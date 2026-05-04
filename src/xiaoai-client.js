import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import XiaoAiTts from "xiaoai-tts";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(rootDir, ".env") });

function resolveFromRoot(value, fallback) {
  const target = value || fallback;
  return path.isAbsolute(target) ? target : path.join(rootDir, target);
}

async function readSession(sessionPath) {
  try {
    return JSON.parse(await fs.readFile(sessionPath, "utf8"));
  } catch {
    return null;
  }
}

async function writeSession(sessionPath, session) {
  await fs.mkdir(path.dirname(sessionPath), { recursive: true });
  await fs.writeFile(sessionPath, JSON.stringify(session, null, 2));
}

export async function createXiaoAiClient() {
  const sessionPath = resolveFromRoot(process.env.XIAOAI_SESSION_PATH, ".data/xiaoai-session.json");
  const savedSession = await readSession(sessionPath);
  const username = process.env.XIAOAI_USERNAME;
  const password = process.env.XIAOAI_PASSWORD;

  if (!savedSession && (!username || !password)) {
    throw new Error("缺少 XIAOAI_USERNAME / XIAOAI_PASSWORD，请先复制 .env.example 为 .env 并填写。");
  }

  const client = savedSession ? new XiaoAiTts(savedSession) : new XiaoAiTts(username, password);

  if (!savedSession) {
    const session = await client.connect();
    await writeSession(sessionPath, session);
  }

  const deviceName = process.env.XIAOAI_DEVICE_NAME;
  if (deviceName) {
    const device = await client.getDevice(deviceName);
    if (!device) {
      throw new Error(`找不到在线音箱：${deviceName}`);
    }
    client.useDevice(device.deviceID);
  }

  const volume = Number.parseInt(process.env.XIAOAI_VOLUME || "", 10);
  if (Number.isInteger(volume)) {
    await client.setVolume(Math.max(0, Math.min(100, volume)));
  }

  return client;
}

export async function sayViaXiaoAi(text) {
  const normalized = String(text || "").trim();
  if (!normalized) return;
  const client = await createXiaoAiClient();
  await client.say(normalized);
}
