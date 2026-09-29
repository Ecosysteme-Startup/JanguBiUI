import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ProfilePage } from '@/features/profil/components/profile-page';
import { onboardingState } from '@/testing/mocks/db';
import { f5bState, laicDeclaration, resetF5bState } from '@/testing/mocks/db-f5b';
import { renderApp } from '@/testing/test-utils';
import { f5bHandlers } from '@/testing/mocks/handlers/f5b';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f5bHandlers));

const ACCOUNT_URL = 'https://auth.example.sn/realms/jangubi/account';

beforeEach(() => {
  resetF5bState();
  onboardingState.paroisse = null;
});

describe('Profil (/app/profil)', () => {
  it('affiche la demande de complément de la chancellerie, et rien sinon', async () => {
    f5bState.declaration = laicDeclaration({
      etat_de_vie: 'clerc',
      degre_ordre: 'pretre',
      statut_verification: 'complement',
      verification_note: 'Joindre la lettre d’obédience du provincial.',
    });
    renderApp(<ProfilePage accountUrl={ACCOUNT_URL} />);

    expect(await screen.findByText('Complément demandé pour votre déclaration')).toBeInTheDocument();
    expect(screen.getByText(/joindre la lettre d.obédience du provincial/i)).toBeInTheDocument();
  });

  it('n’affiche aucune demande de complément pour une déclaration ordinaire', async () => {
    renderApp(<ProfilePage accountUrl={ACCOUNT_URL} />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Marie-Thérèse Diouf' })).toBeInTheDocument();
    expect(screen.queryByText('Complément demandé pour votre déclaration')).not.toBeInTheDocument();
  });

  it('présente le compte, la paroisse suivie, la sécurité (Keycloak), la confidentialité et les onglets de réglages', async () => {
    renderApp(<ProfilePage accountUrl={ACCOUNT_URL} />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Marie-Thérèse Diouf' })).toBeInTheDocument();
    const compte = screen.getByRole('region', { name: 'Compte' });
    expect(within(compte).getByLabelText('E-mail')).toHaveValue('marie-therese.diouf@example.sn');
    expect(within(compte).getByRole('link', { name: /changer le mot de passe/i })).toHaveAttribute('href', ACCOUNT_URL);
    expect(within(screen.getByRole('region', { name: /paroisse suivie/i })).getByText('Saint-Dominique')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /gérer sur l.espace de connexion/i })).toHaveAttribute('href', ACCOUNT_URL);
    const nav = screen.getByRole('navigation', { name: 'Réglages' });
    expect(within(nav).getByRole('link', { name: 'Mon état de vie' })).toHaveAttribute('href', '#etat-de-vie');
    expect(within(nav).getByRole('button', { name: 'Se déconnecter' })).toBeInTheDocument();
    expect(screen.getByText(/messages chiffrés · aucun administrateur n.y a accès/i)).toBeInTheDocument();
    expect(screen.queryByText(/bout en bout/i)).not.toBeInTheDocument();
    expect(screen.getByText(/conditions acceptées le 21 septembre 2026/i)).toBeInTheDocument();
  });

  it('modifie le compte (PATCH /me/) et affiche les erreurs de champ du serveur', async () => {
    const user = userEvent.setup();
    renderApp(<ProfilePage accountUrl={ACCOUNT_URL} />);
    const identite = await screen.findByRole('region', { name: 'Compte' });

    expect(within(identite).getByText('Toutes vos informations sont enregistrées')).toBeInTheDocument();
    const prenom = within(identite).getByLabelText(/prénom/i);
    await user.clear(prenom);
    expect(within(identite).getByText('1 modification non enregistrée')).toBeInTheDocument();
    await user.click(within(identite).getByRole('button', { name: 'Enregistrer' }));
    expect(await within(identite).findByText('Indiquez votre prénom.')).toBeInTheDocument();

    await user.type(prenom, 'Marie');
    await user.type(within(identite).getByLabelText(/téléphone/i), '+000 000 000');
    await user.click(within(identite).getByRole('button', { name: 'Enregistrer' }));
    expect(await within(identite).findByText('Saisissez un numéro de téléphone valide.')).toBeInTheDocument();

    await user.clear(within(identite).getByLabelText(/téléphone/i));
    await user.type(within(identite).getByLabelText(/téléphone/i), '+221 77 548 21 36');
    await user.click(within(identite).getByRole('button', { name: 'Enregistrer' }));
    await vi.waitFor(() =>
      expect(f5bState.profilePatches).toEqual([
        { title: '', first_name: 'Marie', last_name: 'Diouf', date_of_birth: null, phone: '+221 77 548 21 36' },
      ]),
    );
    expect(await within(identite).findByText('Toutes vos informations sont enregistrées')).toBeInTheDocument();
  });

  it('change de paroisse suivie', async () => {
    const user = userEvent.setup();
    renderApp(<ProfilePage accountUrl={ACCOUNT_URL} />);
    const section = await screen.findByRole('region', { name: /paroisse suivie/i });

    await user.click(within(section).getByRole('button', { name: /changer de paroisse/i }));
    await user.type(within(section).getByLabelText(/nom, quartier ou ville/i), 'Dakar');
    await user.click(await within(section).findByRole('button', { name: /suivre cathédrale/i }));

    await vi.waitFor(() => expect(onboardingState.paroisse).toBe('b1000000-0000-4000-8000-000000000010'));
  });

  it('enregistre les préférences de notification', async () => {
    const user = userEvent.setup();
    renderApp(<ProfilePage accountUrl={ACCOUNT_URL} />);

    await user.click(await screen.findByRole('checkbox', { name: 'Par e-mail' }));
    await vi.waitFor(() => expect(f5bState.preferences.email).toBe(false));
  });

  it('exporte mes données au format JSON', async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => 'blob:export');
    const original = { create: URL.createObjectURL, revoke: URL.revokeObjectURL };
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderApp(<ProfilePage accountUrl={ACCOUNT_URL} />);

    await user.click(await screen.findByRole('button', { name: 'Exporter' }));

    await vi.waitFor(() => expect(click).toHaveBeenCalled());
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    click.mockRestore();
    URL.createObjectURL = original.create;
    URL.revokeObjectURL = original.revoke;
  });

  it('ne supprime le compte qu’après une confirmation forte', async () => {
    const user = userEvent.setup();
    const onAccountDeleted = vi.fn();
    renderApp(<ProfilePage accountUrl={ACCOUNT_URL} onAccountDeleted={onAccountDeleted} />);

    await user.click(await screen.findByRole('button', { name: 'Supprimer mon compte' }));
    const dialog = await screen.findByRole('dialog', { name: /supprimer mon compte/i });
    const confirm = within(dialog).getByRole('button', { name: /supprimer définitivement/i });
    expect(confirm).toBeDisabled();

    await user.type(within(dialog).getByLabelText(/pour confirmer, tapez supprimer/i), 'supprimer');
    expect(confirm).toBeDisabled();
    expect(f5bState.deleted).toBe(false);

    await user.clear(within(dialog).getByLabelText(/pour confirmer/i));
    await user.type(within(dialog).getByLabelText(/pour confirmer/i), 'SUPPRIMER');
    await user.click(confirm);

    await vi.waitFor(() => expect(onAccountDeleted).toHaveBeenCalled());
    expect(f5bState.deleted).toBe(true);
  });

  it('explique le refus de suppression pendant une nomination en cours', async () => {
    f5bState.deleteConflict = true;
    const user = userEvent.setup();
    const onAccountDeleted = vi.fn();
    renderApp(<ProfilePage accountUrl={ACCOUNT_URL} onAccountDeleted={onAccountDeleted} />);

    await user.click(await screen.findByRole('button', { name: 'Supprimer mon compte' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(/pour confirmer/i), 'SUPPRIMER');
    await user.click(within(dialog).getByRole('button', { name: /supprimer définitivement/i }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/nomination en cours/i);
    expect(onAccountDeleted).not.toHaveBeenCalled();
  });
});
