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
  name: "list_calls",
  category: "callrail",
  description: "List CallRail calls with optional filters by date range, caller, tag, or lead status.",
  tags: ["callrail", "calls", "intake", "list", "phone", "leads"],
  schema: {
    type: "object",
    properties: {
      start_date: {
        type: "string",
        description: "Filter calls on or after this date (YYYY-MM-DD).",
      },
      end_date: {
        type: "string",
        description: "Filter calls on or before this date (YYYY-MM-DD).",
      },
      caller_number: {
        type: "string",
        description: "Filter by caller phone number.",
      },
      tag: {
        type: "string",
        description: "Filter by tag name.",
      },
      lead_status: {
        type: "string",
        description: 'Filter by lead status: "good_lead", "not_a_lead".',
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
  async execute({ start_date, end_date, caller_number, tag, lead_status, per_page, page }) {
    const params = new URLSearchParams();
    if (start_date) params.set("start_date", start_date as string);
    if (end_date) params.set("end_date", end_date as string);
    if (caller_number) params.set("caller_number", caller_number as string);
    if (tag) params.set("tags[]", tag as string);
    if (lead_status) params.set("lead_status", lead_status as string);
    params.set("per_page", String(Math.min(Number(per_page ?? 25), 100)));
    params.set("page", String(page ?? 1));
    params.set("fields", "id,start_time,duration,caller_number,caller_name,called_number,direction,lead_status,tags,recording,answered");

    const res = await fetch(`${BASE_URL}/a/${accountId()}/calls.json?${params}`, {
      headers: callrailHeaders(),
    });
    if (!res.ok) throw new Error(`CallRail error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { calls: Array<Record<string, unknown>>; total_records: number; page: number; total_pages: number };
    const calls = (data.calls ?? []).map((c) => ({
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
      has_recording: !!(c.recording),
    }));

    return { calls, returned: calls.length, total_records: data.total_records, page: data.page, total_pages: data.total_pages };
  },
};

export default tool;
