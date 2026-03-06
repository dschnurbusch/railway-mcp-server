import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.lawmatics.com/v1";

const tool: ToolDefinition = {
  name: "list_contacts",
  category: "lawmatics",
  description: "List Lawmatics contacts with optional search and pagination.",
  tags: ["lawmatics", "contact", "list", "search", "crm"],
  schema: {
    type: "object",
    properties: {
      search: {
        type: "string",
        description: "Optional name or keyword to filter contacts.",
      },
      page: {
        type: "number",
        description: "Page number for pagination (default 1).",
      },
      per_page: {
        type: "number",
        description: "Results per page (default 25, max 100).",
      },
    },
    required: [],
  },
  async execute({ search, page, per_page }) {
    const token = process.env.LAWMATICS_ACCESS_TOKEN;

    const params = new URLSearchParams();
    if (search) params.set("search", search as string);
    params.set("page", String(page ?? 1));
    params.set("per_page", String(Math.min(Number(per_page ?? 25), 100)));

    const res = await fetch(`${BASE_URL}/contacts?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Lawmatics error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as Record<string, unknown>;
    return data;
  },
};

export default tool;
