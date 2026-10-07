import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import DonsPage from '@/app/espace/[nodeId]/dons/page';
import { apiUrl } from '@/testing/mocks/api-url';
import { ids } from '@/testing/mocks/db';
import {
  grantsEconome,
  grantsSecretaireDons,
  operations,
} from '@/testing/mocks/db-dons';
import { server } from '@/testing/mocks/server';
import { navigation } from '@/testing/navigation';
import { renderApp } from '@/testing/test-utils';

const nodeId = ids.saintDominique;

const renderPage = async (capacites = grantsEconome) =>
  renderApp(await DonsPage({ params: Promise.resolve({ nodeId }) }), {
    capacites,
  });

beforeEach(() => {
  navigation.search = 'mois=2026-09';
  navigation.replace.mockClear();
});

describe('Dons et quêtes, paroisse (WEB-PAR-Dons)', () => {
  it('résume le mois en texte, sans cartes de chiffres', async () => {
    await renderPage();

    const synthese = await screen.findByRole('region', {
      name: 'Synthèse du mois',
    });
    expect(synthese).toHaveTextContent(
      /1\s214\s830\sFCFA affectés en septembre \(par date de messe\), dont 356\s330 en ligne et 858\s500 en espèces\./,
    );
    expect(synthese).toHaveTextContent(/Frais de paiement\s:\s7\s120\sFCFA/);
    expect(
      within(synthese).getByText(/3 paiements en attente de confirmation/),
    ).toBeInTheDocument();
    expect(
      within(synthese).getByText(/1 quête en espèces à valider/),
    ).toBeInTheDocument();
    expect(
      within(synthese).getByRole('link', { name: /Valider/ }),
    ).toHaveAttribute('href', `/espace/${nodeId}/dons/quetes`);
  });

  it('trace une barre par dimanche et détaille fonds, moyens et opérations', async () => {
    await renderPage();

    const chart = await screen.findByRole('img', {
      name: /Montants affectés par dimanche, septembre 2026/,
    });
    expect(chart).toHaveAccessibleName(/dim\. 27 sept\. : 617\s525\sFCFA/);

    const moyens = screen.getByRole('region', { name: 'Par moyen' });
    expect(within(moyens).getByText('Wave')).toBeInTheDocument();
    expect(
      within(moyens).getByText(/9 quêtes saisies · 71\s%/),
    ).toBeInTheDocument();

    const fonds = screen.getByRole('region', { name: 'Par fonds' });
    expect(
      await within(fonds).findByRole('link', {
        name: 'Toiture de la chapelle de la Cité universitaire',
      }),
    ).toHaveAttribute(
      'href',
      `/espace/${nodeId}/dons/campagnes/d0000000-0000-4000-8000-000000000003`,
    );
    expect(
      within(fonds).getByText(/1\s186\s400\sFCFA sur 4,5\sM/),
    ).toBeInTheDocument();

    const ops = await screen.findByRole('region', {
      name: 'Dernières opérations',
    });
    expect(await within(ops).findByText('Élisabeth Gomis')).toBeInTheDocument();
    expect(within(ops).getAllByRole('row')).toHaveLength(11);
    expect(
      within(ops).getByText(
        'Les noms ne sont visibles que du curé et de l’économe. Un don anonyme reste anonyme pour tous.',
      ),
    ).toBeInTheDocument();

    expect(
      await screen.findByText(/Montant net des paiements en ligne validés en septembre \(par date de validation\)/),
    ).toHaveTextContent(/349\s210\sFCFA, dont 301\s480 déjà reversés/);
  });

  it('change de mois par l’URL', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.selectOptions(
      await screen.findByLabelText('Mois affiché'),
      '2026-08',
    );

    expect(navigation.replace).toHaveBeenCalledWith(
      `/espace/${nodeId}/dons?mois=2026-08`,
    );
  });

  it('rembourse un don en ligne confirmé après confirmation', async () => {
    const user = userEvent.setup();
    let refunded: string | null = null;
    server.use(
      http.post(
        apiUrl('/staff/dons/operations/:id/rembourser/'),
        async ({ params, request }) => {
          refunded = `${String(params.id)}:${((await request.json()) as { note: string }).note}`;
          return HttpResponse.json({ ...operations()[1], status: 'rembourse' });
        },
      ),
    );
    await renderPage();

    const ops = await screen.findByRole('region', {
      name: 'Dernières opérations',
    });
    const buttons = await within(ops).findAllByRole('button', {
      name: /^Actions sur le don/,
    });
    // Seuls les dons en ligne confirmés sont remboursables (ni espèces, ni en attente, ni échoué).
    expect(buttons).toHaveLength(3);
    await user.click(
      within(ops).getByRole('button', { name: /Actions sur le don 5102/ }),
    );
    await user.click(await screen.findByRole('menuitem', { name: 'Rembourser le don' }));

    const dialog = await screen.findByRole('dialog', {
      name: 'Rembourser ce don ?',
    });
    await user.type(within(dialog).getByLabelText(/Motif/), 'Don en double');
    await user.click(
      within(dialog).getByRole('button', { name: 'Rembourser' }),
    );

    await vi.waitFor(() =>
      expect(refunded).toBe(
        'e2000000-0000-4000-8000-000000000002:Don en double',
      ),
    );
    await vi.waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('masque les actions de gestion à la secrétaire', async () => {
    await renderPage(grantsSecretaireDons);

    expect(
      await screen.findByRole('link', { name: /Saisir une quête/ }),
    ).toBeInTheDocument();
    const ops = await screen.findByRole('region', {
      name: 'Dernières opérations',
    });
    await within(ops).findByText('Élisabeth Gomis');
    expect(
      screen.queryByRole('link', { name: /Nouvelle campagne/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Créer une campagne' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Exporter et rapprocher/ }),
    ).not.toBeInTheDocument();
    expect(
      within(ops).queryByRole('button', { name: /Actions sur le don/ }),
    ).not.toBeInTheDocument();
  });

  it('affiche un refus propre quand le serveur répond 403', async () => {
    server.use(
      http.get(apiUrl('/staff/dons/synthese/'), () =>
        HttpResponse.json(
          {
            error: {
              code: 'permission_denied',
              message: 'Accès refusé.',
              details: {},
            },
          },
          { status: 403 },
        ),
      ),
    );
    await renderPage();

    expect(
      await screen.findByText('Dons et quêtes : accès réservé'),
    ).toBeInTheDocument();
  });

  it('refuse l’écran sans capacité dons', async () => {
    await renderPage([]);

    expect(
      await screen.findByText('Dons et quêtes : accès réservé'),
    ).toBeInTheDocument();
  });
});
