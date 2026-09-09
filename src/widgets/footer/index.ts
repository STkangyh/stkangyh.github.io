import { esc } from '../../shared/lib/index.ts';
import type { Site } from '../../entities/site/index.ts';

export function renderFooter({ site, builtAt }: { site: Site; builtAt: string }): string {
  return `<footer>
  <span>${esc(site.affiliation)}</span>
  <span><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></span>
  <span class="built">built ${esc(builtAt)}</span>
</footer>`;
}
