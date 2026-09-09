import { esc } from '../../shared/lib/index.js';
import { renderLayout } from '../../widgets/layout/index.js';

export function renderPaperPage({ site, review: r, prev, next, builtAt, cssHref }) {
  const links = [
    r.link ? `<a class="btn" href="${esc(r.link)}">Paper ↗</a>` : '',
    r.code ? `<a class="btn" href="${esc(r.code)}">Code ↗</a>` : '',
  ].filter(Boolean).join('');

  const meta = [r.authors, [r.venue, r.year].filter(Boolean).join(' '), r.dateLabel]
    .filter(Boolean).map(esc).join(' <span aria-hidden="true">·</span> ');

  const body = `<article class="art">
  <div class="eyebrow">${esc((r.topics || []).join(' · ') || 'Paper review')}</div>
  <h1>${esc(r.title)}</h1>
  ${r.paper ? `<p class="paperline">${esc(r.paper)}</p>` : ''}
  <div class="meta">${meta}</div>
  ${links ? `<div class="srclinks">${links}</div>` : ''}
  <div class="prose">
${r.html || '<p class="empty">This review has no body yet.</p>'}
  </div>
  <div class="pager">
    <span>${prev ? `<a href="../${esc(prev.slug)}/">← ${esc(prev.title)}</a>` : ''}</span>
    <span>${next ? `<a href="../${esc(next.slug)}/">${esc(next.title)} →</a>` : ''}</span>
  </div>
</article>`;

  return renderLayout({
    site, base: '../../',
    title: `${r.title} — ${site.name}`,
    description: r.takeaway || r.paper || site.description,
    body, math: r.math, code: r.hasCodeBlocks, builtAt, cssHref,
  });
}
