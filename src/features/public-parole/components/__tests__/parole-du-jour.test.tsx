import { fireEvent, screen, within } from '@testing-library/react';

import { ParoleDuJour } from '@/features/public-parole/components/parole-du-jour';
import { navigation } from '@/testing/navigation';
import { renderApp } from '@/testing/test-utils';
import { f4PublicHandlers } from '@/testing/mocks/handlers/f4-public';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f4PublicHandlers));

beforeEach(() => navigation.push.mockReset());

describe('Parole du jour publique', () => {
  it('présente le jour liturgique, le sommaire et les lectures, avec la mention de droits', async () => {
    renderApp(<ParoleDuJour date="2026-09-24" />);

    expect(await screen.findByRole('heading', { level: 1, name: /jeudi de la 25 ?e semaine du temps ordinaire/i })).toBeInTheDocument();
    expect(screen.getByText('Jeudi 24 septembre 2026')).toBeInTheDocument();
    expect(screen.getAllByText(/bible crampon \(1923\), domaine public/i).length).toBeGreaterThan(0);

    const toc = within(screen.getByRole('complementary', { name: 'Sommaire des lectures' }));
    expect(toc.getByRole('link', { name: /première lecture/i })).toHaveAttribute('href', '#lecture-1');
    expect(toc.getByRole('link', { name: /évangile/i })).toHaveAttribute('href', '#evangile');

    expect(screen.getByRole('heading', { level: 2, name: /première lecture : ec 1, 2-11/i })).toBeInTheDocument();
    expect(screen.getByText(/une génération s’en va/i)).toBeInTheDocument();
    expect(screen.getAllByText('Parole du Seigneur.')).toHaveLength(1);
    expect(screen.getByText('Acclamons la Parole de Dieu.')).toBeInTheDocument();
  });

  it('affiche le texte AELF nettoyé, sans script', async () => {
    const { container } = renderApp(<ParoleDuJour date="2026-09-24" />);

    expect(await screen.findByText(/hérode le tétrarque/i)).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
  });

  it('navigue vers la veille, le lendemain et une date choisie, la date restant dans l’URL', async () => {
    renderApp(<ParoleDuJour date="2026-09-24" />);

    const days = within(await screen.findByRole('navigation', { name: 'Changer de jour' }));
    expect(days.getByRole('link', { name: /mercredi 23 septembre/i })).toHaveAttribute('href', '/parole?date=2026-09-23');
    expect(days.getByRole('link', { name: /vendredi 25 septembre/i })).toHaveAttribute('href', '/parole?date=2026-09-25');
    expect(days.getByRole('link', { name: /aujourd.hui/i })).toHaveAttribute('href', '/parole');

    const picker = days.getByLabelText('Choisir une date dans le calendrier');
    // Le calendrier natif n'est pas saisissable au clavier sous jsdom : on simule le choix d'une date.
    fireEvent.change(picker, { target: { value: '2026-09-20' } });
    expect(navigation.push).toHaveBeenLastCalledWith('/parole?date=2026-09-20');

    const neighbours = within(screen.getByRole('navigation', { name: 'Jours voisins' }));
    expect(await neighbours.findByRole('link', { name: /lendemain.*vendredi de la 25 ?e semaine/i })).toHaveAttribute('href', '/parole?date=2026-09-25');
  });

  it('affiche la date demandée quand elle change', async () => {
    const { rerender } = renderApp(<ParoleDuJour date="2026-09-24" />);
    await screen.findByRole('heading', { level: 1, name: /jeudi/i });

    rerender(<ParoleDuJour date="2026-09-27" />);

    expect(await screen.findByRole('heading', { level: 1, name: /26 ?e dimanche du temps ordinaire/i })).toBeInTheDocument();
    expect(screen.getByText(/dimanche · semaine : année paire · dimanche : année a/i)).toBeInTheDocument();
  });

  it('annonce des lectures pas encore disponibles sans masquer le calendrier', async () => {
    renderApp(<ParoleDuJour date="2026-10-02" />);

    expect(await screen.findByRole('heading', { level: 1, name: /vendredi de la 25 ?e semaine/i })).toBeInTheDocument();
    expect(screen.getByText('Les lectures de ce jour ne sont pas encore disponibles.')).toBeInTheDocument();
    expect(screen.getAllByText(/domaine public/i).length).toBeGreaterThan(0);
  });

  it('explique une date sans liturgie', async () => {
    renderApp(<ParoleDuJour date="1999-01-01" />);

    expect(await screen.findByText('Aucune liturgie pour cette date.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /revenir à aujourd.hui/i })).toHaveAttribute('href', '/parole');
  });

  it('sans date, affiche la liturgie du jour', async () => {
    renderApp(<ParoleDuJour />);

    expect(await screen.findByRole('heading', { level: 1, name: /jeudi de la 25 ?e semaine/i })).toBeInTheDocument();
  });
});
