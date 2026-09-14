import { Fragment } from 'react';
import { css } from '@emotion/react';
import { Layout } from '../../widgets/layout/index.js';
import { ReviewList } from '../../widgets/review-list/index.js';
import {
  heroStyles, eyebrowStyles, heroHeadingStyles, ledeStyles,
  sectionStyles, sectionHeaderStyles, sectionLabelStyles, sectionActionStyles,
  btnStyles, btnSolidStyles,
} from '../../shared/ui/primitives.js';
import type { Site, Metric, Project } from '../../entities/site/index.js';
import type { Review } from '../../entities/review/index.js';

const RECENT = 5;

const metricsStyles = css`display: flex; gap: 34px; margin-top: 26px; flex-wrap: wrap;`;
const metricValueStyles = css`
  font-family: var(--mono); font-size: 22px; font-weight: 500; color: var(--ink); letter-spacing: -0.02em;
  small { font-size: 12.5px; color: var(--ink3); font-weight: 400; }
`;
const metricLabelStyles = css`font-size: 12px; color: var(--ink3); margin-top: 2px;`;
const actionsStyles = css`display: flex; gap: 9px; margin-top: 30px; flex-wrap: wrap;`;

function Metrics({ metrics }: { metrics: Metric[] }) {
  return (
    <div css={metricsStyles}>
      {metrics.map(m => (
        <div key={m.label}>
          <div css={metricValueStyles}>{m.value}<small>{m.unit}</small></div>
          <div css={metricLabelStyles}>{m.label}</div>
        </div>
      ))}
    </div>
  );
}

const projectStyles = css`display: flex; gap: 16px; padding: 16px 0; border-bottom: 0.5px solid var(--line);`;
const projectIndexStyles = css`font-family: var(--mono); font-size: 11.5px; color: var(--ink3); padding-top: 4px; width: 26px; flex: none;`;
const projectTitleStyles = css`
  font-weight: 600; font-size: 15px; letter-spacing: -0.02em;
  span { color: var(--ink3); font-weight: 400; letter-spacing: 0; }
`;
const projectBodyStyles = css`font-size: 14px; line-height: 1.64; color: var(--ink2); margin-top: 5px;`;
const stackStyles = css`display: flex; gap: 6px; margin-top: 9px; flex-wrap: wrap;`;
const chipStyles = css`
  font-family: var(--mono); font-size: 10.5px; color: var(--ink3);
  border: 0.5px solid var(--line2); padding: 2px 7px; border-radius: 4px;
`;

function Projects({ projects }: { projects: Project[] }) {
  return (
    <>
      {projects.map((p, i) => (
        <div key={p.name} css={projectStyles}>
          <div css={projectIndexStyles}>{String(i + 1).padStart(2, '0')}</div>
          <div>
            <div css={projectTitleStyles}>{p.name} <span>— {p.tagline}</span></div>
            <div css={projectBodyStyles}>{p.body}</div>
            <div css={stackStyles}>{p.stack.map(s => <span key={s} css={chipStyles}>{s}</span>)}</div>
          </div>
        </div>
      ))}
    </>
  );
}

export interface HomePageProps {
  site: Site;
  reviews: Review[];
  builtAt: string;
  cssHref: string;
}

export function HomePage({ site, reviews, builtAt, cssHref }: HomePageProps) {
  const recent = reviews.slice(0, RECENT);
  return (
    <Layout site={site} title={site.title} description={site.description} builtAt={builtAt} cssHref={cssHref}>
      <div css={heroStyles}>
        <div css={eyebrowStyles}>{site.eyebrow}</div>
        <h1 css={heroHeadingStyles}>
          {site.headline.map((line, i) => (
            <Fragment key={line}>{i > 0 && <br />}{line}</Fragment>
          ))}
        </h1>
        <p css={ledeStyles}>{site.lede}</p>
        <Metrics metrics={site.metrics} />
        <div css={actionsStyles}>
          <a css={[btnStyles, btnSolidStyles]} href="cv.pdf" download>
            <svg viewBox="0 0 24 24"><path d="M12 3.5v11m0 0 4-4m-4 4-4-4M4.5 17.5v1a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1" /></svg>
            Download CV
          </a>
          <a css={btnStyles} href={site.github}>GitHub</a>
          <a css={btnStyles} href={`mailto:${site.email}`}>Email</a>
        </div>
      </div>

      <section id="papers" css={sectionStyles}>
        <div css={sectionHeaderStyles}>
          <span css={sectionLabelStyles}>Paper reviews</span>
          {reviews.length > recent.length && (
            <a css={sectionActionStyles} href="papers/">All {reviews.length} reviews →</a>
          )}
        </div>
        <ReviewList reviews={recent} base="" />
      </section>

      <section id="work" css={sectionStyles}>
        <div css={sectionHeaderStyles}><span css={sectionLabelStyles}>Selected work</span></div>
        <Projects projects={site.projects} />
      </section>
    </Layout>
  );
}
