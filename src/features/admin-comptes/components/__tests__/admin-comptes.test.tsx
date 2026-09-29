import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createStaffUser } from '@/testing/data-generators';
import {
  COMPTE_COLY,
  COMPTE_GOMIS,
  COMPTE_MARIE,
  COMPTE_MENDY,
  COMPTE_TINE,
  resetAdminComptesMocks,
} from '@/testing/mocks/handlers/admin-comptes';
import { server } from '@/testing/mocks/server';
import { renderApp, screen, userEvent, within } from '@/testing/test-utils';

import { messageErreur } from '../../utils/erreurs';
import { CreerCompte } from '../creer-compte';
import { FicheCompte } from '../fiche-compte';
import { JournalComptes } from '../journal';
import { ListeComptes } from '../liste-comptes';
import { Synchronisation } from '../synchronisation';
import { TableauDeBordComptes } from '../tableau-de-bord';

const A = `${env.API_URL}/v1/admin`;

const moi = (overrides = {}) =>
  server.use(
    http.get(`${env.API_URL}/v1/me/`, () =>
      HttpResponse.json(
        createStaffUser(['comptes.gerer'], undefined, overrides),
      ),
    ),
  );

const perimetreParoisse = () =>
  server.use(
    http.get(`${A}/scope/`, () =>
      HttpResponse.json({
        is_platform_admin: false,
        nodes: [
          {
            id: '5d000000-0000-4000-8000-00000000000d',
            name: 'Saint-Dominique (Point E)',
          },
        ],
        required_actions: ['UPDATE_PASSWORD'],
        impersonation: false,
      }),
    ),
  );

beforeEach(() => {
  resetAdminComptesMocks();
  moi();
});

