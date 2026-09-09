import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { NotionClient, renderBlocks, dropEmptySections } from '../../shared/api/notion/index.js';
import { paths, notionEnv } from '../../shared/config/index.js';
import { slugify, dateLabel, hash, log } from '../../shared/lib/index.js';
import { fromNotionPage } from './model.js';

// Notion file URLs are signed and expire within the hour, so anything served
// from their storage has to be copied into the build output.
const isExpiring = url => /amazonaws\.com|notion-static\.com|X-Amz-/i.test(url);

function imageCollector() {
  const jobs = new Map();
  const onImage = (url, blockId) => {
    if (!isExpiring(url)) return url;
    let ext = extname(new URL(url).pathname).toLowerCase();
    if (!/^\.(png|jpe?g|gif|webp|avif|svg)$/.test(ext)) ext = '.png';
    const name = hash(blockId, 12) + ext;
    jobs.set(name, url);
    return `../../assets/${name}`;
  };
  return { onImage, jobs };
}

export async function fetchPublished() {
  const notion = new NotionClient(notionEnv.token);
  log('querying published reviews');
  const pages = await notion.queryAll(notionEnv.databaseId, {
    filter: { property: 'Status', select: { equals: 'Published' } },
    sorts: [{ property: 'Published', direction: 'descending' }],
  });
  log(`${pages.length} published`);

  const reviews = [];
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
export async function fetchFixture() {
  const raw = await readFile(join(paths.content, 'fixture.json'), 'utf8');
  return JSON.parse(raw).map(r => ({
    ...r,
    slug: r.slug || slugify(r.title, 'review'),
    dateLabel: r.dateLabel || dateLabel(r.sortKey),
    imageJobs: new Map(),
  }));
}

export const fetchReviews = () =>
  notionEnv.configured ? fetchPublished() : fetchFixture();
