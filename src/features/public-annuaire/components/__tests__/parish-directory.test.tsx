import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { useState } from 'react';

import { ParishDirectory } from '@/features/public-annuaire/components/parish-directory';
import { type DirectoryFilters, parseFilters } from '@/features/public-annuaire/utils/filters';
import { apiUrl } from '@/testing/mocks/api-url';
import { ids } from '@/testing/mocks/db';
import { directoryHandler } from '@/testing/mocks/handlers/f4-public';
import { server } from '@/testing/mocks/server';
import { navigation } from '@/testing/navigation';
import { renderApp } from '@/testing/test-utils';
import { f4PublicHandlers } from '@/testing/mocks/handlers/f4-public';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f4PublicHandlers));

/** Page de l'annuaire : l'URL (routeur simulé) redonne ses filtres au composant, comme le fait Next. */
const DirectoryPage = ({ initial = '' }: { initial?: string }) => {
  const [filters, setFilters] = useState<DirectoryFilters>(() => parseFilters(Object.fromEntries(new URLSearchParams(initial))));
  navigation.replace.mockImplementation((href: string) => {
    setFilters(parseFilters(Object.fromEntries(new URL(href, 'http://localhost').searchParams)));
  });
  return <ParishDirectory filters={filters} />;
};

const list = () => within(screen.getByRole('region', { name: 'Liste des paroisses' }));

beforeEach(() => {
  // Horloge figée avant la dernière messe de la semaine type (2026-09-30) : la « prochaine messe » existe.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-27T12:00:00Z'));
  server.use(directoryHandler);
  navigation.pathname = '/paroisses';
  navigation.replace.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Annuaire des paroisses', () => {
  it('liste les paroisses, avec leur présence sur Jàngu Bi et un lien vers leur fiche', async () => {
    renderApp(<DirectoryPage />);

    expect(await screen.findByText('12 paroisses')).toBeInTheDocument();
    expect(await screen.findByText(/, dont 1 sur jàngu bi/i)).toBeInTheDocument();
    const link = list().getByRole('link', { name: /saint-dominique/i });
    expect(link).toHaveAttribute('href', '/paroisses/DAK-SAINT-DOMINIQUE');
    expect(link).toHaveTextContent('Sur Jàngu Bi');
    expect(list().getByRole('link', { name: /saint-joseph de médina/i })).toHaveTextContent('Annuaire diocésain');
    expect(list().getAllByRole('listitem')).toHaveLength(10);
  });

  it('affiche le lieu, le doyenné et la prochaine messe (ou les messes du dimanche)', async () => {
    // Date figée : la dernière messe à venir du jeu de test est le 30/09/2026 à 19 h 15. Sur l'horloge
    // réelle, le test échouait à partir de ce moment-là (plus de « prochaine messe », repli sur le dimanche).
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-09-29T10:00:00Z') });
    onTestFinished(() => {
      vi.useRealTimers();
    });
    renderApp(<DirectoryPage />);

    expect(await screen.findByText('12 paroisses')).toBeInTheDocument();
    const link = list().getByRole('link', { name: /saint-dominique/i });
    expect(link).toHaveTextContent('Avenue Cheikh Anta Diop, Point E, Dakar · doyenné Plateau-Médina');
    await waitFor(() => expect(link).toHaveTextContent(/prochaine messe/i));
    expect(list().getByRole('link', { name: /saint-joseph de médina/i })).not.toHaveTextContent(/messe/i);
  });

  it('pagine par dix et garde la page dans l’URL', async () => {
    const user = userEvent.setup();
    renderApp(<DirectoryPage />);

    expect(await screen.findByText('1–10 sur 12')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Page suivante' }));

    expect(navigation.replace).toHaveBeenLastCalledWith('/paroisses?page=2', { scroll: false });
    expect(await screen.findByText('11–12 sur 12')).toBeInTheDocument();
    await waitFor(() => expect(list().getAllByRole('listitem')).toHaveLength(2));
  });

  it('recherche par nom ou quartier, puis retire le filtre', async () => {
    const user = userEvent.setup();
    renderApp(<DirectoryPage />);
    await screen.findByText('12 paroisses');

    await user.type(screen.getByLabelText('Rechercher'), 'Médina');

    expect(await screen.findByText('1 paroisse')).toBeInTheDocument();
    expect(navigation.replace).toHaveBeenLastCalledWith('/paroisses?q=M%C3%A9dina', { scroll: false });
    expect(list().getByRole('link', { name: /saint-joseph de médina/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Effacer les filtres' }));
    expect(await screen.findByText('12 paroisses')).toBeInTheDocument();
    expect(screen.getByLabelText('Rechercher')).toHaveValue('');
  });

  it('filtre par diocèse puis par doyenné (sous-arbre)', async () => {
    const user = userEvent.setup();
    renderApp(<DirectoryPage />);
    await screen.findByText('12 paroisses');

    await user.selectOptions(await screen.findByLabelText('Diocèse'), 'Diocèse de Thiès');
    expect(await screen.findByText('1 paroisse')).toBeInTheDocument();
    expect(list().getByRole('link', { name: /sainte-anne de thiès/i })).toBeInTheDocument();
    expect(navigation.replace).toHaveBeenLastCalledWith(`/paroisses?diocese=${ids.thies}`, { scroll: false });

    await user.selectOptions(screen.getByLabelText('Diocèse'), 'Archidiocèse de Dakar');
    const doyenne = screen.getByLabelText('Doyenné');
    await waitFor(() => expect(doyenne).toBeEnabled());
    await user.selectOptions(doyenne, 'Plateau-Médina');
    expect(await screen.findByText('3 paroisses')).toBeInTheDocument();
    expect(navigation.replace).toHaveBeenLastCalledWith(expect.stringMatching(/doyenne=/), { scroll: false });
  });

  it('restreint aux paroisses actives sur Jàngu Bi', async () => {
    const user = userEvent.setup();
    renderApp(<DirectoryPage />);
    await screen.findByText('12 paroisses');

    await user.click(screen.getByRole('switch', { name: 'Sur Jàngu Bi seulement' }));

    expect(await screen.findByText('1 paroisse')).toBeInTheDocument();
    expect(navigation.replace).toHaveBeenLastCalledWith('/paroisses?active=1', { scroll: false });
  });

  it('lit les filtres de l’URL au premier affichage', async () => {
    renderApp(<DirectoryPage initial="q=ouakam" />);

    expect(await screen.findByText('1 paroisse')).toBeInTheDocument();
    expect(screen.getByLabelText('Rechercher')).toHaveValue('ouakam');
  });

  it('explique une recherche sans résultat et propose d’effacer les filtres', async () => {
    const user = userEvent.setup();
    renderApp(<DirectoryPage initial="q=zzz" />);

    expect(await screen.findByText('Aucune paroisse ne correspond à votre recherche.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Effacer les filtres' }));
    expect(await screen.findByText('12 paroisses')).toBeInTheDocument();
  });

  it('signale une panne de l’annuaire et permet de réessayer', async () => {
    server.use(http.get(apiUrl('/public/nodes/'), () => HttpResponse.json({ detail: 'Erreur' }, { status: 500 })));
    renderApp(<DirectoryPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('L’annuaire n’a pas pu être chargé.');
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument();
  });
});
