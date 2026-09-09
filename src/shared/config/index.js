import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// src/shared/config -> src -> project root
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export const paths = {
  root: ROOT,
  dist: join(ROOT, 'dist'),
  content: join(ROOT, 'content'),
  public: join(ROOT, 'public'),
  styles: join(ROOT, 'src', 'shared', 'ui', 'styles.css'),
};

export const notionEnv = {
  token: process.env.NOTION_TOKEN,
  databaseId: process.env.NOTION_DB_ID,
  get configured() { return Boolean(this.token && this.databaseId); },
};

// Pinned so a CDN release cannot change how a published page renders.
export const cdn = {
  katex: '0.16.11',
  highlightJs: '11.10.0',
};

export const REQUEST_TIMEOUT_MS = 20_000;
