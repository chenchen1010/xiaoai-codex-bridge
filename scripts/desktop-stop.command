#!/usr/bin/env bash
set -euo pipefail

LABEL="com.burning.xiaoai-codex-bridge"

echo "正在停止小爱 Codex 桥接器..."
launchctl stop "$LABEL" 2>/dev/null || true
echo "已停止。"
echo
echo "这个窗口 3 秒后自动关闭。"
sleep 3
