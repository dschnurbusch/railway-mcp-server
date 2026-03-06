import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://api.lawmatics.com/v1";

const tool: ToolDefinition = {
  name: "create_expense",
  category: "lawmatics",
  description: "Add an expense to a Lawmatics matter.",
  tags: ["lawmatics", "expense", "billing", "costs", "create", "crm"],
  schema: {
    type: "object",
    properties: {
      matter_id: {
        type: "string",
        description: "The matter ID to add the expense to.",
      },
      amount: {
        type: "number",
        description: "Expense amount in dollars.",
      },
      description: {
        type: "string",
        description: "Description of the expense.",
      },
      date: {
        type: "string",
        description: "Expense date in YYYY-MM-DD format (defaults to today).",
      },
      billable: {
        type: "boolean",
        description: "Whether this expense is billable to the client (default true).",
      },
      category: {
        type: "string",
        description: "Expense category (e.g. 'Filing Fee', 'Travel', 'Postage').",
      },
    },
    required: ["matter_id", "amount", "description"],
  },
  async execute({ matter_id, amount, description, date, billable, category }) {
    const token = process.env.LAWMATICS_ACCESS_TOKEN;

    const body: Record<string, unknown> = {
      matter_id,
      amount,
      description,
      billable: billable !== undefined ? billable : true,
    };
    if (date) body.date = date;
    if (category) body.category = category;

    const res = await fetch(`${BASE_URL}/expenses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Lawmatics error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as Record<string, unknown>;
    return { success: true, expense: data };
  },
};

export default tool;
