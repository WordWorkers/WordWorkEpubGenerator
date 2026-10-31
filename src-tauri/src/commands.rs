//! IPC for the window. File dialogs are native and run here, so the WebView
//! never needs file-system permissions.

use std::path::{Path, PathBuf};

use serde::Serialize;
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::{DialogExt, FileDialogBuilder, FilePath};
use tauri_plugin_opener::OpenerExt;

use crate::book::Book;
use crate::epub;
use crate::markdown::{count_words, frontmatter_field, frontmatter_title, split_frontmatter, strip_private};

type Result<T> = std::result::Result<T, String>;

#[derive(Serialize)]
pub struct ChapterInfo {
    path: String,
    file: String,
    title: String,
    author: String,
    words: usize,
}

#[derive(Serialize)]
pub struct Opened {
    path: String,
    book: Book,
}

fn to_paths(picked: Option<Vec<FilePath>>) -> Result<Vec<PathBuf>> {
    picked.unwrap_or_default().into_iter().map(|p| p.into_path().map_err(|e| e.to_string())).collect()
}

fn to_path(picked: Option<FilePath>) -> Result<Option<PathBuf>> {
    picked.map(|p| p.into_path().map_err(|e| e.to_string())).transpose()
}

type Dialog = FileDialogBuilder<tauri::Wry>;

async fn blocking<T: Send + 'static>(f: impl FnOnce() -> T + Send + 'static) -> Result<T> {
    tauri::async_runtime::spawn_blocking(f).await.map_err(|e| e.to_string())
}

fn dialog(app: &AppHandle, title: &str) -> Dialog {
    app.dialog().file().set_title(title)
}

fn info(path: &Path) -> ChapterInfo {
    let text = std::fs::read_to_string(path).unwrap_or_default();
    let (frontmatter, body) = split_frontmatter(&text);
    let file = path.file_name().map(|f| f.to_string_lossy().into_owned()).unwrap_or_default();
    ChapterInfo {
        path: path.display().to_string(),
        title: frontmatter_title(frontmatter).unwrap_or_default(),
        author: frontmatter_field(frontmatter, "author").unwrap_or_default(),
        words: count_words(&strip_private(body)),
        file,
    }
}

#[tauri::command]
pub async fn book_open(app: AppHandle) -> Result<Option<Opened>> {
    let d = dialog(&app, "Öppna bok").add_filter("Bokfil", &["yaml", "yml"]);
    let Some(path) = to_path(blocking(move || d.blocking_pick_file()).await?)? else { return Ok(None) };
    Ok(Some(Opened { book: Book::load(&path)?, path: path.display().to_string() }))
}

/// Saves to `path`, or asks where if there is none. Returns the path used.
#[tauri::command]
pub async fn book_save(app: AppHandle, path: Option<String>, book: Book) -> Result<Option<String>> {
    let path = match path {
        Some(p) => PathBuf::from(p),
        None => {
            let name = if book.title.is_empty() { "bok".to_string() } else { book.title.clone() };
            let d = dialog(&app, "Spara bok").set_file_name(format!("{name}.yaml")).add_filter("Bokfil", &["yaml"]);
            match to_path(blocking(move || d.blocking_save_file()).await?)? {
                Some(p) => p,
                None => return Ok(None),
            }
        }
    };
    book.save(&path)?;
    Ok(Some(path.display().to_string()))
}

#[tauri::command]
pub async fn chapters_pick(app: AppHandle) -> Result<Vec<ChapterInfo>> {
    let mut d = dialog(&app, "Lägg till kapitel").add_filter("Markdown", &["md", "markdown"]);
    if let Some(docs) = app.path().document_dir().ok().map(|d| d.join("Word Work")).filter(|d| d.is_dir()) {
        d = d.set_directory(docs);
    }
    Ok(to_paths(blocking(move || d.blocking_pick_files()).await?)?.iter().map(|p| info(p)).collect())
}

#[tauri::command]
pub fn chapters_info(paths: Vec<String>) -> Vec<ChapterInfo> {
    paths.iter().map(|p| info(Path::new(p))).collect()
}

#[tauri::command]
pub async fn cover_pick(app: AppHandle) -> Result<Option<String>> {
    let d = dialog(&app, "Välj omslag").add_filter("Bild", &["jpg", "jpeg", "png"]);
    Ok(to_path(blocking(move || d.blocking_pick_file()).await?)?.map(|p| p.display().to_string()))
}

/// Asks where to save, then builds. `cover_png` is a cover generated in the
/// window; without it the book's own cover image is used. Returns the EPUB path.
#[tauri::command]
pub async fn epub_build(app: AppHandle, book: Book, cover_png: Option<Vec<u8>>) -> Result<Option<String>> {
    let name = if book.title.is_empty() { "bok".to_string() } else { book.title.clone() };
    let d = dialog(&app, "Spara EPUB").set_file_name(format!("{name}.epub")).add_filter("EPUB", &["epub"]);
    let Some(out) = to_path(blocking(move || d.blocking_save_file()).await?)? else { return Ok(None) };
    blocking(move || {
        let generated = cover_png
            .map(|png| {
                let p = std::env::temp_dir().join(format!("ww-epub-cover-{}.png", std::process::id()));
                std::fs::write(&p, png).map(|_| p).map_err(|e| e.to_string())
            })
            .transpose()?;
        let cover =
            generated.as_deref().or_else(|| (!book.cover_image.is_empty()).then(|| Path::new(&book.cover_image)));
        let r = epub::build(&epub::pandoc_path(), &book, cover, &out).map(|_| out.display().to_string());
        if let Some(p) = generated {
            let _ = std::fs::remove_file(p);
        }
        r
    })
    .await?
    .map(Some)
}

/// Saves a generated cover as a PNG file.
#[tauri::command]
pub async fn cover_save(app: AppHandle, png: Vec<u8>) -> Result<Option<String>> {
    let d = dialog(&app, "Spara omslag").set_file_name("omslag.png").add_filter("PNG", &["png"]);
    let Some(out) = to_path(blocking(move || d.blocking_save_file()).await?)? else { return Ok(None) };
    std::fs::write(&out, png).map_err(|e| format!("Kan inte spara {}: {e}", out.display()))?;
    Ok(Some(out.display().to_string()))
}

#[tauri::command]
pub fn reveal(app: AppHandle, path: String) -> Result<()> {
    app.opener().reveal_item_in_dir(path).map_err(|e| e.to_string())
}
