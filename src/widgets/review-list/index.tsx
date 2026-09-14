import { css } from '@emotion/react';
import type { Review } from '../../entities/review/index.js';

const rowStyles = css`
  display: block;
  text-decoration: none;
  padding: 16px 0;
  border-bottom: 0.5px solid var(--line);
  &:first-of-type { padding-top: 0; }
  &:hover .rt { color: var(--accent); }
`;

const rowTopStyles = css`
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
`;

const tagsStyles = css`display: flex; gap: 5px; flex-wrap: wrap;`;

const tagStyles = css`
  font-size: 11px;
  background: var(--tint);
  color: var(--accent);
  padding: 3px 9px;
  border-radius: 999px;
  white-space: nowrap;
`;

const dateStyles = css`
  font-family: var(--mono);
  font-size: 11.5px;
  color: var(--ink3);
  white-space: nowrap;
`;

const titleStyles = css`
  font-size: 17.5px;
  font-weight: 600;
  line-height: 1.32;
  letter-spacing: -0.025em;
  margin-top: 9px;
  transition: color 0.15s;
`;

const venueStyles = css`
  font-family: var(--mono);
  font-size: 11.5px;
  color: var(--ink3);
  margin-top: 4px;
`;

const takeawayStyles = css`
  font-size: 14px;
  line-height: 1.64;
  color: var(--ink2);
  margin-top: 7px;
`;

export const emptyStateStyles = css`
  font-size: 14px;
  color: var(--ink3);
  padding: 8px 0 4px;
`;

const venueLine = (r: Review): string =>
  [r.authors, [r.venue, r.year].filter(Boolean).join(' ')].filter(Boolean).join(' · ');

// `className="rt"` gives the row's `:hover` rule above a stable target — an
// Emotion `css` class alone is unpredictable to reach from a sibling selector.
export function ReviewRow({ review: r, base }: { review: Review; base: string }) {
  return (
    <a css={rowStyles} href={`${base}papers/${r.slug}/`}>
      <div css={rowTopStyles}>
        <span css={tagsStyles}>
          {(r.topics ?? []).map(t => <span key={t} css={tagStyles}>{t}</span>)}
        </span>
        <span css={dateStyles}>{r.dateLabel}</span>
      </div>
      <div className="rt" css={titleStyles}>{r.title}</div>
      {venueLine(r) && <div css={venueStyles}>{venueLine(r)}</div>}
      {r.takeaway && <div css={takeawayStyles}>{r.takeaway}</div>}
    </a>
  );
}

export function ReviewList({ reviews, base }: { reviews: Review[]; base: string }) {
  if (!reviews.length) return <p css={emptyStateStyles}>No reviews published yet.</p>;
  return <>{reviews.map(r => <ReviewRow key={r.slug} review={r} base={base} />)}</>;
}
