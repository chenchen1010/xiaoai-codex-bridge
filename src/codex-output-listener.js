import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { sayViaXiaoAi } from "./xiaoai-client.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(rootDir, ".env") });

const statePath = path.join(rootDir, ".data", "codex-output-listener-state.json");
const logPath = path.join(rootDir, ".data", "codex-output-listener.log");
const pollMs = Number.parseInt(process.env.CODEX_OUTPUT_POLL_MS || "2000", 10);
const speakFinalText = String(process.env.CODEX_SPEAK_FINAL_TEXT || "false").toLowerCase() === "true";
const doneText = process.env.CODEX_OUTPUT_DONE_TEXT || process.env.CODEX_DONE_TEXT || "AI 编程任务已完成，请查看结果。";
const maxFinalTextLength = Number.parseInt(process.env.CODEX_SPEAK_FINAL_MAX_CHARS || "60", 10);

function log(message) {
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, `${new Date().toISOString()}\t${message}\n`);
}

async function readState() {
  try {
    return JSON.parse(await fsp.readFile(statePath, "utf8"));
  } catch {
    return { offsets: {}, completedTurns: {} };
  }
}

async function writeState(state) {
  await fsp.mkdir(path.dirname(statePath), { recursive: true });
  await fsp.writeFile(statePath, JSON.stringify(state, null, 2));
}

function sqlite(args) {
  return new Promise((resolve, reject) => {
    execFile("sqlite3", args, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) reject(new Error(stderr || error.message));
      else resolve(stdout);
    });
  });
}

async function latestRolloutPaths() {
  const db = path.join(process.env.HOME || "", ".codex", "state_5.sqlite");
  const sql = "select rollout_path from threads where rollout_path != '' order by updated_at_ms desc limit 5;";
  const stdout = await sqlite([db, sql]);
  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function cleanFinalText(text) {
  const normalized = String(text || "")
    .replace(/```[\s\S]*?```/g, "代码块")
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .replace(/\[[^\]]+]\([^)]+\)/g, (match) => match.match(/^\[([^\]]+)]/)?.[1] || "")
    .replace(/\/Users\/[^\s，。；：,;:]+/g, "本地文件")
    .replace(/https?:\/\/[^\s，。；：,;:]+/g, "链接")
    .replace(/[`*_#>\[\]()]/g, "")
    .replace(/\s*[-•]\s*/g, "。")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return "";

  const sentences = normalized
    .split(/[。！？!?；;]\s*/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const preferred = sentences.find((sentence) =>
    /已|已经|完成|改好|修复|新增|更新|通过|失败|需要|建议|下一步|可以/.test(sentence),
  ) || sentences[0] || normalized;

  let spoken = preferred
    .replace(/^已?经?帮你/, "")
    .replace(/^我已经/, "已")
    .replace(/^我/, "")
    .replace(/^这次/, "")
    .trim();

  if (!/[。！？!?]$/.test(spoken)) spoken += "。";

  const prefix = /需要|失败|报错|没能|无法/.test(spoken) ? "需要你看一下：" : "结果：";
  const cleaned = `${prefix}${spoken}`;

  if (cleaned.length <= maxFinalTextLength) return cleaned;

  const clipped = cleaned.slice(0, maxFinalTextLength);
  const sentenceEnd = Math.max(clipped.lastIndexOf("。"), clipped.lastIndexOf("；"), clipped.lastIndexOf("."));
  return `${clipped.slice(0, sentenceEnd > 20 ? sentenceEnd + 1 : maxFinalTextLength)} 详情看屏幕。`;
}

function messageForCompletion(payload) {
  if (!speakFinalText) return doneText;
  const text = cleanFinalText(payload.last_agent_message);
  return text || doneText;
}

async function readNewLines(filePath, state) {
  const stat = await fsp.stat(filePath);
  const previous = state.offsets[filePath];

  if (previous === undefined || previous > stat.size) {
    state.offsets[filePath] = stat.size;
    return [];
  }

  if (previous === stat.size) return [];

  const handle = await fsp.open(filePath, "r");
  try {
    const length = stat.size - previous;
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, previous);
    state.offsets[filePath] = stat.size;
    return buffer.toString("utf8").split("\n").filter(Boolean);
  } finally {
    await handle.close();
  }
}

async function handleLine(line, state) {
  let event;
  try {
    event = JSON.parse(line);
  } catch {
    return;
  }

  const payload = event.payload || {};
  if (event.type !== "event_msg" || payload.type !== "task_complete") return;

  const turnId = payload.turn_id;
  if (!turnId || state.completedTurns[turnId]) return;
  state.completedTurns[turnId] = Date.now();

  const message = messageForCompletion(payload);
  log(`task_complete ${turnId}: ${message}`);
  await sayViaXiaoAi(message);
  log(`spoken ${turnId}`);
}

async function tick(state) {
  const paths = await latestRolloutPaths();
  for (const rolloutPath of paths) {
    let lines = [];
    try {
      lines = await readNewLines(rolloutPath, state);
    } catch {
      continue;
    }

    for (const line of lines) {
      await handleLine(line, state);
    }
  }
  await writeState(state);
}

const state = await readState();
log("codex output listener started");

setInterval(() => {
  tick(state).catch((error) => log(`error ${error instanceof Error ? error.stack || error.message : String(error)}`));
}, Math.max(1000, pollMs));
