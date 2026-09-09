import { esc } from '../../shared/lib/index.js';
import { renderLayout } from '../../widgets/layout/index.js';
import { renderReviewList } from '../../widgets/review-list/index.js';

const RECENT = 5;

const renderMetrics = metrics => metrics.map(m =>
  `<div class="metric"><div class="v">${esc(m.value)}<small>${esc(m.unit)}</small></div><div class="k">${esc(m.label)}</div></div>`
).join('');

const renderProjects = projects => projects.map((p, n) =>
  `<div class="proj"><div class="n">${String(n + 1).padStart(2, '0')}</div><div>
    <div class="pt">${esc(p.name)} <span>— ${esc(p.tagline)}</span></div>
    <div class="pd">${esc(p.body)}</div>
    <div class="stack">${p.stack.map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div>
  </div></div>`
).join('');

export function renderHomePage({ site, reviews, builtAt, cssHref }) {
  const recent = reviews.slice(0, RECENT);
  const body = `<div class="hero">
  <div class="eyebrow">${esc(site.eyebrow)}</div>
  <h1>${site.headline.map(esc).join('<br>')}</h1>
  <p class="lede">${esc(site.lede)}</p>
  <div class="metrics">${renderMetrics(site.metrics)}</div>
  <div class="actions">
    <a class="btn solid" href="cv.pdf" download><svg viewBox="0 0 24 24"><path d="M12 3.5v11m0 0 4-4m-4 4-4-4M4.5 17.5v1a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1"/></svg>Download CV</a>
    <a class="btn" href="${esc(site.github)}">GitHub</a>
    <a class="btn" href="mailto:${esc(site.email)}">Email</a>
  </div>
</div>

<section id="papers">
  <div class="sec-h"><span class="sec-t">Paper reviews</span>${reviews.length > recent.length ? `<a class="sec-a" href="papers/">All ${reviews.length} reviews →</a>` : ''}</div>
  ${renderReviewList({ reviews: recent, base: '' })}
</section>

<section id="work">
  <div class="sec-h"><span class="sec-t">Selected work</span></div>
  ${renderProjects(site.projects)}
</section>`;

  return renderLayout({
    site, base: '', title: site.title, description: site.description,
    body, builtAt, cssHref,
  });
}
