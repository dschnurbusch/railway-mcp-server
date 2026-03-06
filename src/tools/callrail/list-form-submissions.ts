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
  name: "list_form_submissions",
  category: "callrail",
  description: "List CallRail form submissions (web intake forms) with attribution and field data.",
  tags: ["callrail", "forms", "intake", "submissions", "leads", "list"],
  schema: {
    type: "object",
    properties: {
      start_date: {
        type: "string",
        description: "Filter submissions on or after this date (YYYY-MM-DD).",
      },
      end_date: {
        type: "string",
        description: "Filter submissions on or before this date (YYYY-MM-DD).",
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
  async execute({ start_date, end_date, per_page, page }) {
    const params = new URLSearchParams();
    if (start_date) params.set("start_date", start_date as string);
    if (end_date) params.set("end_date", end_date as string);
    params.set("per_page", String(Math.min(Number(per_page ?? 25), 100)));
    params.set("page", String(page ?? 1));

    const res = await fetch(`${BASE_URL}/a/${accountId()}/form_submissions.json?${params}`, {
      headers: callrailHeaders(),
    });
    if (!res.ok) throw new Error(`CallRail error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { form_submissions: Array<Record<string, unknown>>; total_records: number };
    const submissions = (data.form_submissions ?? []).map((f) => ({
      id: f.id,
      submitted_at: f.submitted_at,
      person: f.person,
      form_data: f.form_data,
      source: f.source,
      medium: f.medium,
      campaign: f.campaign,
      lead_status: f.lead_status,
      tags: f.tags,
      note: f.note,
    }));

    return { submissions, returned: submissions.length, total_records: data.total_records };
  },
};

export default tool;
