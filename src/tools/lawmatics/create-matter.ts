import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.lawmatics.com/v1";

const tool: ToolDefinition = {
  name: "create_matter",
  category: "lawmatics",
  description: "Create a new matter (case) in Lawmatics linked to a contact.",
  tags: ["lawmatics", "matter", "case", "create", "new", "pipeline", "crm"],
  schema: {
    type: "object",
    properties: {
      contact_id: {
        type: "string",
        description: "The Lawmatics contact ID to link as the primary contact.",
      },
      name: {
        type: "string",
        description: "Matter name or case title.",
      },
      practice_area: {
        type: "string",
        description: "Practice area (e.g. 'Personal Injury', 'Family Law').",
      },
      stage: {
        type: "string",
        description: "Pipeline stage to assign the matter to.",
      },
      description: {
        type: "string",
        description: "Optional description or notes for the matter.",
      },
    },
    required: ["contact_id", "name"],
  },
  async execute({ contact_id, name, practice_area, stage, description }) {
    const token = process.env.LAWMATICS_ACCESS_TOKEN;

    const body: Record<string, unknown> = { contact_id, name };
    if (practice_area) body.practice_area = practice_area;
    if (stage) body.stage = stage;
    if (description) body.description = description;

    const res = await fetch(`${BASE_URL}/matters`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Lawmatics error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as Record<string, unknown>;
    return { success: true, matter: data };
  },
};

export default tool;
