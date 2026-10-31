/**
 * Built-in covers: SVG from text and shapes only, drawn with system fonts.
 * The same SVG is shown as preview and rasterized to PNG for the EPUB.
 */

export const WIDTH = 1600;
export const HEIGHT = 2400;

export interface CoverText {
  title: string;
  author: string;
  publisher: string;
  date: string;
}

export const STYLES: { id: string; label: string; hint: string }[] = [
  { id: "paperback", label: "Pocketklassiker", hint: "Tre band i orange och vitt, inspirerat av klassiska Penguin-pocketar" },
  { id: "magazine", label: "Magasin", hint: "Stor fet rubrik och en accentfärg, inspirerat av Monocle" },
  { id: "weekly", label: "Tidskrift", hint: "Serifrubrik, tunna linjer och en måne, inspirerat av The New Yorker" },
  { id: "bauhaus", label: "Bauhaus", hint: "Cirkel, triangel och kvadrat i grundfärger, inspirerat av Bauhaus" },
  { id: "swiss", label: "Schweizisk", hint: "Koncentriska ringar och Helvetica, inspirerat av den schweiziska affischkonsten" },
  { id: "pattern", label: "Mönstrad", hint: "Mönstrad pärm med etikett, inspirerat av klassiska Faber-omslag" },
  { id: "fashion", label: "Modemagasin", hint: "Hög serifrubrik på rosa, inspirerat av 50-talets modemagasin" },
  { id: "french", label: "Fransk klassiker", hint: "Dubbel ram i rött och svart på gräddvitt, inspirerat av Gallimard" },
  { id: "pulp", label: "Kiosklitteratur", hint: "Mörk botten, gult band och fet rubrik, inspirerat av 50-talets pocketdeckare" },
  { id: "deco", label: "Art déco", hint: "Guldstrålar och spärrad versalrubrik, inspirerat av 20-talets affischer" },
  { id: "solid", label: "Enfärgad", hint: "En färg och en serifrubrik, inspirerat av samtida litterära förlag" },
  { id: "constructivist", label: "Konstruktivism", hint: "Röd cirkel och svart diagonal, inspirerat av rysk konstruktivism" },
  { id: "memphis", label: "Memphis", hint: "Pastell, vågor och konfetti, inspirerat av 80-talets Memphis-grupp" },
  { id: "nordic", label: "Nordisk", hint: "Vitt, ett dämpat grönt blad och en tunn serif, inspirerat av skandinavisk 50-talsform" },
  { id: "typewriter", label: "Skrivmaskin", hint: "Skrivmaskinstext och röd stämpel på papper, inspirerat av fanzines" },
  { id: "victorian", label: "Viktoriansk", hint: "Vinröd pärm med guldram och ornament, inspirerat av 1800-talets klotband" },
  { id: "brutalist", label: "Brutalism", hint: "Jättestor svart rubrik på rutnät, inspirerat av brutalistisk grafik" },
  { id: "minimal", label: "Minimal", hint: "Vitt, en röd punkt och liten text, inspirerat av japansk minimalism" },
  { id: "space", label: "Rymdålder", hint: "Stjärnhimmel och en ringplanet, inspirerat av 50-talets science fiction" },
  { id: "newspaper", label: "Dagstidning", hint: "Tidningshuvud, linjer och spalter, inspirerat av klassiska dagstidningar" },
  { id: "grid", label: "Rutnät", hint: "Rutor i grått och blått med gemen rubrik, inspirerat av holländsk grafisk design" },
];

const SANS = `"Gill Sans", "Gill Sans MT", Futura, "Helvetica Neue", Helvetica, Arial, sans-serif`;
const GROTESK = `"Helvetica Neue", Helvetica, Arial, sans-serif`;
const DIDONE = `Didot, "Bodoni 72", "Playfair Display", "Times New Roman", serif`;
const GARAMOND = `Garamond, "EB Garamond", Baskerville, "Times New Roman", serif`;
const GEOMETRIC = `Futura, "Century Gothic", "Avenir Next", "Trebuchet MS", sans-serif`;
const CONDENSED = `"Arial Narrow", "Helvetica Neue", Impact, "Arial Black", sans-serif`;
const MONO = `"Courier New", Courier, "IBM Plex Mono", monospace`;

