import { mkdir, writeFile, readFile, cp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Notion, renderBlocks, dropEmptySections, plain } from './notion.mjs';
import { indexPage, papersIndexPage, articlePage } from './templates.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

const TOKEN = process.env.NOTION_TOKEN;
const DB = process.env.NOTION_DB_ID;

const log = (...a) => console.log('·', ...a);
const warn = msg => {
  console.warn(`  ! ${msg}`);
  // Surface it on the Actions run page, not just in the raw log.
  if (process.env.GITHUB_ACTIONS) console.log(`::warning::${msg}`);
};

const slugify = (s, fallback) => {
  const out = String(s).toLowerCase().normalize('NFKD')
    .replace(/[^\w\s-]/g, ' ').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return out || fallback;
};

const dateLabel = iso => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = n => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}.${p(d.getUTCMonth() + 1)}.${p(d.getUTCDate())}`;
};

// --- property extraction -----------------------------------------------
const prop = (page, name) => page.properties?.[name];
const asText = (page, name) => { const p = prop(page, name); return p?.rich_text ? plain(p.rich_text) : ''; };
const asTitle = page => {
  const p = Object.values(page.properties || {}).find(v => v.type === 'title');
  return p ? plain(p.title) : '';
};

function mapReview(page) {
  const published = prop(page, 'Published')?.date?.start || null;
  const title = asTitle(page) || 'Untitled';
  return {
    id: page.id,
    title,
    slug: slugify(title, page.id.replace(/-/g, '').slice(0, 8)),
    paper: asText(page, 'Paper'),
    authors: asText(page, 'Authors'),
    takeaway: asText(page, 'Takeaway'),
    venue: prop(page, 'Venue')?.select?.name || '',
    year: prop(page, 'Year')?.number ?? '',
    topics: (prop(page, 'Topics')?.multi_select || []).map(t => t.name),
    link: prop(page, 'Link')?.url || '',
    code: prop(page, 'Code')?.url || '',
    sortKey: published || page.created_time,
    dateLabel: dateLabel(published || page.created_time),
  };
}

// --- images -------------------------------------------------------------
// Notion file URLs are signed and expire, so they must be copied into dist.
const isExpiring = url => /amazonaws\.com|notion-static\.com|X-Amz-/i.test(url);

function imageCollector() {
  const jobs = new Map();
  const onImage = (url, blockId) => {
    if (!isExpiring(url)) return url;
    let ext = extname(new URL(url).pathname).toLowerCase();
    if (!/^\.(png|jpe?g|gif|webp|avif|svg)$/.test(ext)) ext = '.png';
    const name = createHash('sha1').update(blockId).digest('hex').slice(0, 12) + ext;
    jobs.set(name, url);
    return `../../assets/${name}`;
  };
  return { onImage, jobs };
}

async function downloadImages(jobs) {
  await mkdir(join(DIST, 'assets'), { recursive: true });
  for (const [name, url] of jobs) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await writeFile(join(DIST, 'assets', name), Buffer.from(await res.arrayBuffer()));
      log(`image ${name}`);
    } catch (err) {
      console.warn(`  ! image failed (${name}): ${err.message}`);
    }
  }
}

// --- fetch --------------------------------------------------------------
async function fromNotion() {
  const notion = new Notion(TOKEN);
  log('querying published reviews');
  const pages = await notion.queryAll(DB, {
    filter: { property: 'Status', select: { equals: 'Published' } },
    sorts: [{ property: 'Published', direction: 'descending' }],
  });
  log(`${pages.length} published`);

  const reviews = [];
  for (const page of pages) {
    const r = mapReview(page);
    const raw = await notion.children(page.id);
    const blocks = dropEmptySections(raw);
    const { onImage, jobs } = imageCollector();
    const { html, flags } = renderBlocks(blocks, onImage);
    const dropped = raw.length - blocks.length;
    r.html = html;
    r.math = flags.math;
    r.code_blocks = flags.code;
    r.imageJobs = jobs;
    reviews.push(r);
    log(`fetched "${r.title}" (${blocks.length} blocks`
      + (dropped ? `, ${dropped} empty section heading${dropped === 1 ? '' : 's'} dropped` : '') + ')');
  }
  return reviews;
}

async function fromFixture() {
  const raw = await readFile(join(ROOT, 'data', 'fixture.json'), 'utf8');
  const reviews = JSON.parse(raw).map(r => ({
    ...r,
    slug: r.slug || slugify(r.title, 'review'),
    dateLabel: r.dateLabel || dateLabel(r.sortKey),
    imageJobs: new Map(),
  }));
  return reviews;
}

// --- vetting ------------------------------------------------------------
// Status=Published is one toggle. It must not be enough to put a page with
// nothing on it onto a public site, so a row also has to carry something to
// show. Softer gaps are reported but still published — they are the author's
// call, not the build's.
function vet(reviews) {
  const publishable = [];
  const skipped = [];

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

// --- build --------------------------------------------------------------
async function main() {
  const usingNotion = Boolean(TOKEN && DB);
  if (!usingNotion) {
    console.warn('! NOTION_TOKEN / NOTION_DB_ID not set — building from data/fixture.json');
  }

  const site = JSON.parse(await readFile(join(ROOT, 'src', 'site.json'), 'utf8'));
  const fetched = usingNotion ? await fromNotion() : await fromFixture();
  const { publishable: reviews, skipped } = vet(fetched);
  reviews.sort((a, b) => String(b.sortKey).localeCompare(String(a.sortKey)));

  // Two reviews can slugify to the same string; keep URLs unique.
  const seen = new Map();
  for (const r of reviews) {
    const n = (seen.get(r.slug) || 0) + 1;
    seen.set(r.slug, n);
    if (n > 1) r.slug = `${r.slug}-${n}`;
  }

  const builtAt = new Date().toISOString().slice(0, 10);

  await rm(DIST, { recursive: true, force: true });
  await mkdir(join(DIST, 'papers'), { recursive: true });

  await writeFile(join(DIST, 'index.html'), indexPage({ site, reviews, builtAt }));
  await writeFile(join(DIST, 'papers', 'index.html'), papersIndexPage({ site, reviews, builtAt }));

  for (let i = 0; i < reviews.length; i++) {
    const r = reviews[i];
    const dir = join(DIST, 'papers', r.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'index.html'), articlePage({
      site, review: r, prev: reviews[i - 1], next: reviews[i + 1], builtAt,
    }));
    if (r.imageJobs?.size) await downloadImages(r.imageJobs);
  }

  await cp(join(ROOT, 'src', 'styles.css'), join(DIST, 'styles.css'));
  await cp(join(ROOT, 'public'), DIST, { recursive: true });
  await writeFile(join(DIST, '.nojekyll'), '');

  log(`built ${reviews.length} review page(s) into dist/`
    + (skipped.length ? ` — ${skipped.length} skipped as empty` : ''));
}

main().catch(err => { console.error(err); process.exit(1); });
