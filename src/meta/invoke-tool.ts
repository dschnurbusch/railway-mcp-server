import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registry } from "../registry.js";

export function registerInvokeTool(server: McpServer): void {
  server.tool(
    "invoke_tool",
    "Execute any registered tool by name. Call describe_tool first to learn the required parameters.",
    {
      tool_name: z.string().describe("Name of the tool to invoke"),
      params: z
        .record(z.unknown())
        .optional()
        .describe("Parameters to pass to the tool (as a JSON object)"),
    },
    async ({ tool_name, params }) => {
      const tool = registry.get(tool_name);

      if (!tool) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: `Tool "${tool_name}" not found.`,
                hint: "Use search_tools to discover available tools.",
              }),
            },
          ],
          isError: true,
        };
      }

      try {
        const result = await tool.execute(params ?? {});
        const text =
          typeof result === "string"
            ? result
            : JSON.stringify(result, null, 2);

        return {
          content: [{ type: "text", text }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: message, tool: tool_name }),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