const DRAW: Record<string, (t: CoverText) => string> = {
  paperback,
  magazine,
  weekly,
  bauhaus,
  swiss,
  pattern,
  fashion,
  french,
  pulp,
  deco,
  solid,
  constructivist,
  memphis,
  nordic,
  typewriter,
  victorian,
  brutalist,
  minimal,
  space,
  newspaper,
  grid,
};

export function cover(style: string, text: CoverText): string {
  const t = { ...text, title: text.title.trim() || "Titel", author: text.author.trim() };
  const body = (DRAW[style] ?? paperback)(t);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">${body}</svg>`;
}

// ---------------------------------------------------------------- styles

function paperback(t: CoverText): string {
  const orange = "#EB6E28";
  const band = HEIGHT / 3;
  // The white band sits above the middle, as on the classic covers.
  const whiteTop = band - HEIGHT * 0.1;
  const whiteBottom = whiteTop + band;
  const title = fit(t.title.toUpperCase(), 1300, 4, 120, 0.68);
  const titleY = whiteTop + band / 2 - ((title.lines.length - 1) * title.size * 1.15) / 2 - (t.author ? 60 : 0);
  return `
    <rect width="${WIDTH}" height="${HEIGHT}" fill="${orange}"/>
    <rect y="${whiteTop}" width="${WIDTH}" height="${band}" fill="#fff"/>
    ${block(title.lines, WIDTH / 2, titleY, title.size, 1.15, `font-family='${SANS}' font-weight="500" fill="#111" text-anchor="middle"`)}
    ${t.author ? block(fit(t.author, 1300, 2, 76, 0.55).lines, WIDTH / 2, titleY + title.lines.length * title.size * 1.15 + 70, 76, 1.2, `font-family='${SANS}' fill="#111" text-anchor="middle"`) : ""}
    ${t.publisher ? pill(t.publisher.toUpperCase(), (whiteBottom + HEIGHT) / 2) : ""}`;
}

function pill(label: string, cy: number): string {
  const size = 48;
  const w = Math.min(1300, label.length * size * 0.75 + 160);
  return `
    <rect x="${WIDTH / 2 - w / 2}" y="${cy - 70}" width="${w}" height="140" rx="70" fill="#fff"/>
    <text x="${WIDTH / 2}" y="${cy + size * 0.35}" font-family='${SANS}' font-size="${size}" letter-spacing="8" fill="#111" text-anchor="middle">${esc(label)}</text>`;
}

function magazine(t: CoverText): string {
  const accent = "#1D5C8A";
  const title = fit(t.title, 1300, 5, 210, 0.56);
  const badge = (t.date.match(/\d{4}/)?.[0] ?? "").toUpperCase();
  return `
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#F4F1EA"/>
    <rect width="44" height="${HEIGHT}" fill="${accent}"/>
    <rect x="150" y="150" width="1330" height="16" fill="#111"/>
    ${t.author ? `<text x="150" y="250" font-family='${GROTESK}' font-size="48" font-weight="700" letter-spacing="10" fill="#111">${esc(t.author.toUpperCase())}</text>` : ""}
    ${block(title.lines, 150, 330 + title.size, title.size, 1.02, `font-family='${GROTESK}' font-weight="800" fill="#111" letter-spacing="-4"`)}
    <rect x="150" y="${1830}" width="1330" height="4" fill="#111"/>
    <rect x="150" y="${1846}" width="1330" height="4" fill="#111"/>
    ${t.publisher ? `<text x="150" y="1940" font-family='${GROTESK}' font-size="44" font-weight="700" letter-spacing="8" fill="#111">${esc(t.publisher.toUpperCase())}</text>` : ""}
    <circle cx="1230" cy="2110" r="190" fill="${accent}"/>
    ${badge ? `<text x="1230" y="2140" font-family='${GROTESK}' font-size="92" font-weight="800" fill="#fff" text-anchor="middle">${badge}</text>` : ""}`;
}

