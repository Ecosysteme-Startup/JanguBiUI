import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { ChapeletView } from '@/features/chapelet/components/chapelet-view';
import { apiUrl } from '@/testing/mocks/api-url';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';
import { paroleHandlers } from '@/testing/mocks/handlers/parole';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...paroleHandlers));

const beadsList = () => screen.getByRole('list', { name: /progression de la dizaine/i });

describe('Chapelet guidé', () => {
  it('présente les mystères du jour et commence au Notre Père du premier mystère', async () => {
    renderApp(<ChapeletView />);

    expect(await screen.findByRole('heading', { level: 1, name: /les mystères lumineux/i })).toBeInTheDocument();
    expect(screen.getByText(/chapelet guidé · le jeudi/i)).toBeInTheDocument();
    expect(screen.getByText('Mystère 1 sur 5')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Le baptême de Jésus au Jourdain' })).toBeInTheDocument();
    expect(within(beadsList()).getByText('NP')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('button', { name: 'Grain précédent' })).toBeDisabled();
  });

  it('avance grain par grain, au bouton comme à la touche espace', async () => {
    const user = userEvent.setup();
    renderApp(<ChapeletView />);

    await user.click(await screen.findByRole('button', { name: 'Grain suivant' }));
    expect(beadsList()).toHaveAccessibleName('Progression de la dizaine : 1e Je vous salue Marie sur 10');
    expect(screen.getByText('Je vous salue Marie · 1e')).toBeInTheDocument();

    (document.activeElement as HTMLElement | null)?.blur();
    await user.keyboard(' ');
    expect(beadsList()).toHaveAccessibleName('Progression de la dizaine : 2e Je vous salue Marie sur 10');

    await user.click(screen.getByRole('button', { name: 'Grain précédent' }));
    expect(beadsList()).toHaveAccessibleName('Progression de la dizaine : 1e Je vous salue Marie sur 10');
  });

  it('passe au mystère suivant après le Gloire au Père et marque le précédent comme prié', async () => {
    const user = userEvent.setup();
    renderApp(<ChapeletView />);

    const next = await screen.findByRole('button', { name: 'Grain suivant' });
    for (let i = 0; i < 11; i += 1) await user.click(next);
    expect(screen.getByRole('region', { name: 'Gloire au Père' })).toHaveTextContent('en cours');

    await user.click(next);
    expect(screen.getByText('Mystère 2 sur 5')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Les noces de Cana' })).toBeInTheDocument();
    expect(screen.getByText(/2e mystère lumineux · Jn 2, 1-12/)).toBeInTheDocument();
    const liste = screen.getByRole('region', { name: 'Les cinq mystères' });
    expect(within(liste).getByText(/priée/)).toBeInTheDocument();
  });

  it('permet d’aller directement à un mystère puis de terminer le chapelet', async () => {
    const user = userEvent.setup();
    renderApp(<ChapeletView />);

    await user.click(await screen.findByRole('button', { name: /l’institution de l’eucharistie/i }));
    expect(screen.getByText('Mystère 5 sur 5')).toBeInTheDocument();

    for (let i = 0; i < 11; i += 1) await user.click(screen.getByRole('button', { name: 'Grain suivant' }));
    await user.type(screen.getByLabelText('Mon intention'), 'Pour ma famille');
    await user.click(screen.getByRole('button', { name: 'Terminer le chapelet' }));

    expect(screen.getByRole('heading', { name: /vous avez prié les mystères lumineux/i })).toBeInTheDocument();
    expect(screen.getByText('« Pour ma famille »')).toBeInTheDocument();
    expect(screen.getByText(/salut, ô reine, mère de miséricorde/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Recommencer' }));
    expect(screen.getByText('Mystère 1 sur 5')).toBeInTheDocument();
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
    expect(await screen.findByRole('heading', { level: 1, name: /les mystères lumineux/i })).toBeInTheDocument();
  });
});
