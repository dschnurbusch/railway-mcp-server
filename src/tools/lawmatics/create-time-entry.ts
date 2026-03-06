import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.lawmatics.com/v1";

const tool: ToolDefinition = {
  name: "create_time_entry",
  category: "lawmatics",
  description: "Log a billable time entry to a Lawmatics matter.",
  tags: ["lawmatics", "time", "billing", "hours", "log", "create", "crm"],
  schema: {
    type: "object",
    properties: {
      matter_id: {
        type: "string",
        description: "The matter ID to log time against.",
      },
      duration_minutes: {
        type: "number",
        description: "Time spent in minutes.",
      },
      description: {
        type: "string",
        description: "Description of the work performed.",
      },
      date: {
        type: "string",
        description: "Date of work in YYYY-MM-DD format (defaults to today).",
      },
      hourly_rate: {
        type: "number",
        description: "Hourly rate in dollars (optional; uses matter default if omitted).",
      },
      billable: {
        type: "boolean",
        description: "Whether this entry is billable (default true).",
      },
    },
    required: ["matter_id", "duration_minutes", "description"],
  },
  async execute({ matter_id, duration_minutes, description, date, hourly_rate, billable }) {
    const token = process.env.LAWMATICS_ACCESS_TOKEN;

    const body: Record<string, unknown> = {
      matter_id,
      duration_minutes,
      description,
      billable: billable !== undefined ? billable : true,
    };
    if (date) body.date = date;
    if (hourly_rate !== undefined) body.hourly_rate = hourly_rate;

    const res = await fetch(`${BASE_URL}/time_entries`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Lawmatics error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as Record<string, unknown>;
    return { success: true, time_entry: data };
  },
};

export default tool;
