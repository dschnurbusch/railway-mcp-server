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
  name: "get_call_recording",
  category: "callrail",
  description: "Get the MP3 recording URL for a CallRail call. URLs are short-lived — do not cache.",
  tags: ["callrail", "recording", "call", "audio", "mp3"],
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
    const res = await fetch(`${BASE_URL}/a/${accountId()}/calls/${call_id as string}/recording.json`, {
      headers: callrailHeaders(),
    });
    if (!res.ok) throw new Error(`CallRail error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as Record<string, unknown>;
    return {
      call_id,
      recording_url: data.recording,
      duration_seconds: data.recording_duration,
      note: "Recording URLs are short-lived. Fetch fresh each time.",
    };
  },
};

export default tool;
