import { esc } from '../../shared/lib/index.ts';
import { cdn } from '../../shared/config/index.ts';
import { renderHeader, themeBootScript, themeScript } from '../header/index.ts';
import { renderFooter } from '../footer/index.ts';
import type { Site } from '../../entities/site/index.ts';

export interface LayoutOptions {
  site: Site;
  /** Path back to the site root from the page being rendered. */
  base?: string;
  title: string;
  description: string;
  body: string;
  math?: boolean;
  code?: boolean;
  builtAt: string;
  canonical?: string;
  cssHref?: string;
}

// KaTeX and highlight.js are pulled in only by pages that actually contain
// maths or code. A page without either references no external script at all.
function conditionalAssets({ math, code }: { math: boolean; code: boolean }): string {
  const out: string[] = [];
  if (math) {
    out.push(`<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/${cdn.katex}/katex.min.css">`);
    out.push(`<script defer src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/${cdn.katex}/katex.min.js"></script>`);
    out.push(`<script defer src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/${cdn.katex}/contrib/auto-render.min.js" onload="renderMathInElement(document.querySelector('.prose'),{delimiters:[{left:'$$',right:'$$',display:true},{left:'\\\\(',right:'\\\\)',display:false}],throwOnError:false})"></script>`);
  }
  if (code) {
    out.push(`<script defer src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/${cdn.highlightJs}/highlight.min.js" onload="hljs.highlightAll()"></script>`);
  }
  return out.join('\n');
}

// The page shell every page passes through: head, header, content, footer.
export function renderLayout({
  site, base = '', title, description, body,
  math = false, code = false, builtAt, canonical, cssHref = 'styles.css',
}: LayoutOptions): string {
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
<script>${themeBootScript}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..600&family=JetBrains+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="${base}${cssHref}">
${conditionalAssets({ math, code })}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${renderHeader({ site, base })}
<div class="wrap" id="main">
${body}
${renderFooter({ site, builtAt })}
</div>
${themeScript}
</body>
</html>`;
}
