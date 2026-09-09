import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { paths } from '../../shared/config/index.js';

// Everything about the person: bio, headline, metrics, projects, links.
// Content, not code — edit content/site.json, not a template.
export const loadSite = async () =>
  JSON.parse(await readFile(join(paths.content, 'site.json'), 'utf8'));
