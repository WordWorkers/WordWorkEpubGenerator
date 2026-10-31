//! Word Work EPUB: a Tauri app that builds EPUB 3 books from Word Work Markdown.

mod book;
mod commands;
mod epub;
mod markdown;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::book_open,
            commands::book_save,
            commands::chapters_pick,
            commands::chapters_info,
            commands::cover_pick,
            commands::epub_build,
            commands::cover_save,
            commands::reveal,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Word Work EPUB");
}
