import { invoke } from "@tauri-apps/api/core";
import { STYLES, cover, rasterize } from "./cover";
import "./style.css";

/** Mirrors `Book` in src-tauri/src/book.rs. Paths are absolute while editing. */
type Kind = "novel" | "story" | "collection";

/** UI words per book kind: dropdown label, section heading, add button, and a count noun. */
const KINDS: Record<Kind, { label: string; section: string; add: string; noun: string }> = {
  novel: { label: "Roman eller bok med kapitel", section: "Kapitel", add: "Lägg till kapitel …", noun: "kapitel" },
  story: { label: "Novell eller enskild text", section: "Text", add: "Lägg till text …", noun: "delar" },
  collection: { label: "Novellsamling eller antologi", section: "Noveller", add: "Lägg till novell …", noun: "noveller" },
};

interface Book {
  kind: Kind;
  title: string;
  author: string;
  lang: string;
  date: string;
  publisher: string;
  identifier: string;
  rights: string;
  description: string;
  "cover-image": string;
  "cover-style": string;
  chapters: string[];
}

interface ChapterInfo {
  path: string;
  file: string;
  title: string;
  author: string;
  words: number;
}

const FIELDS: [keyof Book, string, string][] = [
  ["title", "Titel", ""],
  ["author", "Författare", ""],
  ["lang", "Språk", "sv"],
  ["date", "Utgivningsdatum", "ÅÅÅÅ-MM-DD"],
  ["publisher", "Förlag", ""],
  ["identifier", "Identifierare", "ISBN eller URN"],
  ["rights", "Rättigheter", "© …"],
  ["description", "Beskrivning", ""],
];

let book: Book = emptyBook();
let bookPath: string | null = null;
let chapters: ChapterInfo[] = [];

function emptyBook(): Book {
  return {
    kind: "novel",
    title: "",
    author: "",
    lang: "sv",
    date: "",
    publisher: "",
    identifier: "",
    rights: "",
    description: "",
    "cover-image": "",
    "cover-style": "",
    chapters: [],
  };
}

const app = document.getElementById("app")!;
app.innerHTML = `
  <header>
    <h1>Word Work EPUB</h1>
    <div class="actions">
      <button id="new">Ny bok</button>
      <button id="open">Öppna bok …</button>
      <button id="save">Spara bok</button>
      <button id="save-as">Spara bok som …</button>
    </div>
    <div id="book-path" class="muted"></div>
  </header>
  <main>
    <section>
      <h2>Om boken</h2>
      <label class="field"><span>Typ</span>
        <select id="kind">${(Object.keys(KINDS) as Kind[]).map((k) => `<option value="${k}">${KINDS[k].label}</option>`).join("")}</select>
      </label>
      <div id="fields" class="fields"></div>
      <label class="field"><span>Omslag</span>
        <select id="cover-style"><option value="">Egen bild</option>${STYLES.map((s) => `<option value="${s.id}" title="${s.hint}">${s.label}</option>`).join("")}</select>
      </label>
      <div id="cover-own" class="row"><input id="cover" readonly placeholder="Ingen bild vald" /><button id="cover-pick">Välj …</button><button id="cover-clear" title="Ta bort omslag">✕</button></div>
      <div id="cover-generated">
        <div id="cover-preview"></div>
        <div class="row"><button id="cover-save">Spara omslaget som bild …</button></div>
      </div>
    </section>
    <section>
      <h2 id="chapters-heading">Kapitel</h2>
      <ol id="chapters"></ol>
      <div class="row"><button id="add">Lägg till kapitel …</button><span id="total" class="muted"></span></div>
    </section>
  </main>
  <footer>
    <button id="build" class="primary">Skapa EPUB …</button>
    <span id="status" role="status"></span>
  </footer>
`;

const fields = document.getElementById("fields")!;
for (const [key, label, placeholder] of FIELDS) {
  const el = document.createElement("label");
  el.className = "field";
  const input = key === "description" ? document.createElement("textarea") : document.createElement("input");
  input.id = `f-${key}`;
  input.placeholder = placeholder;
  input.addEventListener("input", () => {
    (book[key] as string) = input.value;
    renderCover();
  });
  el.append(Object.assign(document.createElement("span"), { textContent: label }), input);
  fields.append(el);
}

const status = document.getElementById("status")!;
let statusTimer: number | undefined;
function say(text: string, error = false) {
  status.textContent = text;
  status.classList.toggle("error", error);
  clearTimeout(statusTimer);
  if (!error) statusTimer = window.setTimeout(() => (status.textContent = ""), 6000);
}

