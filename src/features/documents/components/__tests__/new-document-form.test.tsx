import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { useRouter } from 'next/navigation';

import { env } from '@/config/env';
import { createDocumentRequest, createUser } from '@/testing/data-generators';
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

// Paroisses d'appartenance du fidèle — proposées en tête par le picker (C7c).
const MEMBERSHIPS = [
  {
    id: 1,
    church: { id: 111, name: 'Église A' },
    parish: { id: 11, name: 'Saint-Pierre' },
    diocese: { id: 1, name: 'Diocèse de Dakar' },
    is_primary: true,
  },
];

function mockMe() {
  server.use(
    http.get(`${env.API_URL}/v1/me/`, () =>
      HttpResponse.json(createUser({ memberships: MEMBERSHIPS })),
    ),
  );
}

/**
 * Steps 1–2 : type+motif puis identité. Laisse l'utilisateur sur l'étape 3
 * (recherche dans les registres / sélection de la paroisse).
 */
async function navigateToSearch(user: ReturnType<typeof userEvent.setup>) {
  // Step 1 — document type + reason
  await user.click(screen.getByRole('button', { name: 'Certificat de baptême' }));
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
  await user.click(await screen.findByRole('button', { name: /Saint-Pierre/ }));
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
    await user.click(screen.getByRole('button', { name: 'Certificat de baptême' }));
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
      screen.getByRole('button', { name: /Saint-Pierre/ }),
    ).toBeInTheDocument();
    // …et plus aucun champ texte libre "Diocèse".
    expect(
      screen.queryByPlaceholderText(/Diocèse de Dakar/),
    ).not.toBeInTheDocument();
  });

  test('permet la recherche libre d’une autre paroisse du registre', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/org/parishes/`, () =>
        HttpResponse.json({
          results: [
            {
              id: 99,
              name: 'Cathédrale',
              city: 'Kaolack',
              address: '',
              diocese: 9,
              diocese_name: 'Diocèse de Kaolack',
            },
          ],
        }),
      ),
    );

    const user = userEvent.setup();
    renderApp(<NewDocumentForm />);
    await navigateToSearch(user);

    await user.type(
      screen.getByLabelText(/rechercher une paroisse/i),
      'Cath',
    );
    await user.click(await screen.findByRole('button', { name: /Cathédrale/ }));

    // État sélectionné : paroisse affichée + bouton "Changer".
    expect(screen.getByText('Cathédrale')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /changer/i }),
    ).toBeInTheDocument();
  });

  test('"Envoyer la demande" appears on the final step and is disabled before consent', async () => {
    const user = userEvent.setup();
    renderApp(<NewDocumentForm />);
    await navigateToConsent(user);

    const submitBtn = screen.getByRole('button', { name: /envoyer la demande/i });
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

  test('envoie UNIQUEMENT parish_id (FK), sans texte libre parish_name/diocese', async () => {
    const capturedBodies: Array<Record<string, unknown>> = [];
    server.use(
      http.post(
        `${env.API_URL}/v1/documents/requests/`,
        async ({ request }) => {
          capturedBodies.push(
            (await request.json()) as Record<string, unknown>,
          );
          return HttpResponse.json(
            createDocumentRequest({ document_type: 'baptism', status: 'submitted' }),
            { status: 201 },
          );
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
      parish_id: 11,
    });
    // B5c : plus de texte libre parish_name/diocese dans le payload (FK seule).
    expect(capturedBodies[0]).not.toHaveProperty('parish_name');
    expect(capturedBodies[0]).not.toHaveProperty('diocese');
  });

  test('redirects to /app/documents after successful submission', async () => {
    const user = userEvent.setup();
    renderApp(<NewDocumentForm />);
    await navigateToConsent(user);
    await user.click(screen.getByRole('button', { name: /je certifie/i }));
    await user.click(
      screen.getByRole('button', { name: /envoyer la demande/i }),
    );

    await waitFor(() =>
      expect(mockRouterPush).toHaveBeenCalledWith('/app/documents'),
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
                HttpResponse.json(
                  createDocumentRequest({
                    document_type: 'baptism',
                    status: 'submitted',
                  }),
                  { status: 201 },
                ),
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
});
