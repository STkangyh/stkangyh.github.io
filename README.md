# younghoon-kang.github.io

Personal site: introduction, paper reviews, CV download.

Reviews are written in **Notion**. A scheduled GitHub Action reads the Notion
database, generates static HTML, and deploys it to GitHub Pages. Nothing calls
Notion at request time, so the site stays fast and stays up even when Notion is down.

## Writing a review

1. Add a row to the **Paper Reviews** database in Notion
   (문서 허브 → Paper Reviews).
2. Fill in `Title`, `Paper`, `Authors`, `Venue`, `Year`, `Topics`, `Link`,
   and a two-or-three-sentence `Takeaway` — the takeaway is what shows in the list.
3. Write the review in the page body. Headings, lists, quotes, callouts, code
   blocks, images and LaTeX equations all carry over.
4. Set `Status` to **Published** and set a `Published` date.

Headings with nothing under them are dropped, so an unfinished template does not
reach the page. A row needs a takeaway or a body to be published. If it has neither, the build
skips it and says so in the log — one stray toggle on an empty row cannot put a
blank page on the site. Missing paper title or link are reported as warnings but
still publish.

It goes live at the next scheduled build (06:00 and 18:00 KST). To publish
immediately, run the workflow by hand: Actions → *Build and deploy* → *Run workflow*.

## Local development

```bash
npm run build      # writes dist/
npm run serve      # http://localhost:5173
```

Without `NOTION_TOKEN` the build falls back to `data/fixture.json`, a specimen
review that exercises every supported block type. Use it to check layout changes
without touching Notion.

To build against the real database locally:

```bash
NOTION_TOKEN=secret_xxx NOTION_DB_ID=0827b9d0308445f78ee1d8fe9fe2f118 npm run build
```

## One-time setup

1. **Notion integration** — notion.so/my-integrations → *New integration*
   (internal, read-only content capability is enough). Copy the token.
2. **Share the database with it** — open the Paper Reviews database → `···` →
   *Connections* → add the integration. Without this the API returns 404.
3. **Repository secrets** — Settings → Secrets and variables → Actions:
   - `NOTION_TOKEN` — the integration token
   - `NOTION_DB_ID` — `0827b9d0308445f78ee1d8fe9fe2f118`
4. **Pages** — Settings → Pages → Source: **GitHub Actions**.

## Layout

```
build/       build.mjs (orchestration), notion.mjs (API + block renderer), templates.mjs (HTML)
src/         styles.css (design system), site.json (bio, metrics, projects)
public/      cv.pdf and anything else copied verbatim
data/        fixture.json — offline specimen review
dist/        generated output (gitignored)
```

The build has **no npm dependencies**. Notion is called over REST with `fetch`,
and blocks are rendered to HTML by `build/notion.mjs`.

## Design

Instrument Sans (600 headings / 400 body), JetBrains Mono for figures and labels,
rust accent `#9A3D1E` on warm paper `#faf9f5`, single 720px column, light and dark.
The site is English throughout; Korean, if it appears, falls back to a system
face rather than a webfont. KaTeX and highlight.js load from a CDN only on
pages that actually contain maths or code. Syntax colours come from the site palette, not a vendor theme,
so code reads correctly in both modes.

## Updating the CV

Replace `public/cv.pdf` and push. It is served at `/cv.pdf`.
