import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, type JsonBodyType } from 'msw';

import { ParoleView } from '@/features/parole/components/parole-view';
import { apiUrl } from '@/testing/mocks/api-url';
import { paroleDay } from '@/testing/mocks/db-parole';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';
import { paroleHandlers } from '@/testing/mocks/handlers/parole';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...paroleHandlers));

const serveToday = (body: JsonBodyType = paroleDay, status = 200) =>
  server.use(http.get(apiUrl('/liturgy/today/'), () => HttpResponse.json(body, { status })));

describe('ParoleView — lectures du jour', () => {
  it('affiche les lectures du jour avec leurs versets, l’acclamation et la notice de droits', async () => {
    serveToday();
    renderApp(<ParoleView />);

    const article = await screen.findByRole('article', { name: /lectures de la messe du jeudi 24 septembre 2026/i });
    expect(within(article).getByRole('heading', { name: 'Ecclésiaste' })).toBeInTheDocument();
    expect(within(article).getByRole('heading', { name: 'Psaumes' })).toBeInTheDocument();
    expect(within(article).getByRole('heading', { name: 'Luc' })).toBeInTheDocument();
    expect(within(article).getByText(/une génération s’en va/i)).toBeInTheDocument();
    expect(within(article).getByText('— Parole du Seigneur.')).toBeInTheDocument();
    expect(within(article).getByText('— Acclamons la Parole de Dieu.')).toBeInTheDocument();
    expect(screen.getByText(/texte de la Bible Crampon \(1923\), domaine public/i)).toBeInTheDocument();
    expect(screen.getByText(/férie · jeudi de la 25e semaine du temps ordinaire · année paire/i)).toBeInTheDocument();
  });

  it('propose l’audio, la méditation publiée et les prolongements vers la Bible et le chapelet', async () => {
    serveToday();
    const { container } = renderApp(<ParoleView />);

    await screen.findByRole('article');
    expect(container.querySelector('audio')).toHaveAttribute('src', paroleDay.audio_url);
    const meditation = screen.getByRole('region', { name: 'Méditation du jour' });
    expect(within(meditation).getByText('Compter nos jours, chercher le Christ.')).toBeInTheDocument();
    expect(await within(meditation).findByText('Augustin Ndiaye')).toBeInTheDocument();
    expect(within(meditation).getByText(/chercher le Christ pour le suivre/i)).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /ouvrir ecclésiaste, chapitre 1/i })).toHaveAttribute(
      'href',
      '/app/bible/Eccl%C3%A9siaste/1',
    );
    expect(screen.getByRole('link', { name: /chapelet du jeudi.*mystères lumineux/i })).toHaveAttribute('href', '/app/chapelet');
  });

  it('change de jour par l’URL : la date demandée est chargée et la navigation pointe vers les jours voisins', async () => {
    renderApp(<ParoleView date="2026-09-23" />);

    expect(await screen.findByText(/la parole · mercredi 23 septembre 2026/i)).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Changer de jour' });
    expect(within(nav).getByRole('link', { current: 'date' })).toHaveAttribute('href', '/app/parole?date=2026-09-23');
    expect(within(nav).getByRole('link', { name: 'Jour précédent' })).toHaveAttribute('href', '/app/parole?date=2026-09-22');
    expect(within(nav).getByRole('link', { name: 'Jour suivant' })).toHaveAttribute('href', '/app/parole?date=2026-09-24');
    expect(screen.getByRole('link', { name: /revenir aux lectures d’aujourd’hui/i })).toHaveAttribute('href', '/app/parole');
  });

  it('dit clairement quand les lectures ne sont pas encore disponibles', async () => {
    renderApp(<ParoleView date="2026-09-23" />);

    expect(await screen.findByText('Les lectures de ce jour ne sont pas encore en ligne.')).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Bible' })).toHaveAttribute('href', '/app/bible');
  });

  it('affiche une erreur explicite et permet de réessayer', async () => {
    serveToday({ detail: 'Le service liturgique est indisponible.' }, 503);
    const user = userEvent.setup();
    renderApp(<ParoleView />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/impossible d’afficher les lectures/i);
    expect(screen.getByText('Le service liturgique est indisponible.')).toBeInTheDocument();

    serveToday();
    await user.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(await screen.findByRole('article')).toBeInTheDocument();
  });

  it('règle la taille du texte et, sur mobile, montre une lecture à la fois (Évangile par défaut)', async () => {
    serveToday();
    const user = userEvent.setup();
    renderApp(<ParoleView />);

    await screen.findByRole('article');
    expect(screen.getByRole('button', { name: 'Texte grand' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Texte très grand' }));
    expect(screen.getByRole('button', { name: 'Texte très grand' })).toHaveAttribute('aria-pressed', 'true');

    const tabs = screen.getByRole('tablist', { name: 'Lectures du jour' });
    expect(within(tabs).getByRole('tab', { name: /évangile/i })).toHaveAttribute('aria-selected', 'true');
    await user.click(within(tabs).getByRole('tab', { name: /première lecture/i }));
    expect(within(tabs).getByRole('tab', { name: /première lecture/i })).toHaveAttribute('aria-selected', 'true');
    expect(document.getElementById('lecture-1')).not.toHaveClass('hidden');
    expect(document.getElementById('lecture-3')).toHaveClass('hidden');
  });

  it('assainit le texte AELF avant de l’afficher', async () => {
    serveToday({
      ...paroleDay,
      source: 'aelf',
      edition: null,
      readings: [{ type: 'evangile', citation: 'Lc 9, 7-9', text: '<p>Hérode entendit parler.</p><img src="x" onerror="alert(1)"><script>alert(2)</script>', verses: [] }],
    });
    const { container } = renderApp(<ParoleView />);

    expect(await screen.findByText('Hérode entendit parler.')).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')?.getAttribute('onerror')).toBeFalsy();
  });
});
