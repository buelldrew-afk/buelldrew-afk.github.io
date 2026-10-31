#!/usr/bin/env bash
# Compresses the drone clips listed in clips.tsv for the website.
# Each clip gets three files in media/:
#   <slug>-sm.mp4  small silent loop for the gallery tile (960px wide)
#   <slug>.mp4     larger silent version for the full-screen viewer (up to 1920px wide)
#   <slug>.jpg     still frame shown before the video loads
# Usage: bash tools/encode.sh   (run from the Website folder; skips clips already done)
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=".."
OUT="media"
mkdir -p "$OUT"

tail -n +2 tools/clips.tsv | while IFS=$'\t' read -r slug source group title start dur; do
  in="$SRC/$source"
  if [[ ! -f "$in" ]]; then echo "MISSING: $source"; continue; fi
  common=(-v error -y -ss "$start" -t "$dur" -i "$in" -an -c:v libx264 -preset slow -pix_fmt yuv420p -g 60 -movflags +faststart)
  [[ -f "$OUT/$slug-sm.mp4" ]] || ffmpeg "${common[@]}" -vf "scale='min(960,iw)':-2" -crf 28 -maxrate 1500k -bufsize 3000k "$OUT/$slug-sm.mp4" </dev/null
  [[ -f "$OUT/$slug.mp4" ]]    || ffmpeg "${common[@]}" -vf "scale='min(1920,iw)':-2" -crf 25 -maxrate 4000k -bufsize 8000k "$OUT/$slug.mp4" </dev/null
  [[ -f "$OUT/$slug.jpg" ]]    || ffmpeg -v error -y -ss "$(awk "BEGIN{print $start+1.5}")" -i "$in" -frames:v 1 -vf "scale='min(960,iw)':-2" -q:v 4 "$OUT/$slug.jpg" </dev/null
  echo "done: $slug"
done
