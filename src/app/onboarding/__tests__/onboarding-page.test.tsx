import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { useRouter } from 'next/navigation';

import { env } from '@/config/env';
import { createUser } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp, screen, waitFor, within } from '@/testing/test-utils';

import OnboardingPage from '../page';

beforeAll(() => {
  // jsdom n'implémente pas ces méthodes pointer (Radix Select en a besoin).
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.releasePointerCapture = vi.fn();
});

const DIOCESES = [
  { id: 1, name: 'Diocèse de Dakar', code: 'DK', province: 1 },
  { id: 2, name: 'Diocèse de Thiès', code: 'TH', province: 1 },
];
const PARISHES: Record<string, unknown[]> = {
  '1': [{ id: 11, name: 'Saint-Pierre', city: 'Dakar', address: '', diocese_id: 1 }],
  '2': [{ id: 21, name: 'Sainte-Anne', city: 'Thiès', address: '', diocese_id: 2 }],
};
const CHURCHES: Record<string, unknown[]> = {
  '11': [{ id: 111, name: 'Église A', is_main: true, city: 'Dakar', is_active: true, parish: 11, parish_name: 'Saint-Pierre' }],
  '21': [{ id: 211, name: 'Église B', is_main: true, city: 'Thiès', is_active: true, parish: 21, parish_name: 'Sainte-Anne' }],
};

const replace = vi.fn();

async function pickOption(comboboxLabel: string, optionName: RegExp) {
  await userEvent.click(screen.getByLabelText(comboboxLabel));
  await userEvent.click(await screen.findByRole('option', { name: optionName }));
}

async function addChurch(diocese: RegExp, parish: RegExp, church: RegExp) {
  await pickOption('Diocèse', diocese);
  await pickOption('Paroisse', parish);
  await pickOption('Église', church);
  await userEvent.click(
    screen.getByRole('button', { name: /ajouter cette église/i }),
  );
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    replace.mockReset();
    vi.mocked(useRouter).mockReturnValue({
      replace,
      push: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    } as never);
    server.use(
      http.get(`${env.API_URL}/v1/me/`, () =>
        HttpResponse.json(createUser({ onboarding_state: 'pending_parish' })),
      ),
      http.get(`${env.API_URL}/v1/org/dioceses/`, () =>
        HttpResponse.json({ results: DIOCESES }),
      ),
      http.get(`${env.API_URL}/v1/org/parishes/`, ({ request }) => {
        const d = new URL(request.url).searchParams.get('diocese') ?? '';
        return HttpResponse.json({ results: PARISHES[d] ?? [] });
      }),
      http.get(`${env.API_URL}/v1/org/churches/`, ({ request }) => {
        const p = new URL(request.url).searchParams.get('parish') ?? '';
        return HttpResponse.json({ results: CHURCHES[p] ?? [] });
      }),
    );
  });

  test('soumet le batch church_ids (principale en tête) et complète l’onboarding', async () => {
    // Holder objet : évite que la CFA TS ne réduise `body` à `null`
    // (l'affectation a lieu dans la closure du handler MSW).
    const captured: { body: { church_ids?: number[] } | null } = { body: null };
    server.use(
      http.post(`${env.API_URL}/v1/users/me/memberships/`, async ({ request }) => {
        captured.body = (await request.json()) as { church_ids: number[] };
        return HttpResponse.json([], { status: 201 });
      }),
    );

    renderApp(<OnboardingPage />);

    // Ajout de deux églises de diocèses différents.
    await addChurch(/Dakar/, /Saint-Pierre/, /Église A/); // 111 (principale par défaut)
    await addChurch(/Thiès/, /Sainte-Anne/, /Église B/); // 211

    // On désigne B (la 2e) comme principale → elle doit passer en tête du batch.
    const list = await screen.findByRole('list', {
      name: /églises sélectionnées/i,
    });
    const itemB = within(list)
      .getByText(/Église B/)
      .closest('li') as HTMLElement;
    await userEvent.click(
      within(itemB).getByRole('button', { name: /définir principale/i }),
    );

    await userEvent.click(screen.getByRole('button', { name: /commencer/i }));

    await waitFor(() => expect(captured.body).not.toBeNull());
    // Batch posté avec la principale (211) en tête.
    expect(captured.body?.church_ids?.[0]).toBe(211);
    expect(new Set(captured.body?.church_ids)).toEqual(new Set([111, 211]));

    // Onboarding complété → redirection (le back passe à completed dès ≥1 appartenance).
    await waitFor(() => expect(replace).toHaveBeenCalled());
  });

  test('le bouton « Commencer » est désactivé tant qu’aucune église n’est ajoutée', async () => {
    renderApp(<OnboardingPage />);
    expect(
      await screen.findByRole('button', { name: /commencer/i }),
    ).toBeDisabled();
  });
});
