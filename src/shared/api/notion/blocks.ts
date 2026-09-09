import { esc, safeHref } from '../../lib/html.ts';
import { richText, plain } from './rich-text.ts';
import type { ImageResolver, NotionBlock, RenderedBlocks, RenderFlags } from './types.ts';

// A heading whose section holds nothing is an unfinished template, not content.
// Drop it before rendering: walk from each heading to the next one at the same
// or higher level, and if nothing in between produces output, the heading goes.
// Runs to a fixed point, because removing a child section can empty its parent.
const HEADING_LEVEL: Record<string, number> = { heading_1: 1, heading_2: 2, heading_3: 3 };

function producesOutput(b: NotionBlock): boolean {
  if (HEADING_LEVEL[b.type]) return false;
  if (b.type === 'paragraph') return plain(b['paragraph'].rich_text).trim() !== '';
  if (b.type === 'table_of_contents' || b.type === 'breadcrumb') return false;
  if (b.type === 'column_list' || b.type === 'synced_block' || b.type === 'column') {
    return Boolean(b.__children?.some(producesOutput));
  }
  return true;
}

export function dropEmptySections(blocks: NotionBlock[]): NotionBlock[] {
  let list = blocks;
  for (let pass = 0; pass < 8; pass++) {
    const drop = new Set<number>();
    for (let i = 0; i < list.length; i++) {
      const block = list[i];
      if (!block) continue;
      const level = HEADING_LEVEL[block.type];
      if (!level) continue;
      // A toggle heading carries its section in its children.
      if (block.__children?.some(producesOutput)) continue;

      let filled = false;
      for (let j = i + 1; j < list.length; j++) {
        const next = list[j];
        if (!next) continue;
        const other = HEADING_LEVEL[next.type];
        if (other && other <= level) break;
        if (producesOutput(next)) { filled = true; break; }
      }
      if (!filled) drop.add(i);
    }
    if (!drop.size) break;
    list = list.filter((_, i) => !drop.has(i));
  }
  return list;
}

// Renders a flat block list, grouping consecutive list items.
// `onImage` returns the src to use, letting the caller localise expiring files.
export function renderBlocks(
  blocks: NotionBlock[],
  onImage: ImageResolver = url => url,
): RenderedBlocks {
  const out: string[] = [];
  const flags: RenderFlags = { math: false, code: false };
  let i = 0;

  const listOf = (type: string, tag: string, cls = ''): void => {
    const items: string[] = [];
    while (i < blocks.length && blocks[i]?.type === type) {
      const b = blocks[i] as NotionBlock;
      const inner = richText(b[type].rich_text);
      const nested = b.__children ? renderBlocks(b.__children, onImage) : null;
      if (nested) { flags.math ||= nested.flags.math; flags.code ||= nested.flags.code; }
      const check = type === 'to_do'
        ? `<span aria-hidden="true">${b['to_do'].checked ? '☑' : '☐'}</span> ` : '';
      items.push(`<li>${check}<span>${inner}${nested ? nested.html : ''}</span></li>`);
      i++;
    }
    out.push(`<${tag}${cls ? ` class="${cls}"` : ''}>${items.join('')}</${tag}>`);
  };

  // Renders a block's children and folds their flags into this level's.
  const nestedOf = (b: NotionBlock): string => {
    if (!b.__children) return '';
    const nested = renderBlocks(b.__children, onImage);
    flags.math ||= nested.flags.math;
    flags.code ||= nested.flags.code;
    return nested.html;
  };

  while (i < blocks.length) {
    const b = blocks[i];
    if (!b) { i++; continue; }
    const t = b.type;

    if (t === 'bulleted_list_item') { listOf(t, 'ul'); continue; }
    if (t === 'numbered_list_item') { listOf(t, 'ol'); continue; }
    if (t === 'to_do') { listOf(t, 'ul', 'todo'); continue; }

    i++;
    switch (t) {
      case 'paragraph': {
        const html = richText(b['paragraph'].rich_text);
        if (html.trim()) out.push(`<p>${html}</p>`);
        break;
      }
      case 'heading_1': out.push(`<h2>${richText(b['heading_1'].rich_text)}</h2>`); break;
      case 'heading_2': out.push(`<h2>${richText(b['heading_2'].rich_text)}</h2>`); break;
      case 'heading_3': out.push(`<h3>${richText(b['heading_3'].rich_text)}</h3>`); break;
      case 'quote': out.push(`<blockquote>${richText(b['quote'].rich_text)}</blockquote>`); break;
      case 'divider': out.push('<hr>'); break;

      case 'code': {
        flags.code = true;
        const lang = esc(b['code'].language || 'text').replace(/\s+/g, '-');
        out.push(`<pre><code class="language-${lang}">${esc(plain(b['code'].rich_text))}</code></pre>`);
        break;
      }
      case 'equation': {
        flags.math = true;
        out.push(`<div class="eq">$$${esc(b['equation'].expression)}$$</div>`);
        break;
      }
      case 'callout': {
        const icon = b['callout'].icon?.type === 'emoji' ? b['callout'].icon.emoji : '•';
        out.push(`<div class="callout"><span class="ico" aria-hidden="true">${esc(icon)}</span><div>${richText(b['callout'].rich_text)}</div></div>`);
        break;
      }
      case 'image': {
        const image = b['image'];
        const src: string = image.type === 'external' ? image.external.url : image.file.url;
        const caption = richText(image.caption ?? []);
        const resolved = onImage(src, b.id);
        out.push(caption
          ? `<figure><img src="${esc(resolved)}" alt="${esc(plain(image.caption ?? []))}" loading="lazy"><figcaption>${caption}</figcaption></figure>`
          : `<img src="${esc(resolved)}" alt="" loading="lazy">`);
        break;
      }
      case 'bookmark':
      case 'embed':
      case 'link_preview': {
        const url: string = b[t].url;
        out.push(`<p><a href="${esc(safeHref(url))}">${esc(url)}</a></p>`);
        break;
      }
      case 'toggle':
        out.push(`<details><summary>${richText(b['toggle'].rich_text)}</summary>${nestedOf(b)}</details>`);
        break;
      case 'column_list':
      case 'column':
      case 'synced_block':
        out.push(nestedOf(b));
        break;
      case 'table_of_contents':
      case 'breadcrumb':
        break;
      default:
        out.push(`<div class="unsupported">Unsupported Notion block: ${esc(t)}</div>`);
    }
  }
  return { html: out.join('\n'), flags };
}
