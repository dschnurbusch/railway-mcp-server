import { google } from "googleapis";
import type { ToolDefinition } from "../../types.js";

function getGmailClient() {
  const auth = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
  return google.gmail({ version: "v1", auth });
}

function parseHeaders(headers: Array<{ name?: string | null; value?: string | null }>) {
  const map: Record<string, string> = {};
  for (const h of headers) {
    if (h.name && h.value) map[h.name.toLowerCase()] = h.value;
  }
  return map;
}

function extractBody(payload: any): string {
  if (!payload) return "";

  // Direct body
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8").slice(0, 2000);
  }

  // Multipart — prefer text/plain, fall back to text/html
  if (payload.parts) {
    const plain = payload.parts.find((p: any) => p.mimeType === "text/plain");
    const html = payload.parts.find((p: any) => p.mimeType === "text/html");
    const part = plain ?? html;
    if (part?.body?.data) {
      return Buffer.from(part.body.data, "base64").toString("utf-8").slice(0, 2000);
    }
  }

  return "";
}

const tool: ToolDefinition = {
  name: "fetch_emails",
  category: "gmail",
  description: "Search Gmail and return matching emails with subject, sender, date, and body preview.",
  tags: ["gmail", "email", "search", "inbox"],
  schema: {
    type: "object",
    properties: {
      gmail_search_filter: {
        type: "string",
        description: 'Gmail search query (e.g. "from:john@example.com", "subject:closing", "is:unread")',
      },
      max_results: {
        type: "number",
        description: "Number of emails to return (1–15, default 5)",
      },
    },
    required: ["gmail_search_filter"],
  },
  async execute({ gmail_search_filter, max_results }) {
    const gmail = getGmailClient();
    const limit = Math.min(Number(max_results ?? 5), 15);

    const list = await gmail.users.messages.list({
      userId: "me",
      q: gmail_search_filter as string,
      maxResults: limit,
    });

    const messages = list.data.messages ?? [];
    if (messages.length === 0) return { results: [], total: 0 };

    const results = await Promise.all(
      messages.map(async (m) => {
        const msg = await gmail.users.messages.get({
          userId: "me",
          id: m.id!,
          format: "full",
        });

        const headers = parseHeaders(msg.data.payload?.headers ?? []);
        const body = extractBody(msg.data.payload);

        return {
          id: msg.data.id,
          thread_id: msg.data.threadId,
          date: headers["date"] ?? null,
          from: headers["from"] ?? null,
          to: headers["to"] ?? null,
          subject: headers["subject"] ?? "(no subject)",
          snippet: msg.data.snippet ?? "",
          body_preview: body.trim(),
        };
      })
    );

    return { results, total: results.length };
  },
};

export default tool;
