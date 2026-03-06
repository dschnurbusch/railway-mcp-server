import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.airtable.com/v0";

const tool: ToolDefinition = {
  name: "get_matter_comments",
  category: "airtable",
  description: "Retrieve all comments on an Airtable matter record.",
  tags: ["airtable", "matter", "comments", "notes"],
  schema: {
    type: "object",
    properties: {
      matter_record_id: {
        type: "string",
        description: "The Airtable record ID of the matter (format: recXXXXXXXXXXXXXX)",
      },
    },
    required: ["matter_record_id"],
  },
  async execute({ matter_record_id }) {
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableId = process.env.AIRTABLE_MATTERS_TABLE;
    const token = process.env.AIRTABLE_API_TOKEN;

    const url = `${BASE_URL}/${baseId}/${tableId}/${matter_record_id}/comments`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`Airtable error ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as {
      comments?: Array<{
        id: string;
        text: string;
        createdTime: string;
        author: { name: string; email: string };
      }>;
    };

    const comments = (data.comments ?? []).map((c) => ({
      id: c.id,
      author: c.author?.name ?? c.author?.email ?? "Unknown",
      date: c.createdTime,
      text: c.text,
    }));

    return { matter_record_id, total: comments.length, comments };
  },
};

export default tool;
