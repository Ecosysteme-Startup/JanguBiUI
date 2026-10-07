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
  it('ouvre l’Évangile par défaut, avec ses versets, l’acclamation, la notice de droits et la fiche du jour', async () => {
    serveToday();
    renderApp(<ParoleView />);

    const panel = await screen.findByRole('tabpanel');
    expect(within(panel).getByRole('heading', { name: 'Lc 9, 7-9' })).toBeInTheDocument();
    expect(within(panel).getByText(/hérode le tétrarque/i)).toBeInTheDocument();
    expect(within(panel).getByText('Acclamons la Parole de Dieu.')).toBeInTheDocument();
    expect(within(panel).getByText(/texte de la Bible Crampon \(1923\), domaine public/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'La Parole du jour' })).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.tagName === 'P' && /^jeudi 24 septembre 2026, jeudi de la 25e semaine/i.test(el.textContent ?? ''))).toBeInTheDocument();

    const fiche = screen.getByRole('region', { name: /jeudi de la 25/i });
    expect(within(fiche).getByText('Année paire, cycle A')).toBeInTheDocument();
    expect(within(fiche).getByText('Lc 9, 7-9')).toBeInTheDocument();
  });

  it('propose l’audio, la méditation publiée, le chapitre entier et les autres lectures', async () => {
    serveToday();
    const user = userEvent.setup();
    const { container } = renderApp(<ParoleView />);

    await screen.findByRole('tabpanel');
    expect(container.querySelector('audio')).toHaveAttribute('src', paroleDay.audio_url);
    const meditation = screen.getByRole('region', { name: 'Pour méditer' });
    expect(within(meditation).getByText('Compter nos jours, chercher le Christ.')).toBeInTheDocument();
    expect(within(meditation).getByText('Augustin Ndiaye')).toBeInTheDocument();
    expect(within(meditation).getByText(/chercher le Christ pour le suivre/i)).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /lire tout le chapitre de luc 9/i })).toHaveAttribute('href', '/app/bible/Luc/9');
    expect(screen.getByRole('link', { name: 'Chapelet' })).toHaveAttribute('href', '/app/chapelet');

    const autres = screen.getByRole('region', { name: /les autres lectures du jour/i });
    await user.click(within(autres).getByRole('button', { name: /première lecture · ec 1, 2-11/i }));
    const panel = screen.getByRole('tabpanel');
    expect(within(panel).getByRole('heading', { name: 'Ec 1, 2-11' })).toBeInTheDocument();
    expect(within(panel).getByText('Parole du Seigneur.')).toBeInTheDocument();
  });

  it('change de jour par l’URL : la semaine de la date est affichée et les flèches changent de semaine', async () => {
    renderApp(<ParoleView date="2026-09-23" />);

    expect(await screen.findByText((_, el) => el?.tagName === 'P' && /^mercredi 23 septembre 2026/i.test(el.textContent ?? ''))).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Changer de jour' });
    expect(within(nav).getByRole('link', { current: 'date' })).toHaveAttribute('href', '/app/parole?date=2026-09-23');
    expect(within(nav).getAllByRole('listitem')).toHaveLength(7);
    expect(within(nav).getByRole('link', { name: 'Semaine précédente' })).toHaveAttribute('href', '/app/parole?date=2026-09-16');
    expect(within(nav).getByRole('link', { name: 'Semaine suivante' })).toHaveAttribute('href', '/app/parole?date=2026-09-30');
    expect(screen.getByRole('link', { name: /revenir aux lectures d’aujourd’hui/i })).toHaveAttribute('href', '/app/parole');
  });

  it('dit clairement quand les lectures ne sont pas encore disponibles', async () => {
    renderApp(<ParoleView date="2026-09-23" />);

    expect(await screen.findByText('Les lectures de ce jour ne sont pas encore en ligne.')).toBeInTheDocument();
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
    for (const link of screen.getAllByRole('link', { name: 'Bible' })) expect(link).toHaveAttribute('href', '/app/bible');
  });

  it('affiche une erreur explicite et permet de réessayer', async () => {
    serveToday({ detail: 'Le service liturgique est indisponible.' }, 503);
    const user = userEvent.setup();
    renderApp(<ParoleView />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/impossible d’afficher les lectures/i);
    expect(screen.getByText('Le service liturgique est indisponible.')).toBeInTheDocument();

    serveToday();
    await user.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(await screen.findByRole('tabpanel')).toBeInTheDocument();
  });

  it('règle la taille du texte et passe d’une lecture à l’autre au clavier', async () => {
    serveToday();
    const user = userEvent.setup();
    renderApp(<ParoleView />);

    await screen.findByRole('tabpanel');
    await user.click(screen.getByRole('button', { name: 'Taille du texte : normal' }));
    expect(screen.getByRole('button', { name: 'Taille du texte : grand' })).toBeInTheDocument();

    const tabs = screen.getByRole('tablist', { name: 'Lectures du jour' });
    const gospel = within(tabs).getByRole('tab', { name: 'Évangile' });
    expect(gospel).toHaveAttribute('aria-selected', 'true');
    gospel.focus();
    await user.keyboard('{Home}');
    expect(within(tabs).getByRole('tab', { name: 'Lecture' })).toHaveAttribute('aria-selected', 'true');
    expect(within(screen.getByRole('tabpanel')).getByRole('heading', { name: 'Ec 1, 2-11' })).toBeInTheDocument();
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
