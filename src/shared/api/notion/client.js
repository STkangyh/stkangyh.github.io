import { REQUEST_TIMEOUT_MS } from '../../config/index.js';

const API = 'https://api.notion.com/v1';
const VERSION = '2022-06-28';

// Minimal Notion REST client: no SDK, so there is no dependency to keep
// current and no surprise when Notion ships a new major version.
export class NotionClient {
  constructor(token) { this.token = token; }

  async call(path, init = {}) {
    const url = path.startsWith('http') ? path : API + path;
    for (let attempt = 0; attempt < 4; attempt++) {
      const res = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Notion-Version': VERSION,
          'Content-Type': 'application/json',
          ...(init.headers || {}),
        },
      });
      // Rate limits and server errors are worth retrying; nothing else is.
      if (res.status === 429 || res.status >= 500) {
        const wait = Number(res.headers.get('retry-after') || 0) * 1000 || 500 * 2 ** attempt;
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Notion ${res.status} on ${path}: ${body.slice(0, 400)}`);
      }
      return res.json();
    }
    throw new Error(`Notion request failed after retries: ${path}`);
  }

  async queryAll(databaseId, body) {
    const out = [];
    let cursor;
    do {
      const page = await this.call(`/databases/${databaseId}/query`, {
        method: 'POST',
        body: JSON.stringify({ ...body, start_cursor: cursor, page_size: 100 }),
      });
      out.push(...page.results);
      cursor = page.has_more ? page.next_cursor : undefined;
    } while (cursor);
    return out;
  }

  // A block's children, recursing into nested blocks.
  async children(blockId, depth = 0) {
    if (depth > 4) return [];
    const out = [];
    let cursor;
    do {
      const qs = cursor ? `?start_cursor=${cursor}&page_size=100` : '?page_size=100';
      const page = await this.call(`/blocks/${blockId}/children${qs}`);
      for (const block of page.results) {
        if (block.has_children) block.__children = await this.children(block.id, depth + 1);
        out.push(block);
      }
      cursor = page.has_more ? page.next_cursor : undefined;
    } while (cursor);
    return out;
  }
}