function weekly(t: CoverText): string {
  const ink = "#1E2A44";
  const paper = "#F6EFDD";
  const title = fit(t.title, 1360, 3, 180, 0.5);
  const rulesY = 300 + title.lines.length * title.size * 1.08 + 50;
  return `
    <rect width="${WIDTH}" height="${HEIGHT}" fill="${paper}"/>
    ${block(title.lines, WIDTH / 2, 300 + title.size * 0.8, title.size, 1.08, `font-family='${DIDONE}' fill="${ink}" text-anchor="middle"`)}
    <rect x="120" y="${rulesY}" width="1360" height="3" fill="${ink}"/>
    <rect x="120" y="${rulesY + 14}" width="1360" height="10" fill="${ink}"/>
    ${t.author ? `<text x="${WIDTH / 2}" y="${rulesY + 110}" font-family='${DIDONE}' font-size="60" font-style="italic" fill="${ink}" text-anchor="middle">${esc(t.author)}</text>` : ""}
    <circle cx="1180" cy="1330" r="150" fill="#E6C170"/>
    ${t.publisher ? `<text x="${WIDTH / 2}" y="2280" font-family='${DIDONE}' font-size="40" letter-spacing="6" fill="${ink}" text-anchor="middle">${esc(t.publisher.toUpperCase())}</text>` : ""}`;
}

function bauhaus(t: CoverText): string {
  const title = fit(t.title, 1360, 4, 150, 0.58);
  return `
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#F2E8D5"/>
    <circle cx="1100" cy="560" r="340" fill="#D23B2E"/>
    <polygon points="150,1150 650,1150 400,700" fill="#E8B824"/>
    <rect x="950" y="800" width="380" height="380" fill="#2A4C9B"/>
    <rect x="120" y="1290" width="1360" height="14" fill="#111"/>
    ${block(title.lines, 120, 1450 + title.size * 0.8, title.size, 1.05, `font-family='${GEOMETRIC}' font-weight="700" fill="#111"`)}
    ${t.author ? `<text x="120" y="2250" font-family='${GEOMETRIC}' font-size="52" letter-spacing="10" fill="#111">${esc(t.author.toUpperCase())}</text>` : ""}
    ${t.publisher ? `<text x="1480" y="2250" font-family='${GEOMETRIC}' font-size="40" letter-spacing="6" fill="#111" text-anchor="end">${esc(t.publisher.toUpperCase())}</text>` : ""}`;
}

function swiss(t: CoverText): string {
  const red = "#E2001A";
  const title = fit(t.title, 1360, 4, 130, 0.56);
  const rings = [80, 220, 360, 500, 640, 780].map((r) => `<circle cx="1150" cy="700" r="${r}" fill="none" stroke="${red}" stroke-width="64"/>`).join("");
  return `
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#fff"/>
    ${rings}
    ${t.author ? `<text x="120" y="1620" font-family='${GROTESK}' font-size="48" font-weight="700" fill="#111">${esc(t.author)}</text>` : ""}
    ${block(title.lines, 120, 1700 + title.size * 0.8, title.size, 1.05, `font-family='${GROTESK}' font-weight="700" fill="#111" letter-spacing="-2"`)}
    ${t.publisher ? `<text x="120" y="2300" font-family='${GROTESK}' font-size="36" fill="#111">${esc(t.publisher)}</text>` : ""}`;
}

function pattern(t: CoverText): string {
  const ink = "#1F2A2A";
  const cream = "#F3EBD8";
  const title = fit(t.title, 950, 4, 110, 0.52);
  const titleTop = 1200 - (title.lines.length * title.size * 1.15) / 2 - (t.author ? 50 : 0);
  return `
    <defs><pattern id="lattice" width="120" height="120" patternUnits="userSpaceOnUse">
      <polygon points="60,18 102,60 60,102 18,60" fill="${cream}" opacity="0.9"/>
    </pattern></defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#1F4E3D"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#lattice)"/>
    <rect x="250" y="800" width="1100" height="800" fill="${cream}"/>
    <rect x="274" y="824" width="1052" height="752" fill="none" stroke="${ink}" stroke-width="3"/>
    ${block(title.lines, WIDTH / 2, titleTop + title.size * 0.8, title.size, 1.15, `font-family='${GARAMOND}' fill="${ink}" text-anchor="middle"`)}
    ${t.author ? `<text x="${WIDTH / 2}" y="${titleTop + title.lines.length * title.size * 1.15 + 90}" font-family='${GARAMOND}' font-size="60" font-style="italic" fill="${ink}" text-anchor="middle">${esc(t.author)}</text>` : ""}
    ${t.publisher ? `<text x="${WIDTH / 2}" y="1530" font-family='${GARAMOND}' font-size="36" letter-spacing="6" fill="${ink}" text-anchor="middle">${esc(t.publisher.toUpperCase())}</text>` : ""}`;
}

