#!/usr/bin/env bash
set -euo pipefail

ASSET_DIR="public/images/marketing"
for img in "$ASSET_DIR"/*.jpg; do
  base="${img%.jpg}"

  if sips -s format webp "$img" --out "${base}.webp" >/dev/null 2>&1; then
    echo "Created ${base}.webp"
  else
    echo "Could not create webp for $img (sips may not support webp on this system)."
  fi

  if sips -s format avif "$img" --out "${base}.avif" >/dev/null 2>&1; then
    echo "Created ${base}.avif"
  else
    echo "Could not create avif for $img (sips may not support avif on this system)."
  fi
done
