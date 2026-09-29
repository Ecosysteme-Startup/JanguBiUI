import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import {
  activitePlateformeSeptembre,
  analyseDioceseSeptembre,
  analyseParoisseSeptembre,
} from '@/testing/mocks/handlers/dons-analyse';
import {
  getDefaultNormalizer,
  renderApp,
  screen,
  userEvent,
  within,
} from '@/testing/test-utils';

import { activitePlateformeSchema } from '../../api/get-activite-plateforme';
import { ATraiter } from '../a-traiter';
import { AnalyseDioceseVue, arrondirAgregats } from '../analyse-diocese';
import { AnalyseParoisseVue } from '../analyse-paroisse';
import { BarreDeFlux } from '../graphiques/barre-de-flux';
import { CarteGraphique } from '../graphiques/carte-graphique';
import { SantePaiementsVue } from '../sante-paiements';

const ANALYSE_URL = `${env.API_URL}/v1/staff/dons/analyse/`;

// Garde les espaces insécables (le normaliseur par défaut les réduit en espaces).
const brut = getDefaultNormalizer({ collapseWhitespace: false });

describe('ATraiter', () => {
  test('trie par échéance et affiche l’échéance de chaque élément', () => {
    renderApp(<ATraiter elements={analyseParoisseSeptembre.a_traiter} />);
    const items = screen.getAllByRole('listitem');
    expect(items.map((li) => li.getAttribute('data-a-traiter'))).toEqual([
      'paiements_en_attente',
      'quete_a_confirmer',
      'depot_especes',
      'remise_curie',
    ]);
    expect(
      within(items[0]).getByText(/Échéance : 28\u00A0sept\., 14:15/, {
        normalizer: brut,
      }),
    ).toBeInTheDocument();
    expect(
      within(items[3]).getByText(/Échéance : 4\u00A0oct\.$/, {
        normalizer: brut,
      }),
    ).toBeInTheDocument();
  });
});

