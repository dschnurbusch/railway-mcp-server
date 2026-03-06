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
  name: "send_text",
  category: "callrail",
  description: "Send an outbound SMS from a CallRail tracking number to a customer.",
  tags: ["callrail", "sms", "text", "send", "outbound"],
  schema: {
    type: "object",
    properties: {
      to_number: {
        type: "string",
        description: "The recipient's phone number (e.g. +15551234567).",
      },
      from_number: {
        type: "string",
        description: "The CallRail tracking number to send from.",
      },
      content: {
        type: "string",
        description: "The text message content.",
      },
    },
    required: ["to_number", "from_number", "content"],
  },
  async execute({ to_number, from_number, content }) {
    const res = await fetch(`${BASE_URL}/a/${accountId()}/text-messages.json`, {
      method: "POST",
      headers: callrailHeaders(),
      body: JSON.stringify({
        customer_phone_number: to_number,
        tracking_phone_number: from_number,
        content,
      }),
    });
    if (!res.ok) throw new Error(`CallRail error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as Record<string, unknown>;
    return { success: true, id: data.id, direction: "outbound", to: to_number, content };
  },
};

export default tool;
