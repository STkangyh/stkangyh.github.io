import { esc } from '../../shared/lib/index.ts';
import type { Review } from '../../entities/review/index.ts';

const venueLine = (r: Review): string => [r.authors, [r.venue, r.year].filter(Boolean).join(' ')]
  .filter(Boolean).join(' · ');

export function renderReviewRow(review: Review, base: string): string {
  const r = review;
  const tags = (r.topics || []).map(t => `<span class="tag">${esc(t)}</span>`).join('');
  return `<a class="rev" href="${base}papers/${esc(r.slug)}/">
    <div class="rev-top"><span class="tags">${tags}</span><span class="date">${esc(r.dateLabel)}</span></div>
    <div class="rt">${esc(r.title)}</div>
    ${venueLine(r) ? `<div class="rv">${esc(venueLine(r))}</div>` : ''}
    ${r.takeaway ? `<div class="rd">${esc(r.takeaway)}</div>` : ''}
  </a>`;
}

export function renderReviewList({ reviews, base }: { reviews: Review[]; base: string }): string {
  if (!reviews.length) return '<p class="empty">No reviews published yet.</p>';
  return reviews.map(r => renderReviewRow(r, base)).join('\n');
}
