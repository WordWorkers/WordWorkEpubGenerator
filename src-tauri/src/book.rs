//! A book: the metadata Pandoc's EPUB writer understands plus the chapter list.
//! Saved as YAML with Pandoc's own key names, relative paths next to the file.

use std::path::Path;

use serde::{Deserialize, Serialize};

/// How the texts are put together; see the word-work-markdown spec.
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum Kind {
    /// Chapters in order, each with a heading, with a table of contents.
    #[default]
    Novel,
    /// One text, no added headings, no table of contents.
    Story,
    /// Independent stories, each with heading and byline, with a table of contents.
    Collection,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(default)]
pub struct Book {
    pub kind: Kind,
    #[serde(skip_serializing_if = "String::is_empty")]
    pub title: String,
    #[serde(skip_serializing_if = "String::is_empty")]
    pub author: String,
    pub lang: String,
    #[serde(skip_serializing_if = "String::is_empty")]
    pub date: String,
    #[serde(skip_serializing_if = "String::is_empty")]
    pub publisher: String,
    #[serde(skip_serializing_if = "String::is_empty")]
    pub identifier: String,
    #[serde(skip_serializing_if = "String::is_empty")]
    pub rights: String,
    #[serde(skip_serializing_if = "String::is_empty")]
    pub description: String,
    #[serde(rename = "cover-image", skip_serializing_if = "String::is_empty")]
    pub cover_image: String,
    /// A built-in cover style (see frontend/src/cover.ts); empty = use `cover_image`.
    #[serde(rename = "cover-style", skip_serializing_if = "String::is_empty")]
    pub cover_style: String,
    /// Markdown files in reading order.
    pub chapters: Vec<String>,
}

impl Default for Book {
    fn default() -> Self {
        Self {
            kind: Kind::Novel,
            title: String::new(),
            author: String::new(),
            lang: "sv".into(),
            date: String::new(),
            publisher: String::new(),
            identifier: String::new(),
            rights: String::new(),
            description: String::new(),
            cover_image: String::new(),
            cover_style: String::new(),
            chapters: Vec::new(),
        }
    }
}

impl Book {
    /// Pandoc `-M key=value` pairs for the metadata that is set.
    pub fn metadata_args(&self) -> Vec<String> {
        let fields = [
            ("title", &self.title),
            ("author", &self.author),
            ("lang", &self.lang),
            ("date", &self.date),
            ("publisher", &self.publisher),
            ("identifier", &self.identifier),
            ("rights", &self.rights),
            ("description", &self.description),
        ];
        fields
            .into_iter()
            .filter(|(_, v)| !v.is_empty())
            .flat_map(|(k, v)| ["-M".to_string(), format!("{k}={v}")])
            .collect()
    }

    /// Reads a book file; paths become absolute.
    pub fn load(path: &Path) -> Result<Self, String> {
        let text = std::fs::read_to_string(path).map_err(|e| format!("Kan inte läsa {}: {e}", path.display()))?;
        let mut book: Book = serde_yaml_ng::from_str(&text).map_err(|e| format!("Bokfilen går inte att tolka: {e}"))?;
        let dir = path.parent().unwrap_or(Path::new("."));
        for c in &mut book.chapters {
            *c = resolve(dir, c);
        }
        if !book.cover_image.is_empty() {
            book.cover_image = resolve(dir, &book.cover_image);
        }
        Ok(book)
    }

    /// Writes the book file; paths under its folder become relative.
    pub fn save(&self, path: &Path) -> Result<(), String> {
        let dir = path.parent().unwrap_or(Path::new("."));
        let mut out = self.clone();
        for c in &mut out.chapters {
            *c = relativize(dir, c);
        }
        if !out.cover_image.is_empty() {
            out.cover_image = relativize(dir, &out.cover_image);
        }
        let yaml = serde_yaml_ng::to_string(&out).map_err(|e| e.to_string())?;
        std::fs::write(path, yaml).map_err(|e| format!("Kan inte spara {}: {e}", path.display()))
    }
}

fn resolve(dir: &Path, p: &str) -> String {
    let path = Path::new(p);
    if path.is_absolute() {
        p.to_string()
    } else {
        dir.join(path).display().to_string()
    }
}

fn relativize(dir: &Path, p: &str) -> String {
    Path::new(p).strip_prefix(dir).map(|r| r.display().to_string()).unwrap_or_else(|_| p.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trips_with_relative_paths() {
        let dir = std::env::temp_dir().join(format!("ww-epub-book-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let file = dir.join("bok.yaml");
        let book = Book {
            title: "Boken".into(),
            chapters: vec![dir.join("k1.md").display().to_string(), "/annanstans/k2.md".into()],
            cover_image: dir.join("omslag.jpg").display().to_string(),
            ..Default::default()
        };
        book.save(&file).unwrap();
        let yaml = std::fs::read_to_string(&file).unwrap();
        assert!(yaml.contains("- k1.md\n"), "{yaml}");
        assert!(yaml.contains("kind: novel\n"), "{yaml}");
        assert!(yaml.contains("cover-image: omslag.jpg"), "{yaml}");
        assert!(!yaml.contains("author"), "{yaml}");
        assert_eq!(Book::load(&file).unwrap(), book);
        assert_eq!(book.metadata_args(), ["-M", "title=Boken", "-M", "lang=sv"]);
        let _ = std::fs::remove_dir_all(&dir);
    }
}
