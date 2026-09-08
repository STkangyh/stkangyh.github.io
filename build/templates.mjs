import { esc } from './notion.mjs';

const KATEX = '0.16.11';
const HLJS = '11.10.0';

const themeBoot = `(function(){try{var m=localStorage.getItem('hp_mode');if(m)document.documentElement.setAttribute('data-mode',m)}catch(e){}})()`;

const themeToggle = `<button id="theme" aria-label="Toggle colour theme">
      <svg class="sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/></svg>
      <svg class="moon" viewBox="0 0 24 24"><path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2z"/></svg>
    </button>`;

const themeScript = `<script>(function(){var r=document.documentElement,K='hp_mode';
function cur(){return r.getAttribute('data-mode')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}
document.getElementById('theme').addEventListener('click',function(){var n=cur()==='dark'?'light':'dark';r.setAttribute('data-mode',n);try{localStorage.setItem(K,n)}catch(e){}})})()</script>`;

function header(site, base) {
  return `<header><div class="wrap">
  <a class="mark" href="${base}">${esc(site.name)}</a>
  <div class="right">
    <nav><a href="${base}papers/">Papers</a><a href="${base}#work">Work</a><a href="${base}cv.pdf">CV</a></nav>
    ${themeToggle}
  </div>
</div></header>`;
}

function footer(site, builtAt) {
  return `<footer>
  <span>${esc(site.affiliation)}</span>
  <span><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></span>
  <span class="built">built ${esc(builtAt)}</span>
</footer>`;
}

export function layout({ site, base = '', title, description, body, math, code, builtAt, canonical }) {
  const assets = [];
  if (math) {
    assets.push(`<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/${KATEX}/katex.min.css">`);
    assets.push(`<script defer src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/${KATEX}/katex.min.js"></script>`);
    assets.push(`<script defer src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/${KATEX}/contrib/auto-render.min.js" onload="renderMathInElement(document.querySelector('.prose'),{delimiters:[{left:'$$',right:'$$',display:true},{left:'\\\\(',right:'\\\\)',display:false}],throwOnError:false})"></script>`);
  }
  if (code) {
    assets.push(`<script defer src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/${HLJS}/highlight.min.js" onload="hljs.highlightAll()"></script>`);
  }
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
<script>${themeBoot}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..600&family=JetBrains+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="${base}styles.css">
${assets.join('\n')}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${header(site, base)}
<div class="wrap" id="main">
${body}
${footer(site, builtAt)}
</div>
${themeScript}
</body>
</html>`;
}

const venueLine = r => [r.authors, [r.venue, r.year].filter(Boolean).join(' ')]
  .filter(Boolean).join(' · ');

export function reviewRow(r, base) {
  const tags = (r.topics || []).map(t => `<span class="tag">${esc(t)}</span>`).join('');
  return `<a class="rev" href="${base}papers/${esc(r.slug)}/">
    <div class="rev-top"><span class="tags">${tags}</span><span class="date">${esc(r.dateLabel)}</span></div>
    <div class="rt">${esc(r.title)}</div>
    ${venueLine(r) ? `<div class="rv">${esc(venueLine(r))}</div>` : ''}
    ${r.takeaway ? `<div class="rd">${esc(r.takeaway)}</div>` : ''}
  </a>`;
}

export function indexPage({ site, reviews, builtAt }) {
  const recent = reviews.slice(0, 5);
  const metrics = site.metrics.map(m =>
    `<div class="metric"><div class="v">${esc(m.value)}<small>${esc(m.unit)}</small></div><div class="k">${esc(m.label)}</div></div>`
  ).join('');
  const projects = site.projects.map((p, n) =>
    `<div class="proj"><div class="n">${String(n + 1).padStart(2, '0')}</div><div>
    <div class="pt">${esc(p.name)} <span>— ${esc(p.tagline)}</span></div>
    <div class="pd">${esc(p.body)}</div>
    <div class="stack">${p.stack.map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div>
  </div></div>`
  ).join('');

  const body = `<div class="hero">
  <div class="eyebrow">${esc(site.eyebrow)}</div>
  <h1>${site.headline.map(esc).join('<br>')}</h1>
  <p class="lede">${esc(site.lede)}</p>
  <div class="metrics">${metrics}</div>
  <div class="actions">
    <a class="btn solid" href="cv.pdf" download><svg viewBox="0 0 24 24"><path d="M12 3.5v11m0 0 4-4m-4 4-4-4M4.5 17.5v1a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1"/></svg>Download CV</a>
    <a class="btn" href="${esc(site.github)}">GitHub</a>
    <a class="btn" href="mailto:${esc(site.email)}">Email</a>
  </div>
</div>

<section id="papers">
  <div class="sec-h"><span class="sec-t">Paper reviews</span>${reviews.length > recent.length ? `<a class="sec-a" href="papers/">All ${reviews.length} reviews →</a>` : ''}</div>
  ${recent.length ? recent.map(r => reviewRow(r, '')).join('\n') : '<p class="empty">No reviews published yet.</p>'}
</section>

<section id="work">
  <div class="sec-h"><span class="sec-t">Selected work</span></div>
  ${projects}
</section>`;

  return layout({ site, base: '', title: site.title, description: site.description, body, builtAt });
}

export function papersIndexPage({ site, reviews, builtAt }) {
  const body = `<div class="hero">
  <div class="eyebrow">Paper reviews</div>
  <h1>What I read,<br>and what held up.</h1>
  <p class="lede">Notes on continual learning, efficient encoders and video understanding — written after reading, and where possible after running the code.</p>
</div>
<section>
  <div class="sec-h"><span class="sec-t">${reviews.length} review${reviews.length === 1 ? '' : 's'}</span></div>
  ${reviews.length ? reviews.map(r => reviewRow(r, '../')).join('\n') : '<p class="empty">No reviews published yet.</p>'}
</section>`;
  return layout({
    site, base: '../', title: `Paper reviews — ${site.name}`,
    description: 'Reviews of papers on continual learning, efficient encoders and video understanding.',
    body, builtAt,
  });
}

export function articlePage({ site, review: r, prev, next, builtAt }) {
  const links = [
    r.link ? `<a class="btn" href="${esc(r.link)}">Paper ↗</a>` : '',
    r.code ? `<a class="btn" href="${esc(r.code)}">Code ↗</a>` : '',
  ].filter(Boolean).join('');

  const body = `<article class="art">
  <div class="eyebrow">${esc((r.topics || []).join(' · ') || 'Paper review')}</div>
  <h1>${esc(r.title)}</h1>
  ${r.paper ? `<p class="paperline">${esc(r.paper)}</p>` : ''}
  <div class="meta">${[r.authors, [r.venue, r.year].filter(Boolean).join(' '), r.dateLabel].filter(Boolean).map(esc).join(' <span aria-hidden="true">·</span> ')}</div>
  ${links ? `<div class="srclinks">${links}</div>` : ''}
  <div class="prose">
${r.html || '<p class="empty">This review has no body yet.</p>'}
  </div>
  <div class="pager">
    <span>${prev ? `<a href="../${esc(prev.slug)}/">← ${esc(prev.title)}</a>` : ''}</span>
    <span>${next ? `<a href="../${esc(next.slug)}/">${esc(next.title)} →</a>` : ''}</span>
  </div>
</article>`;

  return layout({
    site, base: '../../',
    title: `${r.title} — ${site.name}`,
    description: r.takeaway || r.paper || site.description,
    body, math: r.math, code: r.code_blocks, builtAt,
  });
}
