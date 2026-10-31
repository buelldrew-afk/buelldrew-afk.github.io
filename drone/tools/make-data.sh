#!/usr/bin/env bash
# Rebuilds clips.js from clips.tsv. Run from the Website folder: bash tools/make-data.sh
set -euo pipefail
cd "$(dirname "$0")/.."
{ echo "// Gallery clips. Generated from tools/clips.tsv; edit there and rerun tools/make-data.sh."
  echo "window.CLIPS = ["
  tail -n +2 tools/clips.tsv | awk -F'\t' '{printf "  { slug: \"%s\", group: \"%s\", title: \"%s\" },\n", $1, $3, $4}'
  echo "];"; } > clips.js
