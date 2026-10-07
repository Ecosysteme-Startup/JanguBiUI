import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { ParoleView } from '@/features/parole/components/parole-view';
import { apiUrl } from '@/testing/mocks/api-url';
import { aelfSundayDay } from '@/testing/mocks/db-aelf';
import { paroleHandlers } from '@/testing/mocks/handlers/parole';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

beforeEach(() => {
  server.use(...paroleHandlers);
  server.use(http.get(apiUrl('/liturgy/today/'), () => HttpResponse.json(aelfSundayDay)));
});

const openTab = async (name: string | RegExp) => {
  await userEvent.setup().click(await screen.findByRole('tab', { name }));
  return screen.getByRole('tabpanel');
};

describe('ParoleView — source AELF telle quelle', () => {
  it('montre toutes les lectures AELF, deuxième lecture et type inconnu compris', async () => {
    renderApp(<ParoleView />);
    const tabs = within(await screen.findByRole('tablist', { name: 'Lectures du jour' }));
    expect(tabs.getAllByRole('tab').map((t) => t.textContent)).toEqual(['1re lecture', 'Psaume', '2e lecture', 'Évangile', 'Antienne x']);
  });

  it('titre et introduction de aelf, HTML assaini, ligne de source AELF', async () => {
    renderApp(<ParoleView />);
    const panel = await openTab('1re lecture');
    expect(within(panel).getByRole('heading', { name: 'Lecture du livre du prophète Amos (fixture)' })).toBeInTheDocument();
    expect(within(panel).getByText('En ces jours-là (fixture),')).toBeInTheDocument();
    expect(within(panel).getByText(/malheur à ceux/i)).toBeInTheDocument();
    expect(panel.querySelector('script')).toBeNull();
    expect(panel.querySelector('[onclick]')).toBeNull();
    expect(panel.querySelector('span.verse_number')).toHaveTextContent('1');
    expect(within(panel).getByText('Textes liturgiques : AELF.')).toBeInTheDocument();
  });

  it('refrain psalmique et acclamation viennent de aelf ; sans titre AELF, aucun titre inventé', async () => {
    renderApp(<ParoleView />);
    let panel = await openTab('Psaume');
    expect(within(panel).getByText('Refrain (Ps 145, 1)')).toBeInTheDocument();
    expect(within(panel).getByText(/chante, ô mon âme/i)).toBeInTheDocument();
    expect(within(panel).getByRole('heading', { name: 'Ps 145 (146)' })).toBeInTheDocument();

    panel = await openTab('Évangile');
    expect(within(panel).getByText('Acclamation (cf. 2 Co 8, 9)')).toBeInTheDocument();
    expect(within(panel).getByText(/s’est fait pauvre/i)).toBeInTheDocument();
    expect(within(panel).getByRole('heading', { name: 'Lc 16, 19-31' })).toBeInTheDocument();
    expect(within(panel).queryByText(/selon saint/i)).toBeNull();
    expect(within(panel).queryByText(/^Refrain/)).toBeNull();

    panel = await openTab('2e lecture');
    expect(within(panel).getByRole('heading', { name: /première lettre de saint paul/i })).toBeInTheDocument();
    expect(within(panel).queryByText(/^Acclamation/)).toBeNull();
    expect(within(panel).queryByText(/en ces jours-là/i)).toBeNull();
  });
});
