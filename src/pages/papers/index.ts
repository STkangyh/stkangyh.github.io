import { renderLayout } from '../../widgets/layout/index.ts';
import { renderReviewList } from '../../widgets/review-list/index.ts';
import type { Site } from '../../entities/site/index.ts';
import type { Review } from '../../entities/review/index.ts';

export interface PageContext {
  site: Site;
  reviews: Review[];
  builtAt: string;
  cssHref: string;
}


export function renderPapersPage({ site, reviews, builtAt, cssHref }: PageContext): string {
  const body = `<div class="hero">
  <div class="eyebrow">Paper reviews</div>
  <h1>What I read,<br>and what held up.</h1>
  <p class="lede">Notes on continual learning, efficient encoders and video understanding — written after reading, and where possible after running the code.</p>
</div>
<section>
  <div class="sec-h"><span class="sec-t">${reviews.length} review${reviews.length === 1 ? '' : 's'}</span></div>
  ${renderReviewList({ reviews, base: '../' })}
</section>`;

  return renderLayout({
    site, base: '../', title: `Paper reviews — ${site.name}`,
    description: 'Reviews of papers on continual learning, efficient encoders and video understanding.',
    body, builtAt, cssHref,
  });
}
