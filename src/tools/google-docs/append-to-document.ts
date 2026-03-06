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
  name: "append_to_document",
  category: "google-docs",
  description: "Append text to the end of a Google Doc.",
  tags: ["google", "docs", "append", "write", "insert", "text"],
  schema: {
    type: "object",
    properties: {
      document_id: {
        type: "string",
        description: "The Google Doc ID.",
      },
      text: {
        type: "string",
        description: "Text to append to the document. Use \\n for newlines.",
      },
    },
    required: ["document_id", "text"],
  },
  async execute({ document_id, text }) {
    const docs = getDocsClient();

    // Get current end index to insert at end
    const docRes = await docs.documents.get({
      documentId: document_id as string,
      fields: "body.content",
    });

    const content = docRes.data.body?.content ?? [];
    const lastElement = content[content.length - 1] as Record<string, unknown> | undefined;
    const endIndex = (lastElement?.endIndex as number | undefined) ?? 1;

    await docs.documents.batchUpdate({
      documentId: document_id as string,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: endIndex - 1 },
              text: text as string,
            },
          },
        ],
      },
    });

    return { success: true, document_id, appended_chars: (text as string).length };
  },
};

export default tool;
