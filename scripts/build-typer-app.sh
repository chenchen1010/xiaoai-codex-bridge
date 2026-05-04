#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
APP_NAME="小爱Codex输入助手.app"
APP_PATH="$ROOT_DIR/.data/apps/$APP_NAME"
EXECUTABLE="小爱Codex输入助手"
ICON="$ROOT_DIR/assets/xiaoai-codex.icns"

mkdir -p "$APP_PATH/Contents/MacOS" "$APP_PATH/Contents/Resources"

if [ ! -f "$ICON" ]; then
  bash "$ROOT_DIR/scripts/build-icons.sh"
fi

swiftc "$ROOT_DIR/macos-app/XiaoAiCodexTyper.swift" \
  -o "$APP_PATH/Contents/MacOS/$EXECUTABLE" \
  -framework AppKit \
  -framework ApplicationServices \
  -framework Foundation

cat > "$APP_PATH/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key>
  <string>$EXECUTABLE</string>
  <key>CFBundleIdentifier</key>
  <string>com.burning.xiaoai-codex-typer</string>
  <key>CFBundleName</key>
  <string>$EXECUTABLE</string>
  <key>CFBundleIconFile</key>
  <string>xiaoai-codex</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
</dict>
</plist>
PLIST

echo "APPL????" > "$APP_PATH/Contents/PkgInfo"
cp "$ICON" "$APP_PATH/Contents/Resources/xiaoai-codex.icns"
chmod +x "$APP_PATH/Contents/MacOS/$EXECUTABLE"
xattr -cr "$APP_PATH"
codesign --force --deep --sign - "$APP_PATH" >/dev/null 2>&1 || true

echo "$APP_PATH"
