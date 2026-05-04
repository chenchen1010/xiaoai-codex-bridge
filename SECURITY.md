# Security

This project controls a local Codex session and a XiaoAi speaker through your own machine.

## Do Not Commit Secrets

Never commit:

- `.env`
- `.data/`
- Xiaomi passwords, service tokens, session files, or logs containing private prompts

The repository `.gitignore` excludes those files by default.

## Local Automation Risk

`VOICE_REPLY_MODE=submit` pastes voice-recognized text into Codex and presses Enter.

Use a strict voice prefix such as:

```text
回复 xxx
```

Set this when you want manual confirmation:

```env
VOICE_REPLY_MODE=clipboard
```

## Supported Scope

This project is a personal local automation bridge. It is not an official Xiaomi, OpenAI, or Codex product.

Report security issues privately to the repository owner instead of opening a public issue with credentials or logs.
