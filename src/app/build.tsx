// Entry point. Reads the sources, renders every page, writes dist/.
// Layers below only ever import downwards: app -> pages -> widgets ->
// entities -> shared. Nothing in shared/ knows what a review is, and
// nothing here knows how a Notion block becomes HTML.
import { mkdir, writeFile, cp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import createEmotionServer from '@emotion/server/create-instance';

import { paths, notionEnv } from '../shared/config/index.js';
import { hash, assignUniqueSlugs, downloadAll, log } from '../shared/lib/index.js';
import { loadSite } from '../entities/site/index.js';
import { fetchReviews, vet, byNewestFirst } from '../entities/review/index.js';
import type { Review } from '../entities/review/index.js';
import { HomePage } from '../pages/home/index.js';
import { PapersPage } from '../pages/papers/index.js';
import { PaperPage } from '../pages/paper/index.js';

// A page's <link> needs a cssHref before Emotion has told us what the final,
// content-hashed stylesheet is called — the hash can only be known after
// every page has rendered and every style rule is in. So each page renders
// once with this placeholder, and every occurrence is swapped for the real
// href in one pass right before anything is written to disk.
const CSS_PLACEHOLDER = '__EMOTION_CSS_HREF__';

// React drops a string `onLoad`/`onload` prop entirely during static
// rendering (confirmed empirically — see widgets/layout) because it only
// recognises `onLoad` as an event-handler *function*. The real attribute
// travels in as `data-onload` and is promoted here, once, on the final string.
const promoteOnload = (html: string): string => html.replaceAll('data-onload=', 'onload=');

interface RenderedPage { path: string; html: string }

const renderPage = (cache: ReturnType<typeof createCache>, element: React.ReactElement): string =>
  renderToStaticMarkup(<CacheProvider value={cache}>{element}</CacheProvider>);

export async function build(): Promise<void> {
  if (!notionEnv.configured) {
    console.warn('! NOTION_TOKEN / NOTION_DB_ID not set — building from content/fixture.json');
  }

  const site = await loadSite();
  const { publishable: reviews, skipped } = vet(await fetchReviews());
  reviews.sort(byNewestFirst);
  assignUniqueSlugs(reviews);

  const builtAt = new Date().toISOString().slice(0, 10);

  // One cache for the whole build: every page renders through it, so two
  // pages using the same rule get the same generated class name, and
  // extractCritical (below) correctly re-extracts a rule even when an
  // earlier page already "used" it — verified directly, not assumed, since
  // that is exactly the failure mode a shared SSR cache normally has.
  const cache = createCache({ key: 'hp' });
  const { extractCritical } = createEmotionServer(cache);

  const pages: RenderedPage[] = [];
  const cssChunks = new Set<string>();

  const record = (path: string, element: React.ReactElement): void => {
    const { html, css: pageCss } = extractCritical(renderPage(cache, element));
    if (pageCss.trim()) cssChunks.add(pageCss);
    pages.push({ path, html: `<!doctype html>\n${html}` });
  };

  record('index.html', (
    <HomePage site={site} reviews={reviews} builtAt={builtAt} cssHref={CSS_PLACEHOLDER} />
  ));
  record('papers/index.html', (
    <PapersPage site={site} reviews={reviews} builtAt={builtAt} cssHref={CSS_PLACEHOLDER} />
  ));
  reviews.forEach((review: Review, i: number) => {
    record(`papers/${review.slug}/index.html`, (
      <PaperPage
        site={site} review={review} prev={reviews[i - 1]} next={reviews[i + 1]}
        builtAt={builtAt} cssHref={CSS_PLACEHOLDER}
      />
    ));
  });

  const cssText = [...cssChunks].join('\n');
  const cssHref = `styles.${hash(cssText)}.css`;

  await rm(paths.dist, { recursive: true, force: true });
  await mkdir(join(paths.dist, 'papers'), { recursive: true });

  for (const page of pages) {
    const finalHtml = promoteOnload(page.html.replaceAll(CSS_PLACEHOLDER, cssHref));
    const dest = join(paths.dist, page.path);
    await mkdir(join(dest, '..'), { recursive: true });
    await writeFile(dest, finalHtml);
  }
  await writeFile(join(paths.dist, cssHref), cssText);

  for (const review of reviews) {
    await downloadAll(review.imageJobs, join(paths.dist, 'assets'));
  }

  await cp(paths.public, paths.dist, { recursive: true });
  await writeFile(join(paths.dist, '.nojekyll'), '');

  log(`built ${reviews.length} review page(s) into dist/`
    + (skipped.length ? ` — ${skipped.length} skipped as empty` : ''));
}

// Only run when invoked directly; the dev server imports build() instead.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  build().catch(err => { console.error(err); process.exit(1); });
}
