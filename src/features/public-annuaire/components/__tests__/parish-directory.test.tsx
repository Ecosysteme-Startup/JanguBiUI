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
  server.use(directoryHandler);
  navigation.pathname = '/paroisses';
  navigation.replace.mockReset();
});

describe('Annuaire des paroisses', () => {
  it('liste les paroisses, avec leur présence sur Jàngu Bi et un lien vers leur fiche', async () => {
    renderApp(<DirectoryPage />);

    expect(await screen.findByText('12 paroisses')).toBeInTheDocument();
    const link = list().getByRole('link', { name: /paroisse saint-dominique/i });
    expect(link).toHaveAttribute('href', '/paroisses/DAK-SAINT-DOMINIQUE');
    expect(link).toHaveTextContent('Active');
    expect(list().getByRole('link', { name: /saint-joseph de médina/i })).toHaveTextContent('Fiche d’annuaire');
    expect(list().getAllByRole('listitem')).toHaveLength(10);
  });

  it('affiche les messes du dimanche et le doyenné de chaque paroisse', async () => {
    renderApp(<DirectoryPage />);

    expect(await screen.findByText('12 paroisses')).toBeInTheDocument();
    const link = list().getByRole('link', { name: /paroisse saint-dominique/i });
    expect(link).toHaveTextContent('Avenue Cheikh Anta Diop, Point E, Dakar · Doyenné Plateau-Médina');
    expect(link).toHaveTextContent('7 h 30 · 9 h 30 · 11 h 30 · 18 h 30');
    expect(list().getByRole('link', { name: /saint-joseph de médina/i })).toHaveTextContent('Non renseignées');
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

    await user.type(screen.getByLabelText('Paroisse, quartier ou ville'), 'Médina');

    expect(await screen.findByText('1 paroisse')).toBeInTheDocument();
    expect(navigation.replace).toHaveBeenLastCalledWith('/paroisses?q=M%C3%A9dina', { scroll: false });
    expect(list().getByRole('link', { name: /saint-joseph de médina/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /retirer le filtre « médina »/i }));
    expect(await screen.findByText('12 paroisses')).toBeInTheDocument();
    expect(screen.getByLabelText('Paroisse, quartier ou ville')).toHaveValue('');
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
    expect(screen.getByRole('button', { name: /retirer le filtre doyenné plateau-médina/i })).toBeInTheDocument();
  });

  it('restreint aux paroisses actives sur Jàngu Bi', async () => {
    const user = userEvent.setup();
    renderApp(<DirectoryPage />);
    await screen.findByText('12 paroisses');

    await user.click(screen.getByRole('checkbox', { name: 'Active sur Jàngu Bi' }));

    expect(await screen.findByText('1 paroisse')).toBeInTheDocument();
    expect(navigation.replace).toHaveBeenLastCalledWith('/paroisses?active=1', { scroll: false });
  });

  it('lit les filtres de l’URL au premier affichage', async () => {
    renderApp(<DirectoryPage initial="q=ouakam" />);

    expect(await screen.findByText('1 paroisse')).toBeInTheDocument();
    expect(screen.getByLabelText('Paroisse, quartier ou ville')).toHaveValue('ouakam');
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
