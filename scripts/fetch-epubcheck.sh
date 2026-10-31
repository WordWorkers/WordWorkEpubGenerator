#!/usr/bin/env bash
# Downloads the pinned EPUBCheck release (checksum-verified) to tools/epubcheck/
# and writes an `epubcheck` wrapper there, so `tools/epubcheck` can go on PATH.
# Needs Java 11 or later.
set -euo pipefail

VERSION=5.4.0
SHA256=33350c61038e71dfb3d45a76aed04bf5481e6d5500cb780f6e98db8bbd15a28c
URL="https://github.com/w3c/epubcheck/releases/download/v$VERSION/epubcheck-$VERSION.zip"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/tools/epubcheck"
if [[ -f "$OUT/epubcheck.jar" && -x "$OUT/epubcheck" ]]; then
  echo "$OUT already has EPUBCheck $VERSION"
  exit 0
fi
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
echo "Downloading EPUBCheck $VERSION …"
curl -fsSL --retry 3 -o "$TMP/epubcheck.zip" "$URL"
if command -v sha256sum >/dev/null; then sum=$(sha256sum "$TMP/epubcheck.zip" | cut -d' ' -f1); else sum=$(shasum -a 256 "$TMP/epubcheck.zip" | cut -d' ' -f1); fi
[[ "$sum" == "$SHA256" ]] || { echo "Checksum mismatch" >&2; exit 1; }
unzip -q -o "$TMP/epubcheck.zip" -d "$TMP/x"
rm -rf "$OUT" && mkdir -p "$OUT"
cp -R "$TMP/x/epubcheck-$VERSION/." "$OUT/"
cat > "$OUT/epubcheck" <<'WRAP'
#!/usr/bin/env bash
exec java -jar "$(dirname "$0")/epubcheck.jar" "$@"
WRAP
chmod 755 "$OUT/epubcheck"
echo "Installed $OUT/epubcheck"
