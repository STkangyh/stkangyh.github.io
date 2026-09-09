import { plain } from '../../shared/api/notion/index.ts';
import type { NotionPage, PropertyValue, RichTextItem } from '../../shared/api/notion/index.ts';
import { slugify, dateLabel, warn } from '../../shared/lib/index.ts';
import type { Review, VetResult } from './types.ts';

// --- Notion row -> review -----------------------------------------------
const prop = (page: NotionPage, name: string): PropertyValue | undefined =>
  page.properties?.[name];

const asText = (page: NotionPage, name: string): string => {
  const p = prop(page, name);
  return p?.rich_text ? plain(p.rich_text) : '';
};

// Found by type rather than by name, so renaming the column in Notion
// does not break the build.
const asTitle = (page: NotionPage): string => {
  const p = Object.values(page.properties ?? {}).find(v => v.type === 'title');
  return p?.title ? plain(p.title as RichTextItem[]) : '';
};

export function fromNotionPage(page: NotionPage): Review {
  const published = prop(page, 'Published')?.date?.start ?? null;
  const title = asTitle(page) || 'Untitled';
  return {
    id: page.id,
    title,
    slug: slugify(title, page.id.replace(/-/g, '').slice(0, 8)),
    paper: asText(page, 'Paper'),
    authors: asText(page, 'Authors'),
    takeaway: asText(page, 'Takeaway'),
    venue: prop(page, 'Venue')?.select?.name ?? '',
    year: prop(page, 'Year')?.number ?? '',
    topics: (prop(page, 'Topics')?.multi_select ?? []).map(t => t.name),
    link: prop(page, 'Link')?.url ?? '',
    code: prop(page, 'Code')?.url ?? '',
    sortKey: published ?? page.created_time,
    dateLabel: dateLabel(published ?? page.created_time),
  };
}

export const byNewestFirst = (a: Review, b: Review): number =>
  String(b.sortKey).localeCompare(String(a.sortKey));

// --- vetting -------------------------------------------------------------
// Status=Published is one toggle. It must not be enough to put a page with
// nothing on it onto a public site, so a row also has to carry something to
// show. Softer gaps are reported but still published — they are the author's
// call, not the build's.
export function vet(reviews: Review[]): VetResult {
  const publishable: Review[] = [];
  const skipped: Review[] = [];

  for (const r of reviews) {
    const hasBody = Boolean(r.html && r.html.trim());
    const hasTakeaway = Boolean(r.takeaway && r.takeaway.trim());

    if (!hasBody && !hasTakeaway) {
      skipped.push(r);
      warn(`skipped "${r.title}" — marked Published but has no body and no takeaway. `
         + `Write the review, or set Status back to Reading.`);
      continue;
    }
    if (!hasTakeaway) warn(`"${r.title}" has no takeaway, so it shows as a bare title in the list.`);
    if (!hasBody) warn(`"${r.title}" has an empty body — the page will only show its takeaway.`);
    if (!r.paper) warn(`"${r.title}" has no Paper title set.`);
    if (!r.link) warn(`"${r.title}" has no Link set, so the page cannot link to the paper.`);
    publishable.push(r);
  }
  return { publishable, skipped };
}
