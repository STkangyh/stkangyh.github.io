// Zero-dependency Notion reader: REST via fetch, blocks -> HTML.
const API = 'https://api.notion.com/v1';
const VERSION = '2022-06-28';

export class Notion {
  constructor(token) { this.token = token; }

  async call(path, init = {}) {
    const url = path.startsWith('http') ? path : API + path;
    for (let attempt = 0; attempt < 4; attempt++) {
      const res = await fetch(url, {
        ...init,
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Notion-Version': VERSION,
          'Content-Type': 'application/json',
          ...(init.headers || {}),
        },
      });
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

  // Fetch a block's children, recursing into nested blocks.
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

export const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Only allow schemes that are safe to put in href.
const safeHref = url => /^(https?:|mailto:|#|\/)/i.test(String(url || '')) ? url : '#';

export function richText(rt = []) {
  return rt.map(t => {
    if (t.type === 'equation') return `\\(${esc(t.equation.expression)}\\)`;
    let html = esc(t.plain_text);
    const a = t.annotations || {};
    if (a.code) html = `<code>${html}</code>`;
    if (a.bold) html = `<strong>${html}</strong>`;
    if (a.italic) html = `<em>${html}</em>`;
    if (a.strikethrough) html = `<s>${html}</s>`;
    if (a.underline) html = `<u>${html}</u>`;
    if (t.href) html = `<a href="${esc(safeHref(t.href))}">${html}</a>`;
    return html;
  }).join('');
}

export const plain = (rt = []) => rt.map(t => t.plain_text).join('');

// A heading whose section holds nothing is an unfinished template, not content.
// Drop it before rendering: walk from each heading to the next one at the same
// or higher level, and if nothing in between produces output, the heading goes.
// Runs to a fixed point, because removing a child section can empty its parent.
const HEADING_LEVEL = { heading_1: 1, heading_2: 2, heading_3: 3 };

function producesOutput(b) {
  if (HEADING_LEVEL[b.type]) return false;
  if (b.type === 'paragraph') return plain(b.paragraph.rich_text).trim() !== '';
  if (b.type === 'table_of_contents' || b.type === 'breadcrumb') return false;
  if (b.type === 'column_list' || b.type === 'synced_block' || b.type === 'column') {
    return Boolean(b.__children?.some(producesOutput));
  }
  return true;
}

export function dropEmptySections(blocks) {
  let list = blocks;
  for (let pass = 0; pass < 8; pass++) {
    const drop = new Set();
    for (let i = 0; i < list.length; i++) {
      const level = HEADING_LEVEL[list[i].type];
      if (!level) continue;
      // A toggle heading carries its section in its children.
      if (list[i].__children?.some(producesOutput)) continue;
      let filled = false;
      for (let j = i + 1; j < list.length; j++) {
        const other = HEADING_LEVEL[list[j].type];
        if (other && other <= level) break;
        if (producesOutput(list[j])) { filled = true; break; }
      }
      if (!filled) drop.add(i);
    }
    if (!drop.size) break;
    list = list.filter((_, i) => !drop.has(i));
  }
  return list;
}

// Renders a flat block list, grouping consecutive list items.
// onImage(url, blockId) -> returns the src to use (lets the caller localise files).
export function renderBlocks(blocks, onImage = u => u) {
  const out = [];
  let i = 0;
  const flags = { math: false, code: false };

  const listOf = (type, tag, cls = '') => {
    const items = [];
    while (i < blocks.length && blocks[i].type === type) {
      const b = blocks[i];
      const inner = richText(b[type].rich_text);
      const nested = b.__children ? renderBlocks(b.__children, onImage) : null;
      if (nested) { flags.math ||= nested.flags.math; flags.code ||= nested.flags.code; }
      const check = type === 'to_do'
        ? `<span aria-hidden="true">${b.to_do.checked ? '☑' : '☐'}</span> ` : '';
      items.push(`<li>${check}<span>${inner}${nested ? nested.html : ''}</span></li>`);
      i++;
    }
    out.push(`<${tag}${cls ? ` class="${cls}"` : ''}>${items.join('')}</${tag}>`);
  };

  while (i < blocks.length) {
    const b = blocks[i];
    const t = b.type;

    if (t === 'bulleted_list_item') { listOf(t, 'ul'); continue; }
    if (t === 'numbered_list_item') { listOf(t, 'ol'); continue; }
    if (t === 'to_do') { listOf(t, 'ul', 'todo'); continue; }

    i++;
    switch (t) {
      case 'paragraph': {
        const html = richText(b.paragraph.rich_text);
        if (html.trim()) out.push(`<p>${html}</p>`);
        break;
      }
      case 'heading_1': out.push(`<h2>${richText(b.heading_1.rich_text)}</h2>`); break;
      case 'heading_2': out.push(`<h2>${richText(b.heading_2.rich_text)}</h2>`); break;
      case 'heading_3': out.push(`<h3>${richText(b.heading_3.rich_text)}</h3>`); break;
      case 'quote': out.push(`<blockquote>${richText(b.quote.rich_text)}</blockquote>`); break;
      case 'divider': out.push('<hr>'); break;
      case 'code': {
        flags.code = true;
        const lang = esc(b.code.language || 'text').replace(/\s+/g, '-');
        out.push(`<pre><code class="language-${lang}">${esc(plain(b.code.rich_text))}</code></pre>`);
        break;
      }
      case 'equation': {
        flags.math = true;
        out.push(`<div class="eq">$$${esc(b.equation.expression)}$$</div>`);
        break;
      }
      case 'callout': {
        const icon = b.callout.icon?.type === 'emoji' ? b.callout.icon.emoji : '•';
        out.push(`<div class="callout"><span class="ico" aria-hidden="true">${esc(icon)}</span><div>${richText(b.callout.rich_text)}</div></div>`);
        break;
      }
      case 'image': {
        const src = b.image.type === 'external' ? b.image.external.url : b.image.file.url;
        const cap = richText(b.image.caption || []);
        const resolved = onImage(src, b.id);
        out.push(cap
          ? `<figure><img src="${esc(resolved)}" alt="${esc(plain(b.image.caption || []))}" loading="lazy"><figcaption>${cap}</figcaption></figure>`
          : `<img src="${esc(resolved)}" alt="" loading="lazy">`);
        break;
      }
      case 'bookmark':
      case 'embed':
      case 'link_preview': {
        const url = b[t].url;
        out.push(`<p><a href="${esc(safeHref(url))}">${esc(url)}</a></p>`);
        break;
      }
      case 'toggle': {
        const nested = b.__children ? renderBlocks(b.__children, onImage) : { html: '', flags: {} };
        flags.math ||= !!nested.flags.math; flags.code ||= !!nested.flags.code;
        out.push(`<details><summary>${richText(b.toggle.rich_text)}</summary>${nested.html}</details>`);
        break;
      }
      case 'column_list':
      case 'synced_block': {
        const nested = b.__children ? renderBlocks(b.__children, onImage) : { html: '', flags: {} };
        flags.math ||= !!nested.flags.math; flags.code ||= !!nested.flags.code;
        out.push(nested.html);
        break;
      }
      case 'column': {
        const nested = b.__children ? renderBlocks(b.__children, onImage) : { html: '', flags: {} };
        flags.math ||= !!nested.flags.math; flags.code ||= !!nested.flags.code;
        out.push(nested.html);
        break;
      }
      case 'table_of_contents':
      case 'breadcrumb':
        break;
      default:
        out.push(`<div class="unsupported">Unsupported Notion block: ${esc(t)}</div>`);
    }
  }
  return { html: out.join('\n'), flags };
}