function fashion(t: CoverText): string {
  const ink = "#1A1A1A";
  const title = fit(t.title, 1400, 3, 230, 0.52);
  const titleBottom = 260 + title.lines.length * title.size * 1.0;
  return `
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#F6DCD6"/>
    ${block(title.lines, WIDTH / 2, 260 + title.size * 0.8, title.size, 1.0, `font-family='${DIDONE}' fill="${ink}" text-anchor="middle"`)}
    <rect x="${WIDTH / 2 - 1}" y="${titleBottom + 80}" width="2" height="${2080 - titleBottom}" fill="${ink}"/>
    ${t.author ? `<text x="${WIDTH / 2}" y="2260" font-family='${DIDONE}' font-size="56" letter-spacing="12" fill="${ink}" text-anchor="middle">${esc(t.author.toUpperCase())}</text>` : ""}
    ${t.publisher ? `<text x="1480" y="2320" font-family='${DIDONE}' font-size="34" letter-spacing="4" fill="${ink}" text-anchor="end">${esc(t.publisher.toUpperCase())}</text>` : ""}`;
}

function french(t: CoverText): string {
  const red = "#B4121B";
  const title = fit(t.title, 1200, 4, 110, 0.5);
  return `
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#FBF6E9"/>
    <rect x="90" y="90" width="1420" height="2220" fill="none" stroke="${red}" stroke-width="6"/>
    <rect x="114" y="114" width="1372" height="2172" fill="none" stroke="#111" stroke-width="3"/>
    ${t.author ? `<text x="${WIDTH / 2}" y="700" font-family='${GARAMOND}' font-size="52" letter-spacing="8" fill="#111" text-anchor="middle">${esc(t.author.toUpperCase())}</text>` : ""}
    <rect x="${WIDTH / 2 - 14}" y="786" width="28" height="28" fill="${red}" transform="rotate(45 ${WIDTH / 2} 800)"/>
    ${block(title.lines, WIDTH / 2, 900 + title.size * 0.8, title.size, 1.2, `font-family='${GARAMOND}' fill="${red}" text-anchor="middle"`)}
    ${t.publisher ? `<text x="${WIDTH / 2}" y="2150" font-family='${GARAMOND}' font-size="40" letter-spacing="6" fill="#111" text-anchor="middle">${esc(t.publisher.toUpperCase())}</text>` : ""}`;
}

function pulp(t: CoverText): string {
  const yellow = "#F2C230";
  const title = fit(t.title.toUpperCase(), 1360, 4, 190, 0.5);
  return `
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#1B2A4A"/>
    ${block(title.lines, 120, 350 + title.size * 0.8, title.size, 1.0, `font-family='${CONDENSED}' font-weight="900" fill="#F2E9D8"`)}
    <polygon points="0,1500 1600,1050 1600,1350 0,1800" fill="${yellow}"/>
    <polygon points="0,1850 1600,1400 1600,1440 0,1890" fill="${yellow}"/>
    ${t.author ? `<text x="800" y="1448" font-family='${CONDENSED}' font-size="72" font-weight="900" fill="#1B2A4A" text-anchor="middle" transform="rotate(-15.7 800 1425)">${esc(t.author.toUpperCase())}</text>` : ""}
    ${t.publisher ? `<text x="120" y="2280" font-family='${CONDENSED}' font-size="40" letter-spacing="6" fill="${yellow}">${esc(t.publisher.toUpperCase())}</text>` : ""}`;
}

function deco(t: CoverText): string {
  const gold = "#C9A24A";
  const navy = "#16223D";
  const title = fit(t.title.toUpperCase(), 1200, 3, 120, 0.78);
  const boxH = title.lines.length * title.size * 1.25 + 140;
  const boxY = 1150 - boxH / 2;
  let rays = "";
  for (let a = 10; a <= 170; a += 20) {
    const [a1, a2] = [((a - 3.5) * Math.PI) / 180, ((a + 3.5) * Math.PI) / 180];
    const R = 3200;
    rays += `<polygon points="800,2400 ${800 + R * Math.cos(a1)},${2400 - R * Math.sin(a1)} ${800 + R * Math.cos(a2)},${2400 - R * Math.sin(a2)}" fill="${gold}" opacity="0.45"/>`;
  }
  return `
    <rect width="${WIDTH}" height="${HEIGHT}" fill="${navy}"/>
    ${rays}
    <rect x="100" y="${boxY}" width="1400" height="${boxH}" fill="${navy}" stroke="${gold}" stroke-width="6"/>
    <rect x="124" y="${boxY + 24}" width="1352" height="${boxH - 48}" fill="none" stroke="${gold}" stroke-width="2"/>
    ${block(title.lines, WIDTH / 2, boxY + 70 + title.size * 0.9, title.size, 1.25, `font-family='${GEOMETRIC}' font-weight="500" letter-spacing="14" fill="${gold}" text-anchor="middle"`)}
    ${t.author ? `<text x="${WIDTH / 2}" y="${boxY + boxH + 130}" font-family='${GEOMETRIC}' font-size="60" letter-spacing="12" fill="${gold}" text-anchor="middle">${esc(t.author.toUpperCase())}</text>` : ""}
    ${t.publisher ? `<text x="${WIDTH / 2}" y="2280" font-family='${GEOMETRIC}' font-size="38" letter-spacing="8" fill="${gold}" text-anchor="middle">${esc(t.publisher.toUpperCase())}</text>` : ""}`;
}

