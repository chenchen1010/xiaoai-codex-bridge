import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const children = [
  ["reply-server", ["src/voice-reply-server.js"]],
  ["xiaoai-listener", ["src/xiaoai-listener.js"]],
  ["codex-output-listener", ["src/codex-output-listener.js"]],
];

function start(name, args) {
  const child = spawn(process.execPath, args, {
    cwd: rootDir,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => process.stdout.write(`[${name}] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[${name}] ${chunk}`));
  child.on("exit", (code, signal) => {
    console.error(`[${name}] exited: ${signal || code}`);
    shutdown();
    process.exit(1);
  });

  return child;
}

let running = [];

function shutdown() {
  for (const child of running) {
    if (!child.killed) child.kill("SIGTERM");
  }
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(130);
});
process.on("SIGTERM", () => {
  shutdown();
  process.exit(143);
});

running = children.map(([name, args]) => start(name, args));
console.log("xiaoai codex bridge started");
