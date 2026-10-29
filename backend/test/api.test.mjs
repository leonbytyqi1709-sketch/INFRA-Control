import { test, before, after } from "node:test";
import assert from "node:assert/strict";
process.env.NODE_ENV = "test";
delete process.env.PROXMOX_URL;
delete process.env.PROXMOX_TOKEN_ID;
delete process.env.PROXMOX_TOKEN_SECRET;
const { server } = await import("../dist/server.js");
let base;
before(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((r) => server.close(r)));
test("health stays online with security headers", async () => {
  const r = await fetch(base + "/api/health");
  assert.equal(r.status, 200);
  assert.equal((await r.json()).application, "InfraControl");
  assert.equal(r.headers.get("x-content-type-options"), "nosniff");
});
test("missing live config returns accurate unavailable state", async () => {
  const r = await fetch(base + "/api/proxmox/snapshot");
  assert.equal(r.status, 503);
  assert.deepEqual(await r.json(), { error: "NOT_CONFIGURED" });
});
test("rejects mutation and untrusted browser origins", async () => {
  assert.equal(
    (await fetch(base + "/api/health", { method: "POST" })).status,
    405,
  );
  assert.equal(
    (
      await fetch(base + "/api/health", {
        headers: { Origin: "https://untrusted.example" },
      })
    ).status,
    403,
  );
  assert.equal((await fetch(base + "/unknown")).status, 404);
});
test("upstream failures are sanitized; invalid records rejected", async () => {
  const real = globalThis.fetch;
  process.env.PROXMOX_URL = "https://pve.example.internal:8006";
  process.env.PROXMOX_TOKEN_ID = "monitor@pve!test";
  process.env.PROXMOX_TOKEN_SECRET = "test-only-placeholder";
  const { snapshot } = await import("../dist/proxmox.js");
  try {
    globalThis.fetch = async () => {
      throw Error("sensitive-internal-error");
    };
    await assert.rejects(snapshot(), { message: "CONNECTION_FAILED" });
    globalThis.fetch = async (url) =>
      new Response(
        JSON.stringify({
          data: String(url).endsWith("/version")
            ? { version: "8.4" }
            : "bad-records",
        }),
      );
    await assert.rejects(snapshot(), { message: "INVALID_RESPONSE" });
  } finally {
    globalThis.fetch = real;
  }
});
