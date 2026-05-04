import test from "node:test";
import assert from "node:assert/strict";

test("project scaffold is loadable", async () => {
  const module = await import("../src/xiaoai-client.js");
  assert.equal(typeof module.sayViaXiaoAi, "function");
});
