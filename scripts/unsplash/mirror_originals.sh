#!/bin/bash
# Mirror full-resolution Unsplash originals to the USB library.
# Usage: mirror_originals.sh [repo dir] [dest dir]
# Downloads come from images.unsplash.com (the photo CDN, not the API), so no key
# is needed; the API download event was already sent when the photo was added.
set -u
REPO="${1:-/Volumes/USB DISK/2027/Web Build Assets/3d-library-full}"
DEST="${2:-/Volumes/USB DISK/2027/Web Build Assets/photo-library}"
LIST="$REPO/photos/originals.tsv"
[ -f "$LIST" ] || { echo "missing $LIST (git pull first)"; exit 1; }
mkdir -p "$DEST/originals"
ok=0; skip=0; fail=0
while IFS=$'\t' read -r cat id url; do
  [ -n "$id" ] || continue
  out="$DEST/originals/$cat/$id.jpg"
  if [ -s "$out" ]; then skip=$((skip+1)); continue; fi
  mkdir -p "$DEST/originals/$cat"
  if curl -fsSL --retry 3 -o "$out.part" "$url"; then mv "$out.part" "$out"; ok=$((ok+1))
  else rm -f "$out.part"; fail=$((fail+1)); echo "failed: $id"; fi
done < "$LIST"
cp "$REPO/catalog/photos.json" "$DEST/catalog.json"
cp "$REPO/CREDITS.md" "$DEST/CREDITS-all.md"
rsync -a "$REPO/photos/" "$DEST/web/" 2>/dev/null || cp -R "$REPO/photos/." "$DEST/web/"
echo "downloaded $ok, already had $skip, failed $fail"
du -sh "$DEST"
