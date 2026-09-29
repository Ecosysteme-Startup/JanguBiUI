import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import Page from '@/app/espace/[nodeId]/quetes-imperees/page';
import { QuetesImpereesPage } from '@/features/dons/components/diocese/quetes-imperees-page';
import type { ImpereeCreateBody } from '@/features/dons/api/imperees';
import { apiUrl } from '@/testing/mocks/api-url';
import { ids } from '@/testing/mocks/db';
import {
  donsIds,
  grantsEconome,
  grantsEconomeDiocesain,
  imperees,
} from '@/testing/mocks/db-dons';
import { server } from '@/testing/mocks/server';
import { navigation } from '@/testing/navigation';
import { renderApp } from '@/testing/test-utils';

const BRIN = 'Quête impérée pour le Grand Séminaire de Brin';

const quete = (name: RegExp) => screen.getByRole('button', { name });

describe('Quêtes impérées (diocèse)', () => {
  it('liste les quêtes et suit par défaut la première ouverte, en agrégats seulement', async () => {
    renderApp(<QuetesImpereesPage nodeId={ids.dakar} />, {
      capacites: grantsEconomeDiocesain,
    });

    const list = await screen.findByRole('list', { name: 'Quêtes impérées' });
    expect(within(list).getAllByRole('button')).toHaveLength(3);
    expect(screen.getByText('3 quêtes')).toBeInTheDocument();
    expect(quete(/grand séminaire de brin/i)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(quete(/grand séminaire de brin/i)).toHaveTextContent(
      /Du 27 sept\. au 4 oct\. · ARCH-DAK-2026-052.*En cours.*674 525 FCFA/,
    );
    expect(quete(/missions/i)).toHaveTextContent('À venir');
    expect(quete(/carême de partage/i)).toHaveTextContent('Close');

    const follow = await screen.findByRole('table', {
      name: `Suivi de ${BRIN}, par paroisse`,
    });
    const sd = within(follow).getByRole('row', { name: /saint-dominique/i });
    expect(sd).toHaveTextContent(/21 000\s*653 525\s*10\s*674 525 FCFA/);
    const closed = within(follow).getAllByText(
      'Collecte non ouverte sur Jàngu Bi',
    );
    expect(closed).toHaveLength(4);
    expect(
      within(follow).getByRole('row', { name: /sacré-cœur/i }),
    ).not.toHaveTextContent(/FCFA/);
    expect(
      screen.getByText(/aucune donnée nominative à ce niveau/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: `${BRIN}, par paroisse` }),
    ).toBeInTheDocument();
  });

  it('change de quête suivie et l’inscrit dans l’URL', async () => {
    const user = userEvent.setup();
    renderApp(<QuetesImpereesPage nodeId={ids.dakar} />, {
      capacites: grantsEconomeDiocesain,
    });

    await user.click(
      await screen.findByRole('button', {
        name: /journée mondiale des missions/i,
      }),
    );

    expect(quete(/missions/i)).toHaveAttribute('aria-pressed', 'true');
    expect(quete(/grand séminaire de brin/i)).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(navigation.replace).toHaveBeenLastCalledWith(
      `/espace/${ids.dakar}/quetes-imperees?quete=${donsIds.missions}`,
      { scroll: false },
    );
    expect(
      await screen.findByRole('heading', {
        name: 'Journée mondiale des Missions, par paroisse',
      }),
    ).toBeInTheDocument();
  });

  it('ouvre la quête désignée par ?quete=', async () => {
    navigation.search = `quete=${donsIds.careme}`;
    renderApp(<QuetesImpereesPage nodeId={ids.dakar} />, {
      capacites: grantsEconomeDiocesain,
    });

    expect(
      await screen.findByRole('button', { name: /carême de partage/i }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      await screen.findByRole('heading', {
        name: 'Carême de partage 2026, par paroisse',
      }),
    ).toBeInTheDocument();
  });

  it('publie une quête impérée avec un corps conforme au contrat', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post(apiUrl('/staff/dons/quetes-imperees/'), async ({ request }) => {
        const body = (await request.json()) as ImpereeCreateBody;
        bodies.push(body);
        return HttpResponse.json(
          {
            ...imperees()[1],
            ...body,
            id: 'd0000000-0000-4000-8000-000000000098',
            status: 'ouvert',
            raised: 0,
          },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();
    renderApp(<QuetesImpereesPage nodeId={ids.dakar} />, {
      capacites: grantsEconomeDiocesain,
    });
    const panel = await screen.findByRole('complementary', {
      name: 'Définir une quête impérée',
    });

    await user.click(within(panel).getByRole('button', { name: 'Publier' }));
    expect(
      await within(panel).findByText('Indiquez l’objet de la quête.'),
    ).toBeInTheDocument();
    expect(
      within(panel).getByText('Indiquez la date de la quête.'),
    ).toBeInTheDocument();
    expect(
      within(panel).getByText('Indiquez la référence de la décision.'),
    ).toBeInTheDocument();
    expect(bodies).toHaveLength(0);

    expect(
      within(panel).getByText(
        'Toutes les paroisses où la collecte est ouverte',
      ),
    ).toBeInTheDocument();
    await user.type(
      within(panel).getByLabelText(/^objet/i),
      'Quête pour les prêtres âgés et malades',
    );
    await user.type(
      within(panel).getByLabelText(/date de la quête/i),
      '2026-11-22',
    );
    await user.type(
      within(panel).getByLabelText(/fin de collecte/i),
      '2026-11-15',
    );
    await user.type(
      within(panel).getByLabelText(/référence de la décision/i),
      'ARCH-DAK-2026-052',
    );
    expect(within(panel).getByText(/aperçu/i)).toHaveTextContent(
      'ARCH-DAK-2026-052',
    );
    await user.click(within(panel).getByRole('button', { name: 'Publier' }));
    expect(
      await within(panel).findByText(
        'La fin de collecte doit suivre la date de la quête.',
      ),
    ).toBeInTheDocument();
    expect(bodies).toHaveLength(0);

    await user.clear(within(panel).getByLabelText(/fin de collecte/i));
    await user.type(
      within(panel).getByLabelText(/fin de collecte/i),
      '2026-11-29',
    );
    await user.click(within(panel).getByRole('button', { name: 'Publier' }));

    await waitFor(() => expect(bodies).toHaveLength(1));
    const expected: ImpereeCreateBody = {
      node: ids.dakar,
      title: 'Quête pour les prêtres âgés et malades',
      description: '',
      starts_on: '2026-11-22',
      ends_on: '2026-11-29',
      authorization_ref: 'ARCH-DAK-2026-052',
    };
    expect(bodies[0]).toEqual(expected);
    await waitFor(() =>
      expect(within(panel).getByLabelText(/^objet/i)).toHaveValue(''),
    );
    expect(navigation.replace).toHaveBeenLastCalledWith(
      `/espace/${ids.dakar}/quetes-imperees?quete=d0000000-0000-4000-8000-000000000098`,
      { scroll: false },
    );
  });

  it('ferme et rouvre le panneau de définition', async () => {
    const user = userEvent.setup();
    renderApp(<QuetesImpereesPage nodeId={ids.dakar} />, {
      capacites: grantsEconomeDiocesain,
    });

    await user.click(
      await screen.findByRole('button', { name: 'Fermer le panneau' }),
    );
    expect(
      screen.queryByRole('complementary', {
        name: 'Définir une quête impérée',
      }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Définir une quête impérée' }),
    );
    expect(
      screen.getByRole('complementary', { name: 'Définir une quête impérée' }),
    ).toBeInTheDocument();
  });

  it('montre les reversements reçus et leur rapprochement', async () => {
    renderApp(<QuetesImpereesPage nodeId={ids.dakar} />, {
      capacites: grantsEconomeDiocesain,
    });

    const table = await screen.findByRole('table', {
      name: 'Reversements reçus',
    });
    expect(
      within(table).getByRole('row', { name: /PO-2026-0925/ }),
    ).toHaveTextContent(/Vendredi 25 sept\.\s*154 840 FCFA\s*Rapproché/);
    const ecart = within(table).getByRole('row', { name: /PO-2026-0914/ });
    expect(ecart).toHaveTextContent(/Écart de 2 940 FCFA/);
    expect(within(ecart).getByText('Écart')).toBeInTheDocument();
    expect(
      within(table).getByRole('row', { name: /total reçu en septembre/i }),
    ).toHaveTextContent('301 480 FCFA');
  });

  it('réserve l’écran à dons.definir_quete_imperee', async () => {
    renderApp(await Page({ params: Promise.resolve({ nodeId: ids.dakar }) }), {
      capacites: grantsEconome,
    });
    expect(
      await screen.findByText('Cette page ne vous est pas ouverte'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Quêtes impérées' }),
    ).not.toBeInTheDocument();
  });
});
