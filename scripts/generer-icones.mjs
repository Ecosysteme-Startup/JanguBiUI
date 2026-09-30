#!/usr/bin/env node
/**
 * Génère les icônes et l'image Open Graph depuis le logo officiel (src/components/ui/logo.tsx,
 * seule source du tracé et des couleurs) :
 *   src/app/icon.svg, src/app/icon1.png (32), src/app/favicon.ico (16/32/48),
 *   src/app/apple-icon.png (180), public/icons/icon-{192,512}.png, public/icons/maskable-512.png,
 *   src/app/opengraph-image.png (1200 × 630, logo + « Jàngu Bi » en Source Serif 4 600).
 *
 * Usage : node scripts/generer-icones.mjs
 * Police : SOURCE_SERIF_TTF=/chemin/SourceSerif4-SemiBold.ttf (sinon recherche dans le cache yarn,
 * paquet @expo-google-fonts/source-serif-4). Les fichiers produits sont versionnés : le build n'en
 * dépend pas.
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = (rel) => path.join(ROOT, rel);

const source = readFileSync(out('src/components/ui/logo.tsx'), 'utf8');
const constant = (name) => source.match(new RegExp(`export const ${name} = '([^']+)'`))[1];
const BRAND_BLUE = constant('BRAND_BLUE');
const BRAND_INK = constant('BRAND_INK');
const VIEWBOX = constant('LOGO_VIEWBOX').split(' ').map(Number);
const PATHS = [...source.match(/LOGO_PATHS = \[([^\]]+)\]/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
const [VX, VY, VW, VH] = VIEWBOX;

/** Logo centré dans un carré `size`, hauteur `ratio` du carré. */
const mark = (size, ratio) => {
  const scale = (size * ratio) / VH;
  const tx = (size - VW * scale) / 2 - VX * scale;
  const ty = (size - VH * scale) / 2 - VY * scale;
  const round = (n) => Math.round(n * 1000) / 1000;
  return `<g fill="${BRAND_BLUE}" transform="translate(${round(tx)} ${round(ty)}) scale(${round(scale)})">${PATHS.map((d) => `<path fill-rule="evenodd" d="${d}"/>`).join('')}</g>`;
};

/** Carré d'encre (rayon `radius`), logo bleu de marque : lisible sur onglet clair comme sombre. */
const iconSvg = (size, { radius = size * 0.22, ratio = 0.62 } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
  `<rect width="${size}" height="${size}" rx="${radius}" fill="${BRAND_INK}"/>${mark(size, ratio)}</svg>`;

const png = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

/** ICO « PNG embarqués » (Vista+) : en-tête, répertoire, puis les PNG bruts. */
const ico = (images) => {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
};

const findFont = () => {
  if (process.env.SOURCE_SERIF_TTF) return process.env.SOURCE_SERIF_TTF;
  const cache = execSync('yarn cache dir', { cwd: ROOT, encoding: 'utf8' }).trim();
  const found = execSync(`find "${cache}" -name SourceSerif4_600SemiBold.ttf -print -quit`, { encoding: 'utf8' }).trim();
  if (!found) throw new Error('Police Source Serif 4 600 introuvable : définir SOURCE_SERIF_TTF.');
  return found;
};

const openGraph = async () => {
  const { ImageResponse } = await import('next/dist/compiled/@vercel/og/index.node.js');
  const { createElement: h } = await import('react');
  const font = readFileSync(findFont());
  const logo = h(
    'svg',
    { width: 172 * (VW / VH), height: 172, viewBox: VIEWBOX.join(' ') },
    ...PATHS.map((d) => h('path', { key: d, d, fill: BRAND_BLUE, fillRule: 'evenodd' })),
  );
  const image = new ImageResponse(
    h(
      'div',
      { style: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, background: BRAND_INK } },
      logo,
      h('div', { style: { fontFamily: 'Source Serif 4', fontWeight: 600, fontSize: 120, letterSpacing: '-0.01em', color: '#FFFFFF' } }, 'Jàngu Bi'),
    ),
    { width: 1200, height: 630, fonts: [{ name: 'Source Serif 4', data: font, weight: 600, style: 'normal' }] },
  );
  return sharp(Buffer.from(await image.arrayBuffer())).png({ compressionLevel: 9 }).toBuffer();
};

const main = async () => {
  mkdirSync(out('public/icons'), { recursive: true });
  writeFileSync(out('src/app/icon.svg'), `${iconSvg(32, { radius: 7 })}\n`);
  const master = iconSvg(512);
  writeFileSync(out('src/app/icon1.png'), await png(master, 32));
  writeFileSync(out('public/icons/icon-192.png'), await png(master, 192));
  writeFileSync(out('public/icons/icon-512.png'), await png(master, 512));
  // Masquable : fond plein (le système découpe), logo dans la zone sûre (cercle de 80 %).
  writeFileSync(out('public/icons/maskable-512.png'), await png(iconSvg(512, { radius: 0, ratio: 0.5 }), 512));
  // Apple : carré opaque sans arrondi (iOS applique son masque).
  writeFileSync(out('src/app/apple-icon.png'), await png(iconSvg(180, { radius: 0, ratio: 0.58 }), 180));
  const sizes = [16, 32, 48];
  writeFileSync(out('src/app/favicon.ico'), ico(await Promise.all(sizes.map(async (size) => ({ size, data: await png(master, size) })))));
  writeFileSync(out('src/app/opengraph-image.png'), await openGraph());
  if (!existsSync(out('src/app/opengraph-image.alt.txt'))) writeFileSync(out('src/app/opengraph-image.alt.txt'), 'Logo de Jàngu Bi');
  console.log('Icônes et image Open Graph générées.');
};

await main();
