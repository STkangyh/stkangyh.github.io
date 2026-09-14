import { Global, css } from '@emotion/react';

// Design tokens and the document-level reset. Everything a component needs
// is a CSS custom property here — components never hardcode a colour.
const globalStyles = css`
  :root {
    color-scheme: light;
    --paper: #faf9f5; --card: #ffffff; --ink: #1a1a18; --ink2: #55544e; --ink3: #8a887e;
    --line: #e5e3da; --line2: #d6d3c8;
    --accent: #9A3D1E; --tint: #F7E9E2;
    --code-str: #3B6D11; --code-num: #185FA5; --code-kw: #9A3D1E;
    --sans: 'Instrument Sans', -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
    --mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
    --w: 720px;
  }
  :root[data-mode='dark'] {
    color-scheme: dark;
    --paper: #121211; --card: #1a1a18; --ink: #eeece4; --ink2: #a5a399; --ink3: #77756c;
    --line: #2a2a26; --line2: #38372f; --accent: #E39068; --tint: #2a1a12;
    --code-str: #97C459; --code-num: #85B7EB; --code-kw: #E39068;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-mode='light']) {
      color-scheme: dark;
      --paper: #121211; --card: #1a1a18; --ink: #eeece4; --ink2: #a5a399; --ink3: #77756c;
      --line: #2a2a26; --line2: #38372f; --accent: #E39068; --tint: #2a1a12;
      --code-str: #97C459; --code-num: #85B7EB; --code-kw: #E39068;
    }
  }

  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    margin: 0; background: var(--paper); color: var(--ink); font-family: var(--sans);
    font-size: 16px; line-height: 1.7; -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  a { color: inherit; }
  ::selection { background: var(--tint); color: var(--accent); }
  :focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 3px; }
`;

export const wrapStyles = css`
  max-width: var(--w);
  margin: 0 auto;
  padding: 0 28px;
`;

export const skipLinkStyles = css`
  position: absolute;
  left: -9999px;
  &:focus {
    left: 28px; top: 12px; background: var(--card); padding: 8px 14px;
    border-radius: 8px; border: 0.5px solid var(--line2); z-index: 20;
  }
`;

/** Injects the document-level tokens and reset. Mount once, at the page root. */
export const GlobalStyles = () => <Global styles={globalStyles} />;
