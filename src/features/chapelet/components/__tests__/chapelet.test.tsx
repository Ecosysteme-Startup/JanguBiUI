import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { ChapeletView } from '@/features/chapelet/components/chapelet-view';
import { apiUrl } from '@/testing/mocks/api-url';
import { rosaryToday } from '@/testing/mocks/db-parole';
import { paroleHandlers } from '@/testing/mocks/handlers/parole';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...paroleHandlers));
beforeEach(() => window.localStorage.clear());
// Jeudi 24 septembre 2026 : les mystères lumineux sont ceux du jour.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-24T09:00:00'));
});
afterEach(() => vi.useRealTimers());

const beadsList = () => screen.getByRole('list', { name: /progression de la dizaine/i });

describe('Chapelet guidé', () => {
  it('présente les mystères du jour et commence au Notre Père du premier mystère', async () => {
    renderApp(<ChapeletView />);

    expect(await screen.findByRole('heading', { level: 2, name: 'Le baptême de Jésus au Jourdain' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Chapelet' })).toBeInTheDocument();
    expect(screen.getByText(/le jeudi, on médite les mystères lumineux\. votre avancée est gardée jusqu’à ce soir/i)).toBeInTheDocument();
    expect(screen.getByText('Premier mystère lumineux')).toBeInTheDocument();
    expect(screen.getByText('Dizaine 1 sur 5')).toBeInTheDocument();
    expect(within(beadsList()).getAllByRole('listitem')[0]).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('button', { name: 'Précédent' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Chapelet' })).toHaveAttribute('aria-current', 'page');
  });

  it('avance grain par grain, au bouton comme à la touche espace', async () => {
    const user = userEvent.setup();
    renderApp(<ChapeletView />);

    await user.click(await screen.findByRole('button', { name: 'Suivant' }));
    expect(beadsList()).toHaveAccessibleName('Progression de la dizaine : 1e Je vous salue Marie sur 10');
    expect(screen.getByText('Je vous salue Marie · 1 sur 10')).toBeInTheDocument();

    (document.activeElement as HTMLElement | null)?.blur();
    await user.keyboard(' ');
    expect(beadsList()).toHaveAccessibleName('Progression de la dizaine : 2e Je vous salue Marie sur 10');

    await user.click(screen.getByRole('button', { name: 'Précédent' }));
    expect(beadsList()).toHaveAccessibleName('Progression de la dizaine : 1e Je vous salue Marie sur 10');
  });

  it('passe au mystère suivant après le Gloire au Père et marque le précédent comme prié', async () => {
    const user = userEvent.setup();
    renderApp(<ChapeletView />);

    const next = await screen.findByRole('button', { name: 'Suivant' });
    for (let i = 0; i < 11; i += 1) await user.click(next);
    expect(beadsList()).toHaveAccessibleName(/gloire au père \(12 sur 12\)/i);

    await user.click(next);
    expect(screen.getByText('Dizaine 2 sur 5')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Les noces de Cana' })).toBeInTheDocument();
    expect(screen.getByText('Fruit du mystère : la confiance en Marie · Jn 2, 1-12')).toBeInTheDocument();
    const liste = screen.getByRole('region', { name: 'Les cinq mystères lumineux' });
    expect(within(liste).getByRole('button', { name: /le baptême de jésus au jourdain\s?, prié/i })).toBeInTheDocument();
    expect(within(liste).getByText('En cours · dizaine 2')).toBeInTheDocument();
  });

  it('garde l’avancée jusqu’au soir : un nouvel affichage reprend au même grain', async () => {
    const user = userEvent.setup();
    const { unmount } = renderApp(<ChapeletView />);

    const next = await screen.findByRole('button', { name: 'Suivant' });
    for (let i = 0; i < 3; i += 1) await user.click(next);
    unmount();

    renderApp(<ChapeletView />);
    expect(await screen.findByRole('list', { name: /3e je vous salue marie sur 10/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Recommencer le chapelet' }));
    expect(beadsList()).toHaveAccessibleName(/notre père \(1 sur 12\)/i);
  });

  it('permet d’aller directement à un mystère puis de terminer le chapelet', async () => {
    const user = userEvent.setup();
    renderApp(<ChapeletView />);

    await user.click(await screen.findByRole('button', { name: /l’institution de l’eucharistie/i }));
    expect(screen.getByText('Dizaine 5 sur 5')).toBeInTheDocument();

    for (let i = 0; i < 11; i += 1) await user.click(screen.getByRole('button', { name: 'Suivant' }));
    await user.type(screen.getByLabelText('Mon intention'), 'Pour ma famille');
    await user.click(screen.getByRole('button', { name: 'Terminer le chapelet' }));

    expect(screen.getByRole('heading', { name: /vous avez prié les mystères lumineux/i })).toBeInTheDocument();
    expect(screen.getByText('« Pour ma famille »')).toBeInTheDocument();
    expect(screen.getByText(/salut, ô reine, mère de miséricorde/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Recommencer' }));
    expect(screen.getByText('Dizaine 1 sur 5')).toBeInTheDocument();
  });

  it('propose les mystères des autres jours et prie ceux du jour demandé', async () => {
    const joyeux = {
      ...rosaryToday,
      day: { ...rosaryToday.day, weekday: 0, weekday_display: 'Lundi', group: { ...rosaryToday.day.group, name: 'Joyeux', slug: 'joyeux' } },
    };
    server.use(http.get(apiUrl('/rosary/day/:day/'), ({ params }) => (params.day === '0' ? HttpResponse.json(joyeux) : HttpResponse.json({}, { status: 404 }))));
    const { unmount } = renderApp(<ChapeletView />);

    const jours = await screen.findByRole('region', { name: 'Les mystères selon les jours' });
    expect(within(jours).getByRole('link', { name: 'Prier les mystères joyeux' })).toHaveAttribute('href', '/app/chapelet?jour=0');
    unmount();

    renderApp(<ChapeletView jour={0} />);
    expect(await screen.findByText(/vous priez les mystères joyeux, ceux du lundi et du samedi/i)).toBeInTheDocument();
    expect(screen.getByText('Premier mystère joyeux')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Revenir aux mystères du jour' })).toHaveAttribute('href', '/app/chapelet');
  });

  it('explique que le chapelet du jour n’est pas encore configuré (404)', async () => {
    server.use(
      http.get(apiUrl('/rosary/today/'), () =>
        HttpResponse.json({ error: 'Les données du chapelet pour aujourd’hui ne sont pas encore configurées.' }, { status: 404 }),
      ),
    );
    renderApp(<ChapeletView />);

    expect(await screen.findByText('Le chapelet du jour n’est pas encore disponible.')).toBeInTheDocument();
  });

  it('affiche une erreur et permet de réessayer', async () => {
    server.use(http.get(apiUrl('/rosary/today/'), () => HttpResponse.json({ detail: 'Service indisponible.' }, { status: 500 }), { once: true }));
    const user = userEvent.setup();
    renderApp(<ChapeletView />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/impossible d’afficher le chapelet/i);
    await user.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Le baptême de Jésus au Jourdain' })).toBeInTheDocument();
  });
});
