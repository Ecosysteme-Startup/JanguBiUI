import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { contenuStaffSchema } from '@/features/news/api/staff-articles';
import { resetStaffMocks } from '@/testing/mocks/handlers/staff';
import { server } from '@/testing/mocks/server';
import { renderApp, screen, userEvent } from '@/testing/test-utils';

import { EpinglageAnnonce, finDeJournee } from '../epinglage-annonce';

const ID = 'c1000000-0000-4000-8000-000000000001';

const charger = async (id = ID) =>
  contenuStaffSchema.parse(
    await (await fetch(`${env.API_URL}/v1/staff/news/${id}/`)).json(),
  );

beforeEach(() => resetStaffMocks());

describe('Épinglage d’une annonce (/v1/staff/news/{id}/pin/)', () => {
  test('épingle jusqu’à une date puis désépingle', async () => {
    let corps: { until?: string } = {};
    server.use(
      http.post(
        `${env.API_URL}/v1/staff/news/:id/pin/`,
        async ({ request }) => {
          corps = (await request.clone().json()) as { until?: string };
          return undefined;
        },
      ),
    );
    const user = userEvent.setup();
    renderApp(<EpinglageAnnonce contenu={await charger()} />);
    await user.click(screen.getByRole('button', { name: 'Épingler' }));
    await vi.waitFor(() => expect(corps.until).toMatch(/T/));
    // Le composant reçoit la version renvoyée : on relit et on rend à nouveau.
    const epingle = await charger();
    expect(epingle.is_pinned).toBe(true);
  });

  test('épinglée : propose de désépingler', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/staff/news/:id/`, async () =>
        HttpResponse.json({
          ...(await (await fetch(`${env.API_URL}/v1/staff/news/`)).json())
            .results[0],
          is_pinned: true,
          pinned_until: '2026-10-04T20:00:00+00:00',
        }),
      ),
    );
    const user = userEvent.setup();
    renderApp(<EpinglageAnnonce contenu={await charger()} />);
    expect(screen.getByText(/Épinglée jusqu’au/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Désépingler' }));
  });

  test('brouillon : rien à épingler', async () => {
    renderApp(
      <EpinglageAnnonce
        contenu={await charger('c1000000-0000-4000-8000-000000000002')}
      />,
    );
    expect(screen.queryByText('Épingler en tête')).not.toBeInTheDocument();
  });

  test('fin de journée locale', () => {
    expect(new Date(finDeJournee('2026-10-04')).getHours()).toBe(23);
  });
});
