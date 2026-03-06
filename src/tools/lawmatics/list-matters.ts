import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.lawmatics.com/v1";

const tool: ToolDefinition = {
  name: "list_matters",
  category: "lawmatics",
  description: "List Lawmatics matters (cases) with optional filters and pagination.",
  tags: ["lawmatics", "matter", "case", "list", "pipeline", "crm"],
  schema: {
    type: "object",
    properties: {
      contact_id: {
        type: "string",
        description: "Filter matters by contact ID.",
      },
      stage: {
        type: "string",
        description: "Filter by pipeline stage name.",
      },
      practice_area: {
        type: "string",
        description: "Filter by practice area name.",
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
  async execute({ contact_id, stage, practice_area, page, per_page }) {
    const token = process.env.LAWMATICS_ACCESS_TOKEN;

    const params = new URLSearchParams();
    if (contact_id) params.set("contact_id", contact_id as string);
    if (stage) params.set("stage", stage as string);
    if (practice_area) params.set("practice_area", practice_area as string);
    params.set("page", String(page ?? 1));
    params.set("per_page", String(Math.min(Number(per_page ?? 25), 100)));

    const res = await fetch(`${BASE_URL}/matters?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Lawmatics error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as Record<string, unknown>;
    return data;
  },
};

export default tool;
