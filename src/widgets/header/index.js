import { esc } from '../../shared/lib/index.js';

// Set before first paint so a dark-mode visitor never sees a light flash.
export const themeBootScript =
  `(function(){try{var m=localStorage.getItem('hp_mode');if(m)document.documentElement.setAttribute('data-mode',m)}catch(e){}})()`;

const themeToggle = `<button id="theme" aria-label="Toggle colour theme">
      <svg class="sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6"/></svg>
      <svg class="moon" viewBox="0 0 24 24"><path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2z"/></svg>
    </button>`;

// The site's only interactive behaviour, and the only script we ship.
export const themeScript = `<script>(function(){var r=document.documentElement,K='hp_mode';
function cur(){return r.getAttribute('data-mode')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}
document.getElementById('theme').addEventListener('click',function(){var n=cur()==='dark'?'light':'dark';r.setAttribute('data-mode',n);try{localStorage.setItem(K,n)}catch(e){}})})()</script>`;

// `base` is the path back to the site root from the page being rendered,
// so every page can be served from its own directory.
export function renderHeader({ site, base }) {
  return `<header><div class="wrap">
  <a class="mark" href="${base}">${esc(site.name)}</a>
  <div class="right">
    <nav><a href="${base}papers/">Papers</a><a href="${base}#work">Work</a><a href="${base}cv.pdf">CV</a></nav>
    ${themeToggle}
  </div>
</div></header>`;
}
