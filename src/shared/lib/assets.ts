import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { log } from './log.ts';
import { REQUEST_TIMEOUT_MS } from '../config/index.ts';

/** Local filename -> remote URL. */
export type DownloadJobs = Map<string, string>;

// Download a name -> url map into a directory. One failure warns and the rest
// continue: a missing image should not fail a deploy.
export async function downloadAll(
  jobs: DownloadJobs | undefined,
  destDir: string,
): Promise<void> {
  if (!jobs?.size) return;
  await mkdir(destDir, { recursive: true });
  for (const [name, url] of jobs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await writeFile(join(destDir, name), Buffer.from(await res.arrayBuffer()));
      log(`asset ${name}`);
    } catch (err) {
      console.warn(`  ! asset failed (${name}): ${(err as Error).message}`);
    }
  }
}
