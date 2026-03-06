import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registry } from "../registry.js";

export function registerDescribeTool(server: McpServer): void {
  server.tool(
    "describe_tool",
    "Get the full parameter schema and details for one or more tools before invoking them. Pass a single name or an array of names.",
    {
      tool_name: z
        .union([z.string(), z.array(z.string())])
        .describe("Tool name or array of tool names to describe"),
    },
    async ({ tool_name }) => {
      const names = Array.isArray(tool_name) ? tool_name : [tool_name];

      const results = names.map((name) => {
        const tool = registry.get(name);
        if (!tool) {
          return { name, error: `Tool "${name}" not found. Use search_tools to find available tools.` };
        }
        return {
          name: tool.name,
          category: tool.category,
          description: tool.description,
          tags: tool.tags,
          parameters: tool.schema,
        };
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results.length === 1 ? results[0] : results, null, 2),
          },
        ],
      };
    }
  );
}
