#!/usr/bin/env bash
set -euo pipefail

LABEL="com.burning.xiaoai-codex-bridge"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

launchctl stop "$LABEL" 2>/dev/null || true
launchctl unload "$PLIST" 2>/dev/null || true
rm -f "$PLIST"

echo "uninstalled: $LABEL"
