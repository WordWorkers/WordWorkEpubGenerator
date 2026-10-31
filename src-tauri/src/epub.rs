//! Builds the EPUB: every chapter is cleaned per the Markdown spec, the chapters
//! are concatenated and handed to Pandoc on stdin.

use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

use crate::book::{Book, Kind};
use crate::markdown::{
    frontmatter_field, frontmatter_title, prefix_footnotes, split_frontmatter, starts_with_heading, strip_private,
};

/// Pandoc without "smart": quotes and dashes stay as the author typed them.
const MD_IN: &str = "markdown-smart";
#[cfg(target_os = "macos")]
const UTF8_LOCALE: &str = "en_US.UTF-8";
#[cfg(not(target_os = "macos"))]
const UTF8_LOCALE: &str = "C.UTF-8";

/// The text as it goes into the book: no frontmatter, comments or notes, and
/// footnotes unique to the file. A novel chapter or a collected story gets a
/// level-1 heading so it starts a new section; a story in a collection also
/// gets its author as a byline. A single story is left as written.
pub fn chapter_markdown(kind: Kind, index: usize, path: &Path, text: &str) -> String {
    let (frontmatter, body) = split_frontmatter(text);
    let body = prefix_footnotes(&strip_private(body), &format!("k{index}"));
    if kind == Kind::Story || starts_with_heading(&body) {
        return body;
    }
    let title = frontmatter_title(frontmatter)
        .or_else(|| path.file_stem().map(|s| s.to_string_lossy().into_owned()))
        .unwrap_or_default();
    let byline = match kind {
        Kind::Collection => frontmatter_field(frontmatter, "author").map(|a| format!("*{a}*\n\n")).unwrap_or_default(),
        _ => String::new(),
    };
    format!("# {title}\n\n{byline}{body}")
}

/// Writes `out`. Pandoc writes to a temporary file next to it, so a failed
/// build never leaves a broken EPUB behind.
pub fn build(pandoc: &Path, book: &Book, cover: Option<&Path>, out: &Path) -> Result<(), String> {
    if book.chapters.is_empty() {
        return Err("Boken har inga kapitel.".into());
    }
    let mut input = String::new();
    let mut dirs: Vec<PathBuf> = Vec::new();
    for (i, chapter) in book.chapters.iter().enumerate() {
        let path = Path::new(chapter);
        let text = std::fs::read_to_string(path).map_err(|e| format!("Kan inte läsa {}: {e}", path.display()))?;
        input.push_str(&chapter_markdown(book.kind, i + 1, path, &text));
        input.push_str("\n\n");
        if let Some(dir) = path.parent() {
            if !dirs.contains(&dir.to_path_buf()) {
                dirs.push(dir.to_path_buf());
            }
        }
    }
    let tmp = out.with_extension("epub.tmp");
    let mut args: Vec<String> = ["-f", MD_IN, "-t", "epub3", "--split-level=1"].map(String::from).to_vec();
    if book.kind != Kind::Story {
        args.extend(["--toc".into(), "--toc-depth=1".into()]);
    }
    args.extend(book.metadata_args());
    // Images in the chapters are relative to their own file.
    let resource_path = std::env::join_paths(&dirs).map_err(|e| e.to_string())?;
    args.push(format!("--resource-path={}", resource_path.to_string_lossy()));
    if let Some(cover) = cover {
        args.push(format!("--epub-cover-image={}", cover.display()));
    }
    args.extend(["-o".into(), tmp.display().to_string()]);

    // ponytail: no timeout; Pandoc on local files terminates. Add one if a build ever hangs.
    let mut child = Command::new(pandoc)
        .args(&args)
        // Pandoc decodes arguments with the locale; apps started from Finder have none.
        .env("LC_ALL", UTF8_LOCALE)
        .stdin(Stdio::piped())
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Kunde inte starta Pandoc ({}): {e}", pandoc.display()))?;
    let mut stdin = child.stdin.take().expect("piped");
    let writer = std::thread::spawn(move || std::io::Write::write_all(&mut stdin, input.as_bytes()));
    let output = child.wait_with_output().map_err(|e| e.to_string())?;
    let _ = writer.join();
    if !output.status.success() {
        let _ = std::fs::remove_file(&tmp);
        let msg = String::from_utf8_lossy(&output.stderr);
        let last = msg.trim().lines().last().unwrap_or("okänt fel").to_string();
        return Err(format!("Pandoc kunde inte skapa boken: {last}"));
    }
    std::fs::rename(&tmp, out).map_err(|e| format!("Kan inte spara {}: {e}", out.display()))
}

