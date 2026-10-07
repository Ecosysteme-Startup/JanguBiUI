import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AnnouncementsSection } from '@/features/paroisse/components/announcements-section';
import { ids } from '@/testing/mocks/db';
import { f5bHandlers } from '@/testing/mocks/handlers/f5b';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

beforeEach(() => server.use(...f5bHandlers));

describe('AnnouncementsSection (JB-WEB-021)', () => {
  it('montre par défaut toutes les annonces, y compris « Vie paroissiale » (catéchisme)', async () => {
    renderApp(<AnnouncementsSection nodeId={ids.saintDominique} />);

    expect(await screen.findByText(/Inscriptions au catéchisme/i)).toBeInTheDocument();
    expect(screen.getByText(/Quête impérée pour le Grand Séminaire/i)).toBeInTheDocument();
    expect(screen.getByText(/rentrée universitaire/i)).toBeInTheDocument();
  });

  it('le filtre « Vie paroissiale » inclut les annonces hors dimanche, et pas la quête du dimanche', async () => {
    const user = userEvent.setup();
    renderApp(<AnnouncementsSection nodeId={ids.saintDominique} />);

    await screen.findByText(/Inscriptions au catéchisme/i);
    await user.click(screen.getByRole('button', { name: /Vie paroissiale/i }));

    expect(screen.getByText(/Inscriptions au catéchisme/i)).toBeInTheDocument();
    // La quête impérée est une annonce du dimanche : absente de « Vie paroissiale ».
    expect(screen.queryByText(/Quête impérée pour le Grand Séminaire/i)).not.toBeInTheDocument();
  });

  it('une annonce du dimanche affiche sa vraie catégorie (Quête), non « Vie paroissiale »', async () => {
    renderApp(<AnnouncementsSection nodeId={ids.saintDominique} />);

    const quete = (await screen.findByText(/Quête impérée pour le Grand Séminaire/i)).closest('li');
    expect(quete).not.toBeNull();
    // Son étiquette est sa vraie catégorie (« Quête »), jamais « Vie paroissiale ».
    expect(within(quete as HTMLElement).getByText(/Quête ·/)).toBeInTheDocument();
    expect(within(quete as HTMLElement).queryByText(/Vie paroissiale/i)).not.toBeInTheDocument();
  });
});
