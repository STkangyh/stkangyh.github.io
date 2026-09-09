import { esc, safeHref } from '../../lib/html.ts';
import type { RichTextItem } from './types.ts';

// Notion rich text -> HTML, preserving annotations and links.
export function richText(rt: RichTextItem[] = []): string {
  return rt.map(t => {
    if (t.type === 'equation' && t.equation) return `\\(${esc(t.equation.expression)}\\)`;
    let html = esc(t.plain_text);
    const a = t.annotations ?? {};
    if (a.code) html = `<code>${html}</code>`;
    if (a.bold) html = `<strong>${html}</strong>`;
    if (a.italic) html = `<em>${html}</em>`;
    if (a.strikethrough) html = `<s>${html}</s>`;
    if (a.underline) html = `<u>${html}</u>`;
    if (t.href) html = `<a href="${esc(safeHref(t.href))}">${html}</a>`;
    return html;
  }).join('');
}

// The same text with all formatting dropped — for titles, slugs and metadata.
export const plain = (rt: RichTextItem[] = []): string =>
  rt.map(t => t.plain_text).join('');
