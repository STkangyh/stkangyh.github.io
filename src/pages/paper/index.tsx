import { Fragment } from 'react';
import { css } from '@emotion/react';
import { Layout } from '../../widgets/layout/index.js';
import { btnStyles, eyebrowStyles } from '../../shared/ui/primitives.js';
import { emptyStateStyles } from '../../widgets/review-list/index.js';
import type { Site } from '../../entities/site/index.js';
import type { Review } from '../../entities/review/index.js';

const articleStyles = css`padding: 52px 0 24px;`;

const headingStyles = css`
  font-size: 32px;
  line-height: 1.16;
  font-weight: 600;
  letter-spacing: -0.035em;
  margin: 12px 0 0;
  @media (max-width: 560px) { font-size: 26px; }
`;

const paperLineStyles = css`font-size: 14.5px; color: var(--ink2); margin-top: 12px; line-height: 1.55;`;

const metaStyles = css`
  font-family: var(--mono); font-size: 11.5px; color: var(--ink3); margin-top: 14px;
  display: flex; gap: 10px; flex-wrap: wrap; align-items: center;
`;

const sourceLinksStyles = css`display: flex; gap: 9px; margin-top: 18px; flex-wrap: wrap;`;

const pagerStyles = css`
  border-top: 0.5px solid var(--line); padding: 24px 0 0;
  display: flex; justify-content: space-between; gap: 16px; font-size: 13.5px;
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; text-underline-offset: 3px; }
`;

// The Notion body is pre-rendered, sanitised HTML (see shared/api/notion/blocks.ts),
// not React content — it comes from the writer's own document, not user input off
// the web, so dangerouslySetInnerHTML is the right tool here, not a workaround.
// Nested selectors below replace the old global `.prose h2 { ... }` rules; Emotion
// scopes them to this element automatically.
const proseStyles = css`
  border-top: 0.5px solid var(--line);
  margin-top: 28px;
  padding-top: 8px;
  padding-bottom: 40px;

  h2 { font-size: 20px; font-weight: 600; letter-spacing: -0.025em; margin: 34px 0 10px; line-height: 1.3; }
  h3 { font-size: 16.5px; font-weight: 600; letter-spacing: -0.02em; margin: 26px 0 8px; }
  p { margin: 14px 0; color: var(--ink); }
  ul, ol { margin: 14px 0; padding-left: 22px; }
  li { margin: 5px 0; }
  li::marker { color: var(--ink3); }
  a { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 0.5px; }
  strong { font-weight: 600; }
  hr { border: 0; border-top: 0.5px solid var(--line); margin: 32px 0; }
  blockquote { margin: 18px 0; padding: 2px 0 2px 16px; border-left: 2px solid var(--line2); border-radius: 0; color: var(--ink2); }
  code { font-family: var(--mono); font-size: 13px; background: var(--tint); color: var(--accent); padding: 1.5px 5px; border-radius: 4px; }
  pre { background: var(--card); border: 0.5px solid var(--line); border-radius: 10px; padding: 14px 16px; overflow-x: auto; margin: 18px 0; }
  pre code { background: none; color: var(--ink); padding: 0; font-size: 12.5px; line-height: 1.65; }

  /* highlight.js tokens, coloured from our own palette so both themes work */
  .hljs-comment, .hljs-quote { color: var(--ink3); font-style: italic; }
  .hljs-keyword, .hljs-selector-tag, .hljs-built_in, .hljs-name, .hljs-meta { color: var(--code-kw); }
  .hljs-string, .hljs-attr, .hljs-symbol, .hljs-bullet, .hljs-addition { color: var(--code-str); }
  .hljs-number, .hljs-literal, .hljs-type, .hljs-link { color: var(--code-num); }
  .hljs-title, .hljs-section, .hljs-class .hljs-title { color: var(--ink); font-weight: 600; }
  .hljs-params, .hljs-variable, .hljs-template-variable { color: var(--ink2); }
  .hljs-deletion { color: var(--ink3); text-decoration: line-through; }

  img { max-width: 100%; height: auto; border-radius: 10px; border: 0.5px solid var(--line); display: block; margin: 20px 0; }
  figure { margin: 20px 0; }
  figcaption { font-size: 12.5px; color: var(--ink3); margin-top: 8px; text-align: center; }
  .callout { display: flex; gap: 11px; background: var(--card); border: 0.5px solid var(--line); border-radius: 10px; padding: 13px 15px; margin: 18px 0; font-size: 14.5px; }
  .callout .ico { flex: none; line-height: 1.5; }
  .eq { overflow-x: auto; font-family: var(--mono); font-size: 13.5px; color: var(--ink2); background: var(--card); border: 0.5px solid var(--line); border-radius: 10px; padding: 12px 15px; margin: 18px 0; text-align: center; }
  .todo { list-style: none; padding-left: 0; }
  .todo li { display: flex; gap: 9px; align-items: flex-start; }
  .unsupported { font-family: var(--mono); font-size: 12px; color: var(--ink3); border: 0.5px dashed var(--line2); border-radius: 8px; padding: 8px 12px; margin: 14px 0; }
`;

export interface PaperPageProps {
  site: Site;
  review: Review;
  /** Neighbours in publication order, for the pager. Absent at either end. */
  prev?: Review | undefined;
  next?: Review | undefined;
  builtAt: string;
  cssHref: string;
}

export function PaperPage({ site, review: r, prev, next, builtAt, cssHref }: PaperPageProps) {
  return (
    <Layout
      site={site} base="../../" builtAt={builtAt} cssHref={cssHref}
      title={`${r.title} — ${site.name}`}
      description={r.takeaway || r.paper || site.description}
      math={r.math ?? false}
      code={r.hasCodeBlocks ?? false}
    >
      <article css={articleStyles}>
        <div css={eyebrowStyles}>{(r.topics ?? []).join(' · ') || 'Paper review'}</div>
        <h1 css={headingStyles}>{r.title}</h1>
        {r.paper && <p css={paperLineStyles}>{r.paper}</p>}
        <div css={metaStyles}>
          {[r.authors, [r.venue, r.year].filter(Boolean).join(' '), r.dateLabel]
            .filter(Boolean)
            .map((part, i) => (
              <Fragment key={part}>
                {i > 0 && <> <span aria-hidden="true">·</span> </>}
                {part}
              </Fragment>
            ))}
        </div>
        {(r.link || r.code) && (
          <div css={sourceLinksStyles}>
            {r.link && <a css={btnStyles} href={r.link}>Paper ↗</a>}
            {r.code && <a css={btnStyles} href={r.code}>Code ↗</a>}
          </div>
        )}
        {/* className="prose" is a real DOM hook, not decoration — the KaTeX
            auto-render script (widgets/layout) finds this element by that
            literal selector, and an Emotion-generated class name would not
            match it. Confirmed by hitting exactly that failure: the script
            threw "No element provided to render" until this was added. */}
        <div className="prose" css={proseStyles}>
          {r.html
            ? <div dangerouslySetInnerHTML={{ __html: r.html }} />
            : <p css={emptyStateStyles}>This review has no body yet.</p>}
        </div>
        <div css={pagerStyles}>
          <span>{prev && <a href={`../${prev.slug}/`}>← {prev.title}</a>}</span>
          <span>{next && <a href={`../${next.slug}/`}>{next.title} →</a>}</span>
        </div>
      </article>
    </Layout>
  );
}
