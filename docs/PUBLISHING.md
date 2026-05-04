# Publishing Checklist

## Before Push

Run:

```bash
npm test
git status --short
git check-ignore .env .data/xiaoai-session.json
```

Confirm no secrets are staged:

```bash
git diff --cached
```

## Create GitHub Repo

Suggested repository name:

```text
xiaoai-codex-bridge
```

Suggested description:

```text
Use a XiaoAi speaker as a voice interface for Codex: spoken summaries and voice replies.
```

Suggested visibility:

```text
public
```

Suggested topics:

```text
codex, xiaoai, xiaomi, voice-control, ai-coding, smart-speaker, macos, automation
```

## First Push

```bash
git init
git add .
git commit -m "Initial open source release"
gh repo create xiaoai-codex-bridge --public --source=. --remote=origin --push
```

## After Push

- Add a demo video or GIF.
- Add GitHub topics.
- Create release `v0.1.0`.
- Pin the repo on your GitHub profile.
