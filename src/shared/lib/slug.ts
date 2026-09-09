// Turn a review title into a URL segment. Falls back when a title has no
// characters that survive (an all-Korean or all-symbol title, say).
export const slugify = (s: string, fallback: string): string => {
  const out = String(s).toLowerCase().normalize('NFKD')
    .replace(/[^\w\s-]/g, ' ').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return out || fallback;
};

// Two titles can slugify to the same string; keep URLs unique.
export function assignUniqueSlugs<T extends { slug: string }>(items: T[]): T[] {
  const seen = new Map<string, number>();
  for (const item of items) {
    const n = (seen.get(item.slug) ?? 0) + 1;
    seen.set(item.slug, n);
    if (n > 1) item.slug = `${item.slug}-${n}`;
  }
  return items;
}
