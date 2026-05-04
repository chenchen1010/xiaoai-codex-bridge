#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LABEL="com.burning.xiaoai-codex-bridge"

cd "$ROOT_DIR"

echo "正在启动小爱 Codex 桥接器..."
echo

if [ ! -f "$HOME/Library/LaunchAgents/$LABEL.plist" ]; then
  echo "首次启动：安装后台服务..."
  npm run service:install
else
  echo "后台服务已安装，正在重启..."
  launchctl stop "$LABEL" 2>/dev/null || true
  launchctl start "$LABEL" 2>/dev/null || npm run service:install
fi

echo
echo "正在检查服务状态..."
sleep 1

if curl -fsS "http://127.0.0.1:3337/health" >/dev/null; then
  echo "启动成功。现在可以对小爱说：小爱同学，回复 继续"
else
  echo "启动后没有检测到服务，请查看日志："
  echo "$ROOT_DIR/.data/logs/launchd.err.log"
  exit 1
fi

echo
echo "这个窗口 5 秒后自动关闭。"
sleep 5
