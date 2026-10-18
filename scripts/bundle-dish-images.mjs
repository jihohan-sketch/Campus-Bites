/**
 * Draws one photo for every menu line in the bundled 식단표 and ships it inside
 * the app, so students never wait on — or get refused by — a generator.
 *
 *   node scripts/bundle-dish-images.mjs
 *
 * Pictures come from Cloudflare Workers AI (FLUX.1 schnell), whose free daily
 * allowance covers a whole menu in a few minutes. It needs a free Cloudflare
 * account; put its credentials in `.env` at the project root (git-ignored):
 *
 *   CF_ACCOUNT_ID=…
 *   CF_API_TOKEN=…   (dash.cloudflare.com → AI → Workers AI → Use REST API)
 *
 * The live generator the app falls back to (Pollinations) now draws one new
 * picture per 45 seconds per IP and refuses the rest, which is what left whole
 * menus as emoji placeholders on students' phones.
 *
 * Safe to re-run: a dish that already has a file in `assets/dishes/` is
 * skipped, so after a menu change only the new dishes are drawn. It rewrites
 * `src/utils/dishPhotos.ts`, the lookup `DishImage` reads, as it goes.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const outDir = join(root, 'assets/dishes');

const MODEL = '@cf/black-forest-labs/flux-1-schnell';
/**
 * One size covers every tile: the hero shows it at full size and thumbnails
 * scale it down. FLUX draws 1024px, which would make the app bundle several
 * times heavier for no visible gain, so it is shrunk before it is saved.
 */
const SIZE = 512;
/** FLUX schnell is distilled for 1–8 steps; 4 is sharp and cheap. */
const STEPS = 4;
const CONCURRENCY = 4;
const MAX_ATTEMPTS = 4;

/** Same picture as `STYLE` in `foodImage.ts`: white dish, overhead, white backdrop. */
const STYLE =
  ', korean school cafeteria food, one portion plated in a simple white ceramic dish, ' +
  'centered, straight top-down overhead shot, soft even studio lighting, ' +
  'pure white seamless background, appetizing realistic food photography, ' +
  'sharp focus, no text, no hands, no cutlery';

/** See `warm-dish-images.mjs`: lets Node import the app's extensionless `.ts` modules. */
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

/** Every menu line in `config/school.ts`, recovered without evaluating it. */
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

/** Lookup key, spacing-insensitive like every other dish table in the app. */
const keyOf = (name) => name.replace(/\s+/g, '');

/** A stable 32-bit hash of the dish (FNV-1a), used as its file name. */
function hashOf(name) {
  let hash = 2166136261;
  const key = keyOf(name);
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const fileOf = (name) => `${hashOf(name).toString(16).padStart(8, '0')}.jpg`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function draw(prompt) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/${MODEL}`;
  let lastError = 'unknown';

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, steps: STEPS }),
    });
    const body = await response.json().catch(() => null);
    const image = body?.result?.image;
    if (response.ok && image) return Buffer.from(image, 'base64');

    lastError = `HTTP ${response.status}: ${JSON.stringify(body?.errors ?? body).slice(0, 300)}`;
    // A rejected request, bad credentials or a spent daily allowance will not
    // fix themselves; only rate limits and server errors are worth retrying.
    // (A 400 is usually the safety filter misreading a dish name — give that
    // dish a `prompt` override in foodImage.ts.)
    if (response.status !== 429 && response.status < 500) throw new Error(lastError);
    await sleep(2000 * 2 ** attempt);
  }
  throw new Error(lastError);
}

function writeLookup(names) {
  // The 식단표 spells some dishes both with and without a space; one row each.
  const unique = [...new Map(names.map((name) => [keyOf(name), name])).values()];
  const rows = unique
    .filter((name) => existsSync(join(outDir, fileOf(name))))
    .sort((a, b) => keyOf(a).localeCompare(keyOf(b), 'ko'))
    .map((name) => `  '${keyOf(name).replace(/'/g, "\\'")}': require('../../assets/dishes/${fileOf(name)}'),`);

  writeFileSync(
    join(root, 'src/utils/dishPhotos.ts'),
    `/**
 * Dish photos shipped inside the app, keyed on the despaced Korean menu line.
 *
 * Generated by \`node scripts/bundle-dish-images.mjs\` — do not edit by hand.
 * A dish missing here falls back to the live generator in \`foodImage.ts\`.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
export const DISH_PHOTOS: Record<string, number> = {
${rows.join('\n')}
};
`,
  );
  return rows.length;
}

async function main() {
  if (existsSync(join(root, '.env'))) process.loadEnvFile(join(root, '.env'));
  if (!process.env.CF_ACCOUNT_ID || !process.env.CF_API_TOKEN) {
    console.error('Missing CF_ACCOUNT_ID / CF_API_TOKEN — see the top of this file.');
    process.exit(1);
  }

  const { dishImageSubject } = await import(pathToFileURL(join(root, 'src/utils/foodImage.ts')).href);
  mkdirSync(outDir, { recursive: true });

  const names = bundledDishNames();
  const todo = names.filter((name) => !existsSync(join(outDir, fileOf(name))));
  console.log(`${names.length} dishes, ${todo.length} still to draw.`);

  let done = 0;
  let failed = 0;
  const queue = todo[Symbol.iterator]();

  const worker = async () => {
    for (const name of queue) {
      const path = join(outDir, fileOf(name));
      try {
        writeFileSync(path, await draw(`${dishImageSubject(name)}${STYLE}`));
        // macOS's built-in image tool: shrink to SIZE and re-encode as JPEG.
        execFileSync('sips', ['-Z', String(SIZE), '-s', 'format', 'jpeg', '-s', 'formatOptions', '80', path, '--out', path], {
          stdio: 'ignore',
        });
        console.log(`  ✓ ${++done + failed}/${todo.length} ${name}`);
      } catch (error) {
        failed += 1;
        console.warn(`  ✗ ${done + failed}/${todo.length} ${name}: ${error.message}`);
        // Bad credentials or a spent allowance fail every dish; stop early.
        if (/HTTP 40[13]/.test(error.message)) throw error;
      }
    }
  };

  try {
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  } finally {
    console.log(`Done. ${writeLookup(names)}/${names.length} dishes bundled, ${failed} failed.`);
  }
}

await main();
