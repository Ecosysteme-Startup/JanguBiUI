import { screen, within } from '@testing-library/react';

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
    expect(screen.getByText('Avenue Cheikh Anta Diop, Point E, Dakar')).toBeInTheDocument();
    expect(await screen.findByRole('navigation', { name: 'Fil d’Ariane' })).toHaveTextContent('Archidiocèse de Dakar');
    expect(screen.getByRole('link', { name: 'Suivre cette paroisse' })).toHaveAttribute('href', '/inscription');
    expect(screen.getByRole('link', { name: /itinéraire/i })).toHaveAttribute('href', expect.stringContaining('openstreetmap.org'));
    expect(screen.getByRole('link', { name: /retour · annuaire/i })).toHaveAttribute('href', '/paroisses');
  });

  it('affiche les horaires de la semaine par lieu de culte, exceptions signalées', async () => {
    renderApp(<ParishSheet code="DAK-SAINT-DOMINIQUE" />);

    const horaires = within(await screen.findByRole('region', { name: /horaires des messes/i }));
    expect(await horaires.findByRole('heading', { name: 'Église Saint-Dominique' })).toBeInTheDocument();
    expect(horaires.getByText('16 h-18 h confessions')).toBeInTheDocument();
    expect(horaires.getByText('9 h 30 messe des étudiants')).toBeInTheDocument();
    expect(horaires.getByRole('heading', { name: 'Chapelle de la Cité universitaire' })).toBeInTheDocument();
    expect(horaires.getByText('exceptionnel')).toBeInTheDocument();
  });

  it('affiche les annonces publiques et les prochains événements', async () => {
    renderApp(<ParishSheet code="DAK-SAINT-DOMINIQUE" />);

    expect(await screen.findByRole('heading', { name: /quête impérée pour le grand séminaire/i })).toBeInTheDocument();
    expect(screen.getByText(/abbé augustin ndiaye · publiée le 22\.09/i)).toBeInTheDocument();
    expect(await screen.findByText('Répétition de la chorale Sainte-Cécile')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /recevoir les annonces chaque dimanche/i })).toHaveAttribute('href', '/inscription');
  });

  it('affiche la juridiction, le secrétariat publié et le clergé de la paroisse', async () => {
    renderApp(<ParishSheet code="DAK-SAINT-DOMINIQUE" />);

    expect(await screen.findByText('Doyenné Plateau-Médina')).toBeInTheDocument();
    const secretariat = within(screen.getByRole('region', { name: /secrétariat/i }));
    expect(secretariat.getByRole('link', { name: '+221 33 864 21 07' })).toHaveAttribute('href', 'tel:+221338642107');
    expect(secretariat.getByRole('link', { name: 'secretariat.stdominique@example.sn' })).toHaveAttribute(
      'href',
      'mailto:secretariat.stdominique@example.sn',
    );
    expect(secretariat.getByText('Samedi')).toBeInTheDocument();
    expect(secretariat.getByText('9 h-12 h')).toBeInTheDocument();

    const clerge = within(screen.getByRole('region', { name: /clergé/i }));
    expect(clerge.getByText('Augustin Ndiaye')).toBeInTheDocument();
    expect(clerge.getByText('Curé / administrateur paroissial')).toBeInTheDocument();
    expect(clerge.getByText('Emmanuel Tine')).toBeInTheDocument();
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
    expect(await screen.findByText('Aucune annonce publiée pour le moment.')).toBeInTheDocument();
  });

  it('annonce une paroisse introuvable', async () => {
    renderApp(<ParishSheet code="INCONNUE" />);

    expect(await screen.findByText('Paroisse introuvable.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Chercher dans l’annuaire' })).toHaveAttribute('href', '/paroisses');
  });
});
