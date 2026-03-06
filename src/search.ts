import Fuse from "fuse.js";
import { registry } from "./registry.js";
import type { ToolSummary } from "./types.js";

let fuse: Fuse<ToolSummary> | null = null;

function getFuse(): Fuse<ToolSummary> {
  if (!fuse) {
    const summaries: ToolSummary[] = registry.all().map((t) => ({
      name: t.name,
      category: t.category,
      description: t.description,
      tags: t.tags,
    }));

    fuse = new Fuse(summaries, {
      keys: [
        { name: "name", weight: 0.4 },
        { name: "tags", weight: 0.3 },
        { name: "description", weight: 0.2 },
        { name: "category", weight: 0.1 },
      ],
      threshold: 0.4,
      includeScore: false,
    });
  }
  return fuse;
}

/** Call after registry.load() to reset the index when tools change. */
export function invalidateSearchIndex(): void {
  fuse = null;
}

export function searchTools(params: {
  query?: string;
  category?: string;
  limit?: number;
}): ToolSummary[] {
  const { query, category, limit = 20 } = params;

  let results: ToolSummary[] = registry.all().map((t) => ({
    name: t.name,
    category: t.category,
    description: t.description,
    tags: t.tags,
  }));

  // Filter by category first if provided
  if (category) {
    results = results.filter(
      (t) => t.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Then fuzzy search within the filtered set
  if (query) {
    const f = query && !category
      ? getFuse()
      : new Fuse(results, {
          keys: [
            { name: "name", weight: 0.4 },
            { name: "tags", weight: 0.3 },
            { name: "description", weight: 0.2 },
          ],
          threshold: 0.4,
        });
    results = f.search(query).map((r) => r.item);
  }

  return results.slice(0, limit);
}
