import type { ToolDefinition } from "../../types.js";
import { fetchReport, parseReport } from "./auth.js";

const tool: ToolDefinition = {
  name: "qb_trial_balance",
  category: "quickbooks",
  description:
    "Fetch a Trial Balance report from QuickBooks Online showing all account debits and credits for a date range.",
  tags: ["quickbooks", "accounting", "trial balance", "debits", "credits", "reporting"],
  schema: {
    type: "object",
    properties: {
      start_date: {
        type: "string",
        description: "Start date in YYYY-MM-DD format (e.g. 2024-01-01)",
      },
      end_date: {
        type: "string",
        description: "End date in YYYY-MM-DD format (e.g. 2024-12-31)",
      },
      accounting_method: {
        type: "string",
        description: 'Accounting method: "Cash" or "Accrual" (default: Accrual)',
      },
    },
    required: ["start_date", "end_date"],
  },
  async execute({ start_date, end_date, accounting_method }) {
    const raw = await fetchReport("TrialBalance", {
      start_date: start_date as string,
      end_date: end_date as string,
      accounting_method: (accounting_method as string) ?? "Accrual",
    });

    const { title, period, columns, lines } = parseReport(raw);

    return {
      title,
      period,
      columns,
      rows: lines.map((l) => ({
        label: "  ".repeat(l.depth) + l.label,
        values: l.values,
        type: l.type,
      })),
    };
  },
};

export default tool;
