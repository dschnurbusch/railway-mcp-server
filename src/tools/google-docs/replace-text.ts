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
  name: "replace_text",
  category: "google-docs",
  description: "Find and replace all occurrences of a string in a Google Doc.",
  tags: ["google", "docs", "replace", "find", "edit", "text"],
  schema: {
    type: "object",
    properties: {
      document_id: {
        type: "string",
        description: "The Google Doc ID.",
      },
      find: {
        type: "string",
        description: "The text to search for.",
      },
      replacement: {
        type: "string",
        description: "The text to replace it with.",
      },
      match_case: {
        type: "boolean",
        description: "Whether the search is case-sensitive (default false).",
      },
    },
    required: ["document_id", "find", "replacement"],
  },
  async execute({ document_id, find, replacement, match_case }) {
    const docs = getDocsClient();

    const res = await docs.documents.batchUpdate({
      documentId: document_id as string,
      requestBody: {
        requests: [
          {
            replaceAllText: {
              containsText: {
                text: find as string,
                matchCase: (match_case as boolean | undefined) ?? false,
              },
              replaceText: replacement as string,
            },
          },
        ],
      },
    });

    const occurrences = res.data.replies?.[0]?.replaceAllText?.occurrencesChanged ?? 0;
    return { success: true, occurrences_replaced: occurrences };
  },
};

export default tool;
