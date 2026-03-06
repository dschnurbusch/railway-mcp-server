import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { searchTools } from "../search.js";
import { registry } from "../registry.js";

export function registerSearchTools(server: McpServer): void {
  server.tool(
    "search_tools",
    "Search the tool registry by keyword and/or category. Returns tool names and descriptions — call describe_tool to get full parameter schemas before invoking.",
    {
      query: z
        .string()
        .optional()
        .describe("Keyword or phrase to search for (fuzzy match)"),
      category: z
        .string()
        .optional()
        .describe("Filter by category (e.g. 'email', 'calendar', 'files')"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .describe("Max results to return (default 20)"),
    },
    async ({ query, category, limit }) => {
      // If no query or category, list all categories as a starting point
      if (!query && !category) {
        const allTools = registry.all();
        const categories = [...new Set(allTools.map((t) => t.category))].sort();
        const categoryCounts = Object.fromEntries(
          categories.map((cat) => [
            cat,
            allTools.filter((t) => t.category === cat).length,
          ])
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  total_tools: allTools.length,
                  categories: categoryCounts,
                  hint: "Pass a query or category to find specific tools.",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      const results = searchTools({ query, category, limit });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    }
  );
}
