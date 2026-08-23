export type SearchableArchiveItem = { title: string; body?: string | null; altText?: string | null; mediaType?: string | null };

export function filterArchiveItems<T extends SearchableArchiveItem>(items: T[], query: string): T[] {
  const term = query.trim().toLocaleLowerCase();
  if (!term) return items;
  return items.filter(item => [item.title, item.body, item.altText, item.mediaType].filter(Boolean).join(" ").toLocaleLowerCase().includes(term));
}
