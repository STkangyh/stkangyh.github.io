import { esc } from '../../shared/lib/index.js';

export function renderFooter({ site, builtAt }) {
  return `<footer>
  <span>${esc(site.affiliation)}</span>
  <span><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></span>
  <span class="built">built ${esc(builtAt)}</span>
</footer>`;
}
