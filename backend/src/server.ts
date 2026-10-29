import { createServer } from "node:http";

const PORT = 3000;

const server = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/api/health") {
    res.writeHead(200, {
      "Content-Type": "application/json",
    });
    
    res.end(JSON.stringify({
      application: "InfraControl",
      status: "online",
      timestamp: new Date().toISOString(),
    }));

    return;
  }

  res.writeHead(404, {
    "Content-Type": "application/json",
  });

  res.end(JSON.stringify({
    error: "Endpoint not found",
  }));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log('InfraControl läuft auf Port 3000');
});