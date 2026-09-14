import { css } from '@emotion/react';
import type { Site } from '../../entities/site/index.js';
import { wrapStyles } from '../../shared/ui/tokens.js';

// Set before first paint so a dark-mode visitor never sees a light flash.
export const themeBootScript =
  `(function(){try{var m=localStorage.getItem('hp_mode');if(m)document.documentElement.setAttribute('data-mode',m)}catch(e){}})()`;

// The site's only interactive behaviour, and the only script we ship.
export const themeScript = `(function(){var r=document.documentElement,K='hp_mode';
function cur(){return r.getAttribute('data-mode')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}
document.getElementById('theme').addEventListener('click',function(){var n=cur()==='dark'?'light':'dark';r.setAttribute('data-mode',n);try{localStorage.setItem(K,n)}catch(e){}})})()`;

const headerStyles = css`
  border-bottom: 0.5px solid var(--line);
  position: sticky;
  top: 0;
  background: var(--paper);
  z-index: 5;
`;

const innerStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 58px;
  gap: 16px;
`;

const markStyles = css`
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.03em;
  text-decoration: none;
`;

const rightStyles = css`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const navStyles = css`
  display: flex;
  gap: 20px;
  font-size: 13.5px;
  color: var(--ink2);
  a { text-decoration: none; }
  a:hover { color: var(--accent); }
`;

const themeButtonStyles = css`
  width: 30px; height: 30px;
  display: grid; place-items: center;
  border: 0.5px solid var(--line2); border-radius: 999px;
  background: transparent; color: var(--ink2); cursor: pointer; padding: 0;
  &:hover { color: var(--accent); border-color: var(--accent); }
  svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; }
`;

// Both icons ship; CSS decides which one shows, so there is no flash while
// the theme-boot script above runs and no client JS needed to pick one.
const sunStyles = css`
  display: block;
  :root[data-mode='dark'] & { display: none; }
  @media (prefers-color-scheme: dark) {
    :root:not([data-mode='light']) & { display: none; }
  }
`;

const moonStyles = css`
  display: none;
  :root[data-mode='dark'] & { display: block; }
  @media (prefers-color-scheme: dark) {
    :root:not([data-mode='light']) & { display: block; }
  }
`;

/** `base` is the path back to the site root from the page being rendered. */
export function Header({ site, base }: { site: Site; base: string }) {
  return (
    <header css={headerStyles}>
      <div css={[wrapStyles, innerStyles]}>
        <a css={markStyles} href={base}>{site.name}</a>
        <div css={rightStyles}>
          <nav css={navStyles}>
            <a href={`${base}papers/`}>Papers</a>
            <a href={`${base}#work`}>Work</a>
            <a href={`${base}cv.pdf`}>CV</a>
          </nav>
          <button id="theme" css={themeButtonStyles} aria-label="Toggle colour theme">
            <svg css={sunStyles} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4.2" />
              <path d="M12 2.6v2.2M12 19.2v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
            </svg>
            <svg css={moonStyles} viewBox="0 0 24 24">
              <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
