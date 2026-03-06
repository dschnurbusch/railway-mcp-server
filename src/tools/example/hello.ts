import type { ToolDefinition } from "../../types.js";

const tool: ToolDefinition = {
  name: "hello_world",
  category: "example",
  description: "Returns a greeting for a given name. Useful for testing that the server is working.",
  tags: ["example", "test", "greeting"],
  schema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "The name to greet",
      },
    },
    required: ["name"],
  },
  async execute({ name }) {
    return { message: `Hello, ${name}! The railway-mcp-server is working.` };
  },
};

export default tool;