function render() {
  for (const [key] of FIELDS) {
    (document.getElementById(`f-${key}`) as HTMLInputElement).value = book[key] as string;
  }
  (document.getElementById("cover") as HTMLInputElement).value = book["cover-image"].split("/").pop() ?? "";
  (document.getElementById("cover") as HTMLInputElement).title = book["cover-image"];
  document.getElementById("book-path")!.textContent = bookPath ?? "Ej sparad";
  (document.getElementById("cover-style") as HTMLSelectElement).value = book["cover-style"];
  renderCover();

  const kind = KINDS[book.kind];
  (document.getElementById("kind") as HTMLSelectElement).value = book.kind;
  document.getElementById("chapters-heading")!.textContent = kind.section;
  document.getElementById("add")!.textContent = kind.add;
  const list = document.getElementById("chapters")!;
  list.innerHTML = "";
  chapters.forEach((c, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="title">${esc(c.title || c.file)}</span>
      <span class="muted">${book.kind === "collection" && c.author ? esc(c.author) + " · " : ""}${esc(c.file)} · ${c.words} ord</span>
      <span class="buttons">
        <button data-move="-1" title="Flytta upp" ${i === 0 ? "disabled" : ""}>↑</button>
        <button data-move="1" title="Flytta ned" ${i === chapters.length - 1 ? "disabled" : ""}>↓</button>
        <button data-remove title="Ta bort">✕</button>
      </span>`;
    li.querySelectorAll<HTMLButtonElement>("[data-move]").forEach((b) =>
      b.addEventListener("click", () => {
        const j = i + Number(b.dataset.move);
        [chapters[i], chapters[j]] = [chapters[j], chapters[i]];
        sync();
      }),
    );
    li.querySelector("[data-remove]")!.addEventListener("click", () => {
      chapters.splice(i, 1);
      sync();
    });
    list.append(li);
  });
  const words = chapters.reduce((n, c) => n + c.words, 0);
  document.getElementById("total")!.textContent = chapters.length ? `${chapters.length} ${kind.noun}, ${words} ord` : "";
}

function coverSvg(): string {
  return cover(book["cover-style"], { title: book.title, author: book.author, publisher: book.publisher, date: book.date });
}

function renderCover() {
  const generated = book["cover-style"] !== "";
  document.getElementById("cover-own")!.hidden = generated;
  document.getElementById("cover-generated")!.hidden = !generated;
  if (generated) document.getElementById("cover-preview")!.innerHTML = coverSvg();
}

function sync() {
  book.chapters = chapters.map((c) => c.path);
  render();
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

async function run(action: () => Promise<void>) {
  try {
    await action();
  } catch (e) {
    say(String(e), true);
  }
}

document.getElementById("new")!.addEventListener("click", () => {
  book = emptyBook();
  bookPath = null;
  chapters = [];
  render();
});

document.getElementById("open")!.addEventListener("click", () =>
  run(async () => {
    const opened = await invoke<{ path: string; book: Book } | null>("book_open");
    if (!opened) return;
    book = { ...emptyBook(), ...opened.book };
    bookPath = opened.path;
    chapters = await invoke<ChapterInfo[]>("chapters_info", { paths: book.chapters });
    render();
  }),
);

async function save(as: boolean) {
  const path = await invoke<string | null>("book_save", { path: as ? null : bookPath, book });
  if (!path) return;
  bookPath = path;
  render();
  say("Boken är sparad.");
}
document.getElementById("save")!.addEventListener("click", () => run(() => save(false)));
document.getElementById("save-as")!.addEventListener("click", () => run(() => save(true)));

document.getElementById("add")!.addEventListener("click", () =>
  run(async () => {
    const picked = await invoke<ChapterInfo[]>("chapters_pick");
    const known = new Set(chapters.map((c) => c.path));
    chapters.push(...picked.filter((c) => !known.has(c.path)));
    sync();
  }),
);

document.getElementById("cover-pick")!.addEventListener("click", () =>
  run(async () => {
    const path = await invoke<string | null>("cover_pick");
    if (path) {
      book["cover-image"] = path;
      render();
    }
  }),
);
document.getElementById("cover-clear")!.addEventListener("click", () => {
  book["cover-image"] = "";
  render();
});
document.getElementById("kind")!.addEventListener("change", (e) => {
  book.kind = (e.target as HTMLSelectElement).value as Kind;
  render();
});
document.getElementById("cover-style")!.addEventListener("change", (e) => {
  book["cover-style"] = (e.target as HTMLSelectElement).value;
  renderCover();
});
document.getElementById("cover-save")!.addEventListener("click", () =>
  run(async () => {
    const png = Array.from(await rasterize(coverSvg()));
    const path = await invoke<string | null>("cover_save", { png });
    if (path) say(`Omslaget är sparat: ${path.split("/").pop()}`);
  }),
);

document.getElementById("build")!.addEventListener("click", () =>
  run(async () => {
    if (!chapters.length) return say("Lägg till minst ett kapitel först.", true);
    say("Skapar EPUB …");
    const coverPng = book["cover-style"] ? Array.from(await rasterize(coverSvg())) : null;
    const out = await invoke<string | null>("epub_build", { book, coverPng });
    if (!out) return say("");
    status.textContent = "";
    status.append(`Boken är klar: ${out.split("/").pop()} `);
    const show = Object.assign(document.createElement("button"), { textContent: "Visa i mappen", className: "link" });
    show.addEventListener("click", () => run(() => invoke("reveal", { path: out })));
    status.append(show);
    status.classList.remove("error");
  }),
);

render();
