import { screen, within } from '@testing-library/react';

import { ParishSheet } from '@/features/public-annuaire/components/parish-sheet';
import { directoryHandler } from '@/testing/mocks/handlers/f4-public';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

beforeEach(() => server.use(directoryHandler));

describe('Fiche paroisse publique', () => {
  it('présente la paroisse, sa juridiction et ses actions', async () => {
    renderApp(<ParishSheet code="dak-saint-dominique" />);

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
