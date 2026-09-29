import { http, HttpResponse } from 'msw';

import { AcceptInvitationContent } from '@/app/accept-invitation/accept-invitation-content';
import { env } from '@/config/env';
import { createStaffUser, createUser } from '@/testing/data-generators';
import {
  JETON_INVITATION,
  reinitialiserV1Complements,
} from '@/testing/mocks/handlers/v1-complements';
import { server } from '@/testing/mocks/server';
import { renderApp, screen, userEvent, within } from '@/testing/test-utils';

import { ComptesClerge } from '../comptes-clerge';

beforeEach(() => reinitialiserV1Complements());

const moi = (user: ReturnType<typeof createUser>) =>
  server.use(http.get(`${env.API_URL}/v1/me/`, () => HttpResponse.json(user)));

describe('Validation du clergé (/v1/clergy-accounts/, comptes.valider)', () => {
  beforeEach(() => moi(createStaffUser(['comptes.valider'])));

  test('valide un compte en attente puis l’active', async () => {
    const user = userEvent.setup();
    renderApp(<ComptesClerge />);
    const table = await screen.findByRole('table', {
      name: 'Comptes du clergé en attente de validation',
    });
    const ligne = within(table)
      .getByText('Pierre Diatta')
      .closest('tr') as HTMLElement;
    await user.click(within(ligne).getByRole('button', { name: 'Examiner' }));
    await user.click(screen.getByRole('button', { name: 'Valider le compte' }));
    expect(
      await screen.findByText('Pierre Diatta est validé.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Activer le compte' }));
    expect(await screen.findByText('Le compte est actif.')).toBeInTheDocument();
  });

  test('refuse avec un motif obligatoire', async () => {
    let corps: { reason?: string } = {};
    server.use(
      http.post(
        `${env.API_URL}/v1/clergy-accounts/:id/refuse/`,
        async ({ request }) => {
          corps = (await request.clone().json()) as { reason?: string };
          return undefined;
        },
      ),
    );
    const user = userEvent.setup();
    renderApp(<ComptesClerge />);
    const table = await screen.findByRole('table', {
      name: 'Comptes du clergé en attente de validation',
    });
    const ligne = within(table)
      .getByText('Luc Faye')
      .closest('tr') as HTMLElement;
    await user.click(within(ligne).getByRole('button', { name: 'Examiner' }));
    await user.click(screen.getByRole('button', { name: 'Refuser' }));
    await user.click(screen.getByRole('button', { name: 'Refuser le compte' }));
    await vi.waitFor(() =>
      expect(corps.reason).toBe('Pièce ne correspondant pas à l’affectation'),
    );
    expect(await within(table).findByText('Pierre Diatta')).toBeInTheDocument();
    await vi.waitFor(() =>
      expect(within(table).queryByText('Luc Faye')).not.toBeInTheDocument(),
    );
  });

  test('invite : montre le lien d’acceptation une seule fois, puis révoque', async () => {
    const user = userEvent.setup();
    renderApp(<ComptesClerge />);
    await user.click(
      await screen.findByRole('button', {
        name: /Inviter un membre du clergé/,
      }),
    );
    const dialogue = await screen.findByRole('dialog');
    await within(dialogue).findByRole('option', { name: 'Saint-Dominique' });
    await user.type(
      within(dialogue).getByLabelText('Adresse e-mail'),
      'emmanuel.tine@exemple.sn',
    );
    await user.click(
      within(dialogue).getByRole('button', { name: /Envoyer l’invitation/ }),
    );
    expect(await screen.findByLabelText('Lien d’acceptation')).toHaveValue(
      `http://localhost:3000/accept-invitation?token=${JETON_INVITATION}`,
    );
    await user.click(screen.getByRole('button', { name: 'Terminer' }));

    await user.click(screen.getByRole('button', { name: /Invitations/ }));
    const table = await screen.findByRole('table', {
      name: 'Invitations envoyées',
    });
    const ligne = (
      await within(table).findByText('emmanuel.tine@exemple.sn')
    ).closest('tr') as HTMLElement;
    await user.click(within(ligne).getByRole('button', { name: 'Révoquer' }));
    await vi.waitFor(() =>
      expect(
        within(table).queryByText('emmanuel.tine@exemple.sn'),
      ).not.toBeInTheDocument(),
    );
  });
});

describe('Page d’acceptation (/accept-invitation)', () => {
  test('jeton invalide : message sobre', async () => {
    moi(createUser());
    renderApp(<AcceptInvitationContent token="faux" />);
    expect(
      await screen.findByText('Invitation non valable'),
    ).toBeInTheDocument();
  });

  test('connecté : accepte, le compte passe en attente de validation', async () => {
    moi(createUser());
    const user = userEvent.setup();
    renderApp(<AcceptInvitationContent token={JETON_INVITATION} />);
    expect(await screen.findByText('Bienvenue, Emmanuel')).toBeInTheDocument();
    expect(screen.getByText('Prêtre')).toBeInTheDocument();
    await user.click(
      await screen.findByRole('button', { name: 'Accepter l’invitation' }),
    );
    expect(await screen.findByText('Invitation acceptée')).toBeInTheDocument();
  });

  test('adresse différente : explique quoi faire', async () => {
    moi(createUser());
    server.use(
      http.post(`${env.API_URL}/v1/clergy-accounts/invitations/accept/`, () =>
        HttpResponse.json(
          {
            error: {
              code: 'invitation_email_mismatch',
              message: 'Adresse différente.',
              details: {},
            },
          },
          { status: 403 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp(<AcceptInvitationContent token={JETON_INVITATION} />);
    await user.click(
      await screen.findByRole('button', { name: 'Accepter l’invitation' }),
    );
    expect(
      await screen.findByText(/reconnectez-vous avec l’adresse invitée/),
    ).toBeInTheDocument();
  });
});
