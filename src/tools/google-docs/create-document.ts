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
  name: "create_document",
  category: "google-docs",
  description: "Create a new blank Google Doc with a given title.",
  tags: ["google", "docs", "create", "new", "document"],
  schema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Title of the new document.",
      },
    },
    required: ["title"],
  },
  async execute({ title }) {
    const docs = getDocsClient();
    const res = await docs.documents.create({
      requestBody: { title: title as string },
    });

    return {
      success: true,
      document_id: res.data.documentId,
      title: res.data.title,
      url: `https://docs.google.com/document/d/${res.data.documentId}/edit`,
    };
  },
};

export default tool;
