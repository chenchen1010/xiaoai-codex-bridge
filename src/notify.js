import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { stdin } from "node:process";
import { fileURLToPath } from "node:url";
import { sayViaXiaoAi } from "./xiaoai-client.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const logPath = path.join(rootDir, ".data", "notify.log");

function log(message) {
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, `${new Date().toISOString()}\t${message}\n`);
}

async function readStdinIfPiped() {
  if (stdin.isTTY) return "";
  const chunks = [];
  for await (const chunk of stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function passthroughCodexNotification(args) {
  const command = process.env.CODEX_NOTIFY_PASSTHROUGH;
  if (!command) return;
  const extraArg = process.env.CODEX_NOTIFY_PASSTHROUGH_ARG;
  const passthroughArgs = extraArg ? [extraArg, ...args] : args;
  const child = spawn(command, passthroughArgs, {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}

function parsePayload(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

function buildMessage(payload) {
  const doneText = process.env.CODEX_DONE_TEXT || "AI 编程任务已完成，请查看结果。";
  const askText = process.env.CODEX_ASK_TEXT || "AI 需要你确认，请看一下屏幕。";
  const raw = JSON.stringify(payload).toLowerCase();

  if (raw.includes("approval") || raw.includes("confirm") || raw.includes("question")) {
    return askText;
  }

  return doneText;
}

const argvPayload = process.argv.slice(2).join(" ");
const stdinPayload = await readStdinIfPiped();
const payload = parsePayload(stdinPayload || argvPayload);

log(`triggered args=${JSON.stringify(process.argv.slice(2))} stdin=${JSON.stringify(stdinPayload.slice(0, 300))}`);
passthroughCodexNotification(process.argv.slice(2));

try {
  const message = buildMessage(payload);
  log(`speaking ${message}`);
  await sayViaXiaoAi(message);
  log("spoken ok");
} catch (error) {
  log(`error ${error instanceof Error ? error.stack || error.message : String(error)}`);
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