describe('Administration des comptes (/v1/admin/)', () => {
  test('tableau de bord : compteurs et dernières actions', async () => {
    renderApp(<TableauDeBordComptes />);
    expect(await screen.findByText('Comptes actifs')).toBeInTheDocument();
    expect(screen.getByText('Portée : toute la plateforme.')).toBeInTheDocument();
    expect(await screen.findByText(/Compte créé · awa.ndiaye/)).toBeInTheDocument();
  });

  test('liste : filtres transmis au backend', async () => {
    let requete = '';
    server.use(
      http.get(`${A}/accounts/`, ({ request }) => {
        requete = new URL(request.url).search;
        return undefined;
      }),
    );
    const user = userEvent.setup();
    renderApp(<ListeComptes />);
    const table = await screen.findByRole('table', {
      name: 'Comptes de votre périmètre',
    });
    expect(within(table).getByText('Marie-Thérèse Diouf')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Statut'), 'desactive');
    expect(await within(table).findByText('Agnès Sarr')).toBeInTheDocument();
    expect(within(table).queryByText('Marie-Thérèse Diouf')).not.toBeInTheDocument();
    expect(requete).toContain('status=desactive');
    expect(requete).toContain('ordering=-created_at');
  });

  test('liste : rôle plateforme non proposé hors plateforme', async () => {
    perimetreParoisse();
    renderApp(<ListeComptes />);
    await screen.findByRole('table', { name: 'Comptes de votre périmètre' });
    const role = screen.getByLabelText('Rôle');
    expect(
      within(role).queryByRole('option', { name: 'Administrateur plateforme' }),
    ).not.toBeInTheDocument();
  });

  test('création : envoi du contrat et erreur account_exists', async () => {
    let corps: Record<string, unknown> = {};
    server.use(
      http.post(`${A}/accounts/`, async ({ request }) => {
        corps = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          { error: { code: 'account_exists', message: 'x', details: {} } },
          { status: 409 },
        );
      }),
    );
    const user = userEvent.setup();
    renderApp(<CreerCompte />);
    await user.type(await screen.findByLabelText('Prénom'), 'Awa');
    await user.type(screen.getByLabelText('Adresse e-mail'), 'mt.diouf@exemple.sn');
    await user.click(screen.getByRole('button', { name: 'Créer et inviter' }));
    expect(
      await screen.findByText('Un compte existe déjà avec cette adresse e-mail.'),
    ).toBeInTheDocument();
    expect(corps).toMatchObject({
      email: 'mt.diouf@exemple.sn',
      first_name: 'Awa',
      send_invitation: true,
      etat_de_vie: 'laic',
    });
    expect(corps.node_id).toBeTruthy();
  });

  test('fiche : déverrouillage et fermeture d’une session', async () => {
    const user = userEvent.setup();
    renderApp(<FicheCompte id={COMPTE_MENDY} />);
    expect(
      await screen.findByText(/verrouillé après 5 tentatives/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Déverrouiller maintenant' }));
    expect(await screen.findByText('Le compte est déverrouillé.')).toBeInTheDocument();
    expect(screen.getByText('Sessions actives · 2')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Fermer' })[0]);
    expect(await screen.findByText('Sessions actives · 1')).toBeInTheDocument();
  });

  test('fiche : désactivation avec motif obligatoire', async () => {
    const user = userEvent.setup();
    renderApp(<FicheCompte id={COMPTE_MARIE} />);
    await user.click(
      await screen.findByRole('button', { name: 'Désactiver le compte' }),
    );
    const dialogue = await screen.findByRole('dialog');
    const bouton = within(dialogue).getByRole('button', { name: 'Désactiver' });
    expect(bouton).toBeDisabled();
    await user.type(
      within(dialogue).getByLabelText(/Motif/),
      'Départ de la paroisse',
    );
    await user.click(bouton);
    expect(
      await screen.findByRole('button', { name: 'Réactiver le compte' }),
    ).toBeInTheDocument();
  });

  test('fiche : suppression exige la recopie de l’e-mail ; active_office', async () => {
    const user = userEvent.setup();
    renderApp(<FicheCompte id={COMPTE_COLY} />);
    await user.click(
      await screen.findByRole('button', { name: 'Supprimer le compte' }),
    );
    const dialogue = await screen.findByRole('dialog');
    const bouton = within(dialogue).getByRole('button', {
      name: 'Supprimer définitivement',
    });
    await user.type(within(dialogue).getByLabelText(/Motif/), 'Demande');
    await user.type(within(dialogue).getByLabelText(/Recopiez/), 'autre@x.sn');
    expect(bouton).toBeDisabled();
    await user.clear(within(dialogue).getByLabelText(/Recopiez/));
    await user.type(
      within(dialogue).getByLabelText(/Recopiez/),
      'c.coly@exemple.sn',
    );
    await user.click(bouton);
    expect(
      await within(dialogue).findByText(/encore une fonction en cours/),
    ).toBeInTheDocument();
  });

  test('fiche : pas d’action destructive sur son propre compte', async () => {
    moi({ id: COMPTE_GOMIS, email: 'p.gomis@exemple.sn' });
    renderApp(<FicheCompte id={COMPTE_GOMIS} />);
    expect(
      await screen.findByText(/C’est votre propre compte/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Supprimer le compte' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Désactiver le compte' }),
    ).not.toBeInTheDocument();
  });

  test('fiche : compte au-dessus du périmètre en consultation seule', async () => {
    renderApp(<FicheCompte id={COMPTE_TINE} />);
    expect(
      await screen.findByText(/relève d’un niveau supérieur/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Supprimer le compte' }),
    ).not.toBeInTheDocument();
  });

  test('fiche : Keycloak injoignable (503) → message clair', async () => {
    server.use(
      http.post(`${A}/accounts/:id/password-reset/`, () =>
        HttpResponse.json(
          {
            error: {
              code: 'keycloak_unavailable',
              message: 'x',
              details: {},
            },
          },
          { status: 503 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp(<FicheCompte id={COMPTE_MARIE} />);
    await user.click(
      await screen.findByRole('button', { name: /Réinitialiser le mot de passe/ }),
    );
    expect(await screen.findByText(/Keycloak\) est injoignable/)).toBeInTheDocument();
  });

  test('synchronisation : réservée à la plateforme', async () => {
    perimetreParoisse();
    renderApp(<Synchronisation />);
    expect(await screen.findByText('Réservé à la plateforme')).toBeInTheDocument();
  });

  test('synchronisation : rapport et lancement d’une simulation', async () => {
    let corps: unknown = null;
    server.use(
      http.post(`${A}/sync/runs/`, async ({ request }) => {
        corps = await request.clone().json();
        return undefined;
      }),
    );
    const user = userEvent.setup();
    renderApp(<Synchronisation />);
    expect(
      await screen.findByText('À créer dans Keycloak'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Lancer une réconciliation' }));
    expect(await screen.findByText(/simulation, rien n’a été corrigé/)).toBeInTheDocument();
    expect(corps).toEqual({ dry_run: true });
  });

  test('journal : entrées et motif', async () => {
    renderApp(<JournalComptes />);
    const table = await screen.findByRole('table', {
      name: 'Journal des actions sur les comptes',
    });
    expect(within(table).getByText('Compte désactivé')).toBeInTheDocument();
    expect(
      within(table).getByText('Motif : Départ de la paroisse'),
    ).toBeInTheDocument();
  });
});

describe('messageErreur', () => {
  test.each([
    ['self_action', 'propre compte'],
    ['platform_only', 'réservée aux administrateurs'],
    ['last_platform_admin', 'dernier administrateur'],
    ['account_not_linked', 'pas encore relié'],
    ['account_out_of_scope', 'pas dans votre périmètre'],
    ['account_above_scope', 'niveau supérieur'],
    ['keycloak_conflict', 'conflit'],
  ])('%s', async (code, attendu) => {
    const { ApiError } = await import('@/lib/api-client');
    expect(messageErreur(new ApiError('x', 403, code))).toContain(attendu);
  });
});
