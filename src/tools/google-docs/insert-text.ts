import type { ToolDefinition } from "../../types.js";
import { google } from "googleapis";

function getDocsClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.docs({ version: "v1", auth });
}

const tool: ToolDefinition = {
  name: "insert_text",
  category: "google-docs",
  description: "Insert text at a specific character index in a Google Doc.",
  tags: ["google", "docs", "insert", "write", "text", "index"],
  schema: {
    type: "object",
    properties: {
      document_id: {
        type: "string",
        description: "The Google Doc ID.",
      },
      index: {
        type: "number",
        description: "Character index at which to insert (1 = start of document body).",
      },
      text: {
        type: "string",
        description: "Text to insert at the given index.",
      },
    },
    required: ["document_id", "index", "text"],
  },
  async execute({ document_id, index, text }) {
    const docs = getDocsClient();

    await docs.documents.batchUpdate({
      documentId: document_id as string,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: index as number },
              text: text as string,
            },
          },
        ],
      },
    });

    return { success: true, document_id, inserted_at_index: index };
  },
};

export default tool;
