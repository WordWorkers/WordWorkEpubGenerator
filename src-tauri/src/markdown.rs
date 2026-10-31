//! Word Work Markdown, as described in the word-work-markdown spec: GFM with
//! YAML frontmatter, Pandoc footnotes, CriticMarkup comments and HTML-comment
//! notes. Comments and notes are the author's own and never reach readers.

use std::sync::LazyLock;

use regex::Regex;

/// Splits off the YAML frontmatter: a `---` first line (BOM allowed) not
/// followed by a blank line, closed by `---` or `...`.
pub fn split_frontmatter(text: &str) -> (&str, &str) {
    let body_start = text.strip_prefix('\u{feff}').unwrap_or(text);
    let mut lines = body_start.split_inclusive('\n');
    let Some(first) = lines.next() else { return ("", text) };
    if first.trim_end() != "---" {
        return ("", text);
    }
    let mut end = text.len() - body_start.len() + first.len();
    let mut next = lines.next();
    if next.is_none_or(|l| l.trim().is_empty()) {
        return ("", text);
    }
    while let Some(line) = next {
        end += line.len();
        if matches!(line.trim_end(), "---" | "...") {
            return (&text[..end], &text[end..]);
        }
        next = lines.next();
    }
    ("", text)
}

/// `title:` from the frontmatter, unquoted.
pub fn frontmatter_title(frontmatter: &str) -> Option<String> {
    frontmatter_field(frontmatter, "title")
}

/// A one-line `key: value` field from the frontmatter, unquoted.
pub fn frontmatter_field(frontmatter: &str, key: &str) -> Option<String> {
    let re = Regex::new(&format!(r"(?m)^{}:[ \t]*(.*?)[ \t]*$", regex::escape(key))).unwrap();
    let raw = re.captures(frontmatter)?.get(1)?.as_str();
    let v = raw.trim();
    let v = match (v.chars().next(), v.chars().last()) {
        (Some('"'), Some('"')) | (Some('\''), Some('\'')) if v.len() >= 2 => &v[1..v.len() - 1],
        _ => v,
    };
    let v = v.split_whitespace().collect::<Vec<_>>().join(" ");
    (!v.is_empty()).then_some(v)
}

/// Applies `f` to the text outside fenced code blocks.
fn map_outside_code(text: &str, f: impl Fn(&str) -> String) -> String {
    static FENCE: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"^ {0,3}(```|~~~)").unwrap());
    let mut out = String::with_capacity(text.len());
    let mut segment = String::new();
    let mut in_code = false;
    for line in text.split_inclusive('\n') {
        let fence = FENCE.is_match(line);
        if in_code {
            out.push_str(line);
            if fence {
                in_code = false;
            }
        } else if fence {
            out.push_str(&f(&segment));
            segment.clear();
            out.push_str(line);
            in_code = true;
        } else {
            segment.push_str(line);
        }
    }
    out.push_str(&f(&segment));
    out
}

/// Removes CriticMarkup comments (`{==text==}{>>comment<<}` keeps the text)
/// and private notes (HTML comments on their own lines).
pub fn strip_private(body: &str) -> String {
    static COMMENT: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"\{==([\s\S]+?)==\}\{>>[\s\S]*?<<\}").unwrap());
    static LONE_COMMENT: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"\{>>[\s\S]*?<<\}").unwrap());
    static NOTE: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"(?m)^<!--[\s\S]*?-->[ \t]*(?:\n+|\z)").unwrap());
    map_outside_code(body, |s| {
        let s = COMMENT.replace_all(s, "$1");
        let s = LONE_COMMENT.replace_all(&s, "");
        NOTE.replace_all(&s, "").into_owned()
    })
}

/// Prefixes footnote identifiers so chapters can be concatenated without clashes.
pub fn prefix_footnotes(body: &str, prefix: &str) -> String {
    static NOTE_ID: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"\[\^([^\]\s]+)\]").unwrap());
    map_outside_code(body, |s| NOTE_ID.replace_all(s, format!("[^{prefix}-$1]")).into_owned())
}

/// Does the body start with a level-1 heading?
pub fn starts_with_heading(body: &str) -> bool {
    body.lines().find(|l| !l.trim().is_empty()).is_some_and(|l| l.starts_with("# "))
}

pub fn count_words(body: &str) -> usize {
    body.split_whitespace().count()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn frontmatter() {
        let (fm, body) = split_frontmatter("---\ntitle: \"Hej\"\n---\nText\n");
        assert_eq!(fm, "---\ntitle: \"Hej\"\n---\n");
        assert_eq!(body, "Text\n");
        assert_eq!(frontmatter_title(fm).as_deref(), Some("Hej"));
        assert_eq!(split_frontmatter("---\n\ntext"), ("", "---\n\ntext"));
        assert_eq!(split_frontmatter("Text\n---\n"), ("", "Text\n---\n"));
        assert_eq!(split_frontmatter("\u{feff}---\na: 1\n...\nX").1, "X");
    }

    #[test]
    fn private_text_is_stripped_outside_code() {
        let md = "Hon {==gick==}{>>Verkligen?<<} hem.{>>lös<<}\n<!-- kolla\nsiffran -->\nKvar\n```\n<!-- kod -->\n{==x==}{>>y<<}\n```\n";
        assert_eq!(strip_private(md), "Hon gick hem.\nKvar\n```\n<!-- kod -->\n{==x==}{>>y<<}\n```\n");
    }

    #[test]
    fn footnotes_get_prefixed() {
        assert_eq!(
            prefix_footnotes("A.[^1] B.[^kalla]\n\n[^1]: X\n[^kalla]: Y\n", "k2"),
            "A.[^k2-1] B.[^k2-kalla]\n\n[^k2-1]: X\n[^k2-kalla]: Y\n"
        );
    }
}
