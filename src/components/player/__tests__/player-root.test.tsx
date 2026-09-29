import { act } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { FakeEngine } from '@/lib/player/__tests__/fake-engine';
import { resetDeviceIdForTests } from '@/lib/player/device';
import { resetListenEventsForTests } from '@/lib/player/listen-events';
import {
  resetPlayerModuleForTests,
  usePlayerStore,
} from '@/lib/player/player-store';
import { resetStateSyncForTests } from '@/lib/player/state-sync';
import {
  messeTracks,
  resetAudioLecteurMocks,
} from '@/testing/mocks/handlers/audio-lecteur';
import { server } from '@/testing/mocks/server';
import {
  renderApp,
  screen,
  userEvent,
  waitFor,
  within,
} from '@/testing/test-utils';

import { PlayerRoot } from '../player-root';

const store = () => usePlayerStore.getState();
let engine: FakeEngine;

beforeAll(() => {
  // jsdom ne peint pas : on saute les animations (sorties d'AnimatePresence).
  MotionGlobalConfig.skipAnimations = true;
});
afterAll(() => {
  MotionGlobalConfig.skipAnimations = false;
});

beforeEach(() => {
  vi.stubEnv('TEST', 'true');
  localStorage.clear();
  resetPlayerModuleForTests();
  resetListenEventsForTests();
  resetStateSyncForTests();
  resetDeviceIdForTests();
  resetAudioLecteurMocks();
  engine = new FakeEngine();
  // Pas d'offre de reprise par défaut dans ces tests.
  server.use(
    http.get(
      `${env.API_URL}/v1/audio/lecture/etat/`,
      () => new HttpResponse(null, { status: 204 }),
    ),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
});

async function renderWithGloria() {
  const user = userEvent.setup();
  renderApp(<PlayerRoot createEngine={() => engine} />);
  await act(async () => {
    await store().playTracks(messeTracks, 2, {
      kindLabel: 'l’album',
      label: 'Messe du 27 septembre 2026',
    });
  });
  return user;
}

describe('<PlayerRoot>', () => {
  it('n’affiche rien sans piste, puis la barre avec un curseur accessible', async () => {
    renderApp(<PlayerRoot createEngine={() => engine} />);
    expect(
      screen.queryByRole('region', { name: 'Lecteur audio' }),
    ).not.toBeInTheDocument();
    await act(async () => {
      await store().playTracks(messeTracks, 2);
    });
    const bar = await screen.findByRole('region', { name: 'Lecteur audio' });
    expect(
      within(bar).getByText('Gloria — Messe de la Visitation'),
    ).toBeInTheDocument();
    const slider = within(bar).getByRole('slider', {
      name: 'Position dans la piste',
    });
    expect(slider).toHaveAttribute(
      'aria-valuetext',
      '1 minute 52 secondes sur 4 minutes 12',
    );
    expect(slider).toHaveAttribute('aria-valuemax', '252');
    expect(within(bar).getByText('1:52')).toBeInTheDocument();
    expect(within(bar).getByText('−2:20')).toBeInTheDocument();
    // Deux boutons (bureau et mobile compact), l'un masqué en CSS selon la largeur.
    expect(
      within(bar).getAllByRole('button', { name: 'Mettre en pause' }).length,
    ).toBeGreaterThan(0);
  });

  it('raccourcis : Espace = lecture/pause, flèches = ±15 s, sauf dans un champ', async () => {
    const user = await renderWithGloria();
    expect(store().status).toBe('playing');

    await user.keyboard(' ');
    expect(store().status).toBe('paused');
    await user.keyboard(' ');
    expect(store().status).toBe('playing');

    await user.keyboard('{ArrowRight}');
    expect(store().position).toBe(127);
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(store().position).toBe(97);

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    await user.keyboard(' {ArrowRight}');
    expect(store().status).toBe('playing');
    expect(store().position).toBe(97);
    input.remove();
  });

  it('le curseur de l’onde gère ses flèches sans doubler le raccourci global', async () => {
    const user = await renderWithGloria();
    const bar = screen.getByRole('region', { name: 'Lecteur audio' });
    const slider = within(bar).getByRole('slider', {
      name: 'Position dans la piste',
    });
    slider.focus();
    await user.keyboard('{ArrowRight}');
    expect(store().position).toBe(127);
    await user.keyboard('{Home}');
    expect(store().position).toBe(0);
  });

  it('Agrandir ouvre le panneau latéral (non modal) ; Échap le ferme et rend le focus', async () => {
    const user = await renderWithGloria();
    // Un élément de la page, pour vérifier qu'elle reste utilisable.
    const pageAction = vi.fn();
    const pageButton = document.createElement('button');
    pageButton.textContent = 'Action de la page';
    pageButton.addEventListener('click', pageAction);
    document.body.appendChild(pageButton);

    const expandButton = screen.getByRole('button', {
      name: 'Agrandir le lecteur',
    });
    await user.click(expandButton);

    const panel = await screen.findByRole('complementary', {
      name: 'Lecteur : Gloria — Messe de la Visitation',
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(panel).not.toHaveAttribute('aria-modal');
    expect(
      within(panel).getByRole('button', { name: 'Fermer le panneau (Échap)' }),
    ).toHaveFocus();
    expect(within(panel).getByText('Lecture en cours')).toBeInTheDocument();
    expect(within(panel).getByText(/Depuis l’album/)).toHaveTextContent(
      'Depuis l’album Messe du 27 septembre 2026',
    );
    // La barre reste en bas ; « Agrandir » devient « Fermer le panneau ».
    const bar = screen.getByRole('region', { name: 'Lecteur audio' });
    expect(
      within(bar).getByRole('button', {
        name: 'Fermer le panneau du lecteur',
      }),
    ).toHaveAttribute('aria-expanded', 'true');

    // Onglet « À suivre » : la file.
    const suivre = within(panel).getByRole('tab', { name: 'À suivre' });
    expect(suivre).toHaveAttribute('aria-selected', 'true');
    expect(
      within(panel).getByRole('region', { name: "File d'attente" }),
    ).toBeInTheDocument();
    expect(within(panel).getByText('Ensuite dans l’album')).toBeInTheDocument();
    expect(within(panel).getByText('7 pistes · 22 min')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        within(panel).getByText(
          'Souvent écouté après la Messe de la Visitation',
        ),
      ).toBeInTheDocument(),
    );

    // Onglet « À propos » (flèche droite dans la liste d'onglets).
    suivre.focus();
    await user.keyboard('{ArrowRight}');
    const propos = within(panel).getByRole('tab', { name: 'À propos' });
    expect(propos).toHaveAttribute('aria-selected', 'true');
    expect(propos).toHaveFocus();
    expect(
      within(panel).getByRole('region', { name: 'À propos de cette piste' }),
    ).toBeInTheDocument();
    expect(within(panel).getByText('Élisabeth Gomis')).toBeInTheDocument();

    // La page reste utilisable pendant l'écoute (pas de piège de focus).
    await user.click(pageButton);
    expect(pageAction).toHaveBeenCalledTimes(1);
    expect(store().expanded).toBe(true);

    // Échap ferme le panneau ; le focus, hors du panneau, ne bouge pas.
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument(),
    );
    expect(store().expanded).toBe(false);
    expect(pageButton).toHaveFocus();
    pageButton.remove();
  });

  it('Échap depuis le panneau rend le focus au bouton d’origine', async () => {
    const user = await renderWithGloria();
    const expandButton = screen.getByRole('button', {
      name: 'Agrandir le lecteur',
    });
    await user.click(expandButton);
    await screen.findByRole('complementary');
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole('button', { name: 'Agrandir le lecteur' }),
    ).toHaveFocus();
  });

  it('piste réservée (403 reserve_paroissiens) : message sobre, « Ajouter cette paroisse », puis lecture', async () => {
    let membre = false;
    let ajout: unknown = null;
    server.use(
      http.post(`${env.API_URL}/v1/audio/pistes/:id/lecture/`, () =>
        membre
          ? undefined
          : HttpResponse.json(
              {
                error: {
                  code: 'reserve_paroissiens',
                  message: 'Réservé aux paroissiens de Saint-Joseph de Médina.',
                  details: {
                    paroisse: {
                      id: '5b7d2c1e-8a41-4f0b-9d7e-2c3f1a6b9e02',
                      name: 'Saint-Joseph de Médina',
                    },
                  },
                },
              },
              { status: 403 },
            ),
      ),
      http.post(`${env.API_URL}/v1/me/paroisses/`, async ({ request }) => {
        ajout = await request.json();
        membre = true;
        return HttpResponse.json([], { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderApp(<PlayerRoot createEngine={() => engine} />);
    await act(async () => {
      await store().playTracks(messeTracks, 2);
    });
    expect(store().status).toBe('error');
    expect(store().reserve?.paroisse?.name).toBe('Saint-Joseph de Médina');
    expect(engine.loads).toHaveLength(0);

    const bar = await screen.findByRole('region', { name: 'Lecteur audio' });
    const message = within(bar).getByText(
      'Réservé aux paroissiens de Saint-Joseph de Médina.',
    );
    // Sobre : pas la couleur d'erreur.
    expect(message.parentElement).not.toHaveClass('text-destructive');

    await user.click(
      within(bar).getByRole('button', { name: 'Ajouter cette paroisse' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Ajouter Saint-Joseph de Médina',
    });
    await user.click(
      within(dialog).getByRole('button', { name: 'Ajouter à mes paroisses' }),
    );
    await waitFor(() => expect(engine.loads).toHaveLength(1));
    expect(ajout).toEqual({
      paroisse_id: '5b7d2c1e-8a41-4f0b-9d7e-2c3f1a6b9e02',
      principale: false,
    });
    expect(store().reserve).toBeNull();
    expect(store().status).toBe('playing');
  });

  it('vitesse segmentée : radiogroupe, 1,25× retenu pour la piste', async () => {
    const user = await renderWithGloria();
    await user.click(
      screen.getByRole('button', { name: 'Agrandir le lecteur' }),
    );
    const panel = await screen.findByRole('complementary');
    const group = within(panel).getByRole('radiogroup', { name: 'Vitesse' });
    await user.click(within(group).getByRole('radio', { name: '1,25×' }));
    expect(within(group).getByRole('radio', { name: '1,25×' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(engine.rate).toBe(1.25);
    expect(
      screen.getByRole('button', { name: 'Vitesse de lecture : 1,25×' }),
    ).toBeInTheDocument();
  });

  it('propose « Reprendre sur cet appareil » et reprend à 1:47', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/audio/lecture/etat/`, () =>
        HttpResponse.json({
          track: messeTracks[2],
          position_seconds: 107,
          device_id: 'web-ordinateur-paroisse',
          updated_at: new Date(Date.now() - 60_000).toISOString(),
        }),
      ),
    );
    const user = userEvent.setup();
    renderApp(<PlayerRoot createEngine={() => engine} />);
    const offer = await screen.findByRole('region', {
      name: 'Reprendre sur cet appareil ?',
    });
    expect(
      within(offer).getByText(/Vous écoutiez sur un autre navigateur/),
    ).toBeInTheDocument();
    await user.click(
      within(offer).getByRole('button', { name: 'Reprendre ici à 1:47' }),
    );
    await waitFor(() => expect(engine.loads).toHaveLength(1));
    expect(engine.lastLoad.options.startAt).toBe(107);
    await screen.findByRole('region', { name: 'Lecteur audio' });
  });
});
