// Minimal shapes for the parts of the Notion API this build actually reads.
// Notion keys a block's payload by its own type name (`block.paragraph`,
// `block.code`, …), which no reasonable union expresses without hundreds of
// lines, so payloads stay loose and everything around them is typed.

export interface Annotations {
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
  code?: boolean;
  color?: string;
}

export interface RichTextItem {
  type: string;
  plain_text: string;
  href?: string | null;
  annotations?: Annotations;
  equation?: { expression: string };
}

export interface NotionBlock {
  id: string;
  type: string;
  has_children?: boolean;
  /** Children fetched recursively by the client; not part of the API response. */
  __children?: NotionBlock[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [payload: string]: any;
}

export interface DateValue { start: string | null; end?: string | null }

export interface SelectValue { name: string }

export interface PropertyValue {
  type: string;
  title?: RichTextItem[];
  rich_text?: RichTextItem[];
  number?: number | null;
  select?: SelectValue | null;
  multi_select?: SelectValue[];
  url?: string | null;
  date?: DateValue | null;
}

export interface NotionPage {
  id: string;
  created_time: string;
  properties: Record<string, PropertyValue>;
}

export interface QueryBody {
  filter?: unknown;
  sorts?: unknown[];
  start_cursor?: string | undefined;
  page_size?: number;
}

/** Rewrites an image URL and records anything that must be copied locally. */
export type ImageResolver = (url: string, blockId: string) => string;

export interface RenderFlags { math: boolean; code: boolean }
export interface RenderedBlocks { html: string; flags: RenderFlags }
