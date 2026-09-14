import { css } from '@emotion/react';

// Small style building blocks reused across more than one page or widget.
// A page-only rule stays in that page's own file; anything shared lives here
// so two pages cannot drift out of sync with each other.

export const mobileBreakpoint = '@media (max-width: 560px)';

export const heroStyles = css`
  padding: 60px 0 38px;
  ${mobileBreakpoint} { padding: 44px 0 32px; }
`;

export const eyebrowStyles = css`
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.09em;
  color: var(--accent);
  text-transform: uppercase;
`;

export const heroHeadingStyles = css`
  font-size: 38px;
  font-weight: 600;
  line-height: 1.11;
  letter-spacing: -0.035em;
  margin: 12px 0 0;
  ${mobileBreakpoint} { font-size: 31px; }
`;

export const ledeStyles = css`
  font-size: 15.5px;
  line-height: 1.68;
  color: var(--ink2);
  margin: 18px 0 0;
  max-width: 52ch;
`;

export const sectionStyles = css`
  padding: 38px 0;
  border-top: 0.5px solid var(--line);
`;

export const sectionHeaderStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 20px;
`;

export const sectionLabelStyles = css`
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--ink3);
`;

export const sectionActionStyles = css`
  font-size: 12.5px;
  color: var(--accent);
  text-decoration: none;
  &:hover { text-decoration: underline; text-underline-offset: 3px; }
`;

export const btnStyles = css`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13.5px;
  font-weight: 500;
  padding: 9px 16px;
  border-radius: 999px;
  text-decoration: none;
  border: 0.5px solid var(--line2);
  color: var(--ink);
  transition: border-color 0.15s, color 0.15s;
  &:hover { border-color: var(--accent); color: var(--accent); }
  svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
`;

export const btnSolidStyles = css`
  background: var(--ink);
  color: var(--paper);
  border-color: var(--ink);
  &:hover { opacity: 0.86; color: var(--paper); }
`;
