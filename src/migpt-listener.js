import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { MiGPT } from "@mi-gpt/next";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(rootDir, ".env") });

const replyWebhook = process.env.MIGPT_REPLY_WEBHOOK || `http://127.0.0.1:${process.env.VOICE_REPLY_PORT || "3337"}/reply`;
const prefix = process.env.MIGPT_REPLY_PREFIX || "回复";
const userId = process.env.MIGPT_XIAOMI_USER_ID || process.env.XIAOAI_USERNAME;
const password = process.env.XIAOAI_PASSWORD;
const did = process.env.MIGPT_DID || process.env.XIAOAI_DEVICE_NAME;

if (!userId || !password || !did) {
  throw new Error("缺少 MIGPT_XIAOMI_USER_ID/XIAOAI_PASSWORD/XIAOAI_DEVICE_NAME 配置。");
}

async function forwardReply(text) {
  const response = await fetch(replyWebhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`转发失败：${response.status} ${await response.text()}`);
  }
}

function stripPrefix(text) {
  return text.replace(new RegExp(`^${prefix}[，,。\\s]*`), "").trim();
}

console.log(`MiGPT listener starting, device: ${did}`);
console.log(`Voice command: "${prefix} 继续" -> ${replyWebhook}`);
console.log(`Xiaomi login: userId=${userId}, password=${password ? "<set>" : "<missing>"}`);

await MiGPT.start({
  debug: true,
  speaker: {
    userId,
    password,
    did,
  },
  openai: {
    model: "gpt-4o-mini",
    baseURL: "http://127.0.0.1:9/v1",
    apiKey: "not-used",
  },
  prompt: {
    system: "只用于转发语音回复到 Codex。",
  },
  callAIKeywords: ["__disabled__"],
  async onMessage(_engine, { text }) {
    const spoken = String(text || "").trim();
    console.log(`heard: ${spoken}`);

    if (!spoken.startsWith(prefix)) return;

    const reply = stripPrefix(spoken);
    if (!reply) {
      return { text: "你可以说，回复，然后说要发给 Codex 的内容。" };
    }

    await forwardReply(reply);
    return { text: "已发送到 Codex" };
  },
});