function solid(t: CoverText): string {
  const title = fit(t.title, 1200, 4, 130, 0.5);
  const titleTop = 1000 - (title.lines.length * title.size * 1.15) / 2;
  return `
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#2548A3"/>
    ${block(title.lines, WIDTH / 2, titleTop + title.size * 0.8, title.size, 1.15, `font-family='${GARAMOND}' fill="#fff" text-anchor="middle"`)}
    ${t.author ? `<text x="${WIDTH / 2}" y="${titleTop + title.lines.length * title.size * 1.15 + 110}" font-family='${GARAMOND}' font-size="70" font-style="italic" fill="#fff" text-anchor="middle">${esc(t.author)}</text>` : ""}
    ${t.publisher ? `<text x="${WIDTH / 2}" y="2250" font-family='${GARAMOND}' font-size="40" letter-spacing="6" fill="#fff" text-anchor="middle">${esc(t.publisher.toUpperCase())}</text>` : ""}`;
}

function constructivist(t: CoverText): string {
  const red = "#C8102E";
  const title = fit(t.title.toUpperCase(), 1360, 4, 150, 0.62);
  return `
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#E9E2D0"/>
    <circle cx="460" cy="640" r="380" fill="${red}"/>
    <polygon points="0,1300 1600,420 1600,560 0,1440" fill="#111"/>
    <polygon points="1180,0 1600,0 1600,420" fill="#111"/>
    ${block(title.lines, 120, 1600 + title.size * 0.8, title.size, 1.0, `font-family='${GROTESK}' font-weight="900" fill="#111"`)}
    ${t.author ? `<text x="120" y="2250" font-family='${GROTESK}' font-size="56" font-weight="700" letter-spacing="8" fill="${red}">${esc(t.author.toUpperCase())}</text>` : ""}
    ${t.publisher ? `<text x="1480" y="2250" font-family='${GROTESK}' font-size="36" letter-spacing="6" fill="#111" text-anchor="end">${esc(t.publisher.toUpperCase())}</text>` : ""}`;
}

function memphis(t: CoverText): string {
  const title = fit(t.title, 1360, 4, 160, 0.58);
  const y0 = 1350;
  const wave = "M 100 500 q 100 -120 200 0 t 200 0 t 200 0 t 200 0 t 200 0 t 200 0";
  return `
    <defs><pattern id="dots" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="9" fill="#111"/></pattern></defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#FDF3E7"/>
    <rect x="900" y="150" width="560" height="560" fill="#F27BA5"/>
    <rect x="900" y="150" width="560" height="560" fill="url(#dots)" opacity="0.35"/>
    <path d="${wave}" fill="none" stroke="#111" stroke-width="18" stroke-linecap="round"/>
    <polygon points="140,1150 520,1150 330,760" fill="#2BB5A0"/>
    <polyline points="620,1000 720,860 820,1000 920,860 1020,1000 1120,860 1220,1000" fill="none" stroke="#F5D547" stroke-width="26" stroke-linejoin="round"/>
    <circle cx="1380" cy="1020" r="110" fill="#111"/>
    ${block(title.lines, 132, y0 + 12 + title.size * 0.8, title.size, 1.02, `font-family='${GEOMETRIC}' font-weight="700" fill="#F27BA5"`)}
    ${block(title.lines, 120, y0 + title.size * 0.8, title.size, 1.02, `font-family='${GEOMETRIC}' font-weight="700" fill="#111"`)}
    ${t.author ? `<text x="120" y="2250" font-family='${GEOMETRIC}' font-size="56" letter-spacing="8" fill="#111">${esc(t.author.toUpperCase())}</text>` : ""}
    ${t.publisher ? `<text x="1480" y="2250" font-family='${GEOMETRIC}' font-size="36" letter-spacing="6" fill="#111" text-anchor="end">${esc(t.publisher.toUpperCase())}</text>` : ""}`;
}

