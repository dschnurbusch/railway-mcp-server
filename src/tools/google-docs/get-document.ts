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

function extractText(content: unknown[]): string {
  const parts: string[] = [];
  for (const element of content) {
    const el = element as Record<string, unknown>;
    if (el.paragraph) {
      const para = el.paragraph as Record<string, unknown>;
      const elements = (para.elements as unknown[]) ?? [];
      for (const pe of elements) {
        const e = pe as Record<string, unknown>;
        const tr = e.textRun as Record<string, unknown> | undefined;
        if (tr?.content) parts.push(String(tr.content));
      }
    } else if (el.table) {
      parts.push("[table]");
    }
  }
  return parts.join("").trim();
}

const tool: ToolDefinition = {
  name: "get_document",
  category: "google-docs",
  description: "Read a Google Doc's title and full text content.",
  tags: ["google", "docs", "read", "document", "content"],
  schema: {
    type: "object",
    properties: {
      document_id: {
        type: "string",
        description: "The Google Doc ID (from the URL: /document/d/{id}/).",
      },
    },
    required: ["document_id"],
  },
  async execute({ document_id }) {
    const docs = getDocsClient();
    const res = await docs.documents.get({
      documentId: document_id as string,
    });

    const body = res.data.body?.content ?? [];
    const text = extractText(body as unknown[]);

    return {
      document_id: res.data.documentId,
      title: res.data.title,
      text: text.slice(0, 8000),
      truncated: text.length > 8000,
      character_count: text.length,
    };
  },
};

export default tool;
