import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ParoleDuJour } from '@/features/public-parole/components/parole-du-jour';
import { navigation } from '@/testing/navigation';
import { renderApp } from '@/testing/test-utils';
import { f4PublicHandlers } from '@/testing/mocks/handlers/f4-public';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f4PublicHandlers));

beforeEach(() => navigation.push.mockReset());

describe('Parole du jour publique', () => {
  it('présente le jour liturgique et les lectures en onglets, avec la mention de droits', async () => {
    renderApp(<ParoleDuJour date="2026-09-24" />);

    expect(await screen.findByRole('heading', { level: 1, name: 'La Parole du jour' })).toBeInTheDocument();
    expect(screen.getByText('Jeudi 24 septembre 2026')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /jeudi de la 25 ?e semaine du temps ordinaire/i })).toBeInTheDocument();
    expect(screen.getAllByText(/bible crampon \(1923\), domaine public/i).length).toBeGreaterThan(0);

    const tabs = within(screen.getByRole('tablist', { name: 'Textes du jour' }));
    expect(tabs.getByRole('tab', { name: 'Lectures' })).toHaveAttribute('aria-selected', 'true');
    expect(tabs.getByRole('tab', { name: 'Psaume' })).toBeInTheDocument();
    expect(tabs.getByRole('tab', { name: 'Évangile' })).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 2, name: 'Première lecture : Ec 1, 2-11' })).toBeInTheDocument();
    expect(screen.getAllByText('Ec 1, 2-11').length).toBeGreaterThan(0);
    expect(screen.getByText(/une génération s’en va/i)).toBeInTheDocument();
    expect(screen.getAllByText('Parole du Seigneur.')).toHaveLength(1);
  });

  it('passe d’un onglet à l’autre, et propose le texte suivant', async () => {
    const user = userEvent.setup();
    renderApp(<ParoleDuJour date="2026-09-24" />);

    await user.click(await screen.findByRole('button', { name: /ensuite.*ps 89/i }));
    expect(screen.getByRole('tab', { name: 'Psaume' })).toHaveAttribute('aria-selected', 'true');
    expect(window.location.hash).toBe('#psaume');

    await user.click(screen.getByRole('tab', { name: 'Évangile' }));
    const panel = screen.getByRole('tabpanel', { name: 'Évangile' });
    expect(within(panel).getByText('Acclamons la Parole de Dieu.')).toBeInTheDocument();
  });

  it('affiche le texte AELF nettoyé, sans script', async () => {
    const { container } = renderApp(<ParoleDuJour date="2026-09-24" />);

    expect(await screen.findByText(/hérode le tétrarque/i)).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
  });

  it('navigue par semaine, par jour et par date choisie, la date restant dans l’URL', async () => {
    renderApp(<ParoleDuJour date="2026-09-24" />);

    const nav = within(await screen.findByRole('navigation', { name: 'Changer de jour' }));
    expect(nav.getByRole('link', { name: 'Semaine précédente' })).toHaveAttribute('href', '/parole?date=2026-09-17');
    expect(nav.getByRole('link', { name: 'Semaine suivante' })).toHaveAttribute('href', '/parole?date=2026-10-01');
    expect(nav.getByRole('link', { name: /aujourd.hui/i })).toHaveAttribute('href', '/parole');

    const week = within(screen.getByRole('navigation', { name: 'Jours de la semaine' }));
    expect(week.getAllByRole('link')).toHaveLength(7);
    expect(week.getByRole('link', { name: /jeudi 24 septembre/i })).toHaveAttribute('aria-current', 'date');
    expect(week.getByRole('link', { name: /vendredi 25 septembre/i })).toHaveAttribute('href', '/parole?date=2026-09-25');

    const picker = nav.getByLabelText('Choisir une date dans le calendrier');
    // Le calendrier natif n'est pas saisissable au clavier sous jsdom : on simule le choix d'une date.
    fireEvent.change(picker, { target: { value: '2026-09-20' } });
    expect(navigation.push).toHaveBeenLastCalledWith('/parole?date=2026-09-20');
  });

  it('montre le mois, jour par jour, et le dimanche suivant', async () => {
    const user = userEvent.setup();
    renderApp(<ParoleDuJour date="2026-09-24" />);

    const month = within(await screen.findByRole('region', { name: 'Septembre 2026' }));
    expect(month.getByRole('link', { name: /mercredi 30 septembre 2026/i })).toHaveAttribute('href', '/parole?date=2026-09-30');
    await user.click(month.getByRole('button', { name: 'Mois suivant' }));
    expect(await screen.findByRole('region', { name: 'Octobre 2026' })).toBeInTheDocument();

    expect(await screen.findByRole('link', { name: /27 sept\..*26 ?e dimanche du temps ordinaire/i })).toHaveAttribute('href', '/parole?date=2026-09-27');
  });

  it('copie le lien de la page du jour', async () => {
    const user = userEvent.setup();
    renderApp(<ParoleDuJour date="2026-09-24" />);

    await user.click(await screen.findByRole('button', { name: /copier le lien/i }));

    expect(await screen.findByText(/lien copié/i)).toBeInTheDocument();
    expect(await navigator.clipboard.readText()).toMatch(/\/parole\?date=2026-09-24$/);
  });

  it('affiche la date demandée quand elle change', async () => {
    const { rerender } = renderApp(<ParoleDuJour date="2026-09-24" />);
    await screen.findByRole('heading', { level: 2, name: /jeudi/i });

    rerender(<ParoleDuJour date="2026-09-27" />);

    expect(await screen.findByRole('heading', { level: 2, name: /26 ?e dimanche du temps ordinaire/i })).toBeInTheDocument();
    expect(screen.getByText(/année paire, cycle a/i)).toBeInTheDocument();
  });

  it('annonce des lectures pas encore disponibles sans masquer le calendrier', async () => {
    renderApp(<ParoleDuJour date="2026-10-02" />);

    expect(await screen.findByRole('heading', { level: 2, name: /vendredi de la 25 ?e semaine/i })).toBeInTheDocument();
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

    expect(await screen.findByRole('heading', { level: 2, name: /jeudi de la 25 ?e semaine/i })).toBeInTheDocument();
  });
});
