/** One row of the Notion Paper Reviews database, ready to render. */
export interface Review {
  id?: string;
  title: string;
  slug: string;
  paper: string;
  authors: string;
  takeaway: string;
  venue: string;
  year: number | '';
  topics: string[];
  /** Link to the paper (arXiv or DOI). */
  link: string;
  /** Link to the official implementation. Not the same as `hasCodeBlocks`. */
  code: string;
  sortKey: string;
  dateLabel: string;

  html?: string;
  /** The body contains LaTeX, so the page pulls in KaTeX. */
  math?: boolean;
  /** The body contains code blocks, so the page pulls in highlight.js. */
  hasCodeBlocks?: boolean;
  /** Local filename -> expiring Notion URL, downloaded after rendering. */
  imageJobs?: Map<string, string>;
}

export interface VetResult {
  publishable: Review[];
  skipped: Review[];
}
