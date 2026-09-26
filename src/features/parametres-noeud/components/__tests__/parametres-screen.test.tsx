import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';

import ParametresPage from '@/app/espace/[nodeId]/parametres/page';
import type { Grant } from '@/lib/capacites';
import { apiUrl } from '@/testing/mocks/api-url';
import { grantsSecretaire, ids } from '@/testing/mocks/db';
import { f8aState, resetF8a } from '@/testing/mocks/db-f8a';
import { f8aOverrides, v1Error } from '@/testing/mocks/handlers/f8a';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';
import { f8aHandlers } from '@/testing/mocks/handlers/f8a';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f8aHandlers));

/** Chancelier du diocèse : `structure.gerer` héritée sur la paroisse (suffit aussi pour le secrétariat). */
const grantsStructure: Grant[] = [...grantsSecretaire, { ...grantsSecretaire[0], capacite: 'structure.gerer', office: 'chancelier' }];

const renderPage = async (capacites: Grant[]) =>
  renderApp(await ParametresPage({ params: Promise.resolve({ nodeId: ids.saintDominique }) }), { capacites });

beforeEach(() => {
  resetF8a();
  server.use(...f8aOverrides);
});

describe('Paramètres (PAR-Parametres)', () => {
  it('présente l’identité, les lieux de culte et les CEB rattachées', async () => {
    await renderPage(grantsSecretaire);

    expect(await screen.findByRole('heading', { name: 'Paramètres de la paroisse', level: 1 })).toBeInTheDocument();
    const identity = screen.getByRole('region', { name: /identité/i });
    expect(within(identity).getByText('Saint-Dominique')).toBeInTheDocument();
    expect(within(identity).getByText('Érigé, le 07.10.1956')).toBeInTheDocument();
    expect(await within(identity).findByText('Archidiocèse de Dakar')).toBeInTheDocument();
    expect(await screen.findByText('Chapelle de la Cité universitaire')).toBeInTheDocument();
    expect(await screen.findByText('CEB Saint-Charles-Lwanga')).toBeInTheDocument();
  });

  it('permet au secrétariat (horaires.gerer) de modifier téléphone, accueil et demandes d’actes', async () => {
    const user = userEvent.setup();
    await renderPage(grantsSecretaire);

    const phone = await screen.findByLabelText('Téléphone');
    expect(phone).toBeEnabled();
    expect(screen.getByLabelText('Jours, créneau 2')).toHaveValue('Samedi');
    await user.clear(phone);
    await user.type(phone, '+221 33 864 21 07');
    await user.click(screen.getByRole('button', { name: 'Ajouter un créneau' }));
    await user.type(screen.getByLabelText('Jours, créneau 3'), 'Dimanche');
    await user.type(screen.getByLabelText('Heures, créneau 3'), 'Fermé');
    await user.clear(screen.getByLabelText(/délai indicatif/i));
    await user.type(screen.getByLabelText(/délai indicatif/i), '5');
    await user.click(screen.getByRole('switch', { name: 'Publier sur la fiche publique' }));
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText('Paramètres enregistrés.')).toBeInTheDocument();
    expect(f8aState.lastBody).toMatchObject({
      phone: '+221 33 864 21 07',
      office_hours: [
        { days: 'Lun. – ven.', hours: '9 h-12 h · 15 h 30-18 h' },
        { days: 'Samedi', hours: '9 h-12 h' },
        { days: 'Dimanche', hours: 'Fermé' },
      ],
      acts_delay_days: 5,
      secretariat_public: false,
    });
  });

  it('valide les champs avant l’envoi', async () => {
    const user = userEvent.setup();
    await renderPage(grantsSecretaire);

    const email = await screen.findByLabelText('Adresse e-mail');
    await user.clear(email);
    await user.type(email, 'pas-un-email');
    await user.clear(screen.getByLabelText(/délai indicatif/i));
    await user.type(screen.getByLabelText(/délai indicatif/i), '0');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText('Adresse e-mail invalide.')).toBeInTheDocument();
    expect(screen.getByText('Entre 1 et 90 jours.')).toBeInTheDocument();
    expect(f8aState.lastBody).toBeNull();
  });

  it('reporte sur le champ une erreur de validation du serveur', async () => {
    const user = userEvent.setup();
    await renderPage(grantsStructure);

    const email = await screen.findByLabelText('Adresse e-mail');
    await user.clear(email);
    await user.type(email, 'accueil@refuse.sn');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText('Cette adresse est refusée par le serveur.')).toBeInTheDocument();
  });

  it('affiche proprement un refus du serveur', async () => {
    server.use(
      http.patch(apiUrl('/hierarchy/nodes/:nodeId/settings/'), () => v1Error(403, 'permission_denied', 'Vous n’avez pas la capacité requise sur ce nœud.')),
    );
    const user = userEvent.setup();
    await renderPage(grantsSecretaire);

    await user.type(await screen.findByLabelText('Ville'), ' Plateau');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText('Vous n’avez pas la capacité de modifier ces paramètres.')).toBeInTheDocument();
  });

  it('refuse l’écran sans horaires.gerer', async () => {
    await renderPage(grantsSecretaire.filter((g) => g.capacite !== 'horaires.gerer'));

    expect(await screen.findByText('Paramètres : accès réservé')).toBeInTheDocument();
  });
});
