import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const config = require('../../../tailwind.config.cjs') as { theme: { fontSize: Record<string, [string, unknown]> } };

/**
 * A11Y-14 : tailles de police en rem, pour que le réglage « taille du texte » du navigateur
 * (WCAG 1.4.4) agrandisse vraiment le texte. Les tailles en px ne bougeaient pas.
 */
test('l’échelle typographique de Tailwind est en rem', () => {
  const sizes = Object.entries(config.theme.fontSize).map(([name, [size]]) => `${name}:${size}`);
  expect(sizes.filter((s) => !/:\d+(\.\d+)?rem$/.test(s))).toEqual([]);
  expect(config.theme.fontSize.meta[0]).toBe('0.75rem'); // 12 px à la taille par défaut
});

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : /\.tsx$/.test(entry) ? [full] : [];
  });

test('aucune taille de police arbitraire en px dans les composants', () => {
  const root = path.resolve(__dirname, '../..');
  const offending = walk(root).flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(/text-\[\d+(?:\.\d+)?px\]/g)].map((m) => `${path.relative(root, file)} : ${m[0]}`),
  );
  expect(offending).toEqual([]);
});
