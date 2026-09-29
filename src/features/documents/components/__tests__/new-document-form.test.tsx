import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { useRouter } from 'next/navigation';

import { env } from '@/config/env';
import { createUser } from '@/testing/data-generators';
import { createRequesterRequest } from '@/testing/mocks/handlers/documents';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { NewDocumentForm } from '../new-document-form';

const mockRouterPush = vi.fn();
const mockRouterBack = vi.fn();

vi.mocked(useRouter).mockReturnValue({
  push: mockRouterPush,
  back: mockRouterBack,
  replace: vi.fn(),
  refresh: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
} as never);

function mockMe() {
  server.use(
    http.get(`${env.API_URL}/v1/me/`, () => HttpResponse.json(createUser())),
  );
}

/**
 * Steps 1–2 : type+motif puis identité. Laisse l'utilisateur sur l'étape 3
 * (recherche dans les registres / sélection de la paroisse).
 */
async function navigateToSearch(user: ReturnType<typeof userEvent.setup>) {
  // Step 1 — document type + reason
  await user.click(
    screen.getByRole('button', { name: 'Certificat de baptême' }),
  );
  await user.click(screen.getByRole('button', { name: 'Usage personnel' }));
  await user.click(screen.getByRole('button', { name: /continuer/i }));

  // Step 2 — identity
  await user.type(screen.getByLabelText(/prénom/i), 'Jean');
  await user.type(screen.getByLabelText(/^nom/i), 'Dupont');
  await user.type(screen.getByLabelText(/date de naissance/i), '2000-01-01');
  await user.type(screen.getByLabelText(/lieu de naissance/i), 'Dakar');
  await user.click(screen.getByRole('button', { name: /continuer/i }));
}

/**
 * Remplit toutes les étapes requises 1–4 et saute l'étape 5 (pièces jointes,
 * optionnelle) pour arriver à l'étape 6 (Validation / consentement). La paroisse
 * du registre est choisie via le picker (raccourci appartenance).
 */
async function navigateToConsent(user: ReturnType<typeof userEvent.setup>) {
  await navigateToSearch(user);

  // Step 3 — sacrament search (parents + paroisse via picker)
  await user.type(screen.getByLabelText(/nom du père/i), 'Dupont');
  await user.type(screen.getByLabelText(/nom de la mère/i), 'Martin');
  await user.click(
    await screen.findByRole('button', { name: /^Saint-Dominique/ }),
  );
  await user.type(screen.getByLabelText(/date approx/i), '2000');
  await user.type(screen.getByLabelText(/^lieu/i), 'Dakar');
  await user.click(screen.getByRole('button', { name: /continuer/i }));

  // Step 4 — contact
  await user.type(screen.getByLabelText(/téléphone/i), '+221770000000');
  await user.type(screen.getByLabelText(/email/i), 'jean@example.com');
  await user.click(screen.getByRole('button', { name: /continuer/i }));

  // Step 5 — attachments (optional, skip without uploading)
  await user.click(screen.getByRole('button', { name: /continuer/i }));
}

