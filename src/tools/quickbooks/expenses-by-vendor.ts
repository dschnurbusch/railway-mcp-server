import type { ToolDefinition } from "../../types.js";
import { fetchReport, parseReport } from "./auth.js";

const tool: ToolDefinition = {
  name: "qb_expenses_by_vendor",
  category: "quickbooks",
  description:
    "Fetch a vendor expense summary from QuickBooks Online, breaking down total spend per vendor for a date range.",
  tags: ["quickbooks", "accounting", "expenses", "vendor", "spending", "reporting"],
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
    const raw = await fetchReport("VendorExpenses", {
      start_date: start_date as string,
      end_date: end_date as string,
      accounting_method: (accounting_method as string) ?? "Accrual",
      summarize_column_by: "Vendors",
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
