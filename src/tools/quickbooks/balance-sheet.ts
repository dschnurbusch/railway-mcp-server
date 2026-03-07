import type { ToolDefinition } from "../../types.js";
import { fetchReport, parseReport } from "./auth.js";

const tool: ToolDefinition = {
  name: "qb_balance_sheet",
  category: "quickbooks",
  description:
    "Fetch a Balance Sheet report from QuickBooks Online as of a specific date, showing assets, liabilities, and equity.",
  tags: ["quickbooks", "accounting", "balance sheet", "assets", "liabilities", "equity", "reporting"],
  schema: {
    type: "object",
    properties: {
      as_of_date: {
        type: "string",
        description: "Report date in YYYY-MM-DD format (e.g. 2024-12-31)",
      },
      accounting_method: {
        type: "string",
        description: 'Accounting method: "Cash" or "Accrual" (default: Accrual)',
      },
    },
    required: ["as_of_date"],
  },
  async execute({ as_of_date, accounting_method }) {
    const raw = await fetchReport("BalanceSheet", {
      start_date: as_of_date as string,
      end_date: as_of_date as string,
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
