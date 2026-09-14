import type { ReactNode } from 'react';
import { cdn } from '../../shared/config/index.js';
import { GlobalStyles, wrapStyles, skipLinkStyles } from '../../shared/ui/tokens.js';
import type { Site } from '../../entities/site/index.js';
import { Header, themeBootScript, themeScript } from '../header/index.js';
import { Footer } from '../footer/index.js';

export interface LayoutOptions {
  site: Site;
  /** Path back to the site root from the page being rendered. */
  base?: string;
  title: string;
  description: string;
  children: ReactNode;
  math?: boolean;
  code?: boolean;
  builtAt: string;
  canonical?: string;
  /**
   * Where the extracted Emotion stylesheet will live. Its real, hashed name
   * is only known after every page has been rendered, so this is a
   * placeholder — app/build.ts substitutes the real href in afterwards.
   */
  cssHref: string;
}

// KaTeX and highlight.js are pulled in only by pages that actually contain
// maths or code. A page without either references no external script at all.
//
// The `onload` handler has to reach the final HTML as a literal attribute,
// but React's `onLoad` only accepts a function (and drops a string silently
// during static rendering — confirmed empirically, not assumed), and a
// lowercase `onload` prop is rejected outright as an invalid event name. So
// it goes in as `data-onload` here, and app/build.tsx rewrites
// `data-onload="..."` to a real `onload="..."` attribute in the rendered
// HTML before writing the file.
//
// The KaTeX delimiter `\(` below is written with exactly two backslash
// characters, not the four a JS template literal would need — a plain JSX
// string attribute (no `{}`) does not apply JS backslash-escaping, so what's
// typed here is what reaches the browser verbatim. Confirmed empirically:
// four backslashes reached the page as four and broke KaTeX's auto-render.
function ConditionalAssets({ math, code }: { math: boolean; code: boolean }) {
  return (
    <>
      {math && (
        <>
          <link rel="stylesheet" href={`https://cdnjs.cloudflare.com/ajax/libs/KaTeX/${cdn.katex}/katex.min.css`} />
          <script defer src={`https://cdnjs.cloudflare.com/ajax/libs/KaTeX/${cdn.katex}/katex.min.js`} />
          <script
            defer
            src={`https://cdnjs.cloudflare.com/ajax/libs/KaTeX/${cdn.katex}/contrib/auto-render.min.js`}
            data-onload="renderMathInElement(document.querySelector('.prose'),{delimiters:[{left:'$$',right:'$$',display:true},{left:'\\(',right:'\\)',display:false}],throwOnError:false})"
          />
        </>
      )}
      {code && (
        <script
          defer
          src={`https://cdnjs.cloudflare.com/ajax/libs/highlight.js/${cdn.highlightJs}/highlight.min.js`}
          data-onload="hljs.highlightAll()"
        />
      )}
    </>
  );
}

// The page shell every page passes through: head, header, content, footer.
export function Layout({
  site, base = '', title, description, children,
  math = false, code = false, builtAt, canonical, cssHref,
}: LayoutOptions) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        {canonical && <link rel="canonical" href={canonical} />}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..600&family=JetBrains+Mono:wght@400;500&display=swap"
        />
        <link rel="stylesheet" href={`${base}${cssHref}`} />
        <ConditionalAssets math={math} code={code} />
      </head>
      <body>
        <GlobalStyles />
        <a css={skipLinkStyles} href="#main">Skip to content</a>
        <Header site={site} base={base} />
        <div css={wrapStyles} id="main">
          {children}
          <Footer site={site} builtAt={builtAt} />
        </div>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </body>
    </html>
  );
}
