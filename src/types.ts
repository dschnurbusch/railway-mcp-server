export interface JsonSchema {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
  description?: string;
}

export interface ToolDefinition {
  name: string;
  category: string;
  description: string;
  tags: string[];
  schema: JsonSchema;
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

export interface ToolSummary {
  name: string;
  category: string;
  description: string;
  tags: string[];
}
