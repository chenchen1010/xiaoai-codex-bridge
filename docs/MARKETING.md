# Open Source Launch Notes

## Positioning

One-line pitch:

> Turn a XiaoAi speaker into a hands-free voice layer for Codex.

Short description:

> XiaoAi Codex Bridge lets a XiaoAi speaker read concise Codex results aloud and lets you reply by voice with "回复 xxx". It is designed for makers who want AI coding to keep moving while they are away from the keyboard.

## Why It Is Interesting

- It connects a real consumer smart speaker to a coding agent workflow.
- It solves a real working pain: Codex can finish while you are not staring at the screen.
- It makes voice replies practical by using a strict command prefix and concise spoken summaries.
- It is local-first: the bridge runs on your Mac and uses your own XiaoAi device.

## Target Users

- Chinese-speaking Codex users
- Makers with XiaoAi speakers
- AI automation builders
- People who want ambient coding notifications and hands-free follow-up

## Demo Script

1. Start the menu bar app.
2. Ask Codex to make a small code change.
3. Walk away from the keyboard.
4. XiaoAi speaks a short result summary.
5. Say: "小爱同学，回复 继续".
6. Codex receives "继续" and proceeds.

## README Hook

Recommended opening:

> Your coding agent should not require you to stare at the screen. This bridge lets XiaoAi tell you what Codex just did, then lets you reply by voice.

## Social Post Draft

我把小爱音箱 mini 接进了 Codex 工作流。

现在 Codex 写完代码，小爱会用 60 字左右播报结果；我说“小爱同学，回复 继续”，它会自动提交回 Codex。长回复也支持两段式：先说“回复”，再说具体内容。

不是玩具，是一个真正能用的 hands-free AI coding loop。

GitHub: https://github.com/chenchen1010/xiaoai-codex-bridge

## Suggested GitHub Topics

- codex
- xiaoai
- xiaomi
- voice-control
- ai-coding
- smart-speaker
- macos
- automation

## Release Checklist

- Remove real `.env` and `.data` from git.
- Confirm `.env.example` has placeholders only.
- Include a short demo GIF or screen recording.
- Add screenshots of the menu bar app.
- Add a clear disclaimer that this is unofficial.
- Tag `v0.1.0`.
