import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { NotionClient, renderBlocks, dropEmptySections } from '../../shared/api/notion/index.ts';
import type { ImageResolver } from '../../shared/api/notion/index.ts';
import { paths, notionEnv } from '../../shared/config/index.ts';
import { slugify, dateLabel, hash, log } from '../../shared/lib/index.ts';
import type { DownloadJobs } from '../../shared/lib/index.ts';
import { fromNotionPage } from './model.ts';
import type { Review } from './types.ts';

// Notion file URLs are signed and expire within the hour, so anything served
// from their storage has to be copied into the build output.
const isExpiring = (url: string): boolean =>
  /amazonaws\.com|notion-static\.com|X-Amz-/i.test(url);

function imageCollector(): { onImage: ImageResolver; jobs: DownloadJobs } {
  const jobs: DownloadJobs = new Map();
  const onImage: ImageResolver = (url, blockId) => {
    if (!isExpiring(url)) return url;
    let ext = extname(new URL(url).pathname).toLowerCase();
    if (!/^\.(png|jpe?g|gif|webp|avif|svg)$/.test(ext)) ext = '.png';
    const name = hash(blockId, 12) + ext;
    jobs.set(name, url);
    return `../../assets/${name}`;
  };
  return { onImage, jobs };
}

export async function fetchPublished(): Promise<Review[]> {
  const notion = new NotionClient(notionEnv.token as string);
  log('querying published reviews');
  const pages = await notion.queryAll(notionEnv.databaseId as string, {
    filter: { property: 'Status', select: { equals: 'Published' } },
    sorts: [{ property: 'Published', direction: 'descending' }],
  });
  log(`${pages.length} published`);

  const reviews: Review[] = [];
  for (const page of pages) {
    const review = fromNotionPage(page);
    const raw = await notion.children(page.id);
    const blocks = dropEmptySections(raw);
    const { onImage, jobs } = imageCollector();
    const { html, flags } = renderBlocks(blocks, onImage);
    const dropped = raw.length - blocks.length;

    Object.assign(review, { html, math: flags.math, hasCodeBlocks: flags.code, imageJobs: jobs });
    reviews.push(review);
    log(`fetched "${review.title}" (${blocks.length} blocks`
      + (dropped ? `, ${dropped} empty section heading${dropped === 1 ? '' : 's'} dropped` : '') + ')');
  }
  return reviews;
}

// Offline source, so layout work does not need a Notion token.
export async function fetchFixture(): Promise<Review[]> {
  const raw = await readFile(join(paths.content, 'fixture.json'), 'utf8');
  return (JSON.parse(raw) as Review[]).map(r => ({
    ...r,
    slug: r.slug || slugify(r.title, 'review'),
    dateLabel: r.dateLabel || dateLabel(r.sortKey),
    imageJobs: new Map<string, string>(),
  }));
}

export const fetchReviews = (): Promise<Review[]> =>
  notionEnv.configured ? fetchPublished() : fetchFixture();
