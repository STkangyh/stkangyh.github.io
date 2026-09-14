import { Layout } from '../../widgets/layout/index.js';
import { ReviewList } from '../../widgets/review-list/index.js';
import {
  heroStyles, eyebrowStyles, heroHeadingStyles, ledeStyles,
  sectionStyles, sectionHeaderStyles, sectionLabelStyles,
} from '../../shared/ui/primitives.js';
import type { Site } from '../../entities/site/index.js';
import type { Review } from '../../entities/review/index.js';

export interface PapersPageProps {
  site: Site;
  reviews: Review[];
  builtAt: string;
  cssHref: string;
}

export function PapersPage({ site, reviews, builtAt, cssHref }: PapersPageProps) {
  return (
    <Layout
      site={site} base="../" builtAt={builtAt} cssHref={cssHref}
      title={`Paper reviews — ${site.name}`}
      description="Reviews of papers on continual learning, efficient encoders and video understanding."
    >
      <div css={heroStyles}>
        <div css={eyebrowStyles}>Paper reviews</div>
        <h1 css={heroHeadingStyles}>What I read,<br />and what held up.</h1>
        <p css={ledeStyles}>
          Notes on continual learning, efficient encoders and video understanding — written after
          reading, and where possible after running the code.
        </p>
      </div>
      <section css={sectionStyles}>
        <div css={sectionHeaderStyles}>
          <span css={sectionLabelStyles}>{reviews.length} review{reviews.length === 1 ? '' : 's'}</span>
        </div>
        <ReviewList reviews={reviews} base="../" />
      </section>
    </Layout>
  );
}
