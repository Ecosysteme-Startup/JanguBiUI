/**
 * CLI du harnais visuel (sans le lanceur de tests) :
 *
 *   KC_DEMO_PASSWORD=… npx tsx e2e/visuel/capture.ts WEB-FID-Parole,WEB-Erreur-404
 *   KC_DEMO_PASSWORD=… npx tsx e2e/visuel/capture.ts --route /app/parole --compte fidele --maquette WEB-FID-Parole [--nom X] [--theme sombre]
 *
 * Sortie : e2e/visuel/resultats/<maquette ou nom>/{app,maquette,comparaison}-{clair,sombre}.png + rapport.json
 */
import { chromium } from '@playwright/test';

import { type Compte, type Ecran, select } from './ecrans';
import { compare, type Theme } from './lib';

const args = process.argv.slice(2);
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const route = opt('route');
const ecrans: Ecran[] = route
  ? [{ maquette: opt('maquette') ?? 'ad-hoc', route, compte: (opt('compte') ?? 'public') as Compte, nom: opt('nom') }]
  : select(args.find((a) => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--')));
const themes: Theme[] = opt('theme') ? [opt('theme') as Theme] : ['clair', 'sombre'];

const browser = await chromium.launch();
let failures = 0;
for (const ecran of ecrans) {
  try {
    const rapport = await compare(browser, ecran, themes);
    const pct = (t: Theme) => {
      const r = (rapport[t] as { differences: number | null } | undefined)?.differences;
      return r == null ? '—' : `${(r * 100).toFixed(1)} %`;
    };
    console.log(`${ecran.nom ?? ecran.maquette} : clair ${pct('clair')}, sombre ${pct('sombre')}`);
  } catch (error) {
    failures += 1;
    console.error(`${ecran.nom ?? ecran.maquette} : ÉCHEC — ${(error as Error).message}`);
  }
}
await browser.close();
process.exit(failures ? 1 : 0);
