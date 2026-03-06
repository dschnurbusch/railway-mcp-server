import type { ToolDefinition } from "../../types.js";

const tool: ToolDefinition = {
  name: "echo",
  category: "example",
  description: "Echoes back any JSON payload you send. Useful for testing invoke_tool parameter passing.",
  tags: ["example", "test", "debug"],
  schema: {
    type: "object",
    properties: {
      payload: {
        type: "object",
        description: "Any JSON object to echo back",
      },
    },
    required: ["payload"],
  },
  async execute({ payload }) {
    return { echoed: payload, timestamp: new Date().toISOString() };
  },
};

export default tool;
