import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Garde-fous du poids du JS public (recette perf 04) : ces imports ont été sortis du premier
 * affichage ; un import statique les y ferait revenir sans que rien d'autre ne casse.
 */
const root = join(process.cwd(), 'src');
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : files(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });

describe('Poids du JS du premier affichage', () => {
  it('aucun module client n’importe statiquement le SDK Sentry (chargé à la demande)', () => {
    const offenders = files(root)
      .filter((file) => /^\s*import (?!type)[^;]*from '@sentry\/nextjs'/m.test(readFileSync(file, 'utf8')))
      .map((file) => relative(root, file));
    // `lib/sentry-sdk.ts` ré-exporte le SDK : il n'est atteint que par l'import dynamique.
    expect(offenders).toEqual([]);
  });

  it('l’extrait de l’Évangile de l’accueil n’embarque pas DOMPurify', () => {
    const readings = readFileSync(join(root, 'features/public-parole/utils/readings.ts'), 'utf8');
    expect(readings).not.toMatch(/dompurify/i);
  });
});
