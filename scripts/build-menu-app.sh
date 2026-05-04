#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
APP_NAME="小爱Codex开关.app"
APP_PATH="$HOME/Desktop/$APP_NAME"
BUILD_DIR="$ROOT_DIR/.data/build"
EXECUTABLE="小爱Codex开关"

mkdir -p "$BUILD_DIR" "$APP_PATH/Contents/MacOS" "$APP_PATH/Contents/Resources"

swiftc "$ROOT_DIR/macos-app/XiaoAiCodexSwitch.swift" \
  -o "$APP_PATH/Contents/MacOS/$EXECUTABLE" \
  -framework AppKit \
  -framework Foundation

/usr/libexec/PlistBuddy -c "Clear dict" "$APP_PATH/Contents/Info.plist" 2>/dev/null || true
cp "$ROOT_DIR/macos-app/Info.plist" "$APP_PATH/Contents/Info.plist"
/usr/libexec/PlistBuddy -c "Add :XiaoAiBridgeRoot string $ROOT_DIR" "$APP_PATH/Contents/Info.plist"
echo "APPL????" > "$APP_PATH/Contents/PkgInfo"
chmod +x "$APP_PATH/Contents/MacOS/$EXECUTABLE"

codesign --force --deep --sign - "$APP_PATH" >/dev/null 2>&1 || true

echo "$APP_PATH"