describe('NewDocumentForm', () => {
  beforeEach(() => {
    mockRouterPush.mockReset();
    mockRouterBack.mockReset();
    mockMe();
  });

  test('renders all document type selection cards on step 1', () => {
    renderApp(<NewDocumentForm />);

    expect(
      screen.getByRole('button', { name: 'Certificat de baptême' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Attestation de première communion' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Attestation de confirmation' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Attestation de mariage religieux' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Attestation parrain / marraine' }),
    ).toBeInTheDocument();
  });

  test('shows validation errors when "Continuer" is clicked without selections on step 1', async () => {
    const user = userEvent.setup();
    renderApp(<NewDocumentForm />);

    // Click Continuer without selecting anything — should show errors, not advance
    await user.click(screen.getByRole('button', { name: /continuer/i }));

    // Should still be on step 1 (document type cards still visible)
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Certificat de baptême' }),
      ).toBeInTheDocument();
    });

    // After selecting both, clicking Continuer should advance to step 2
    await user.click(
      screen.getByRole('button', { name: 'Certificat de baptême' }),
    );
    await user.click(screen.getByRole('button', { name: 'Usage personnel' }));
    await user.click(screen.getByRole('button', { name: /continuer/i }));

    // Now on step 2 — identity fields appear
    await waitFor(() => {
      expect(screen.getByLabelText(/prénom/i)).toBeInTheDocument();
    });
  });

  test('le picker propose les paroisses d’appartenance en tête (plus de saisie libre)', async () => {
    const user = userEvent.setup();
    renderApp(<NewDocumentForm />);
    await navigateToSearch(user);

    // Raccourci "Mes paroisses" présent…
    expect(await screen.findByText('Mes paroisses')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Saint-Dominique/ }),
    ).toBeInTheDocument();
    // …et plus aucun champ texte libre "Diocèse".
    expect(
      screen.queryByPlaceholderText(/Diocèse de Dakar/),
    ).not.toBeInTheDocument();
  });

  test('permet la recherche libre d’une autre paroisse du registre', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/public/nodes/`, () =>
        HttpResponse.json({
          count: 1,
          results: [
            {
              id: '7d1c9a52-0b3e-4f6a-9c21-5e8b4d2a1f00',
              name: 'Cathédrale Saint-Théophile',
              city: 'Kaolack',
              diocese_name: 'Diocèse de Kaolack',
            },
          ],
        }),
      ),
    );

    const user = userEvent.setup();
    renderApp(<NewDocumentForm />);
    await navigateToSearch(user);

    await user.type(screen.getByLabelText(/rechercher une paroisse/i), 'Cath');
    await user.click(
      await screen.findByRole('button', { name: /Cathédrale Saint-Théophile/ }),
    );

    // État sélectionné : paroisse affichée + bouton "Changer".
    expect(screen.getByText('Cathédrale Saint-Théophile')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /changer/i }),
    ).toBeInTheDocument();
  });

  test('"Envoyer la demande" appears on the final step and is disabled before consent', async () => {
    const user = userEvent.setup();
    renderApp(<NewDocumentForm />);
    await navigateToConsent(user);

    const submitBtn = screen.getByRole('button', {
      name: /envoyer la demande/i,
    });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();
  });

  test('consent checkbox enables "Envoyer la demande"', async () => {
    const user = userEvent.setup();
    renderApp(<NewDocumentForm />);
    await navigateToConsent(user);

    await user.click(screen.getByRole('button', { name: /je certifie/i }));

    expect(
      screen.getByRole('button', { name: /envoyer la demande/i }),
    ).toBeEnabled();
  });

  test('envoie target_node_id (UUID du nœud), sans parish_id ni texte libre', async () => {
    const capturedBodies: Array<Record<string, unknown>> = [];
    server.use(
      http.post(
        `${env.API_URL}/v1/documents/requests/`,
        async ({ request }) => {
          capturedBodies.push(
            (await request.json()) as Record<string, unknown>,
          );
          return HttpResponse.json(createRequesterRequest(), { status: 201 });
        },
      ),
    );

    const user = userEvent.setup();
    renderApp(<NewDocumentForm />);
    await navigateToConsent(user);
    await user.click(screen.getByRole('button', { name: /je certifie/i }));
    await user.click(
      screen.getByRole('button', { name: /envoyer la demande/i }),
    );

    await waitFor(() => expect(capturedBodies).toHaveLength(1));
    expect(capturedBodies[0]).toMatchObject({
      document_type: 'baptism',
      consent_given: true,
      reason: 'personal',
      target_node_id: '5b7d2c1e-8a41-4f0b-9d7e-2c3f1a6b9e01',
    });
    expect(capturedBodies[0]).not.toHaveProperty('parish_id');
    expect(capturedBodies[0]).not.toHaveProperty('parish_name');
    expect(capturedBodies[0]).not.toHaveProperty('diocese');
  });

  test('mène au détail de la demande créée', async () => {
    const user = userEvent.setup();
    renderApp(<NewDocumentForm />);
    await navigateToConsent(user);
    await user.click(screen.getByRole('button', { name: /je certifie/i }));
    await user.click(
      screen.getByRole('button', { name: /envoyer la demande/i }),
    );

    await waitFor(() =>
      expect(mockRouterPush).toHaveBeenCalledWith(
        '/app/documents/9f8e7d6c-5b4a-4392-8170-6f5e4d3c2b1a',
      ),
    );
  });

  test('shows loading indicator while submitting', async () => {
    let resolveRequest!: () => void;
    server.use(
      http.post(
        `${env.API_URL}/v1/documents/requests/`,
        () =>
          new Promise<Response>((resolve) => {
            resolveRequest = () =>
              resolve(
                HttpResponse.json(createRequesterRequest(), { status: 201 }),
              );
          }),
      ),
    );

    const user = userEvent.setup();
    renderApp(<NewDocumentForm />);
    await navigateToConsent(user);
    await user.click(screen.getByRole('button', { name: /je certifie/i }));
    await user.click(
      screen.getByRole('button', { name: /envoyer la demande/i }),
    );

    await screen.findByText(/envoi en cours/i);
    expect(
      screen.getByRole('button', { name: /envoi en cours/i }),
    ).toBeDisabled();

    resolveRequest();
  });

  test('un refus V1 (reason_not_allowed) est affiché', async () => {
    server.use(
      http.post(`${env.API_URL}/v1/documents/requests/`, () =>
        HttpResponse.json(
          {
            error: {
              code: 'reason_not_allowed',
              message:
                'Le motif « Usage personnel » ne correspond pas au document demandé.',
              details: {},
            },
          },
          { status: 400 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp(<NewDocumentForm />);
    await navigateToConsent(user);
    await user.click(screen.getByRole('button', { name: /je certifie/i }));
    await user.click(
      screen.getByRole('button', { name: /envoyer la demande/i }),
    );

    expect(
      await screen.findByText(/ne correspond pas au document demandé/),
    ).toBeInTheDocument();
  });

  test('les motifs proposés suivent le type (options du backend)', async () => {
    const user = userEvent.setup();
    renderApp(<NewDocumentForm />);
    await user.click(
      await screen.findByRole('button', {
        name: 'Attestation de mariage religieux',
      }),
    );
    expect(
      screen.queryByRole('button', { name: 'Inscription catéchèse' }),
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Usage personnel' }),
    ).toBeInTheDocument();
  });
});
