/**
 * Draws every dish photo in the bundled 식단표 as one labelled contact sheet,
 * so a picture that does not match its dish is obvious at a glance.
 *
 *   node scripts/audit-dish-images.mjs && open dish-image-audit.html
 *
 * The sheet links the live generator URLs rather than downloading anything, so
 * this costs nothing to run and doubles as a warm-up: scrolling the page draws
 * whatever has not been drawn yet.
 *
 * When a picture is wrong, add the dish to `OVERRIDES` in
 * `src/utils/foodImage.ts` — each card prints the exact key to paste — and run
 * this again. That loop is the whole point: "the photos match the food" is a
 * property somebody has to be able to re-check after every menu change, not a
 * claim made once.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

/** The size the sheet renders at — the one every menu tile requests. */
const SIZE = 256;

/**
 * Node strips the types out of a `.ts` file on its own, but it still wants a
 * real file extension on every import. The app's own modules are written for a
 * bundler and leave it off, so this fills it back in — that way the sheet shows
 * the URLs `foodImage.ts` actually builds rather than a second copy of the
 * prompt that would silently drift out of step with it.
 */
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[mc]?[jt]s$/.test(specifier)) {
      try {
        return nextResolve(`${specifier}.ts`, context);
      } catch {
        // Fall through and let normal resolution report the problem.
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
  return [...names].sort((a, b) => a.localeCompare(b, 'ko'));
}

const escape = (value) =>
  String(value).replace(/[&<>"]/g, (ch) => `&${{ '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot' }[ch]};`);

async function main() {
  const { dishImageUrl, dishImageSubject } = await import(
    pathToFileURL(join(root, 'src/utils/foodImage.ts')).href
  );
  const { englishDishName } = await import(
    pathToFileURL(join(root, 'src/utils/dishEnglish.ts')).href
  );

  const names = bundledDishNames();
  const cards = names
    .map((name) => {
      const english = englishDishName(name) ?? '';
      const subject = dishImageSubject(name);
      // Worth calling out: a dish with no English name is being drawn from a
      // keyword guess, which is the likeliest kind of picture to be wrong.
      const guessed = english ? '' : ' card--guessed';
      return `    <figure class="card${guessed}">
      <img src="${escape(dishImageUrl(name, SIZE))}" alt="${escape(english || name)}" loading="lazy" />
      <figcaption>
        <b>${escape(name)}</b>
        <span>${escape(english || '— no English name; drawn from a keyword guess —')}</span>
        <code>${escape(subject)}</code>
      </figcaption>
    </figure>`;
    })
    .join('\n');

  const html = `<!doctype html>
<meta charset="utf-8" />
<title>Dish image audit — ${names.length} dishes</title>
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; padding: 24px; font: 14px/1.45 -apple-system, BlinkMacSystemFont, system-ui, sans-serif; }
  header { max-width: 60ch; margin-bottom: 24px; }
  h1 { font-size: 20px; margin: 0 0 8px; }
  p { margin: 0 0 8px; opacity: 0.75; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
  .card { margin: 0; border: 1px solid rgba(128,128,128,0.3); border-radius: 12px; overflow: hidden; }
  .card--guessed { outline: 2px solid #e8a33d; }
  .card img { display: block; width: 100%; aspect-ratio: 1; object-fit: cover; background: rgba(128,128,128,0.15); }
  figcaption { padding: 8px 10px; display: grid; gap: 2px; }
  figcaption b { font-size: 14px; }
  figcaption span { font-size: 12px; opacity: 0.8; }
  figcaption code { font-size: 10px; opacity: 0.55; word-break: break-word; }
</style>
<header>
  <h1>Dish image audit — ${names.length} dishes</h1>
  <p>Every picture the app will draw, at the size the menu list requests. Scan for
     any photo that is not the food named under it.</p>
  <p>To fix one, add its <b>Korean name</b> to <code>OVERRIDES</code> in
     <code>src/utils/foodImage.ts</code> — give it a descriptive <code>prompt</code>,
     bump <code>reroll</code>, or pin a <code>url</code> — then run this again.</p>
  <p>An orange outline means the dish has no English name and its picture is being
     drawn from a keyword guess.</p>
</header>
<div class="grid">
${cards}
</div>
`;

  const out = join(root, 'dish-image-audit.html');
  writeFileSync(out, html);
  console.log(`Wrote ${out} — ${names.length} dishes.`);
  console.log('Open it and look for any picture that is not the food named under it.');
}

await main();
