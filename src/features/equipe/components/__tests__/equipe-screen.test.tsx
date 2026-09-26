import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';

import EquipePage from '@/app/espace/[nodeId]/equipe/page';
import type { Grant } from '@/lib/capacites';
import { apiUrl } from '@/testing/mocks/api-url';
import { grantsSecretaire, ids } from '@/testing/mocks/db';
import { f8aState, resetF8a } from '@/testing/mocks/db-f8a';
import { f8aOverrides, v1Error } from '@/testing/mocks/handlers/f8a';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { withoutAccess } from '../nomination-form';
import { f8aHandlers } from '@/testing/mocks/handlers/f8a';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f8aHandlers));

const grantsCure: Grant[] = ['offices.nommer', 'tableau_bord.voir', 'actes.traiter'].map((capacite) => ({
  capacite,
  node_id: ids.saintDominique,
  node_name: 'Saint-Dominique',
  node_type: 'paroisse',
  herite: false,
  office: 'cure',
  office_label: 'Administrateur paroissial',
}));

const renderPage = async (capacites: Grant[] = grantsCure) =>
  renderApp(await EquipePage({ params: Promise.resolve({ nodeId: ids.saintDominique }) }), { capacites });

beforeEach(() => {
  resetF8a();
  server.use(...f8aOverrides);
});

