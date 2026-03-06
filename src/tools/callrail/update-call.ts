import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.callrail.com/v3";

function callrailHeaders() {
  return {
    Authorization: `Token token="${process.env.CALLRAIL_API_KEY}"`,
    "Content-Type": "application/json",
  };
}

function accountId() {
  return process.env.CALLRAIL_ACCOUNT_ID!;
}

const tool: ToolDefinition = {
  name: "update_call",
  category: "callrail",
  description: "Update a CallRail call: set caller name, lead status, note, or tags.",
  tags: ["callrail", "call", "update", "tag", "lead", "note"],
  schema: {
    type: "object",
    properties: {
      call_id: {
        type: "string",
        description: "The CallRail call ID to update.",
      },
      caller_name: {
        type: "string",
        description: "Update the caller's name.",
      },
      lead_status: {
        type: "string",
        description: 'Set lead status: "good_lead" or "not_a_lead".',
      },
      note: {
        type: "string",
        description: "Add or update a note on the call.",
      },
      tags: {
        type: "array",
        description: 'Tags to set on the call (replaces existing tags). e.g. ["intake","personal-injury"].',
      },
    },
    required: ["call_id"],
  },
  async execute({ call_id, caller_name, lead_status, note, tags }) {
    const body: Record<string, unknown> = {};
    if (caller_name !== undefined) body.caller_name = caller_name;
    if (lead_status !== undefined) body.lead_status = lead_status;
    if (note !== undefined) body.note = note;
    if (tags !== undefined) body.tags = tags;

    const res = await fetch(`${BASE_URL}/a/${accountId()}/calls/${call_id as string}.json`, {
      method: "PUT",
      headers: callrailHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`CallRail error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as Record<string, unknown>;
    return { success: true, call_id: data.id, lead_status: data.lead_status, tags: data.tags };
  },
};

export default tool;
