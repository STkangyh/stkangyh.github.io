export interface Metric { value: string; unit: string; label: string }

export interface Project {
  name: string;
  tagline: string;
  body: string;
  stack: string[];
}

/** Everything about the person. Edited in content/site.json, never in a template. */
export interface Site {
  name: string;
  title: string;
  description: string;
  url: string;
  eyebrow: string;
  headline: string[];
  lede: string;
  metrics: Metric[];
  email: string;
  github: string;
  affiliation: string;
  projects: Project[];
}
