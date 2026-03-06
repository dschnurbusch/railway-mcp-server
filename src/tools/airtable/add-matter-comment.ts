import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.airtable.com/v0";

const tool: ToolDefinition = {
  name: "add_matter_comment",
  category: "airtable",
  description: "Add a comment to an Airtable matter record.",
  tags: ["airtable", "matter", "comment", "note", "write"],
  schema: {
    type: "object",
    properties: {
      matter_record_id: {
        type: "string",
        description: "The Airtable record ID of the matter (format: recXXXXXXXXXXXXXX)",
      },
      comment: {
        type: "string",
        description: "The comment text to add to the matter record.",
      },
    },
    required: ["matter_record_id", "comment"],
  },
  async execute({ matter_record_id, comment }) {
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableId = process.env.AIRTABLE_MATTERS_TABLE;
    const token = process.env.AIRTABLE_API_TOKEN;

    const url = `${BASE_URL}/${baseId}/${tableId}/${matter_record_id}/comments`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: comment }),
    });

    if (!res.ok) {
      throw new Error(`Airtable error ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as { id: string; createdTime: string };

    return {
      success: true,
      comment_id: data.id,
      matter_record_id,
      created_at: data.createdTime,
    };
  },
};

export default tool;
