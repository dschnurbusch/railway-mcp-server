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
  name: "get_call",
  category: "callrail",
  description: "Get full details for a specific CallRail call including recording URL, duration, caller, and tags.",
  tags: ["callrail", "call", "get", "detail", "recording", "phone"],
  schema: {
    type: "object",
    properties: {
      call_id: {
        type: "string",
        description: "The CallRail call ID.",
      },
    },
    required: ["call_id"],
  },
  async execute({ call_id }) {
    const res = await fetch(`${BASE_URL}/a/${accountId()}/calls/${call_id as string}.json`, {
      headers: callrailHeaders(),
    });
    if (!res.ok) throw new Error(`CallRail error ${res.status}: ${await res.text()}`);

    const c = (await res.json()) as Record<string, unknown>;
    return {
      id: c.id,
      start_time: c.start_time,
      duration_seconds: c.duration,
      direction: c.direction,
      caller_number: c.caller_number,
      caller_name: c.caller_name,
      called_number: c.called_number,
      answered: c.answered,
      lead_status: c.lead_status,
      tags: c.tags,
      note: c.note,
      recording_url: c.recording,
      recording_duration: c.recording_duration,
      source: c.source,
      medium: c.medium,
      campaign: c.campaign,
    };
  },
};

export default tool;
