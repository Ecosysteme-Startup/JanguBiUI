import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ParishSheet } from '@/features/public-annuaire/components/parish-sheet';
import { directoryHandler } from '@/testing/mocks/handlers/f4-public';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';
import { f4PublicHandlers } from '@/testing/mocks/handlers/f4-public';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f4PublicHandlers));

beforeEach(() => server.use(directoryHandler));

describe('Fiche paroisse publique', () => {
  it('présente la paroisse, sa juridiction et ses actions', async () => {
    renderApp(<ParishSheet code="DAK-SAINT-DOMINIQUE" />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Paroisse Saint-Dominique' })).toBeInTheDocument();
    expect(screen.getByText(/avenue cheikh anta diop, point e, dakar\. doyenné plateau-médina, archidiocèse de dakar\./i)).toBeInTheDocument();
    const crumbs = await screen.findByRole('navigation', { name: 'Fil d’Ariane' });
    expect(within(crumbs).getByRole('link', { name: 'Paroisses' })).toHaveAttribute('href', '/paroisses');
    await waitFor(() => expect(crumbs).toHaveTextContent('Archidiocèse de Dakar'));
    expect(screen.getByRole('link', { name: 'Suivre cette paroisse' })).toHaveAttribute('href', '/inscription');
    expect(screen.getByRole('button', { name: 'Partager la fiche' })).toBeInTheDocument();
  });

  it('affiche les horaires du jour choisi et la semaine type, exceptions signalées', async () => {
    const user = userEvent.setup();
    renderApp(<ParishSheet code="DAK-SAINT-DOMINIQUE" />);

    const horaires = within(await screen.findByRole('region', { name: /horaires des messes/i }));
    expect(await horaires.findByText('Confessions')).toBeInTheDocument();
    await user.click(horaires.getByRole('button', { name: /dimanche 27 septembre/i }));
    expect(horaires.getByText('Messe des étudiants')).toBeInTheDocument();
    await user.click(horaires.getByRole('button', { name: /mercredi 30 septembre/i }));
    expect(horaires.getByText('Exceptionnel')).toBeInTheDocument();
    expect(horaires.getByText('Chaque semaine')).toBeInTheDocument();
    expect(horaires.getByText('7 h 30, 9 h 30 (messe des étudiants)')).toBeInTheDocument();
  });

  it('présente les lieux de culte avec leur itinéraire', async () => {
    renderApp(<ParishSheet code="DAK-SAINT-DOMINIQUE" />);

    const lieux = within(await screen.findByRole('region', { name: /lieux de culte/i }));
    expect(lieux.getByText('2 lieux')).toBeInTheDocument();
    expect(lieux.getByRole('link', { name: /itinéraire vers église saint-dominique/i })).toHaveAttribute('href', expect.stringContaining('openstreetmap.org'));
  });

  it('affiche les annonces publiques et les prochains événements', async () => {
    renderApp(<ParishSheet code="DAK-SAINT-DOMINIQUE" />);

    expect(await screen.findByRole('heading', { name: /quête impérée pour le grand séminaire/i })).toBeInTheDocument();
    expect(screen.getByText(/abbé augustin ndiaye · publiée le 22\.09/i)).toBeInTheDocument();
    expect(screen.getByText(/lues à la fin des messes du dimanche 27 septembre/i)).toBeInTheDocument();
    expect(await screen.findByText('Répétition de la chorale Sainte-Cécile')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /recevoir les annonces chaque dimanche/i })).toHaveAttribute('href', '/inscription');
  });

  it('affiche le secrétariat publié, le clergé et les démarches de la paroisse', async () => {
    renderApp(<ParishSheet code="DAK-SAINT-DOMINIQUE" />);

    const secretariat = within(await screen.findByRole('region', { name: 'Contact' }));
    expect(secretariat.getByRole('link', { name: '+221 33 864 21 07' })).toHaveAttribute('href', 'tel:+221338642107');
    expect(secretariat.getByRole('link', { name: 'secretariat.stdominique@example.sn' })).toHaveAttribute(
      'href',
      'mailto:secretariat.stdominique@example.sn',
    );
    expect(secretariat.getByText(/samedi, 9 h-12 h/i)).toBeInTheDocument();

    const clerge = within(screen.getByRole('region', { name: /clergé/i }));
    expect(clerge.getByText('Augustin Ndiaye')).toBeInTheDocument();
    expect(clerge.getByText('Administrateur paroissial')).toBeInTheDocument(); // titre réel, jamais la double forme
    expect(clerge.getByText('Emmanuel Tine')).toBeInTheDocument();
    expect(clerge.getByText(/aucun administrateur n.y a accès/i)).toBeInTheDocument();

    const demarches = within(screen.getByRole('region', { name: 'Démarches' }));
    expect(demarches.getByText(/original papier/i)).toBeInTheDocument();
    expect(demarches.getByRole('link', { name: 'Demander un extrait' })).toHaveAttribute('href', '/app/demandes/nouvelle');
    expect(demarches.getByRole('link', { name: 'Prendre rendez-vous' })).toHaveAttribute('href', '/app/confession');
    expect(await demarches.findByText(/samedi : confessions de 16 h à 18 h/i)).toBeInTheDocument();
  });

  it('n’affiche aucune coordonnée tant que le secrétariat n’est pas publié', async () => {
    renderApp(<ParishSheet code="DAK-P03" />);

    expect(await screen.findByText(/n.a pas encore publié les coordonnées de son secrétariat/i)).toBeInTheDocument();
    expect(screen.getByText(/aucun clerc n.est encore renseigné/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^\+221/ })).not.toBeInTheDocument();
  });

  it('indique qu’une paroisse sans horaires publiés n’est pas encore ouverte', async () => {
    renderApp(<ParishSheet code="DAK-P03" />);

    expect(await screen.findByRole('heading', { level: 1, name: /saint-joseph de médina/i })).toBeInTheDocument();
    expect(screen.getByText(/n.est pas encore ouverte sur jàngu bi/i)).toBeInTheDocument();
    expect(await screen.findByText(/aucun horaire n.est encore publié/i)).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Démarches' })).not.toBeInTheDocument();
    expect(await screen.findByText('Aucune annonce publiée pour le moment.')).toBeInTheDocument();
  });

  it('annonce une paroisse introuvable', async () => {
    renderApp(<ParishSheet code="INCONNUE" />);

    expect(await screen.findByText('Paroisse introuvable.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Chercher dans l’annuaire' })).toHaveAttribute('href', '/paroisses');
  });
});
