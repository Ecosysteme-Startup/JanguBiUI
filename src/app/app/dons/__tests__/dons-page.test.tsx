import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import * as React from 'react';

import { env } from '@/config/env';
import { ouvrirPaiement } from '@/features/dons/utils/paiement';
import { FONDS_CAMPAGNE, FONDS_QUETE } from '@/testing/mocks/handlers/dons';
import {
  PAROISSES,
  resetParoissesMocks,
} from '@/testing/mocks/handlers/paroisses';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

// AppShell pulls nav/notifications/theme — hors sujet pour la logique de don.
vi.mock('@/components/layouts/app-shell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => children,
}));
// La redirection vers l'agrégateur quitte l'application : simulée.
vi.mock('@/features/dons/utils/paiement', () => ({ ouvrirPaiement: vi.fn() }));

import DonsPage from '../page';

describe('DonsPage — dons du fidèle sur les routes V1', () => {
  beforeEach(() => resetParoissesMocks());

  test('page de don de la paroisse principale : fonds, montants, mention', async () => {
    renderApp(<DonsPage />);

    expect(
      await screen.findByRole('button', { name: /Réfection de la toiture/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Quête du dimanche 27 septembre/ }),
    ).toBeInTheDocument();
    // Montant réuni / objectif en FCFA (espaces insécables).
    expect(
      screen.getByText(/^1\s214\s830\sFCFA réunis sur 3\s000\s000\sFCFA$/),
    ).toBeInTheDocument();
    expect(screen.getByText(/ARCH-DK-2026-014/)).toBeInTheDocument();
    // Aucun choix de moyen de paiement dans l'application.
    expect(screen.queryByLabelText(/méthode de paiement/i)).toBeNull();
  });

  test('checkout : fund_id, montant, frais, clé d’idempotence, puis paiement', async () => {
    const captured: { body: unknown; cle: string | null } = {
      body: null,
      cle: null,
    };
    server.use(
      http.post(`${env.API_URL}/v1/dons/checkout/`, async ({ request }) => {
        captured.body = await request.json();
        captured.cle = request.headers.get('Idempotency-Key');
        return HttpResponse.json(
          {
            donation_id: '9a3f6c10-5b2e-4d8a-8f41-3c7e2a1b0d99',
            reference: 'DON-2026-000431',
            status: 'initie',
            checkout_url: 'https://paiement.exemple.sn/checkout/x',
            amount: 5000,
            fee_amount: 100,
            charged_amount: 5100,
            net_amount: 5000,
          },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup();
    renderApp(<DonsPage />);

    await user.click(
      await screen.findByRole('button', { name: /Réfection de la toiture/ }),
    );
    await user.click(screen.getByRole('button', { name: /^5\s000/ }));
    await user.click(screen.getByLabelText(/frais de paiement/i));
    await user.click(
      screen.getByRole('button', { name: /continuer vers le paiement/i }),
    );

    await waitFor(() =>
      expect(captured.body).toEqual({
        fund_id: FONDS_CAMPAGNE,
        amount: 5000,
        fees_covered: true,
        anonymous: false,
        source: 'web',
      }),
    );
    expect(captured.cle).toBeTruthy();
    await waitFor(() =>
      expect(ouvrirPaiement).toHaveBeenCalledWith(
        'https://paiement.exemple.sn/checkout/x',
      ),
    );
  });

  test('montant hors bornes : message et bouton désactivé', async () => {
    const user = userEvent.setup();
    renderApp(<DonsPage />);

    await user.click(
      await screen.findByRole('button', { name: /Quête du dimanche/ }),
    );
    await user.type(screen.getByLabelText('Montant (FCFA)'), '100');
    expect(await screen.findByRole('alert')).toHaveTextContent(/de 200\sFCFA/);
    expect(
      screen.getByRole('button', { name: /continuer vers le paiement/i }),
    ).toBeDisabled();
    expect(FONDS_QUETE).toBeTruthy();
  });

  test('paroisse sans collecte ouverte : message sobre', async () => {
    const user = userEvent.setup();
    renderApp(<DonsPage />);

    const select = await screen.findByLabelText('Paroisse');
    await user.selectOptions(select, PAROISSES.cathedrale.id);
    expect(
      await screen.findByText(/pas encore ouvert pour cette paroisse/i),
    ).toBeInTheDocument();
  });

  test('mes dons : total de l’année, liste et reçu du don confirmé', async () => {
    const user = userEvent.setup();
    renderApp(<DonsPage />);

    await user.click(await screen.findByRole('tab', { name: 'Mes dons' }));

    expect(
      await screen.findByText(/^10\s000\sFCFA$/, { selector: 'p' }),
    ).toBeInTheDocument();
    const liste = await screen.findByRole('list', { name: 'Mes dons' });
    expect(within(liste).getAllByRole('listitem')).toHaveLength(2);
    // Reçu seulement pour le don confirmé.
    expect(
      within(liste).getAllByRole('button', { name: /reçu/i }),
    ).toHaveLength(1);
    expect(within(liste).getByText('Non abouti')).toBeInTheDocument();
  });
});
