import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { paths } from '../../shared/config/index.ts';
import type { Site } from './types.ts';

// Everything about the person: bio, headline, metrics, projects, links.
// Content, not code — edit content/site.json, not a template.
export const loadSite = async (): Promise<Site> =>
  JSON.parse(await readFile(join(paths.content, 'site.json'), 'utf8')) as Site;

export type { Site, Metric, Project } from './types.ts';
