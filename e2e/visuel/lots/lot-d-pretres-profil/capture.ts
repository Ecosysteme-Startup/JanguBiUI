/**
 * Captures du lot D (prêtres, messagerie, confession, profil) avec le harnais commun.
 * Ajoute le compte `vicaire` (prêtre, TOTP) propre à ce lot, sans toucher au registre partagé.
 *
 *   KC_DEMO_PASSWORD=… npx tsx e2e/visuel/lots/lot-d-pretres-profil/capture.ts [Pretres,Profil] [--theme clair] [--mobile]
 */
import { chromium } from '@playwright/test';

import { COMPTES, type Compte, type Ecran } from '../../ecrans';
import { compare, type Theme } from '../../lib';

(COMPTES as Record<string, { email: string; entry: string }>).vicaire = { email: 'vicaire@demo.jangubi.sn', entry: '/espace' };

const LOT = 'lot-d-pretres-profil';
const args = process.argv.slice(2);
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const mobile = args.includes('--mobile');
const filtre = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--')) ?? '';

const ECRANS: Ecran[] = [
  { maquette: 'WEB-FID-Pretres', route: '/app/pretres', compte: 'fidele' },
  {
    maquette: 'WEB-FID-Conversation',
    route: '/app/pretres/conversations/{conversation}',
    compte: 'fidele',
    trous: { conversation: { depuis: '/app/pretres?vue=conversations', motif: '^/app/pretres/conversations/([^/?#]+)$' } },
  },
  { maquette: 'WEB-FID-Confession-RDV', route: '/app/confession', compte: 'fidele' },
  { maquette: 'WEB-FID-Profil', route: '/app/profil', compte: 'fidele' },
  { maquette: 'WEB-PAR-Messagerie', route: '/espace/{node}/messagerie', compte: 'vicaire' as Compte },
];

const parts = filtre.split(',').filter(Boolean);
const selected = ECRANS.filter((e) => !parts.length || parts.some((p) => e.maquette.includes(p))).map((e) => ({
  ...e,
  nom: `${LOT}/${e.maquette.replace('WEB-', '')}${mobile ? '-375' : ''}`,
  ...(mobile ? { viewport: { width: 375, height: 812 } } : {}),
}));
const themes: Theme[] = opt('theme') ? [opt('theme') as Theme] : ['clair', 'sombre'];

const browser = await chromium.launch();
let failures = 0;
for (const ecran of selected) {
  try {
    const rapport = await compare(browser, ecran, themes);
    const pct = (t: Theme) => {
      const r = (rapport[t] as { differences: number | null } | undefined)?.differences;
      return r == null ? '—' : `${(r * 100).toFixed(1)} %`;
    };
    console.log(`${ecran.nom} : clair ${pct('clair')}, sombre ${pct('sombre')}`);
  } catch (error) {
    failures += 1;
    console.error(`${ecran.nom} : ÉCHEC — ${(error as Error).message}`);
  }
}
await browser.close();
process.exit(failures ? 1 : 0);
