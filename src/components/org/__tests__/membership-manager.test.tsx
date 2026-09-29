import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createUser } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp, screen, waitFor, within } from '@/testing/test-utils';

import { MembershipManager } from '../membership-manager';

beforeAll(() => {
  // jsdom n'implémente pas ces méthodes pointer (Radix Select en a besoin).
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.releasePointerCapture = vi.fn();
});

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

function mockMe() {
  server.use(
    http.get(`${env.API_URL}/v1/me/`, () =>
      HttpResponse.json(createUser({ memberships: MEMBERSHIPS })),
    ),
  );
}

describe('MembershipManager', () => {
  beforeEach(mockMe);

  test('liste les appartenances avec la principale', async () => {
    renderApp(<MembershipManager />);

    await screen.findByText('Église A');
    expect(screen.getByText('Église B')).toBeInTheDocument();
    const itemA = screen.getByText('Église A').closest('li') as HTMLElement;
    expect(within(itemA).getByText('Principale')).toBeInTheDocument();
  });

  test('désigne une appartenance comme principale (PATCH set-primary)', async () => {
    let patched = '';
    server.use(
      http.patch(
        `${env.API_URL}/v1/users/me/memberships/:id/set-primary/`,
        ({ params }) => {
          patched = String(params.id);
          return HttpResponse.json({});
        },
      ),
    );

    renderApp(<MembershipManager />);
    const itemB = (await screen.findByText('Église B')).closest('li') as HTMLElement;
    await userEvent.click(
      within(itemB).getByRole('button', { name: /définir principale/i }),
    );

    await waitFor(() => expect(patched).toBe('2'));
  });

  test('retire une appartenance (DELETE)', async () => {
    let deleted = '';
    server.use(
      http.delete(`${env.API_URL}/v1/users/me/memberships/:id/`, ({ params }) => {
        deleted = String(params.id);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderApp(<MembershipManager />);
    const itemB = (await screen.findByText('Église B')).closest('li') as HTMLElement;
    await userEvent.click(
      within(itemB).getByRole('button', { name: /retirer église b/i }),
    );

    await waitFor(() => expect(deleted).toBe('2'));
  });

  test('ajoute une église via la cascade (POST /me/memberships)', async () => {
    // Holder objet : évite que la CFA TS ne réduise `body` à `null`
    // (l'affectation a lieu dans la closure du handler MSW).
    const captured: { body: { church_ids?: number[] } | null } = { body: null };
    server.use(
      http.get(`${env.API_URL}/v1/org/dioceses/`, () =>
        HttpResponse.json({
          results: [{ id: 9, name: 'Diocèse de Kaolack', code: 'KL', province: 1 }],
        }),
      ),
      http.get(`${env.API_URL}/v1/org/parishes/`, () =>
        HttpResponse.json({
          results: [{ id: 99, name: 'Cathédrale', city: 'Kaolack', address: '', diocese_id: 9 }],
        }),
      ),
      http.get(`${env.API_URL}/v1/org/churches/`, () =>
        HttpResponse.json({
          results: [{ id: 999, name: 'Église C', is_main: true, city: 'Kaolack', is_active: true, parish: 99, parish_name: 'Cathédrale' }],
        }),
      ),
      http.post(`${env.API_URL}/v1/users/me/memberships/`, async ({ request }) => {
        captured.body = (await request.json()) as { church_ids: number[] };
        return HttpResponse.json([], { status: 201 });
      }),
    );

    renderApp(<MembershipManager />);
    await screen.findByRole('list', { name: /mes appartenances/i });

    await userEvent.click(
      screen.getByRole('button', { name: /ajouter une église/i }),
    );
    await userEvent.click(screen.getByLabelText('Diocèse'));
    await userEvent.click(await screen.findByRole('option', { name: /Kaolack/ }));
    await userEvent.click(screen.getByLabelText('Paroisse'));
    await userEvent.click(await screen.findByRole('option', { name: /Cathédrale/ }));
    await userEvent.click(screen.getByLabelText('Église'));
    await userEvent.click(await screen.findByRole('option', { name: /Église C/ }));
    await userEvent.click(
      screen.getByRole('button', { name: /ajouter cette église/i }),
    );
    await userEvent.click(screen.getByRole('button', { name: /^ajouter$/i }));

    await screen.findByText(/Église A/); // flush
    expect(captured.body?.church_ids).toEqual([999]);
  });
});
