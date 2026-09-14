import { css } from '@emotion/react';
import type { Site } from '../../entities/site/index.js';

const footerStyles = css`
  padding: 32px 0 60px;
  border-top: 0.5px solid var(--line);
  font-size: 13px;
  color: var(--ink3);
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  a { color: var(--accent); text-decoration: none; }
`;

const builtStyles = css`
  font-family: var(--mono);
  font-size: 11px;
`;

export function Footer({ site, builtAt }: { site: Site; builtAt: string }) {
  return (
    <footer css={footerStyles}>
      <span>{site.affiliation}</span>
      <span><a href={`mailto:${site.email}`}>{site.email}</a></span>
      <span css={builtStyles}>built {builtAt}</span>
    </footer>
  );
}
