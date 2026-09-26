import { test } from '@playwright/test';

import { type Compte, type Ecran, select } from './ecrans';
import { compare, type Theme } from './lib';

/**
 * Un test par écran : captures clair et sombre + planches comparatives dans e2e/visuel/resultats/.
 * Sélection : VISUEL_ECRANS (filtres séparés par des virgules) ou écran ad hoc
 * (VISUEL_ROUTE + VISUEL_COMPTE + VISUEL_MAQUETTE). Thème : VISUEL_THEME=clair|sombre (défaut : les deux).
 */
const adHoc: Ecran | undefined = process.env.VISUEL_ROUTE
  ? {
      maquette: process.env.VISUEL_MAQUETTE ?? 'ad-hoc',
      route: process.env.VISUEL_ROUTE,
      compte: (process.env.VISUEL_COMPTE ?? 'public') as Compte,
      nom: process.env.VISUEL_NOM,
    }
  : undefined;

const ecrans = adHoc ? [adHoc] : select(process.env.VISUEL_ECRANS);
const themes: Theme[] = process.env.VISUEL_THEME ? [process.env.VISUEL_THEME as Theme] : ['clair', 'sombre'];

for (const ecran of ecrans) {
  test(`${ecran.nom ?? ecran.maquette} (${ecran.compte})`, async ({ browser }) => {
    const rapport = await compare(browser, ecran, themes);
    test.info().annotations.push({ type: 'rapport', description: JSON.stringify(rapport) });
  });
}
