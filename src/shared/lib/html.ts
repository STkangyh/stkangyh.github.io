// Escape text for interpolation into HTML. Every value that comes from Notion
// or from site.json passes through here before it reaches a template.
export const esc = (s: unknown): string => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Only schemes that are safe to put in an href.
export const safeHref = (url: string | null | undefined): string =>
  /^(https?:|mailto:|#|\/)/i.test(String(url ?? '')) ? String(url) : '#';
