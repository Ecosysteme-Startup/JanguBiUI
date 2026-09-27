import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { MyDonations } from '@/features/dons/components/mes-dons/my-donations';
import { apiUrl } from '@/testing/mocks/api-url';
import { donsIds, myDonations } from '@/testing/mocks/db-dons';
import { server } from '@/testing/mocks/server';
import { navigation } from '@/testing/navigation';
import { renderApp } from '@/testing/test-utils';

const table = () => screen.findByRole('table', { name: 'Mes dons en 2026' });
const dataRows = (t: HTMLElement) =>
  within(t)
    .getAllByRole('row')
    .filter((r) => within(r).queryAllByRole('cell').length > 1);

beforeEach(() => {
  navigation.search = 'annee=2026';
});

describe('Mes dons (WEB-FID-Mes-Dons)', () => {
  it('résume l’année, visible par le seul fidèle, et liste les dons avec leur statut', async () => {
    renderApp(<MyDonations />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Mes dons' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nouveau don' })).toHaveAttribute(
      'href',
      '/app/dons',
    );
    expect(
      await screen.findByText('2026 : 38 500 FCFA, 7 dons'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('confirmés, à la paroisse Saint-Dominique'),
    ).toBeInTheDocument();
    expect(screen.getByText('Visible par vous seul.')).toBeInTheDocument();

    const t = await table();
    await waitFor(() => expect(dataRows(t)).toHaveLength(7));
    const first = dataRows(t)[0];
    expect(within(first).getByText('24 sept.')).toBeInTheDocument();
    expect(
      within(first).getByText('Quête du dimanche 27 septembre'),
    ).toBeInTheDocument();
    expect(within(first).getByText('Quête dominicale')).toBeInTheDocument();
    expect(within(first).getByText('5 000 FCFA')).toBeInTheDocument();
    expect(within(first).getByText('Confirmé')).toBeInTheDocument();

    expect(within(t).getByText('En attente')).toBeInTheDocument();
    expect(within(t).getByText('Échoué')).toBeInTheDocument();
    expect(within(t).getAllByRole('img', { name: 'Don anonyme' })).toHaveLength(
      1,
    );
    expect(
      screen.getByText('Reçus simples, ce ne sont pas des reçus fiscaux.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Pagination' }),
    ).not.toBeInTheDocument();
  });

  it('filtre par type de fonds côté client', async () => {
    const user = userEvent.setup();
    renderApp(<MyDonations />);
    const t = await table();
    await waitFor(() => expect(dataRows(t)).toHaveLength(7));

    await user.click(screen.getByRole('button', { name: 'Campagnes' }));
    expect(screen.getByRole('button', { name: 'Campagnes' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Tous' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(dataRows(t)).toHaveLength(2);
    dataRows(t).forEach((r) =>
      expect(within(r).getByText('Campagne')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: 'Quêtes' }));
    expect(dataRows(t)).toHaveLength(4);

    await user.click(screen.getByRole('button', { name: 'Contribution' }));
    expect(dataRows(t)).toHaveLength(1);
    expect(
      within(dataRows(t)[0]).getByText('Contribution annuelle 2026'),
    ).toBeInTheDocument();
  });

  it('change d’année par l’URL (?annee=)', async () => {
    const user = userEvent.setup();
    renderApp(<MyDonations />);
    await screen.findByText('2026 : 38 500 FCFA, 7 dons');

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Année' }),
      '2025',
    );
    expect(navigation.replace).toHaveBeenCalledWith(
      '/app/dons/historique?annee=2025',
    );
  });

  it('dit simplement qu’il n’y a aucun don sur une année vide', async () => {
    navigation.search = 'annee=2025';
    renderApp(<MyDonations />);

    expect(
      await screen.findByText('2025 : aucun don confirmé'),
    ).toBeInTheDocument();
    expect(await screen.findByText('Aucun don en 2025.')).toBeInTheDocument();
  });

  it('n’offre le reçu que pour un don confirmé ; le téléchargement appelle /me/dons/:id/recu/', async () => {
    const user = userEvent.setup();
    const requested: string[] = [];
    server.use(
      http.get(apiUrl('/me/dons/:donationId/recu/'), ({ params }) => {
        requested.push(String(params.donationId));
        return new HttpResponse(
          new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
          { headers: { 'Content-Type': 'application/pdf' } },
        );
      }),
    );
    const original = {
      create: URL.createObjectURL,
      revoke: URL.revokeObjectURL,
    };
    URL.createObjectURL = vi.fn(() => 'blob:recu');
    URL.revokeObjectURL = vi.fn();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    try {
      renderApp(<MyDonations />);
      const t = await table();
      await waitFor(() => expect(dataRows(t)).toHaveLength(7));

      const pending = within(dataRows(t)[1]).getByRole('button', {
        name: /^Reçu/,
      });
      expect(pending).toHaveAttribute('aria-disabled', 'true');
      expect(pending).toHaveAccessibleDescription(
        'Disponible une fois le don confirmé',
      );
      await user.click(pending);
      expect(requested).toEqual([]);

      const confirmed = within(dataRows(t)[0]).getByRole('button', {
        name: 'Reçu du don du 24 sept., Quête du dimanche 27 septembre',
      });
      expect(confirmed).not.toHaveAttribute('aria-disabled');
      await user.click(confirmed);
      await waitFor(() => expect(requested).toEqual([donsIds.donConfirme]));
      await waitFor(() => expect(click).toHaveBeenCalled());
      expect(click.mock.contexts[0]).toHaveProperty(
        'download',
        'recu-SD-2026-00147.pdf',
      );
    } finally {
      click.mockRestore();
      URL.createObjectURL = original.create;
      URL.revokeObjectURL = original.revoke;
    }
  });

  it('pagine au-delà de dix dons', async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 12 }, (_, i) => ({
      ...myDonations()[2],
      id: `e3000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
    }));
    const offsets: string[] = [];
    server.use(
      http.get(apiUrl('/me/dons/'), ({ request }) => {
        const params = new URL(request.url).searchParams;
        const offset = Number(params.get('offset') ?? 0);
        offsets.push(String(offset));
        return HttpResponse.json({
          limit: 10,
          offset,
          count: many.length,
          next: null,
          previous: null,
          results: many.slice(offset, offset + 10),
        });
      }),
    );
    renderApp(<MyDonations />);
    const t = await table();
    await waitFor(() => expect(dataRows(t)).toHaveLength(10));

    const pagination = screen.getByRole('navigation', { name: 'Pagination' });
    expect(pagination).toHaveTextContent('1 à 10 sur 12 dons');
    await user.click(
      within(pagination).getByRole('button', { name: 'Page suivante' }),
    );
    await waitFor(() => expect(dataRows(t)).toHaveLength(2));
    expect(offsets).toContain('10');
  });
});
