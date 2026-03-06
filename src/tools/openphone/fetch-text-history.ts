import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.openphone.com/v1";

const tool: ToolDefinition = {
  name: "fetch_text_history",
  category: "openphone",
  description:
    "Fetch SMS/text message history with a given phone number from OpenPhone (Quo). Returns sender, direction, text content, and timestamp.",
  tags: ["openphone", "quo", "sms", "text", "messages", "phone"],
  schema: {
    type: "object",
    properties: {
      phone: {
        type: "string",
        description: "Participant phone number in E.164 format (e.g. +15551234567)",
      },
      created_after: {
        type: "string",
        description: "ISO 8601 datetime — only return messages after this time",
      },
      created_before: {
        type: "string",
        description: "ISO 8601 datetime — only return messages before this time",
      },
      limit: {
        type: "number",
        description: "Max messages to return (1–100, default 10)",
      },
    },
    required: ["phone"],
  },
  async execute({ phone, created_after, created_before, limit }) {
    const apiKey = process.env.OPENPHONE_API_KEY!;
    const phoneNumberId = process.env.OPENPHONE_PHONE_NUMBER_ID!;

    const params = new URLSearchParams({
      phoneNumberId,
      maxResults: String(Math.min(Number(limit ?? 10), 100)),
    });
    params.append("participants", phone as string);
    if (created_after) params.set("createdAfter", created_after as string);
    if (created_before) params.set("createdBefore", created_before as string);

    const res = await fetch(`${BASE_URL}/messages?${params}`, {
      headers: { Authorization: apiKey },
    });

    if (!res.ok) {
      throw new Error(`OpenPhone error ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as {
      data: Array<{
        id: string;
        from: string;
        to: string[];
        text: string;
        direction: string;
        status: string;
        createdAt: string;
      }>;
      totalItems: number;
    };

    const messages = (data.data ?? []).map((m) => ({
      id: m.id,
      direction: m.direction,
      from: m.from,
      to: m.to,
      text: m.text,
      status: m.status,
      sent_at: m.createdAt,
    }));

    return { phone, total: data.totalItems, returned: messages.length, messages };
  },
};

export default tool;
