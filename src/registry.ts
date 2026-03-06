import { readdirSync, statSync } from "fs";
import { join, extname, dirname } from "path";
import { fileURLToPath } from "url";
import type { ToolDefinition } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      console.warn(`Tool "${tool.name}" already registered — skipping duplicate.`);
      return;
    }
    this.tools.set(tool.name, tool);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  all(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  async load(): Promise<void> {
    const toolsDir = join(__dirname, "tools");
    const files = findFiles(toolsDir);

    for (const file of files) {
      try {
        const mod = await import(file);
        const tool = mod.default;
        if (tool && typeof tool.name === "string" && typeof tool.execute === "function") {
          this.register(tool as ToolDefinition);
        } else {
          console.warn(`Skipping ${file}: missing name or execute export.`);
        }
      } catch (err) {
        console.error(`Failed to load tool from ${file}:`, err);
      }
    }

    console.log(`Loaded ${this.tools.size} tool(s) from registry.`);
  }
}

function findFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        results.push(...findFiles(full));
      } else {
        const ext = extname(entry);
        if (ext === ".js" || ext === ".ts") {
          results.push(full);
        }
      }
    }
  } catch {
    // tools dir may not exist yet
  }
  return results;
}

export const registry = new ToolRegistry();