describe('Équipe et nominations (PAR-Equipe)', () => {
  it('liste les offices actifs avec leurs capacités, et les nominations passées', async () => {
    await renderPage();

    const table = await screen.findByRole('table');
    expect(within(table).getByText('Abbé Augustin Ndiaye')).toBeInTheDocument();
    expect(within(table).getByText('Secrétaire paroissiale')).toBeInTheDocument();
    expect(await within(table).findAllByRole('list', { name: 'Capacités' })).toHaveLength(2);
    expect(within(table).getByText('+3')).toHaveAttribute('title', 'Messagerie, Confessions, Tableau de bord');
    const past = screen.getByRole('region', { name: /nominations passées/i });
    expect(within(past).getByText(/anna sarr/i)).toBeInTheDocument();
    expect(within(past).getByText('À sa demande')).toBeInTheDocument();
  });

  it('déplace le focus dans le panneau, le ferme à Échap et rend le focus au bouton (A11Y-16)', async () => {
    const user = userEvent.setup();
    await renderPage();

    const opener = await screen.findByRole('button', { name: /nommer une personne/i });
    await user.click(opener);
    const panel = await screen.findByRole('region', { name: 'Nommer une personne' });
    await vi.waitFor(() => expect(panel).toHaveFocus());

    // Premier Échap dans la combobox ouverte : ferme la liste seulement.
    const combobox = within(panel).getByRole('combobox', { name: /personne/i });
    await user.type(combobox, 'élis');
    await within(panel).findByRole('option', { name: /élisabeth gomis/i });
    await user.keyboard('{Escape}');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('region', { name: 'Nommer une personne' })).toBeInTheDocument();

    // Second Échap : ferme le panneau, le focus revient au déclencheur.
    await user.keyboard('{Escape}');
    await vi.waitFor(() => expect(screen.queryByRole('region', { name: 'Nommer une personne' })).not.toBeInTheDocument());
    expect(opener).toHaveFocus();
  });

  it('nomme une personne, avec l’aperçu des capacités de l’office', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.click(await screen.findByRole('button', { name: /nommer une personne/i }));
    const panel = await screen.findByRole('region', { name: 'Nommer une personne' });
    await user.type(within(panel).getByRole('combobox', { name: /personne/i }), 'élis');
    await user.click(await within(panel).findByRole('option', { name: /élisabeth gomis/i }));
    expect(within(panel).getByText(/personne choisie : élisabeth gomis/i)).toBeInTheDocument();
    await user.selectOptions(await within(panel).findByLabelText(/^office/i), 'Catéchiste');
    expect(within(panel).getByText('Sans accès aux demandes d’actes, à la messagerie prêtre ni aux confessions.', { exact: false })).toBeInTheDocument();
    expect(within(panel).getByRole('list', { name: 'Capacités' })).toHaveTextContent(/Événements.*Annonces/);
    await user.type(within(panel).getByLabelText(/justificatif/i), 'Lettre de mission du 22.09');
    await user.click(within(panel).getByRole('button', { name: 'Nommer' }));

    await vi.waitFor(() => expect(screen.queryByRole('region', { name: 'Nommer une personne' })).not.toBeInTheDocument());
    expect(f8aState.lastBody).toMatchObject({
      person_id: '5f0c0000-0000-4000-8000-0000000000e1',
      office: 'catechiste',
      node_id: ids.saintDominique,
      decree_ref: 'Lettre de mission du 22.09',
      end_date: null,
    });
    expect(await screen.findByText('Élisabeth Gomis')).toBeInTheDocument();
  });

  it('demande la qualité pour une cure : curé par défaut, ou administrateur paroissial', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.click(await screen.findByRole('button', { name: /nommer une personne/i }));
    const panel = await screen.findByRole('region', { name: 'Nommer une personne' });
    expect(within(panel).queryByRole('group', { name: 'Qualité' })).not.toBeInTheDocument();
    await user.type(within(panel).getByRole('combobox', { name: /personne/i }), 'élis');
    await user.click(await within(panel).findByRole('option', { name: /élisabeth gomis/i }));
    await user.selectOptions(await within(panel).findByLabelText(/^office/i), 'Curé / administrateur paroissial');
    const quality = within(panel).getByRole('group', { name: 'Qualité' });
    expect(within(quality).getByRole('radio', { name: 'Curé' })).toBeChecked();
    await user.click(within(quality).getByRole('radio', { name: 'Administrateur paroissial' }));
    await user.click(within(panel).getByRole('button', { name: 'Nommer' }));

    await vi.waitFor(() => expect(f8aState.lastBody).toMatchObject({ office: 'cure', quality: 'administrateur' }));
    expect(await within(await screen.findByRole('table')).findByText('Administrateur paroissial')).toBeInTheDocument();
  });

  it('exige de choisir une personne dans la recherche, et l’office', async () => {
    const user = userEvent.setup();
    await renderPage();
    await user.click(await screen.findByRole('button', { name: /nommer une personne/i }));
    const panel = await screen.findByRole('region', { name: 'Nommer une personne' });

    await user.type(within(panel).getByRole('combobox', { name: /personne/i }), 'Élisabeth');
    await user.click(within(panel).getByRole('button', { name: 'Nommer' }));

    expect(await within(panel).findByText('Choisissez la personne à nommer.')).toBeInTheDocument();
    expect(within(panel).getByText('Choisissez l’office.')).toBeInTheDocument();
    expect(f8aState.lastBody).toBeNull();
  });

  it('recherche au clavier : 2 caractères au moins, flèches puis Entrée', async () => {
    const user = userEvent.setup();
    await renderPage();
    await user.click(await screen.findByRole('button', { name: /nommer une personne/i }));
    const panel = await screen.findByRole('region', { name: 'Nommer une personne' });
    const combo = within(panel).getByRole('combobox', { name: /personne/i });

    await user.type(combo, 'n');
    expect(within(panel).getByText('Saisissez au moins 2 caractères.')).toBeInTheDocument();
    await user.type(combo, 'dour');
    expect(await within(panel).findByRole('option', { name: /abbé ignace ndour/i })).toHaveTextContent('i•••r@example.sn');
    await user.keyboard('{ArrowDown}{Enter}');

    expect(combo).toHaveValue('Abbé Ignace Ndour');
    expect(within(panel).getByText(/prêtre · statut vérifié · diocèse de thiès/i)).toBeInTheDocument();
  });

  it('explique un refus pour MFA manquante', async () => {
    server.use(http.post(apiUrl('/hierarchy/assignments/'), () => v1Error(403, 'mfa_required', 'Authentification à deux facteurs requise.')));
    const user = userEvent.setup();
    await renderPage();
    await user.click(await screen.findByRole('button', { name: /nommer une personne/i }));
    const panel = await screen.findByRole('region', { name: 'Nommer une personne' });
    await user.type(within(panel).getByRole('combobox', { name: /personne/i }), 'gomis');
    await user.click(await within(panel).findByRole('option', { name: /élisabeth gomis/i }));
    await user.selectOptions(await within(panel).findByLabelText(/^office/i), 'Catéchiste');
    await user.click(within(panel).getByRole('button', { name: 'Nommer' }));

    expect(await within(panel).findByText('Validez d’abord votre double authentification, puis recommencez.')).toBeInTheDocument();
  });

  it('termine une nomination', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.click(await screen.findByRole('button', { name: 'Terminer la nomination de Mme Germaine Faye' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Terminer la nomination' }));

    await vi.waitFor(() => expect(f8aState.lastBody).toMatchObject({ action: 'terminer' }));
    const past = await screen.findByRole('region', { name: /nominations passées/i });
    expect(await within(past).findByText(/germaine faye/i)).toBeInTheDocument();
  });

  it('modifie la qualité du curé : il devient administrateur paroissial', async () => {
    const user = userEvent.setup();
    await renderPage();

    // Seuls les offices qui ont des qualités proposent l'action.
    expect(await screen.findByRole('button', { name: 'Modifier la qualité de Abbé Augustin Ndiaye' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Modifier la qualité de Mme Germaine Faye' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Modifier la qualité de Abbé Augustin Ndiaye' }));
    const dialog = await screen.findByRole('dialog', { name: 'Modifier la qualité' });
    expect(within(dialog).getByRole('radio', { name: 'Curé' })).toBeChecked();
    expect(within(dialog).getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    await user.click(within(dialog).getByRole('radio', { name: 'Administrateur paroissial' }));
    await user.click(within(dialog).getByRole('button', { name: 'Enregistrer' }));

    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(f8aState.lastBody).toEqual({ action: 'qualifier', quality: 'administrateur' });
    expect(await within(screen.getByRole('table')).findByText('Administrateur paroissial')).toBeInTheDocument();
  });

  it('garde la fenêtre ouverte et explique un refus du serveur', async () => {
    server.use(
      http.patch(apiUrl('/hierarchy/assignments/:id/'), () =>
        v1Error(403, 'appointment_forbidden', 'Votre office ne permet pas de nommer « Curé / administrateur paroissial ».'),
      ),
    );
    const user = userEvent.setup();
    await renderPage();

    await user.click(await screen.findByRole('button', { name: 'Modifier la qualité de Abbé Augustin Ndiaye' }));
    const dialog = await screen.findByRole('dialog', { name: 'Modifier la qualité' });
    await user.click(within(dialog).getByRole('radio', { name: 'Administrateur paroissial' }));
    await user.click(within(dialog).getByRole('button', { name: 'Enregistrer' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/votre office ne permet pas de nommer/i);
    expect(within(screen.getByRole('table', { hidden: true })).getByText('Curé')).toBeInTheDocument(); // inchangé
  });

  it('reste en lecture avec tableau_bord.voir seul : pas de bouton pour nommer', async () => {
    await renderPage(grantsSecretaire);

    expect(await screen.findByText('Consultation seule')).toBeInTheDocument();
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /nommer une personne/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /terminer la nomination/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /modifier la qualité/i })).not.toBeInTheDocument();
  });

  it('refuse l’écran sans aucune des deux capacités', async () => {
    await renderPage(grantsCure.filter(() => false));

    expect(await screen.findByText('Équipe et nominations : accès réservé')).toBeInTheDocument();
  });

  it('décrit les accès sensibles absents', () => {
    expect(withoutAccess(['actes.traiter', 'messagerie.recevoir_fideles', 'confessions.gerer'])).toBe('');
    expect(withoutAccess(['actes.traiter', 'messagerie.recevoir_fideles'])).toBe('Sans accès aux confessions.');
    expect(withoutAccess(['confessions.gerer'])).toBe('Sans accès aux demandes d’actes ni à la messagerie prêtre.');
  });
});
