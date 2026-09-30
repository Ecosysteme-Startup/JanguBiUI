import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * `/connexion` et `/inscription` sont des routes qui lancent la connexion Keycloak. Préchargées
 * par `next/link` (lien visible à l'écran), elles démarraient une connexion en arrière-plan sur
 * chaque page publique (requête `auth?response_type=code…` en échec, cookies PKCE réécrits).
 */
const root = join(process.cwd(), 'src');
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : files(path);
    return name.endsWith('.tsx') ? [path] : [];
  });

describe('Liens vers la connexion', () => {
  it('aucun lien next/link vers /connexion ou /inscription n’est préchargé', () => {
    const offenders = files(root).flatMap((file) => {
      const source = readFileSync(file, 'utf8');
      const tags = source.match(/<(?:NextLink|Link)\b[^>]*?paths\.auth\.(?:connexion|inscription)[\s\S]*?>/g) ?? [];
      return tags.filter((tag) => !tag.includes('prefetch={false}')).map(() => relative(root, file));
    });
    expect(offenders).toEqual([]);
  });
});
