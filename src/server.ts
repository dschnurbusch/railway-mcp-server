import express, { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { registry } from "./registry.js";
import { registerSearchTools } from "./meta/search-tools.js";
import { registerDescribeTool } from "./meta/describe-tool.js";
import { registerInvokeTool } from "./meta/invoke-tool.js";

const PORT = parseInt(process.env.PORT ?? "3000", 10);
const API_KEY = process.env.MCP_API_KEY;

// Session transport map for stateful connections
const transports = new Map<string, StreamableHTTPServerTransport>();

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
    // No key configured — open in dev mode
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
  // Auto-discover and load all tools
  await registry.load();

  const app = express();
  app.use(express.json());

  // Health check (no auth required)
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      tools: registry.all().length,
      uptime: process.uptime(),
    });
  });

  // MCP endpoint — POST handles initialize + tool calls
  app.post("/mcp", authMiddleware, async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    // Route to existing session
    if (sessionId && transports.has(sessionId)) {
      await transports.get(sessionId)!.handleRequest(req, res, req.body);
      return;
    }

    // New session — must be an initialize request
    if (isInitializeRequest(req.body)) {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          transports.set(id, transport);
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) transports.delete(transport.sessionId);
      };

      const server = createMcpServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    res.status(400).json({
      error: "No session ID provided and request is not an initialize request.",
    });
  });

  // SSE stream for server-to-client notifications
  app.get("/mcp", authMiddleware, async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string;
    const transport = transports.get(sessionId);

    if (!transport) {
      res.status(400).json({ error: "Invalid or expired session." });
      return;
    }

    await transport.handleRequest(req, res);
  });

  // Session termination
  app.delete("/mcp", authMiddleware, async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string;
    const transport = transports.get(sessionId);

    if (!transport) {
      res.status(400).json({ error: "Invalid or expired session." });
      return;
    }

    await transport.handleRequest(req, res);
  });

  app.listen(PORT, () => {
    const keyStatus = API_KEY ? "enabled" : "DISABLED (set MCP_API_KEY)";
    console.log(`Railway MCP server running on port ${PORT}`);
    console.log(`Auth: ${keyStatus}`);
    console.log(`Tools loaded: ${registry.all().length}`);
    console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
