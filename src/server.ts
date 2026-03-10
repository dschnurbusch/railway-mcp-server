import express, { Request, Response, NextFunction } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registry } from "./registry.js";
import { registerSearchTools } from "./meta/search-tools.js";
import { registerDescribeTool } from "./meta/describe-tool.js";
import { registerInvokeTool } from "./meta/invoke-tool.js";

const PORT = parseInt(process.env.PORT ?? "3000", 10);
const API_KEY = process.env.MCP_API_KEY;

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "railway-tools",
    version: "1.0.0",
  });

  registerSearchTools(server);
  registerDescribeTool(server);
  registerInvokeTool(server);

  return server;
}

function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!API_KEY) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token !== API_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}

async function main(): Promise<void> {
  await registry.load();

  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      tools: registry.all().length,
      uptime: process.uptime(),
    });
  });

  // MCP endpoint — stateless mode: each request gets a fresh transport+server.
  // No session tracking needed, so server restarts don't break connections.
  app.post("/mcp", authMiddleware, async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    const server = createMcpServer();
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  // GET for SSE — not needed in stateless mode
  app.get("/mcp", (_req, res) => {
    res.status(405).json({ error: "SSE not supported in stateless mode." });
  });

  // DELETE for session termination — not needed in stateless mode
  app.delete("/mcp", (_req, res) => {
    res.status(405).json({ error: "Session termination not applicable in stateless mode." });
  });

  app.listen(PORT, () => {
    const keyStatus = API_KEY ? "enabled" : "DISABLED (set MCP_API_KEY)";
    console.log(`Railway MCP server running on port ${PORT} (stateless)`);
    console.log(`Auth: ${keyStatus}`);
    console.log(`Tools loaded: ${registry.all().length}`);
    console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