describe('BarreDeFlux', () => {
  test('segments dans l’ordre reçu, parts dans le nom accessible', () => {
    renderApp(
      <BarreDeFlux
        titre="Répartition par type de fonds"
        segments={[
          {
            cle: 'a',
            libelle: 'Quête dominicale',
            valeur: 259905,
            couleur: 'var(--dv-fonds-1)',
          },
          {
            cle: 'b',
            libelle: 'Quête impérée',
            valeur: 674525,
            couleur: 'var(--dv-fonds-2)',
          },
          {
            cle: 'c',
            libelle: 'Autres',
            valeur: 0,
            couleur: 'var(--dv-fonds-5)',
          },
        ]}
      />,
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAccessibleName(
      /Quête dominicale 28\u00A0%, Quête impérée 72\u00A0%, Autres 0\u00A0%/,
    );
    // Un segment nul disparaît ; les autres gardent leur place.
    expect(img.querySelectorAll('[data-segment]')).toHaveLength(2);
  });
});

describe('CarteGraphique', () => {
  test('bascule « Graphique · Tableau »', async () => {
    renderApp(
      <CarteGraphique
        titre="Flux"
        graphique={<p>figure</p>}
        tableau={<p>table</p>}
      />,
    );
    expect(screen.getByText('figure')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tableau' }));
    expect(screen.getByText('table')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tableau' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});

describe('AnalyseParoisseVue', () => {
  test('phrase de synthèse avec un seul chiffre-titre et les montants de septembre', async () => {
    renderApp(<AnalyseParoisseVue />);
    const chiffre = await screen.findByText('1\u00A0214\u00A0830', {
      selector: '[data-chiffre-titre]',
      normalizer: brut,
    });
    expect(chiffre).toBeInTheDocument();
    expect(document.querySelectorAll('[data-chiffre-titre]')).toHaveLength(1);
    expect(
      screen.getByText(/collectés en septembre à Saint-Dominique/),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText('674\u00A0525', { normalizer: brut }).length,
    ).toBeGreaterThan(0);
    // Onglets Opérations · Analyse
    expect(screen.getByRole('link', { name: 'Analyse' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Opérations' })).toHaveAttribute(
      'href',
      '/app/dons',
    );
  });

  test('un mois sans don affiche l’état vide', async () => {
    renderApp(<AnalyseParoisseVue />);
    await screen.findByText('1\u00A0214\u00A0830', {
      selector: '[data-chiffre-titre]',
      normalizer: brut,
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Mois précédent' }),
    );
    expect(
      await screen.findByText('Aucun don sur cette période.'),
    ).toBeInTheDocument();
  });

  test('403 : vue non ouverte', async () => {
    server.use(
      http.get(ANALYSE_URL, () =>
        HttpResponse.json({ detail: 'x' }, { status: 403 }),
      ),
    );
    renderApp(<AnalyseParoisseVue />);
    expect(
      await screen.findByText("Cette vue n'est pas ouverte à votre compte."),
    ).toBeInTheDocument();
  });
});

describe('AnalyseDioceseVue', () => {
  test('arrondit au millier au-dessus de la paroisse, sans masquage', async () => {
    // Le serveur renvoie des montants non arrondis : l'écran arrondit quand même.
    server.use(
      http.get(ANALYSE_URL, () =>
        HttpResponse.json({
          ...analyseDioceseSeptembre,
          collecte: {
            ...analyseDioceseSeptembre.collecte,
            total: 1214830,
            pour_curie: 674525,
          },
          paroisses: analyseDioceseSeptembre.paroisses.map((p) =>
            p.collecte ? { ...p, collecte: 1214830 } : p,
          ),
        }),
      ),
    );
    renderApp(<AnalyseDioceseVue />);
    expect(
      await screen.findByText('1\u00A0215\u00A0000', {
        selector: '[data-chiffre-titre]',
        normalizer: brut,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/1\u00A0214\u00A0830/, { normalizer: brut }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/moins de 5 dons/i)).not.toBeInTheDocument();
    // La quête impérée reste au franc près (rapprochement).
    expect(
      screen.getAllByText('674\u00A0525', { normalizer: brut }).length,
    ).toBeGreaterThan(0);
  });

  test('paroisses par ordre alphabétique, jamais par montant', async () => {
    renderApp(<AnalyseDioceseVue />);
    const table = await screen.findByRole('table', {
      name: /Paroisses engagées/,
    });
    const noms = within(table)
      .getAllByRole('row')
      .map((r) => r.getAttribute('data-paroisse'))
      .filter(Boolean);
    expect(noms).toEqual([
      'Cathédrale Notre-Dame-des-Victoires',
      'Notre-Dame des Anges de Ouakam',
      'Saint-Dominique',
      'Saint-Joseph de Médina',
      'Sainte-Thérèse de Grand-Dakar',
    ]);
    // Seule la colonne Paroisse se trie (A→Z / Z→A), aucune autre n'est triable.
    expect(
      within(table)
        .getAllByRole('columnheader')
        .filter((th) => th.hasAttribute('aria-sort')),
    ).toHaveLength(1);
  });

  test('un seul mois : tendance indisponible', async () => {
    renderApp(<AnalyseDioceseVue />);
    expect(
      await screen.findByText(
        'Pas encore de tendance : il faut au moins 3 mois comparables.',
      ),
    ).toBeInTheDocument();
  });

  test('arrondirAgregats ne touche pas la trésorerie', () => {
    const r = arrondirAgregats({
      ...analyseDioceseSeptembre,
      compte_marchand: {
        ...analyseDioceseSeptembre.compte_marchand,
        recu: 301480,
      },
    });
    expect(r.compte_marchand.recu).toBe(301480);
  });
});

describe('SantePaiementsVue', () => {
  test('n’affiche aucun montant', async () => {
    const { container } = renderApp(<SantePaiementsVue />);
    expect(
      await screen.findByText('81', {
        selector: '[data-chiffre-titre]',
        normalizer: brut,
      }),
    ).toBeInTheDocument();
    const texte = container.textContent ?? '';
    expect(texte).not.toMatch(/FCFA|XOF/);
    expect(texte).not.toMatch(/\d{1,3}(\u00A0\d{3})+/); // aucun nombre à milliers (montant)
    expect(texte).toContain('la plateforme ne voit aucun montant');
  });

  test('le contrat refuse un montant ajouté par erreur', () => {
    const avecMontant = {
      ...activitePlateformeSeptembre,
      paiements: {
        ...activitePlateformeSeptembre.paiements,
        montant_total: 1214830,
      },
    };
    expect(
      activitePlateformeSchema.safeParse(activitePlateformeSeptembre).success,
    ).toBe(true);
    expect(activitePlateformeSchema.safeParse(avecMontant).success).toBe(false);
  });
});
