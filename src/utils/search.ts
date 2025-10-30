// Client-side search utilities (no filesystem operations)
import type { SearchItem } from "@/utils/file";

export type SearchResult = SearchItem & {
  highlightedTitle: string;
  highlightedDescription: string;
  matchScore: number;
};

/**
 * Highlight matching text in a string
 */
export function highlightText(text: string, query: string): string {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return text.replace(regex, '<span class="bg-yellow-200/50 dark:bg-yellow-400/20 px-0.5 py-0 rounded-sm font-medium">$1</span>');
}

/**
 * Calculate match score for search ranking
 */
function calculateMatchScore(item: SearchItem, query: string): number {
  const lowerQuery = query.toLowerCase();
  const lowerTitle = item.title.toLowerCase();
  const lowerDescription = item.description.toLowerCase();

  // Exact title match gets highest score
  if (lowerTitle === lowerQuery) return 100;

  // Title starts with query gets high score
  if (lowerTitle.startsWith(lowerQuery)) return 90;

  // Title contains query gets medium score
  if (lowerTitle.includes(lowerQuery)) return 70;

  // Description starts with query gets medium score
  if (lowerDescription.startsWith(lowerQuery)) return 60;

  // Description contains query gets lower score
  if (lowerDescription.includes(lowerQuery)) return 40;

  // Fuzzy match in searchable text gets lowest score
  if (item.searchableText.includes(lowerQuery)) return 20;

  return 0;
}

/**
 * Search through items and return ranked results
 */
export function searchItems(items: SearchItem[], query: string, limit: number = 5): SearchResult[] {
  if (!query.trim()) return [];

  const results: SearchResult[] = [];

  for (const item of items) {
    const score = calculateMatchScore(item, query);

    if (score > 0) {
      results.push({
        ...item,
        highlightedDescription: highlightText(item.description, query),
        highlightedTitle: highlightText(item.title, query),
        matchScore: score
      });
    }
  }

  // Sort by score (descending) and return top results
  return results.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
}
