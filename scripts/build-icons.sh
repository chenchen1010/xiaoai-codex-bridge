#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ICONSET="$ROOT_DIR/.data/build/XiaoAiCodex.iconset"
PNG_1024="$ROOT_DIR/.data/build/xiaoai-codex-1024.png"
ICNS="$ROOT_DIR/assets/xiaoai-codex.icns"

mkdir -p "$ICONSET" "$(dirname "$ICNS")" "$ROOT_DIR/.data/build"

if command -v qlmanage >/dev/null 2>&1; then
  qlmanage -t -s 1024 -o "$ROOT_DIR/.data/build" "$ROOT_DIR/assets/xiaoai-codex-icon.svg" >/dev/null 2>&1 || true
fi

GENERATED="$ROOT_DIR/.data/build/xiaoai-codex-icon.svg.png"
if [ -f "$GENERATED" ]; then
  mv "$GENERATED" "$PNG_1024"
fi

if [ ! -f "$PNG_1024" ]; then
  cat > "$ROOT_DIR/.data/build/icon.html" <<HTML
<!doctype html>
<img src="$ROOT_DIR/assets/xiaoai-codex-icon.svg" width="1024" height="1024">
HTML
  if command -v sips >/dev/null 2>&1; then
    echo "Could not render SVG automatically. Install librsvg or open assets/xiaoai-codex-icon.svg and export 1024 PNG to $PNG_1024."
    exit 1
  fi
fi

sips -z 16 16 "$PNG_1024" --out "$ICONSET/icon_16x16.png" >/dev/null
sips -z 32 32 "$PNG_1024" --out "$ICONSET/icon_16x16@2x.png" >/dev/null
sips -z 32 32 "$PNG_1024" --out "$ICONSET/icon_32x32.png" >/dev/null
sips -z 64 64 "$PNG_1024" --out "$ICONSET/icon_32x32@2x.png" >/dev/null
sips -z 128 128 "$PNG_1024" --out "$ICONSET/icon_128x128.png" >/dev/null
sips -z 256 256 "$PNG_1024" --out "$ICONSET/icon_128x128@2x.png" >/dev/null
sips -z 256 256 "$PNG_1024" --out "$ICONSET/icon_256x256.png" >/dev/null
sips -z 512 512 "$PNG_1024" --out "$ICONSET/icon_256x256@2x.png" >/dev/null
sips -z 512 512 "$PNG_1024" --out "$ICONSET/icon_512x512.png" >/dev/null
cp "$PNG_1024" "$ICONSET/icon_512x512@2x.png"

iconutil -c icns "$ICONSET" -o "$ICNS"
echo "$ICNS"