function nordic(t: CoverText): string {
  const green = "#6B8F71";
  const title = fit(t.title, 1300, 4, 120, 0.5);
  return `
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#fff"/>
    <ellipse cx="1050" cy="760" rx="230" ry="560" fill="${green}" transform="rotate(32 1050 760)"/>
    <line x1="1050" y1="760" x2="1340" y2="300" stroke="#fff" stroke-width="6"/>
    <line x1="700" y1="1320" x2="1050" y2="760" stroke="${green}" stroke-width="8" stroke-linecap="round"/>
    ${block(title.lines, 120, 1650 + title.size * 0.8, title.size, 1.15, `font-family='${GARAMOND}' fill="#222"`)}
    ${t.author ? `<text x="120" y="2230" font-family='${GARAMOND}' font-size="60" font-style="italic" fill="#222">${esc(t.author)}</text>` : ""}
    ${t.publisher ? `<text x="1480" y="2230" font-family='${GARAMOND}' font-size="36" letter-spacing="6" fill="#222" text-anchor="end">${esc(t.publisher.toUpperCase())}</text>` : ""}`;
}

function typewriter(t: CoverText): string {
  const red = "#B3261E";
  const title = fit(t.title.toUpperCase(), 1360, 5, 120, 0.62);
  const stampW = Math.min(1300, (t.author.length + 2) * 64 * 0.62 + 120);
  return `
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#F1ECE0"/>
    ${block(title.lines, 120, 300 + title.size * 0.8, title.size, 1.25, `font-family='${MONO}' font-weight="700" fill="#222"`)}
    ${t.author ? `<g transform="rotate(-5 800 1700)">
      <rect x="${800 - stampW / 2}" y="1620" width="${stampW}" height="160" fill="none" stroke="${red}" stroke-width="8" rx="8"/>
      <text x="800" y="1722" font-family='${MONO}' font-size="64" font-weight="700" letter-spacing="6" fill="${red}" text-anchor="middle">${esc(t.author.toUpperCase())}</text>
    </g>` : ""}
    ${t.publisher ? `<text x="120" y="2260" font-family='${MONO}' font-size="40" fill="#222">${esc(t.publisher)}</text>` : ""}
    ${t.date ? `<text x="1480" y="2260" font-family='${MONO}' font-size="40" fill="#222" text-anchor="end">${esc(t.date)}</text>` : ""}`;
}