/// The bundled Pandoc next to the app executable; `WW_PANDOC` overrides in
/// debug builds; PATH is the last resort.
pub fn pandoc_path() -> PathBuf {
    if cfg!(debug_assertions) {
        if let Ok(p) = std::env::var("WW_PANDOC") {
            return p.into();
        }
    }
    if let Some(dir) = std::env::current_exe().ok().and_then(|e| e.parent().map(Path::to_path_buf)) {
        let p = dir.join(if cfg!(windows) { "ww-pandoc.exe" } else { "ww-pandoc" });
        if p.is_file() {
            return p;
        }
    }
    "pandoc".into()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn chapter_gets_heading_and_clean_text() {
        let md = "---\ntitle: Första\nauthor: Anna\n---\nText.[^1] {==Mer==}{>>?<<}\n\n[^1]: Not\n";
        let out = chapter_markdown(Kind::Novel, 2, Path::new("x.md"), md);
        assert_eq!(out, "# Första\n\nText.[^k2-1] Mer\n\n[^k2-1]: Not\n");
        assert_eq!(chapter_markdown(Kind::Novel, 1, Path::new("Kapitel.md"), "Hej\n"), "# Kapitel\n\nHej\n");
        assert_eq!(chapter_markdown(Kind::Novel, 1, Path::new("x.md"), "# Egen\n\nHej\n"), "# Egen\n\nHej\n");
        assert_eq!(chapter_markdown(Kind::Story, 1, Path::new("x.md"), md), "Text.[^k1-1] Mer\n\n[^k1-1]: Not\n");
        assert!(chapter_markdown(Kind::Collection, 1, Path::new("x.md"), md).starts_with("# Första\n\n*Anna*\n\nText."));
    }

    /// Runs when a Pandoc is available (sidecar in the repo or `WW_PANDOC`).
    #[test]
    fn builds_a_real_epub() {
        let repo = Path::new(env!("CARGO_MANIFEST_DIR"));
        let sidecar = std::fs::read_dir(repo.join("binaries"))
            .ok()
            .and_then(|d| d.filter_map(Result::ok).map(|e| e.path()).find(|p| p.is_file()));
        let Some(pandoc) = std::env::var("WW_PANDOC").map(PathBuf::from).ok().or(sidecar) else {
            eprintln!("no pandoc, skipping");
            return;
        };
        let dir = std::env::temp_dir().join(format!("ww-epub-build-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let k1 = dir.join("k1.md");
        let k2 = dir.join("k2.md");
        std::fs::write(&k1, "---\ntitle: Ett\n---\nHej.[^1]\n\n[^1]: a\n").unwrap();
        std::fs::write(&k2, "---\ntitle: Två\n---\nDå.[^1]\n<!-- privat -->\n\n[^1]: b\n").unwrap();
        let book = Book {
            title: "Testboken".into(),
            author: "Någon".into(),
            chapters: vec![k1.display().to_string(), k2.display().to_string()],
            ..Default::default()
        };
        let out = dir.join("bok.epub");
        build(&pandoc, &book, None, &out).unwrap();
        let bytes = std::fs::read(&out).unwrap();
        assert_eq!(&bytes[..2], b"PK");
        assert!(bytes.windows(8).any(|w| w == b"mimetype"));
        let _ = std::fs::remove_dir_all(&dir);
    }
}
