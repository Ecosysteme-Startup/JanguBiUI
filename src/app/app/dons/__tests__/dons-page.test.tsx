import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import * as React from 'react';

import { env } from '@/config/env';
import { createUser } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

// AppShell pulls nav/notifications/theme — hors sujet pour la logique de don.
vi.mock('@/components/layouts/app-shell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => children,
}));

import DonsPage from '../page';

const MEMBERSHIPS = [
  {
    id: 1,
    church: { id: 111, name: 'Église A' },
    parish: { id: 11, name: 'Saint-Pierre' },
    diocese: { id: 1, name: 'Diocèse de Dakar' },
    is_primary: true,
  },
  {
    id: 2,
    church: { id: 211, name: 'Église B' },
    parish: { id: 21, name: 'Sainte-Anne' },
    diocese: { id: 2, name: 'Diocèse de Thiès' },
    is_primary: false,
  },
];

function mockBackend() {
  server.use(
    http.get(`${env.API_URL}/v1/me/`, () =>
      HttpResponse.json(createUser({ memberships: MEMBERSHIPS })),
    ),
    http.get(`${env.API_URL}/v1/donations/campaigns/`, () =>
      HttpResponse.json({ count: 0, results: [] }),
    ),
  );
}

describe('DonsPage — bénéficiaire & paiement (C7c)', () => {
  beforeEach(mockBackend);

  test('le bénéficiaire par défaut est l’église principale', async () => {
    renderApp(<DonsPage />);

    const beneficiary = (await screen.findByLabelText(
      'Bénéficiaire',
    )) as HTMLSelectElement;
    // Église principale = id 111 (is_primary).
    expect(beneficiary.value).toBe('111');
  });

  test('le paiement en ligne est désactivé, les espèces actives par défaut', async () => {
    renderApp(<DonsPage />);

    const method = (await screen.findByLabelText(
      'Méthode de paiement',
    )) as HTMLSelectElement;
    expect(method.value).toBe('cash');

    expect(within(method).getByRole('option', { name: /wave/i })).toBeDisabled();
    expect(
      within(method).getByRole('option', { name: /orange money/i }),
    ).toBeDisabled();
    expect(
      within(method).getByRole('option', { name: /free money/i }),
    ).toBeDisabled();
    expect(
      within(method).getByRole('option', { name: /espèces/i }),
    ).toBeEnabled();
  });

  test('le don envoie church_id (principale) + parish_id dérivé + cash', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post(`${env.API_URL}/v1/donations/donate/`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({}, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderApp(<DonsPage />);
    await screen.findByLabelText('Bénéficiaire');

    await user.type(screen.getByLabelText('Montant (XOF)'), '5000');
    await user.click(screen.getByRole('button', { name: /confirmer le don/i }));

    await waitFor(() => expect(body).not.toBeNull());
    expect(body).toMatchObject({
      church_id: 111,
      parish_id: 11,
      payment_provider: 'cash',
      amount: 5000,
    });
  });

  test('on peut choisir une autre église bénéficiaire', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post(`${env.API_URL}/v1/donations/donate/`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({}, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderApp(<DonsPage />);
    await screen.findByLabelText('Bénéficiaire');

    await user.selectOptions(screen.getByLabelText('Bénéficiaire'), '211');
    await user.type(screen.getByLabelText('Montant (XOF)'), '3000');
    await user.click(screen.getByRole('button', { name: /confirmer le don/i }));

    await waitFor(() => expect(body).not.toBeNull());
    expect(body).toMatchObject({ church_id: 211, parish_id: 21 });
  });
});
