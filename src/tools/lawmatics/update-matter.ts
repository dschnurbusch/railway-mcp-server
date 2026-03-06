import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.lawmatics.com/v1";

const tool: ToolDefinition = {
  name: "update_matter",
  category: "lawmatics",
  description: "Update fields on a Lawmatics matter, including pipeline stage transitions.",
  tags: ["lawmatics", "matter", "case", "update", "stage", "pipeline", "crm"],
  schema: {
    type: "object",
    properties: {
      matter_id: {
        type: "string",
        description: "The Lawmatics matter ID to update.",
      },
      name: { type: "string", description: "Updated matter name." },
      stage: {
        type: "string",
        description: "New pipeline stage name (triggers stage-change automations).",
      },
      practice_area: { type: "string", description: "Updated practice area." },
      description: { type: "string", description: "Updated description/notes." },
      status: {
        type: "string",
        description: "Matter status (e.g. 'active', 'closed', 'archived').",
      },
    },
    required: ["matter_id"],
  },
  async execute({ matter_id, name, stage, practice_area, description, status }) {
    const token = process.env.LAWMATICS_ACCESS_TOKEN;

    const body: Record<string, unknown> = {};
    if (name !== undefined) body.name = name;
    if (stage !== undefined) body.stage = stage;
    if (practice_area !== undefined) body.practice_area = practice_area;
    if (description !== undefined) body.description = description;
    if (status !== undefined) body.status = status;

    const res = await fetch(`${BASE_URL}/matters/${matter_id as string}`, {
      method: "PUT",
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
