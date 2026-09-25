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

const grantsCure: Grant[] = ['offices.nommer', 'tableau_bord.voir', 'actes.traiter'].map((capacite) => ({
  capacite,
  node_id: ids.saintDominique,
  node_name: 'Saint-Dominique',
  node_type: 'paroisse',
  herite: false,
  office: 'cure',
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

  it('nomme une personne, avec l’aperçu des capacités de l’office', async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.click(await screen.findByRole('button', { name: /nommer une personne/i }));
    const panel = await screen.findByRole('region', { name: 'Nommer une personne' });
    await user.type(within(panel).getByLabelText(/identifiant de la personne/i), '5f0c0000-0000-4000-8000-0000000000bb');
    await user.selectOptions(await within(panel).findByLabelText(/^office/i), 'Catéchiste');
    expect(within(panel).getByText('Sans accès aux demandes d’actes, à la messagerie prêtre ni aux confessions.', { exact: false })).toBeInTheDocument();
    expect(within(panel).getByRole('list', { name: 'Capacités' })).toHaveTextContent(/Événements.*Annonces/);
    await user.type(within(panel).getByLabelText(/justificatif/i), 'Lettre de mission du 22.09');
    await user.click(within(panel).getByRole('button', { name: 'Nommer' }));

    await vi.waitFor(() => expect(screen.queryByRole('region', { name: 'Nommer une personne' })).not.toBeInTheDocument());
    expect(f8aState.lastBody).toMatchObject({
      person_id: '5f0c0000-0000-4000-8000-0000000000bb',
      office: 'catechiste',
      node_id: ids.saintDominique,
      decree_ref: 'Lettre de mission du 22.09',
      end_date: null,
    });
    expect(await screen.findByText('Élisabeth Gomis')).toBeInTheDocument();
  });

  it('valide l’identifiant et l’office', async () => {
    const user = userEvent.setup();
    await renderPage();
    await user.click(await screen.findByRole('button', { name: /nommer une personne/i }));
    const panel = await screen.findByRole('region', { name: 'Nommer une personne' });

    await user.type(within(panel).getByLabelText(/identifiant de la personne/i), 'Élisabeth');
    await user.click(within(panel).getByRole('button', { name: 'Nommer' }));

    expect(await within(panel).findByText('Identifiant invalide : 36 caractères, tirets compris.')).toBeInTheDocument();
    expect(within(panel).getByText('Choisissez l’office.')).toBeInTheDocument();
  });

  it('explique un refus pour MFA manquante', async () => {
    server.use(http.post(apiUrl('/hierarchy/assignments/'), () => v1Error(403, 'mfa_required', 'Authentification à deux facteurs requise.')));
    const user = userEvent.setup();
    await renderPage();
    await user.click(await screen.findByRole('button', { name: /nommer une personne/i }));
    const panel = await screen.findByRole('region', { name: 'Nommer une personne' });
    await user.type(within(panel).getByLabelText(/identifiant de la personne/i), '5f0c0000-0000-4000-8000-0000000000bb');
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

  it('reste en lecture avec tableau_bord.voir seul : pas de bouton pour nommer', async () => {
    await renderPage(grantsSecretaire);

    expect(await screen.findByText('Consultation seule')).toBeInTheDocument();
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /nommer une personne/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /terminer la nomination/i })).not.toBeInTheDocument();
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
