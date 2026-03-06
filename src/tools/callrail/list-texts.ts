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
  name: "list_texts",
  category: "callrail",
  description: "List CallRail SMS/MMS text message conversations.",
  tags: ["callrail", "sms", "texts", "messages", "list"],
  schema: {
    type: "object",
    properties: {
      start_date: {
        type: "string",
        description: "Filter texts on or after this date (YYYY-MM-DD).",
      },
      end_date: {
        type: "string",
        description: "Filter texts on or before this date (YYYY-MM-DD).",
      },
      phone_number: {
        type: "string",
        description: "Filter by customer phone number.",
      },
      per_page: {
        type: "number",
        description: "Results per page (default 25, max 100).",
      },
      page: {
        type: "number",
        description: "Page number (default 1).",
      },
    },
    required: [],
  },
  async execute({ start_date, end_date, phone_number, per_page, page }) {
    const params = new URLSearchParams();
    if (start_date) params.set("start_date", start_date as string);
    if (end_date) params.set("end_date", end_date as string);
    if (phone_number) params.set("phone_number", phone_number as string);
    params.set("per_page", String(Math.min(Number(per_page ?? 25), 100)));
    params.set("page", String(page ?? 1));

    const res = await fetch(`${BASE_URL}/a/${accountId()}/text-messages.json?${params}`, {
      headers: callrailHeaders(),
    });
    if (!res.ok) throw new Error(`CallRail error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { text_messages: Array<Record<string, unknown>>; total_records: number };
    const texts = (data.text_messages ?? []).map((t) => ({
      id: t.id,
      created_at: t.created_at,
      direction: t.direction,
      customer_number: t.customer_number,
      tracking_number: t.tracking_number,
      content: t.content,
      type: t.type,
    }));

    return { texts, returned: texts.length, total_records: data.total_records };
  },
};

export default tool;
