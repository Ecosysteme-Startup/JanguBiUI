import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { BibleHome } from '@/features/bible/components/bible-home';
import { ChapterReader } from '@/features/bible/components/chapter-reader';
import { apiUrl } from '@/testing/mocks/api-url';
import { paroleDay } from '@/testing/mocks/db-parole';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';
import { paroleHandlers } from '@/testing/mocks/handlers/parole';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...paroleHandlers));

// Sans Évangile du jour : la Bible s'ouvre sur le choix du livre.
const noGospel = () =>
  server.use(http.get(apiUrl('/liturgy/today/'), () => HttpResponse.json({ date: '2026-09-24', readings: [] })));

describe('Bible — choix du livre', () => {
  it('liste les livres par testament, groupés, et ouvre le chapitre 1', async () => {
    noGospel();
    const user = userEvent.setup();
    renderApp(<BibleHome />);

    const nav = await screen.findByRole('navigation', { name: 'Livres de la Bible' });
    expect(within(nav).getByRole('radio', { name: 'Nouveau' })).toHaveAttribute('aria-checked', 'true');
    expect(within(nav).getByRole('list', { name: 'Évangiles' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /luc/i })).toHaveAttribute('href', '/app/bible/luc/1');

    await user.click(within(nav).getByRole('radio', { name: 'Ancien' }));
    expect(within(nav).getByRole('link', { name: /ecclésiaste/i })).toHaveAttribute('href', '/app/bible/ecclesiaste/1');
    expect(screen.getByText('Choisissez un livre')).toBeInTheDocument();
  });

  it('ne crée pas de second défilement sur mobile : la liste suit la page, défilement interne seulement en lg (A11Y-17)', async () => {
    noGospel();
    renderApp(<BibleHome />);

    const nav = await screen.findByRole('navigation', { name: 'Livres de la Bible' });
    const list = within(nav).getByRole('list', { name: 'Évangiles' }).parentElement!;
    expect(list.className).not.toMatch(/(^|\s)(max-h-|overflow-y-auto)/);
    expect(list).toHaveClass('lg:max-h-[640px]', 'lg:overflow-y-auto');
  });

  it('filtre les livres par nom, cherche un mot et renvoie au verset trouvé', async () => {
    noGospel();
    const user = userEvent.setup();
    renderApp(<BibleHome />);

    await user.type(await screen.findByLabelText('Rechercher un livre ou un passage'), 'vanité');
    const results = await screen.findByRole('list', { name: 'Résultats de la recherche' });
    expect(within(results).getByRole('link', { name: /ecclésiaste 1, 2/i })).toHaveAttribute('href', '/app/bible/ecclesiaste/1#v2');
    expect(screen.getByText('1 verset trouvé')).toBeInTheDocument();
    expect(screen.getByText('Aucun livre de ce nom.')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Rechercher un livre ou un passage'));
    await user.type(screen.getByLabelText('Rechercher un livre ou un passage'), 'eccl');
    expect(screen.getByRole('link', { name: /ecclésiaste 12/i })).toHaveAttribute('href', '/app/bible/ecclesiaste/1');
  });

  it('signale une recherche sans résultat', async () => {
    noGospel();
    const user = userEvent.setup();
    renderApp(<BibleHome />);

    await user.type(await screen.findByLabelText('Rechercher un livre ou un passage'), 'zzzz');
    expect(await screen.findByText('Aucun verset trouvé.')).toBeInTheDocument();
  });

  it('affiche une erreur si la table des livres ne se charge pas', async () => {
    noGospel();
    server.use(http.get(apiUrl('/bible/testaments/'), () => HttpResponse.json({ detail: 'Service indisponible.' }, { status: 503 })));
    renderApp(<BibleHome />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/impossible d’ouvrir la bible/i);
  });

  it('s’ouvre sur le passage de l’Évangile du jour, puis le chapitre entier sur demande', async () => {
    server.use(
      http.get(apiUrl('/liturgy/today/'), () => HttpResponse.json(paroleDay)),
      http.get(apiUrl('/bible/books/:bookId/chapters/:chapter/verses/'), () =>
        HttpResponse.json({
          count: 4,
          next: null,
          previous: null,
          results: [6, 7, 9, 10].map((n) => ({ id: 4290 + n, number: n, text: `Verset ${n} de Luc 9.` })),
        }),
      ),
    );
    const user = userEvent.setup();
    renderApp(<BibleHome />);

    expect(await screen.findByRole('heading', { level: 2, name: 'Évangile selon saint Luc, chapitre 9' })).toBeInTheDocument();
    expect(await screen.findByText('Verset 7 de Luc 9.')).toBeInTheDocument();
    expect(screen.getByText('Ouvert au passage de l’Évangile du jour, versets 7 à 9.')).toBeInTheDocument();
    expect(screen.queryByText('Verset 6 de Luc 9.')).not.toBeInTheDocument();
    expect(screen.getByText('Suite du chapitre : versets 10 à 10')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Lire depuis le verset 1' }));
    expect(screen.getByText('Verset 6 de Luc 9.')).toBeInTheDocument();
    expect(screen.getByText('Verset 10 de Luc 9.')).toBeInTheDocument();
  });
});

describe('Bible — lecture d’un chapitre', () => {
  it('affiche les versets du chapitre et les chapitres voisins, d’un livre à l’autre', async () => {
    renderApp(<ChapterReader livre="ecclesiaste" chapitre={1} />);

    expect(await screen.findByRole('heading', { level: 2, name: 'Ecclésiaste, chapitre 1' })).toBeInTheDocument();
    const article = screen.getByRole('article', { name: 'Ecclésiaste, chapitre 1' });
    expect(await within(article).findByText(/il n’y a rien de nouveau sous le soleil/i)).toBeInTheDocument();

    const voisins = screen.getByRole('navigation', { name: 'Chapitres voisins' });
    expect(within(voisins).getByRole('link', { name: 'Proverbes 31' })).toHaveAttribute('href', '/app/bible/proverbes/31');
    expect(within(voisins).getByRole('link', { name: 'Ecclésiaste 2' })).toHaveAttribute('href', '/app/bible/ecclesiaste/2');

    const chapitres = screen.getByRole('group', { name: 'Chapitres : Ecclésiaste' });
    expect(within(chapitres).getAllByRole('link')).toHaveLength(12);
    expect(within(chapitres).getByRole('link', { current: 'page' })).toHaveTextContent('1');
  });

  it('résout un livre par son nom (liens des lectures du jour) et sélectionne un verset', async () => {
    const user = userEvent.setup();
    renderApp(<ChapterReader livre="Ecclésiaste" chapitre={1} />);

    await user.click(await screen.findByRole('button', { name: 'Verset 9' }));
    expect(screen.getByRole('button', { name: 'Verset 9' })).toHaveAttribute('aria-pressed', 'true');
    const actions = screen.getByRole('toolbar', { name: 'Ecclésiaste 1, 9' });
    expect(within(actions).getByRole('button', { name: 'Copier' })).toBeInTheDocument();
    expect(within(actions).getByRole('button', { name: 'Partager' })).toBeInTheDocument();
  });

  it('passe au livre suivant après le dernier chapitre', async () => {
    renderApp(<ChapterReader livre="ecclesiaste" chapitre={12} />);

    const voisins = await screen.findByRole('navigation', { name: 'Chapitres voisins' });
    expect(within(voisins).getByRole('link', { name: 'Ecclésiaste 11' })).toBeInTheDocument();
    expect(within(voisins).getByRole('link', { name: 'Luc 1' })).toHaveAttribute('href', '/app/bible/luc/1');
    expect(await screen.findByText('Le texte de ce chapitre n’est pas encore disponible.')).toBeInTheDocument();
  });

  it('explique un livre ou un chapitre inexistant', async () => {
    const { unmount } = renderApp(<ChapterReader livre="ecclesiaste" chapitre={40} />);
    expect(await screen.findByText('Ecclésiaste n’a pas de chapitre 40.')).toBeInTheDocument();
    unmount();

    renderApp(<ChapterReader livre="inconnu" chapitre={1} />);
    expect(await screen.findByText('Ce livre est introuvable.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Choisir un livre' })).toHaveAttribute('href', '/app/bible');
  });

  it('charge un long chapitre en une seule requête', async () => {
    const all = Array.from({ length: 176 }, (_, i) => ({ id: 9000 + i, number: i + 1, text: `Verset numéro ${i + 1}.` }));
    const requests: URL[] = [];
    server.use(
      http.get(apiUrl('/bible/books/:bookId/chapters/:chapter/verses/'), ({ request }) => {
        const url = new URL(request.url);
        requests.push(url);
        const limit = Math.min(Number(url.searchParams.get('limit') ?? 200), 200);
        return HttpResponse.json({ count: all.length, next: null, previous: null, results: all.slice(0, limit) });
      }),
    );
    renderApp(<ChapterReader livre="genese" chapitre={1} />);

    expect(await screen.findByText('Verset numéro 176.')).toBeInTheDocument();
    expect(screen.getByText(/genèse 1 · versets 1-176/i)).toBeInTheDocument();
    expect(requests).toHaveLength(1);
    expect(requests[0].searchParams.get('limit')).toBe('200');
  });
});
