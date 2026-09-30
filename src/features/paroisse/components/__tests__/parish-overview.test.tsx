import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { ParishOverview } from '@/features/paroisse/components/parish-overview';
import { apiUrl } from '@/testing/mocks/api-url';
import { me } from '@/testing/mocks/db';
import { announcements, resetF5bState } from '@/testing/mocks/db-f5b';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';
import { f5bHandlers } from '@/testing/mocks/handlers/f5b';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f5bHandlers));

beforeEach(() => resetF5bState());

describe('Ma paroisse (/app/paroisse)', () => {
  it('présente la paroisse suivie : prochaines messes, annonces récentes, événements, lieux, clergé', async () => {
    renderApp(<ParishOverview />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Paroisse Saint-Dominique' })).toBeInTheDocument();
    expect(await screen.findByText(/point e, dakar · archidiocèse de dakar/i)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Aperçu', selected: true })).toBeInTheDocument();

    const messes = await screen.findByRole('region', { name: 'Prochaines messes' });
    expect(within(messes).getAllByRole('listitem').length).toBeGreaterThan(0);

    const annonces = screen.getByRole('region', { name: 'Annonces récentes' });
    expect(within(annonces).getByRole('link', { name: /quête impérée/i })).toBeInTheDocument();
    expect(within(annonces).getAllByRole('listitem')).toHaveLength(3);

    const evenements = screen.getByRole('region', { name: 'Événements à venir' });
    expect(within(evenements).getByRole('link', { name: /journée de récollection des ceb/i })).toHaveAttribute('href', '/app/paroisse/evenements/42');

    const lieux = screen.getByRole('region', { name: 'Lieux de culte' });
    expect(within(lieux).getByText('Église Saint-Dominique')).toBeInTheDocument();
    expect(within(lieux).getByText('2 lieux')).toBeInTheDocument();

    const clerge = screen.getByRole('region', { name: /clergé et secrétariat/i });
    expect(await within(clerge).findByRole('link', { name: /écrire à emmanuel tine/i })).toBeInTheDocument();
    expect(within(clerge).getByText('Messages chiffrés, aucun administrateur n’y a accès.')).toBeInTheDocument();

    const actes = screen.getByRole('region', { name: 'Extrait d’acte' });
    expect(within(actes).getByRole('link', { name: 'Demander un extrait' })).toHaveAttribute('href', '/app/demandes/nouvelle');
  });

  it('ouvre l’onglet Horaires depuis « Tous les horaires » et l’inscrit dans l’ancre', async () => {
    const user = userEvent.setup();
    renderApp(<ParishOverview />);

    await user.click(await screen.findByRole('link', { name: 'Tous les horaires' }));

    expect(screen.getByRole('tab', { name: 'Horaires', selected: true })).toBeInTheDocument();
    expect(window.location.hash).toBe('#horaires');
    const horaires = await screen.findByRole('region', { name: /horaires de la semaine/i });
    expect(within(horaires).getByRole('heading', { name: 'Église Saint-Dominique' })).toBeInTheDocument();
    expect(within(horaires).getByText(/16 h-18 h/)).toBeInTheDocument();
    expect(within(horaires).getByText(/adoration du jeudi/i)).toBeInTheDocument();
  });

  it('ouvre directement l’onglet de l’ancre (#agenda)', async () => {
    window.history.replaceState(null, '', '/app/paroisse#agenda');
    renderApp(<ParishOverview />);

    const agenda = await screen.findByRole('region', { name: 'Agenda' });
    expect(await within(agenda).findByRole('link', { name: /journée de récollection des ceb/i })).toBeInTheDocument();
    window.history.replaceState(null, '', '/');
  });

  it('filtre les annonces du dimanche (onglet Annonces)', async () => {
    const user = userEvent.setup();
    renderApp(<ParishOverview />);

    await user.click(await screen.findByRole('tab', { name: /annonces/i }));
    const annonces = await screen.findByRole('region', { name: /^annonces/i });
    await user.click(await within(annonces).findByRole('button', { name: /annonces du dimanche/i }));

    expect(within(annonces).getAllByRole('listitem')).toHaveLength(1);
    expect(within(annonces).getByRole('link', { name: /quête impérée/i })).toBeInTheDocument();
    window.history.replaceState(null, '', '/');
  });

  it('affiche le clergé titré et le secrétariat publiés sur la fiche de la paroisse', async () => {
    server.use(
      http.get(apiUrl('/public/nodes/by-code/SD/'), () =>
        HttpResponse.json({
          id: me.paroisse_suivie.id,
          code: 'SD',
          deanery_name: null,
          diocese_name: 'Archidiocèse de Dakar',
          secretariat: { phone: '+221 33 825 47 12', email: 'secretariat@saintdominique.sn', office_hours: [{ days: 'Du lundi au vendredi', hours: '9 h-12 h' }] },
          clergy: [
            { name: 'Augustin Ndiaye', office: 'Curé' },
            { name: 'Emmanuel Tine', office: 'Vicaire paroissial' },
          ],
          acts: { delay_days: null, welcome_message: '' },
        }),
      ),
    );
    renderApp(<ParishOverview />);

    const clerge = await screen.findByRole('region', { name: /clergé et secrétariat/i });
    expect(await within(clerge).findByText('Curé')).toBeInTheDocument();
    expect(within(clerge).getByText('Vicaire paroissial')).toBeInTheDocument();
    // Seuls les prêtres joignables par message ont « Écrire ».
    expect(within(clerge).getAllByRole('link', { name: /^écrire à/i })).toHaveLength(1);

    const contact = screen.getByRole('region', { name: 'Contact' });
    expect(within(contact).getByRole('link', { name: '+221 33 825 47 12' })).toHaveAttribute('href', 'tel:+221338254712');
    expect(within(contact).getByRole('link', { name: 'secretariat@saintdominique.sn' })).toBeInTheDocument();
    expect(within(contact).getByText(/secrétariat du lundi au vendredi, 9 h-12 h/i)).toBeInTheDocument();
  });

  it('invite à choisir une paroisse quand aucune n’est suivie', async () => {
    server.use(http.get(apiUrl('/me/'), () => HttpResponse.json({ ...me, paroisse_suivie: null })));
    renderApp(<ParishOverview />);

    expect(await screen.findByText('Vous ne suivez encore aucune paroisse.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /choisir ma paroisse/i })).toHaveAttribute('href', '/app/profil');
  });

  it('accepte la réponse réelle de /me/ (paroisse sans code ni type)', async () => {
    server.use(
      http.get(apiUrl('/me/'), () => HttpResponse.json({ ...me, paroisse_suivie: { id: me.paroisse_suivie.id, name: 'Saint-Dominique' } })),
    );
    renderApp(<ParishOverview />);

    expect(await screen.findByRole('heading', { level: 1, name: /saint-dominique/i })).toBeInTheDocument();
  });

  it('met en tête les annonces épinglées de la paroisse, marquées « Épinglée »', async () => {
    const base = announcements.map((a) => ({ ...a, is_pinned: false }));
    // Le serveur renvoie l’épinglée en dernier : la page la remonte quand même.
    const pinned = { ...base[2], is_pinned: true };
    server.use(http.get(apiUrl('/news/'), () => HttpResponse.json({ count: 3, next: null, previous: null, results: [base[0], base[1], pinned] })));
    renderApp(<ParishOverview />);

    const annonces = await screen.findByRole('region', { name: 'Annonces récentes' });
    const rows = within(annonces).getAllByRole('listitem');
    expect(within(rows[0]).getByRole('link', { name: /inscriptions au catéchisme/i })).toBeInTheDocument();
    expect(within(rows[0]).getByText('Épinglée')).toBeInTheDocument();
    expect(within(rows[1]).queryByText('Épinglée')).not.toBeInTheDocument();
  });

  it('signale une erreur de chargement des annonces', async () => {
    server.use(http.get(apiUrl('/news/'), () => HttpResponse.json({}, { status: 500 })));
    renderApp(<ParishOverview />);

    expect(await screen.findByText('Les annonces n’ont pas pu être chargées.')).toBeInTheDocument();
  });
});
