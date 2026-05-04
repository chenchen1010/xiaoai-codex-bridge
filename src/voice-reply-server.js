import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(rootDir, ".env") });

const port = Number.parseInt(process.env.VOICE_REPLY_PORT || "3337", 10);
const legacyAutoPaste = String(process.env.VOICE_REPLY_AUTO_PASTE || "false").toLowerCase() === "true";
const replyMode = (process.env.VOICE_REPLY_MODE || (legacyAutoPaste ? "submit" : "clipboard")).toLowerCase();
const targetApp = process.env.VOICE_REPLY_TARGET_APP || "Codex";
const submitDelayMs = Number.parseInt(process.env.VOICE_REPLY_SUBMIT_DELAY_MS || "300", 10);
const logPath = path.join(rootDir, ".data", "replies.log");

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString("utf8");
  return body ? JSON.parse(body) : {};
}

function run(command, args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["pipe", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      code === 0 ? resolve() : reject(new Error(stderr || `${command} exited with ${code}`));
    });
    child.stdin.end(input);
  });
}

async function saveReply(text) {
  await fs.mkdir(path.dirname(logPath), { recursive: true });
  await fs.appendFile(logPath, `${new Date().toISOString()}\t${text}\n`);
  await run("pbcopy", [], text);

  if (replyMode === "paste" || replyMode === "submit") {
    const script = [
      `tell application "${targetApp}" to activate`,
      `delay ${Math.max(0, submitDelayMs) / 1000}`,
      'tell application "System Events" to keystroke "v" using command down',
    ];

    if (replyMode === "submit") {
      script.push('tell application "System Events" to key code 36');
    }

    await run("osascript", script.flatMap((line) => ["-e", line]), "");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (req.method !== "POST" || req.url !== "/reply") {
      res.writeHead(404, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "not_found" }));
      return;
    }

    const payload = await readJson(req);
    const text = String(payload.text || "").trim();
    if (!text) {
      res.writeHead(400, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "missing_text" }));
      return;
    }

    await saveReply(text);
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true, copied: true, mode: replyMode, targetApp }));
  } catch (error) {
    res.writeHead(500, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`voice reply server listening on http://0.0.0.0:${port}`);
  console.log(`voice reply mode: ${replyMode}${replyMode === "clipboard" ? "" : ` -> ${targetApp}`}`);
});
