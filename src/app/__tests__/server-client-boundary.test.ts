import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { parseReferentielTab } from '@/features/referentiels/utils/tabs';

/**
 * A11Y-01 : un composant serveur qui importe une VALEUR (constante, fonction) d'un module
 * « use client » ne reçoit qu'une référence client ; `REFERENTIEL_TABS.includes` plantait
 * `/plateforme/referentiels`. Seuls les composants (PascalCase) franchissent la frontière.
 */
const SRC = path.resolve(__dirname, '../..');
const isClient = (source: string) => /^\s*['"]use client['"]/.test(source);

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return entry === '__tests__' ? [] : walk(full);
    return /\.tsx?$/.test(entry) ? [full] : [];
  });

const resolve = (spec: string, from: string) => {
  const base = spec.startsWith('@/') ? path.join(SRC, spec.slice(2)) : spec.startsWith('.') ? path.resolve(path.dirname(from), spec) : null;
  if (!base) return null;
  return ['.tsx', '.ts', '/index.tsx', '/index.ts'].map((ext) => base + ext).find((f) => existsSync(f)) ?? null;
};

test("aucune page serveur n'importe une valeur non composant depuis un module client", () => {
  const offending: string[] = [];
  for (const file of walk(path.join(SRC, 'app'))) {
    const source = readFileSync(file, 'utf8');
    if (isClient(source)) continue;
    for (const [statement, names, spec] of source.matchAll(/import\s+\{([^}]*)\}\s+from\s+'([^']+)'/g)) {
      const target = resolve(spec, file);
      if (statement.startsWith('import type') || !target || !isClient(readFileSync(target, 'utf8'))) continue;
      const values = names
        .split(',')
        .map((n) => n.trim())
        .filter((n) => n && !n.startsWith('type '))
        .map((n) => n.split(/\s+as\s+/)[0]);
      for (const name of values) if (!/^[A-Z][a-z]/.test(name)) offending.push(`${path.relative(SRC, file)} : ${name} (${spec})`);
    }
  }
  expect(offending).toEqual([]);
});

test('parseReferentielTab garde un onglet connu et retombe sur « offices » sinon', () => {
  expect(parseReferentielTab('retraits')).toBe('retraits');
  expect(parseReferentielTab('inconnu')).toBe('offices');
  expect(parseReferentielTab(undefined)).toBe('offices');
});

test('le module des onglets reste neutre (sans « use client »)', () => {
  expect(isClient(readFileSync(path.join(SRC, 'features/referentiels/utils/tabs.ts'), 'utf8'))).toBe(false);
});
