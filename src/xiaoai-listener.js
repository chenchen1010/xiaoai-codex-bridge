import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import dotenv from "dotenv";
import { sayViaXiaoAi } from "./xiaoai-client.js";

const require = createRequire(import.meta.url);
const XiaoAiTts = require("xiaoai-tts");

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(rootDir, ".env") });

const sessionPath = path.join(rootDir, process.env.XIAOAI_SESSION_PATH || ".data/xiaoai-session.json");
const prefix = process.env.XIAOAI_REPLY_PREFIX || process.env.MIGPT_REPLY_PREFIX || "回复";
const webhook = process.env.XIAOAI_REPLY_WEBHOOK || process.env.MIGPT_REPLY_WEBHOOK || `http://127.0.0.1:${process.env.VOICE_REPLY_PORT || "3337"}/reply`;
const pollMs = Number.parseInt(process.env.XIAOAI_LISTENER_POLL_MS || "1500", 10);
const commandPairWindowMs = Number.parseInt(process.env.XIAOAI_REPLY_PAIR_WINDOW_MS || "180000", 10);

function cookieFromSession(session, device) {
  const parts = [
    `userId=${session.userId}`,
    `serviceToken=${session.serviceToken}`,
    `deviceId=${device.deviceID}`,
    `sn=${device.serialNumber || session.serialNumber || ""}`,
    `hardware=${device.hardware || ""}`,
    `deviceSNProfile=${device.deviceSNProfile || ""}`,
  ];
  return parts.join("; ");
}

async function fetchConversations(session, device, limit = 2) {
  const params = new URLSearchParams({
    limit: String(limit),
    requestId: crypto.randomUUID(),
    source: "dialogu",
    hardware: device.hardware || "",
  });
  const response = await fetch(`https://userprofile.mina.mi.com/device_profile/v2/conversation?${params}`, {
    headers: {
      accept: "application/json, text/plain, */*",
      cookie: cookieFromSession(session, device),
      referer: "https://userprofile.mina.mi.com/dialogue-note/index.html",
      "user-agent": "Mozilla/5.0 (Linux; Android 10; 000; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/119.0.6045.193 Mobile Safari/537.36 /XiaoMi/HybridView/ micoSoundboxApp/i appVersion/A_2.4.40",
    },
  });

  if (!response.ok) {
    throw new Error(`读取小爱对话失败：${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const payload = typeof data.data === "string" ? JSON.parse(data.data) : data.data || data;
  return payload.records || [];
}

async function forwardReply(text) {
  const response = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`转发到 Codex 失败：${response.status} ${await response.text()}`);
  }
}

function extractReply(text) {
  const spoken = String(text || "").trim();
  if (!spoken.startsWith(prefix)) return null;
  return spoken.replace(new RegExp(`^${prefix}[，,。\\s]*`), "").trim();
}

function isPrefixOnly(text) {
  return new RegExp(`^${prefix}[，,。\\s]*$`).test(String(text || "").trim());
}

const session = JSON.parse(await fs.readFile(sessionPath, "utf8"));
const xiaoai = new XiaoAiTts(session);
const device = await xiaoai.getDevice(process.env.XIAOAI_DEVICE_NAME);

if (!device) {
  throw new Error(`找不到在线音箱：${process.env.XIAOAI_DEVICE_NAME}`);
}

let lastTime = 0;
let pendingPrefixTime = 0;
let recentNonCommand = null;
let lastForwarded = null;
const initialRecords = await fetchConversations(session, device, 1);
if (initialRecords[0]) lastTime = initialRecords[0].time;

console.log(`xiaoai listener started: ${device.name} (${device.hardware})`);
console.log(`voice command: "${prefix} 继续" -> ${webhook}`);

setInterval(async () => {
  try {
    const records = await fetchConversations(session, device, 5);
    const newRecords = records
      .filter((record) => record.time > lastTime)
      .sort((a, b) => a.time - b.time);

    for (const record of newRecords) {
      lastTime = Math.max(lastTime, record.time);
      const reply = extractReply(record.query);
      console.log(`heard: ${record.query}`);

      if (reply === null) {
        const withinPendingPrefix = pendingPrefixTime && record.time - pendingPrefixTime <= commandPairWindowMs;

        if (withinPendingPrefix) {
          pendingPrefixTime = 0;
          if (!lastForwarded || lastForwarded.text !== record.query || record.time - lastForwarded.time > commandPairWindowMs) {
            console.log(`paired reply after prefix: ${record.query}`);
            await forwardReply(record.query);
            lastForwarded = { text: record.query, time: record.time };
            await sayViaXiaoAi("已发送到 Codex");
          }
          continue;
        }

        recentNonCommand = { text: record.query, time: record.time };
        continue;
      }

      if (!reply) {
        const pairedPrevious =
          recentNonCommand && record.time - recentNonCommand.time <= commandPairWindowMs ? recentNonCommand : null;

        if (pairedPrevious) {
          recentNonCommand = null;
          pendingPrefixTime = 0;
          if (!lastForwarded || lastForwarded.text !== pairedPrevious.text || record.time - lastForwarded.time > commandPairWindowMs) {
            console.log(`paired previous reply: ${pairedPrevious.text}`);
            await forwardReply(pairedPrevious.text);
            lastForwarded = { text: pairedPrevious.text, time: record.time };
            await sayViaXiaoAi("已发送到 Codex");
          }
          continue;
        }

        if (isPrefixOnly(record.query)) {
          pendingPrefixTime = record.time;
          await sayViaXiaoAi("收到，请继续说要发给 Codex 的内容。");
          continue;
        }

        await sayViaXiaoAi("你可以说，回复，然后说要发给 Codex 的内容。");
        continue;
      }

      pendingPrefixTime = 0;
      recentNonCommand = null;
      await forwardReply(reply);
      lastForwarded = { text: reply, time: record.time };
      await sayViaXiaoAi("已发送到 Codex");
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
  }
}, Math.max(1000, pollMs));