function victorian(t: CoverText): string {
  const gold = "#C9A24A";
  const title = fit(t.title.toUpperCase(), 1100, 4, 100, 0.72);
  const titleTop = 1100 - (title.lines.length * title.size * 1.3) / 2;
  const corners = [
    [170, 170],
    [1430, 170],
    [170, 2230],
    [1430, 2230],
  ]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="26" fill="${gold}"/><rect x="${x - 14}" y="${y - 14}" width="28" height="28" fill="#4A1C2B" transform="rotate(45 ${x} ${y})"/>`)
    .join("");
  return `
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#4A1C2B"/>
    <rect x="80" y="80" width="1440" height="2240" fill="none" stroke="${gold}" stroke-width="10"/>
    <rect x="170" y="170" width="1260" height="2060" fill="none" stroke="${gold}" stroke-width="3"/>
    ${corners}
    <rect x="786" y="${titleTop - 130}" width="28" height="28" fill="${gold}" transform="rotate(45 800 ${titleTop - 116})"/>
    ${block(title.lines, WIDTH / 2, titleTop + title.size * 0.8, title.size, 1.3, `font-family='${GARAMOND}' letter-spacing="10" fill="${gold}" text-anchor="middle"`)}
    <rect x="600" y="${titleTop + title.lines.length * title.size * 1.3 + 40}" width="400" height="3" fill="${gold}"/>
    ${t.author ? `<text x="${WIDTH / 2}" y="${titleTop + title.lines.length * title.size * 1.3 + 150}" font-family='${GARAMOND}' font-size="64" font-style="italic" fill="${gold}" text-anchor="middle">${esc(t.author)}</text>` : ""}
    ${t.publisher ? `<text x="${WIDTH / 2}" y="2120" font-family='${GARAMOND}' font-size="36" letter-spacing="8" fill="${gold}" text-anchor="middle">${esc(t.publisher.toUpperCase())}</text>` : ""}`;
}

function brutalist(t: CoverText): string {
  const title = fit(t.title.toUpperCase(), 1500, 5, 260, 0.62);
  let lines = "";
  for (let x = 160; x < WIDTH; x += 160) lines += `<line x1="${x}" y1="0" x2="${x}" y2="${HEIGHT}" stroke="#ddd" stroke-width="2"/>`;
  for (let y = 160; y < HEIGHT; y += 160) lines += `<line x1="0" y1="${y}" x2="${WIDTH}" y2="${y}" stroke="#ddd" stroke-width="2"/>`;
  return `
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#fff"/>
    ${lines}
    ${block(title.lines, 50, 120 + title.size * 0.85, title.size, 0.95, `font-family='${GROTESK}' font-weight="900" fill="#111" letter-spacing="-8"`)}
    <rect y="2000" width="${WIDTH}" height="400" fill="#111"/>
    ${t.author ? `<text x="50" y="2180" font-family='${GROTESK}' font-size="72" font-weight="700" fill="#fff">${esc(t.author.toUpperCase())}</text>` : ""}
    ${t.publisher ? `<text x="50" y="2300" font-family='${GROTESK}' font-size="40" fill="#fff">${esc(t.publisher)}</text>` : ""}`;
}

function minimal(t: CoverText): string {
  const title = fit(t.title, 1300, 3, 72, 0.5);
  return `
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#fff"/>
    <circle cx="1180" cy="760" r="90" fill="#C8102E"/>
    <rect x="120" y="1900" width="80" height="2" fill="#111"/>
    ${block(title.lines, 120, 1990 + title.size * 0.8, title.size, 1.3, `font-family='${GARAMOND}' fill="#111"`)}
    ${t.author ? `<text x="120" y="${2010 + title.lines.length * title.size * 1.3 + 50}" font-family='${GARAMOND}' font-size="44" fill="#777">${esc(t.author)}</text>` : ""}
    ${t.publisher ? `<text x="1480" y="2290" font-family='${GARAMOND}' font-size="30" letter-spacing="6" fill="#777" text-anchor="end">${esc(t.publisher.toUpperCase())}</text>` : ""}`;
}

function space(t: CoverText): string {
  const rnd = seeded(t.title);
  let stars = "";
  for (let i = 0; i < 160; i++) {
    stars += `<circle cx="${Math.round(rnd() * WIDTH)}" cy="${Math.round(rnd() * HEIGHT)}" r="${(1.5 + rnd() * 3.5).toFixed(1)}" fill="#fff" opacity="${(0.4 + rnd() * 0.6).toFixed(2)}"/>`;
  }
  const title = fit(t.title.toUpperCase(), 1300, 4, 120, 0.75);
  return `
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#06080F"/>
    ${stars}
    <circle cx="1100" cy="900" r="300" fill="#D86B3A"/>
    <ellipse cx="1100" cy="900" rx="540" ry="120" fill="none" stroke="#E9C58A" stroke-width="22" transform="rotate(-25 1100 900)"/>
    ${block(title.lines, WIDTH / 2, 1650 + title.size * 0.8, title.size, 1.25, `font-family='${GEOMETRIC}' letter-spacing="12" fill="#E6EEF8" text-anchor="middle"`)}
    ${t.author ? `<text x="${WIDTH / 2}" y="${1690 + title.lines.length * title.size * 1.25 + 60}" font-family='${GEOMETRIC}' font-size="52" letter-spacing="8" fill="#E9C58A" text-anchor="middle">${esc(t.author.toUpperCase())}</text>` : ""}
    ${t.publisher ? `<text x="${WIDTH / 2}" y="2300" font-family='${GEOMETRIC}' font-size="34" letter-spacing="6" fill="#8FA3C7" text-anchor="middle">${esc(t.publisher.toUpperCase())}</text>` : ""}`;
}

function newspaper(t: CoverText): string {
  const ink = "#1A1A1A";
  const title = fit(t.title.toUpperCase(), 1400, 3, 150, 0.62);
  const mastBottom = 220 + title.lines.length * title.size * 1.05 + 40;
  const columnsTop = mastBottom + 260;
  return `
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#F4F0E6"/>
    <rect x="100" y="150" width="1400" height="4" fill="${ink}"/>
    ${block(title.lines, WIDTH / 2, 220 + title.size * 0.85, title.size, 1.05, `font-family='${GARAMOND}' font-weight="700" fill="${ink}" text-anchor="middle"`)}
    <rect x="100" y="${mastBottom}" width="1400" height="12" fill="${ink}"/>
    <rect x="100" y="${mastBottom + 22}" width="1400" height="3" fill="${ink}"/>
    ${t.date ? `<text x="100" y="${mastBottom + 90}" font-family='${GARAMOND}' font-size="36" letter-spacing="3" fill="${ink}">${esc(t.date)}</text>` : ""}
    ${t.publisher ? `<text x="1500" y="${mastBottom + 90}" font-family='${GARAMOND}' font-size="36" letter-spacing="3" fill="${ink}" text-anchor="end">${esc(t.publisher.toUpperCase())}</text>` : ""}
    ${t.author ? `<text x="${WIDTH / 2}" y="${mastBottom + 190}" font-family='${GARAMOND}' font-size="48" letter-spacing="8" fill="${ink}" text-anchor="middle">${esc(t.author.toUpperCase())}</text>` : ""}
    <rect x="100" y="${columnsTop}" width="1400" height="3" fill="${ink}"/>
    <line x1="566" y1="${columnsTop + 40}" x2="566" y2="2250" stroke="${ink}" stroke-width="2"/>
    <line x1="1033" y1="${columnsTop + 40}" x2="1033" y2="2250" stroke="${ink}" stroke-width="2"/>
    <rect x="100" y="2250" width="1400" height="3" fill="${ink}"/>`;
}

function grid(t: CoverText): string {
  const blue = "#1F3A93";
  const rnd = seeded(t.title);
  let squares = "";
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 8; c++) {
      squares += `<rect x="${120 + c * 170}" y="${120 + r * 170}" width="150" height="150" fill="${rnd() < 0.22 ? blue : "#DADAD5"}"/>`;
    }
  }
  const title = fit(t.title.toLowerCase(), 1360, 3, 130, 0.56);
  return `
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#F3F3F0"/>
    ${squares}
    ${block(title.lines, 120, 1780 + title.size * 0.8, title.size, 1.05, `font-family='${GEOMETRIC}' font-weight="700" fill="${blue}"`)}
    ${t.author ? `<text x="120" y="2280" font-family='${GEOMETRIC}' font-size="44" fill="#111">${esc(t.author.toLowerCase())}</text>` : ""}
    ${t.publisher ? `<text x="1480" y="2280" font-family='${GEOMETRIC}' font-size="36" fill="#111" text-anchor="end">${esc(t.publisher.toLowerCase())}</text>` : ""}`;
}

