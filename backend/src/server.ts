import { createServer } from "node:http";
import { configured, ProxmoxError, snapshot } from "./proxmox.js";
export const server = createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'",
  );
  const origin = req.headers.origin;
  const allowed = process.env.FRONTEND_ORIGIN;
  if (origin) {
    if (!allowed || origin !== allowed) {
      res.writeHead(403);
      res.end(JSON.stringify({ error: "Origin not allowed" }));
      return;
    }
    res.setHeader("Access-Control-Allow-Origin", allowed);
    res.setHeader("Vary", "Origin");
  }
  if (req.method !== "GET") {
    res.writeHead(405, { Allow: "GET" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }
  if (req.url === "/api/health") {
    res.end(
      JSON.stringify({
        application: "InfraControl",
        status: "online",
        timestamp: new Date().toISOString(),
      }),
    );
    return;
  }
  if (req.url === "/api/status") {
    res.end(
      JSON.stringify({
        application: "InfraControl",
        proxmoxConfigured: configured(),
        liveVerified: false,
      }),
    );
    return;
  }
  if (req.url === "/api/proxmox/snapshot") {
    try {
      res.end(JSON.stringify(await snapshot()));
    } catch (error) {
      const code =
        error instanceof ProxmoxError ? error.code : "INTERNAL_ERROR";
      res.writeHead(code === "NOT_CONFIGURED" ? 503 : 502);
      res.end(JSON.stringify({ error: code }));
    }
    return;
  }
  res.writeHead(404);
  res.end(JSON.stringify({ error: "Endpoint not found" }));
});
if (process.env.NODE_ENV !== "test")
  server.listen(Number(process.env.PORT) || 3000, "127.0.0.1", () =>
    console.log("InfraControl backend listening on loopback"),
  );
