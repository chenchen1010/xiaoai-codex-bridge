import { stdin } from "node:process";
import { sayViaXiaoAi } from "./xiaoai-client.js";

async function readStdinIfPiped() {
  if (stdin.isTTY) return "";
  const chunks = [];
  for await (const chunk of stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

const text = process.argv.slice(2).join(" ").trim() || (await readStdinIfPiped()).trim();

try {
  await sayViaXiaoAi(text);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