/** Deterministic pseudo-random numbers in [0, 1), so a book keeps its cover between builds. */
function seeded(seed: string): () => number {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ (h >>> 13)) >>> 0) / 4294967296;
}

// ---------------------------------------------------------------- text

/** Shrinks the font until the text fits in `maxLines` lines of `width`. `charW` is the average glyph width in em. */
function fit(text: string, width: number, maxLines: number, size: number, charW: number): { size: number; lines: string[] } {
  for (;;) {
    const lines = wrap(text, Math.max(1, Math.floor(width / (size * charW))));
    if (lines.length <= maxLines || size < 40) return { size, lines };
    size = Math.round(size * 0.92);
  }
}

function wrap(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (line && (line + " " + word).length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = line ? line + " " + word : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function block(lines: string[], x: number, y: number, size: number, leading: number, attrs: string): string {
  const spans = lines.map((l, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : size * leading}">${esc(l)}</tspan>`).join("");
  return `<text x="${x}" y="${y}" font-size="${size}" ${attrs}>${spans}</text>`;
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

// ---------------------------------------------------------------- raster

/** Draws the SVG on a canvas and returns PNG bytes. */
export async function rasterize(svg: string): Promise<Uint8Array> {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Kunde inte rita omslaget."));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    canvas.getContext("2d")!.drawImage(img, 0, 0, WIDTH, HEIGHT);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
    if (!blob) throw new Error("Kunde inte skapa omslagsbilden.");
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    URL.revokeObjectURL(url);
  }
}
