# Word Work EPUB – for developers

A Tauri 2 desktop app. The Rust side (`src-tauri/src`) cleans each chapter per
the [Word Work Markdown spec](../../word-work-markdown), concatenates them and
runs the bundled Pandoc to produce EPUB 3. The frontend (`frontend/src`) is
plain TypeScript, no framework. UI text is Swedish; code and comments are
English.

## Requirements

Node 22+, Rust via rustup (`rust-toolchain.toml` picks the toolchain), and
`cargo install tauri-cli --version "^2" --locked`.

## Run

```sh
(cd frontend && npm ci)
scripts/fetch-pandoc.sh   # Pandoc sidecar → src-tauri/binaries/
cargo test --workspace    # includes a real EPUB build when the sidecar exists
cargo tauri dev
cargo tauri build
```

`WW_PANDOC=/path/to/pandoc` overrides the sidecar in debug builds.

## Validation

After a build the app runs [EPUBCheck](https://github.com/w3c/epubcheck) if
`epubcheck` is on PATH or in the usual Homebrew and Linux locations, and shows
the result. `scripts/fetch-epubcheck.sh` installs a pinned copy under
`tools/epubcheck/` (needs Java); put that folder on PATH, or set
`WW_EPUBCHECK=/path/to/epubcheck` in debug builds. The build test validates
every book kind when a checker is found, and CI always has one.

## Book file

```yaml
kind: novel
title: Boken
author: Namn
lang: sv
cover-image: omslag.jpg
chapters:
  - kapitel-1.md
  - kapitel-2.md
```

`kind` (`novel`, `story`, `collection`) decides how the texts are assembled;
see the spec. The other keys are Pandoc's EPUB metadata names and are passed
to Pandoc as `-M`.
Paths are relative to the book file. `cover-style` (one of the ids in `STYLES`
in `frontend/src/cover.ts`) selects a built-in cover: `frontend/src/cover.ts` draws it as SVG,
the window rasterizes it to PNG and sends the bytes with the build request.

## CI and releases

`ci.yml` runs on every push and pull request: formatting, clippy, tests with
the real Pandoc sidecar, frontend typecheck and build, and dependency audits.
`build.yml` builds installers for macOS (both architectures), Windows and
Linux on pull requests and on tags; a `v*` tag also drafts a GitHub release
with the installers, `SHA256SUMS` and `docs/RELEASE_NOTES.md` as body.
macOS builds are signed and notarized when the `APPLE_*` secrets exist,
otherwise ad-hoc signed.
