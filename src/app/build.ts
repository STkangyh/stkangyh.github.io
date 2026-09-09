// Entry point. Reads the sources, renders every page, writes dist/.
// Layers below only ever import downwards: app -> pages -> widgets ->
// entities -> shared. Nothing here knows how a Notion block becomes HTML,
// and nothing in shared/ knows that a "review" exists.
import { mkdir, writeFile, readFile, cp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { paths, notionEnv } from '../shared/config/index.ts';
import { hash, assignUniqueSlugs, downloadAll, log } from '../shared/lib/index.ts';
import { loadSite } from '../entities/site/index.ts';
import { fetchReviews, vet, byNewestFirst } from '../entities/review/index.ts';
import { renderHomePage } from '../pages/home/index.ts';
import { renderPapersPage } from '../pages/papers/index.ts';
import { renderPaperPage } from '../pages/paper/index.ts';

export async function build(): Promise<void> {
  if (!notionEnv.configured) {
    console.warn('! NOTION_TOKEN / NOTION_DB_ID not set — building from content/fixture.json');
  }

  const site = await loadSite();
  const { publishable: reviews, skipped } = vet(await fetchReviews());
  reviews.sort(byNewestFirst);
  assignUniqueSlugs(reviews);

  const builtAt = new Date().toISOString().slice(0, 10);

  // Hash the stylesheet into its own filename. Pages serves max-age=600, so an
  // unhashed styles.css can pair old CSS with new markup for ten minutes.
  const css = await readFile(paths.styles, 'utf8');
  const cssHref = `styles.${hash(css)}.css`;

  await rm(paths.dist, { recursive: true, force: true });
  await mkdir(join(paths.dist, 'papers'), { recursive: true });

  await writeFile(join(paths.dist, 'index.html'),
    renderHomePage({ site, reviews, builtAt, cssHref }));
  await writeFile(join(paths.dist, 'papers', 'index.html'),
    renderPapersPage({ site, reviews, builtAt, cssHref }));

  for (const [i, review] of reviews.entries()) {
    const dir = join(paths.dist, 'papers', review.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'index.html'), renderPaperPage({
      site, review, prev: reviews[i - 1], next: reviews[i + 1], builtAt, cssHref,
    }));
    await downloadAll(review.imageJobs, join(paths.dist, 'assets'));
  }

  await cp(paths.styles, join(paths.dist, cssHref));
  await cp(paths.public, paths.dist, { recursive: true });
  await writeFile(join(paths.dist, '.nojekyll'), '');

  log(`built ${reviews.length} review page(s) into dist/`
    + (skipped.length ? ` — ${skipped.length} skipped as empty` : ''));
}

// Only run when invoked directly; the dev server imports build() instead.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  build().catch(err => { console.error(err); process.exit(1); });
}
