// Captures de référence des maquettes statiques (docs/v1/maquettes-ciel/rendu → captures/).
// Usage : node scripts/maquettes-captures.mjs [filtre]
import { chromium } from '@playwright/test';
import { readdirSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dir = resolve('docs/v1/maquettes-ciel/rendu');
const out = resolve('docs/v1/maquettes-ciel/captures');
mkdirSync(out, { recursive: true });
const filter = process.argv[2] ?? '';
const browser = await chromium.launch();
for (const file of readdirSync(dir).filter((f) => f.endsWith('.html') && f.includes(filter))) {
  const html = readFileSync(join(dir, file), 'utf8');
  const m = html.match(/<div style="width: (\d+)px; (?:min-)?height: (\d+)px/);
  const [width, height] = m ? [Number(m[1]), Number(m[2])] : [1440, 900];
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(`file://${join(dir, file)}`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(out, file.replace('.html', '.png')), fullPage: true });
  await page.close();
  console.log(file, width, height);
}
await browser.close();
