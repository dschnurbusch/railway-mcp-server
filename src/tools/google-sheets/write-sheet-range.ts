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

const tool: ToolDefinition = {
  name: "write_sheet_range",
  category: "google-sheets",
  description: "Write values to a Google Sheet range, overwriting existing cell contents.",
  tags: ["google", "sheets", "write", "update", "cells", "range"],
  schema: {
    type: "object",
    properties: {
      spreadsheet_id: {
        type: "string",
        description: "The Google Spreadsheet ID.",
      },
      range: {
        type: "string",
        description: "A1 notation range to write to (e.g. 'Sheet1!A1:C3').",
      },
      values: {
        type: "array",
        description: "2D array of cell values (rows of columns). e.g. [[\"Name\",\"Age\"],[\"Alice\",30]].",
      },
    },
    required: ["spreadsheet_id", "range", "values"],
  },
  async execute({ spreadsheet_id, range, values }) {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheet_id as string,
      range: range as string,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: values as unknown[][] },
    });

    return {
      success: true,
      updated_range: res.data.updatedRange,
      updated_rows: res.data.updatedRows,
      updated_columns: res.data.updatedColumns,
      updated_cells: res.data.updatedCells,
    };
  },
};

export default tool;
