import type { ToolDefinition } from "../../types.js";
import { fetchReport, parseReport } from "./auth.js";

const tool: ToolDefinition = {
  name: "qb_cash_flow",
  category: "quickbooks",
  description:
    "Fetch a Cash Flow Statement from QuickBooks Online for a given date range, showing operating, investing, and financing activities.",
  tags: ["quickbooks", "accounting", "cash flow", "statement", "reporting"],
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
    },
    required: ["start_date", "end_date"],
  },
  async execute({ start_date, end_date }) {
    const raw = await fetchReport("CashFlow", {
      start_date: start_date as string,
      end_date: end_date as string,
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
