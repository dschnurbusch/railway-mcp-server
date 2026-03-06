import type { ToolDefinition } from "../../types.js";

const BASE_URL = "https://www.courtlistener.com/api/rest/v4";

function clHeaders() {
  return { Authorization: `Token ${process.env.COURTLISTENER_API_TOKEN}` };
}

const tool: ToolDefinition = {
  name: "get_opinion",
  category: "courtlistener",
  description: "Retrieve the full text of a court opinion by opinion ID.",
  tags: ["courtlistener", "opinion", "case-law", "text", "ruling"],
  schema: {
    type: "object",
    properties: {
      opinion_id: {
        type: "string",
        description: "The CourtListener opinion ID.",
      },
    },
    required: ["opinion_id"],
  },
  async execute({ opinion_id }) {
    const res = await fetch(`${BASE_URL}/opinions/${opinion_id as string}/`, {
      headers: clHeaders(),
    });
    if (!res.ok) throw new Error(`CourtListener error ${res.status}: ${await res.text()}`);

    const o = (await res.json()) as Record<string, unknown>;
    const text = (o.html_with_citations ?? o.plain_text ?? o.html ?? "") as string;

    return {
      id: o.id,
      type: o.type,
      date_created: o.date_created,
      author_str: o.author_str,
      joined_by_str: o.joined_by_str,
      cite_count: o.cite_count,
      cluster: o.cluster,
      text: text.slice(0, 8000),
      truncated: text.length > 8000,
      character_count: text.length,
    };
  },
};

export default tool;
