import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * Contrastes des paires de tokens (WCAG 1.4.3, 4,5:1) dans les 4 palettes × clair/sombre.
 * jsdom ne calcule pas les couleurs rendues : on lit donc `tokens.css` et on vérifie
 * (1) les paires posées sur des surfaces héritées (pied de page nuit, créneau choisi…),
 * (2) toute classe qui combine `bg-<token>` et `text-<token>` dans le code (recette A11Y-02 à 04).
 */
const ROOT = path.resolve(__dirname, '../..');
const css = readFileSync(path.join(ROOT, 'styles/tokens.css'), 'utf8');

const themes = new Map<string, Record<string, string>>();
for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
  const name = selector.trim().split(',').pop()!.trim();
  themes.set(name, Object.fromEntries([...body.matchAll(/--jb-([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]])));
}

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const failures = (fg: string, bg: string) =>
  [...themes].flatMap(([name, t]) => {
    const r = ratio(t[fg], t[bg]);
    return r < 4.5 ? [`${fg} sur ${bg} dans ${name} : ${r.toFixed(2)}:1`] : [];
  });

test('tokens.css définit les 8 thèmes (4 palettes × clair/sombre)', () => {
  expect(themes.size).toBe(8);
});

test.each([
  ['on-night-muted', 'night'], // pied de page public, panneau d'authentification (A11Y-03)
  ['on-night-muted', 'night-2'],
  ['on-night', 'night'],
  ['on-primary', 'primary-fill'], // créneau sélectionné (A11Y-04)
  ['on-primary', 'primary-fill-hover'],
  ['primary-strong', 'tint-100'], // initiales d'avatar (A11Y-02)
  ['tint-200', 'ink'], // icône des notifications (fond ink, bascule avec le thème)
  ['paper', 'ink'],
])('%s sur %s passe 4,5:1 dans tous les thèmes', (fg, bg) => {
  expect(failures(fg, bg)).toEqual([]);
});

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return entry === '__tests__' ? [] : walk(full);
    return /\.tsx$/.test(entry) && !entry.includes('.stories.') ? [full] : [];
  });

test('aucune classe du code ne combine un fond et un texte de tokens sous 4,5:1', () => {
  const tokens = new Set(Object.keys(themes.values().next().value!));
  const found: string[] = [];
  for (const file of walk(ROOT)) {
    for (const [literal] of readFileSync(file, 'utf8').matchAll(/'[^'\n]*'|"[^"\n]*"|`[^`]*`/g)) {
      const bgs = [...literal.matchAll(/(?<![\w:-])bg-([\w-]+?)(?:\/\d+)?(?=[\s'"`]|$)/g)].map((m) => m[1]).filter((b) => tokens.has(b));
      const texts = [...literal.matchAll(/(?<![\w:-])text-([\w-]+)(?=[\s'"`]|$)/g)].map((m) => m[1]).filter((t) => tokens.has(t));
      for (const bg of bgs) for (const fg of texts) found.push(...failures(fg, bg).map((f) => `${path.relative(ROOT, file)} — ${f}`));
    }
  }
  expect(found).toEqual([]);
});
