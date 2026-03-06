import type { ToolDefinition } from "../../types.js";
import { google } from "googleapis";

function getSheetsClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.sheets({ version: "v4", auth });
}

interface RangeUpdate {
  range: string;
  values: unknown[][];
}

const tool: ToolDefinition = {
  name: "batch_update_sheet",
  category: "google-sheets",
  description: "Write multiple non-contiguous ranges in a Google Sheet in a single API call.",
  tags: ["google", "sheets", "batch", "write", "update", "multiple"],
  schema: {
    type: "object",
    properties: {
      spreadsheet_id: {
        type: "string",
        description: "The Google Spreadsheet ID.",
      },
      updates: {
        type: "array",
        description: 'Array of {range, values} objects. e.g. [{range:"Sheet1!A1",values:[["Hello"]]},{range:"Sheet1!C1",values:[["World"]]}].',
      },
    },
    required: ["spreadsheet_id", "updates"],
  },
  async execute({ spreadsheet_id, updates }) {
    const sheets = getSheetsClient();
    const data = (updates as RangeUpdate[]).map((u) => ({
      range: u.range,
      values: u.values,
    }));

    const res = await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: spreadsheet_id as string,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data,
      },
    });

    return {
      success: true,
      total_updated_cells: res.data.totalUpdatedCells,
      total_updated_rows: res.data.totalUpdatedRows,
      ranges_updated: res.data.responses?.length ?? 0,
    };
  },
};

export default tool;
