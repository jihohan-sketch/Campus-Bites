/**
 * Pre-generates the dish photo for every menu line in the bundled 식단표.
 *
 * The generator draws a picture the first time a URL is asked for and serves it
 * from cache afterwards, so without this the first student to open a new day
 * watches the tiles fill in one at a time. Running this whenever the menu data
 * changes moves that wait off the students and onto the deploy.
 *
 *   node scripts/warm-dish-images.mjs
 *
 * Safe to re-run: an already generated URL comes back from cache in well under
 * a second, so a repeat pass over an unchanged menu costs almost nothing.
 */

import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

/**
 * The three sizes `DishImage` ever actually requests: menu thumbnails round up
 * to 128, the bigger detail-list tiles to 256, and the full-width hero photo on
 * the meal card and the detail page to 512. Smallest first, so the pictures
 * students see while scrolling are ready even if this is interrupted part way
 * through — and because the hero is one image per card while the tiles are a
 * dozen.
 */
const SIZES = [128, 256, 512];
/**
 * How many pictures to draw at once. The generator rate-limits *generation*
 * hard — eight at a time gets almost everything a 429 — while serving an
 * already drawn picture is never throttled. Two workers with backoff finishes
 * the whole menu without tripping it.
 */
const CONCURRENCY = 2;
/** Attempts per image before giving up on it for this run. */
const MAX_ATTEMPTS = 5;
/** A 429 waits this long, doubling each time. */
const BACKOFF_MS = 4000;

/**
 * Node strips the types out of a `.ts` file on its own, but it still wants a
 * real file extension on every import. The app's own modules are written for a
 * bundler and leave it off, so this fills it back in — that way the URLs warmed
 * here are built by `foodImage.ts` itself rather than by a second copy of the
 * prompt that would silently drift out of step with it.
 */
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[mc]?[jt]s$/.test(specifier)) {
      try {
        return nextResolve(`${specifier}.ts`, context);
      } catch {
        // Fall through to the normal resolution and let it report the problem.
      }
    }
    return nextResolve(specifier, context);
  },
});

/**
 * Pulls the menu lines out of `config/school.ts` without evaluating it. Every
 * dish in that file sits in a quoted string inside a `breakfast:`, `lunch:` or
 * `dinner:` array, which is enough to recover them all.
 */
function bundledDishNames() {
  const source = readFileSync(join(root, 'src/config/school.ts'), 'utf8');
  const names = new Set();

  for (const [, body] of source.matchAll(/(?:breakfast|lunch|dinner):\s*\[([\s\S]*?)\]/g)) {
    for (const [, quoted] of body.matchAll(/'((?:[^'\\]|\\.)*)'/g)) {
      const name = quoted.replace(/\\'/g, "'").trim();
      if (name) names.add(name);
    }
  }
  return [...names];
}

async function main() {
  const { dishImageUrl } = await import(
    pathToFileURL(join(root, 'src/utils/foodImage.ts')).href
  );

  const names = bundledDishNames();
  const jobs = SIZES.flatMap((size) =>
    names.map((name) => ({ name, size, url: dishImageUrl(name, size) })),
  );

  console.log(`Warming ${jobs.length} images across ${names.length} dishes…`);

  let done = 0;
  let failed = 0;
  const queue = jobs[Symbol.iterator]();

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const worker = async () => {
    for (const job of queue) {
      let lastError = 'unknown';

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        try {
          const response = await fetch(job.url);
          if (response.ok) {
            await response.arrayBuffer();
            lastError = null;
            break;
          }
          lastError = `HTTP ${response.status}`;
          // 429 means the queue is full right now, not that this image is bad.
          if (response.status !== 429 && response.status < 500) break;
        } catch (error) {
          lastError = error.message;
        }
        await sleep(BACKOFF_MS * 2 ** attempt);
      }

      if (lastError) {
        failed += 1;
        console.warn(`  ✗ ${job.name} @${job.size}: ${lastError}`);
      }
      done += 1;
      if (done % 25 === 0) console.log(`  ${done}/${jobs.length} (${failed} failed)`);
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`Done. ${done - failed} warmed, ${failed} failed.`);
}

await main();
