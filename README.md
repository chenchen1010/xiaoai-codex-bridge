# XiaoAi Codex Bridge

让小爱音箱成为 Codex 的语音层：Codex 写完代码，小爱用一句话播报结果；你说“回复 xxx”，Codex 自动收到并继续执行。

> Your coding agent should not require you to stare at the screen. This bridge lets XiaoAi tell you what Codex just did, then lets you reply by voice.

## What It Does

- **Spoken Codex summaries**：Codex 回合结束后，小爱播报适合“听”的简洁摘要。
- **Voice replies**：你说“小爱同学，回复 继续”，Codex 会自动收到“继续”。
- **Menu bar control**：macOS 右上角菜单栏显示运行状态，可启动、停止、查看日志。
- **Local-first**：桥接服务运行在你的 Mac 上，使用你自己的小爱音箱和小米账号。

## Demo Flow

```text
Codex 完成代码修改
→ 小爱播报：结果：已更新菜单栏应用，详情看屏幕。
→ 你说：小爱同学，回复 继续
→ Codex 自动收到：继续
```

## Verified Device

当前已实测：

- 小爱音箱 mini
- 米家名称：`小爱音箱mini`
- 硬件型号：`LX01`

其他小爱设备可能可用，但需要自行测试。

## Requirements

- macOS
- Node.js 18+
- Codex desktop app
- XiaoAi speaker connected to your Xiaomi account
- Xiaomi account credentials

## Install

```bash
git clone https://github.com/chenchen1010/xiaoai-codex-bridge.git
cd xiaoai-codex-bridge
npm install
cp .env.example .env
```

Edit `.env`:

```env
XIAOAI_USERNAME=your_xiaomi_id_or_phone
XIAOAI_PASSWORD=your_xiaomi_password
XIAOAI_DEVICE_NAME=小爱音箱mini
```

Test speaker output:

```bash
npm run say -- "测试，小爱音箱已经连接成功"
```

## Daily Use

Build the menu bar app:

```bash
npm run app:build
```

Then double-click the generated app on your Desktop:

```text
小爱Codex开关.app
```

Menu bar status:

- `小爱Codex 🟢`：running
- `小爱Codex 🔴`：stopped

The menu lets you:

- start/restart
- stop
- open logs
- quit the menu bar icon

## Voice Reply

Say:

```text
小爱同学，回复 继续
```

Codex receives and submits:

```text
继续
```

More examples:

```text
小爱同学，回复 选第一个方案
小爱同学，回复 帮我直接改
小爱同学，回复 先不要动代码，解释一下
```

XiaoAi may say “没听懂”. That is okay. The bridge reads XiaoAi's cloud recognition history; if Codex receives the text, the flow is working.

For longer replies, XiaoAi may split the command into two recognition records: one record is only “回复”, and the next or previous record is the actual content. The bridge pairs nearby records within 3 minutes and submits the content to Codex. If XiaoAi only records “回复”, wait for the prompt, then say the content as a second voice command.

Two-step long reply:

```text
小爱同学，回复
小爱同学，你把最新改动更新一下文档然后提交到 GitHub
```

## Spoken Summary

The bridge does not read the whole screen aloud. It creates a short listening-friendly version.

Default config:

```env
CODEX_SPEAK_FINAL_TEXT=true
CODEX_SPEAK_FINAL_MAX_CHARS=60
```

It tries to prioritize:

- what was completed
- whether you need to respond
- whether something failed

It also cleans noisy content:

- code blocks become “代码块”
- local file paths become “本地文件”
- links become “链接”
- long output ends with “详情看屏幕”

## Components

`npm start` runs three services:

- `reply-server`：receives reply text and submits it to Codex
- `xiaoai-listener`：listens for XiaoAi commands starting with “回复”
- `codex-output-listener`：detects Codex task completion and speaks a concise summary

The menu bar app manages these services through macOS LaunchAgent.

## Manual Testing

Check service health:

```bash
curl http://127.0.0.1:3337/health
```

Expected:

```json
{"ok":true}
```

Test automatic submission:

```bash
curl -sS -X POST http://127.0.0.1:3337/reply \
  -H 'content-type: application/json' \
  -d '{"text":"这是自动提交测试"}'
```

## Service Management

Install or reinstall background service:

```bash
npm run service:install
```

Uninstall:

```bash
npm run service:uninstall
```

Build menu bar app:

```bash
npm run app:build
```

Build macOS input helper:

```bash
npm run typer:build
```

If auto-submit is blocked by macOS Accessibility permissions, grant Accessibility permission to `小爱Codex输入助手.app`, then set:

```env
VOICE_REPLY_TYPER_APP=/Users/you/Desktop/小爱Codex输入助手.app
```

## Logs

Background service:

```text
.data/logs/launchd.out.log
.data/logs/launchd.err.log
```

Codex spoken summaries:

```text
.data/codex-output-listener.log
```

Voice replies:

```text
.data/replies.log
```

Reply submission detail:

```text
.data/reply-server.log
```

Notify fallback:

```text
.data/notify.log
```

## Important Config

```env
VOICE_REPLY_MODE=submit
VOICE_REPLY_TARGET_APP=Codex

XIAOAI_REPLY_PREFIX=回复
XIAOAI_REPLY_WEBHOOK=http://127.0.0.1:3337/reply

CODEX_SPEAK_FINAL_TEXT=true
CODEX_SPEAK_FINAL_MAX_CHARS=60
```

Set this if you want manual confirmation instead of auto-submit:

```env
VOICE_REPLY_MODE=clipboard
```

## Security

Never commit:

- `.env`
- `.data/`
- Xiaomi passwords, service tokens, session files, or private Codex logs

See [SECURITY.md](SECURITY.md).

## Launch Notes

For positioning, demo script, social copy, and release checklist, see [docs/MARKETING.md](docs/MARKETING.md).

For GitHub publishing steps, see [docs/PUBLISHING.md](docs/PUBLISHING.md).

## Prior Art

- [`xiaoai-tts`](https://github.com/vv314/xiaoai-tts)：used for XiaoAi login/session and TTS.
- [`MiGPT-Next`](https://github.com/idootop/migpt-next)：researched, but Xiaomi `passToken` verification made it less reliable for this setup.
- [`Open-XiaoAI`](https://github.com/idootop/open-xiaoai)：powerful, but requires specific devices and flashing.

## Disclaimer

This is an unofficial local automation project. It is not affiliated with Xiaomi, OpenAI, Codex, or Apple.
