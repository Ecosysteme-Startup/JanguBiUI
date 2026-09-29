import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createUser } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { ProfilContent } from '../profil-content';

const mockUser = createUser({
  email: 'jean.dupont@example.com',
  profile: {
    first_name: 'Jean',
    last_name: 'Dupont',
    title: undefined,
    phone: '+221770000000',
    primary_parish: null,
    avatar: null,
  },
});

describe('ProfilContent', () => {
  beforeEach(() => {
    server.use(
      http.get(`${env.API_URL}/v1/me/`, () => HttpResponse.json(mockUser)),
    );
  });

  test('shows user name and email after loading', async () => {
    renderApp(<ProfilContent />);

    await screen.findByText('Jean Dupont');
    expect(screen.getByText('jean.dupont@example.com')).toBeInTheDocument();
  });

  test('pre-fills first name and last name in the form', async () => {
    renderApp(<ProfilContent />);

    await screen.findByDisplayValue('Jean');
    expect(screen.getByDisplayValue('Dupont')).toBeInTheDocument();
  });

  test('submits updated profile to PATCH /v1/me/', async () => {
    const capturedBodies: unknown[] = [];
    server.use(
      http.patch(`${env.API_URL}/v1/me/`, async ({ request }) => {
        const body = await request.json();
        capturedBodies.push(body);
        return HttpResponse.json(mockUser);
      }),
    );

    renderApp(<ProfilContent />);

    const firstNameInput = await screen.findByDisplayValue('Jean');
    await userEvent.clear(firstNameInput);
    await userEvent.type(firstNameInput, 'Pierre');

    await userEvent.click(
      screen.getByRole('button', { name: /^enregistrer$/i }),
    );

    await waitFor(() => expect(capturedBodies).toHaveLength(1));
    expect(capturedBodies[0]).toMatchObject({ first_name: 'Pierre' });
  });

  test('shows success notification after profile update', async () => {
    server.use(
      http.patch(`${env.API_URL}/v1/me/`, () => HttpResponse.json(mockUser)),
    );

    renderApp(<ProfilContent />);

    await screen.findByDisplayValue('Jean');
    await userEvent.click(
      screen.getByRole('button', { name: /^enregistrer$/i }),
    );

    expect(await screen.findByText(/profil mis à jour/i)).toBeInTheDocument();
  });

  test('mot de passe et double authentification : lien vers le compte Keycloak', async () => {
    renderApp(<ProfilContent />);

    const lien = await screen.findByRole('link', {
      name: /gérer ma connexion/i,
    });
    expect(lien).toHaveAttribute(
      'href',
      expect.stringMatching(/\/realms\/jangubi\/account\//),
    );
    expect(screen.queryByLabelText(/mot de passe actuel/i)).toBeNull();
  });

  test('« Se déconnecter » termine la session Keycloak (end_session)', async () => {
    const assign = vi.fn();
    const original = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        origin: original.origin,
        pathname: '/app/profil',
        search: '',
        assign,
      },
    });
    try {
      renderApp(<ProfilContent />);

      await userEvent.click(
        await screen.findByRole('button', { name: 'Se déconnecter' }),
      );

      await waitFor(() => expect(assign).toHaveBeenCalled());
      expect(String(assign.mock.calls[0][0])).toMatch(
        /\/protocol\/openid-connect\/logout\?/,
      );
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: original,
      });
    }
  });

  test('shows confirmation dialog before deleting account', async () => {
    renderApp(<ProfilContent />);

    await screen.findByRole('button', { name: /supprimer mon compte/i });
    await userEvent.click(
      screen.getByRole('button', { name: /supprimer mon compte/i }),
    );

    await screen.findByText(/cette action est irréversible/i);
    expect(
      screen.getByRole('button', { name: /confirmer/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /annuler/i }),
    ).toBeInTheDocument();
  });

  test('can cancel account deletion', async () => {
    renderApp(<ProfilContent />);

    await screen.findByRole('button', { name: /supprimer mon compte/i });
    await userEvent.click(
      screen.getByRole('button', { name: /supprimer mon compte/i }),
    );

    await screen.findByText(/cette action est irréversible/i);
    await userEvent.click(screen.getByRole('button', { name: /annuler/i }));

    expect(
      screen.queryByText(/cette action est irréversible/i),
    ).not.toBeInTheDocument();
  });

  test('renders safely when user has no profile fields', async () => {
    const emptyProfileUser = createUser({
      profile: {
        first_name: '',
        last_name: '',
        phone: '',
        primary_parish: null,
        avatar: null,
      },
    });
    server.use(
      http.get(`${env.API_URL}/v1/me/`, () =>
        HttpResponse.json(emptyProfileUser),
      ),
    );

    renderApp(<ProfilContent />);

    await screen.findByRole('button', { name: /^enregistrer$/i });
    expect(
      screen.getByRole('heading', { name: /informations personnelles/i }),
    ).toBeInTheDocument();
  });

  test('does not crash when profile is undefined (missing from API response)', async () => {
    // Simulates a backend response where the profile object is absent.
    // This is the exact scenario that caused the TypeError on user.profile.first_name.
    const userWithoutProfile = createUser({
      profile: undefined as unknown as ReturnType<typeof createUser>['profile'],
    });
    server.use(
      http.get(`${env.API_URL}/v1/me/`, () =>
        HttpResponse.json(userWithoutProfile),
      ),
    );

    renderApp(<ProfilContent />);

    // The component must render without crashing — email appears in both h1 and p when profile is absent
    const emailElements = await screen.findAllByText(userWithoutProfile.email);
    expect(emailElements.length).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', { name: /^enregistrer$/i }),
    ).toBeInTheDocument();
  });
});
