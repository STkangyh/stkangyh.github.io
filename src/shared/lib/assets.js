import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { log } from './log.js';

// Download a name -> url map into a directory. One failure warns and the rest
// continue: a missing image should not fail a deploy.
export async function downloadAll(jobs, destDir) {
  if (!jobs?.size) return;
  await mkdir(destDir, { recursive: true });
  for (const [name, url] of jobs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await writeFile(join(destDir, name), Buffer.from(await res.arrayBuffer()));
      log(`asset ${name}`);
    } catch (err) {
      console.warn(`  ! asset failed (${name}): ${err.message}`);
    }
  }
}
