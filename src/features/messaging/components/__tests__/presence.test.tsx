import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createConversation, createUser } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { act, renderApp, screen, within } from '@/testing/test-utils';
import { useRealtimeStore } from '@/stores/realtime-store';

import { ConversationList } from '../conversation-list';

const moi = {
  id: 'me',
  email: 'mt.diouf@orange.sn',
  full_name: 'Marie-Thérèse Diouf',
};

const conversations = [
  createConversation({
    id: 'c-tine',
    participant_a: moi,
    participant_b: {
      id: 'pere-emmanuel-tine',
      email: 'e.tine@sd.sn',
      full_name: 'Père Emmanuel Tine',
    },
  }),
  createConversation({
    id: 'c-ndiaye',
    participant_a: moi,
    participant_b: {
      id: 'abbe-augustin-ndiaye',
      email: 'a.ndiaye@sd.sn',
      full_name: 'Abbé Augustin Ndiaye',
    },
  }),
  createConversation({
    id: 'c-sagna',
    participant_a: moi,
    participant_b: {
      id: 'abbe-robert-sagna',
      email: 'r.sagna@sd.sn',
      full_name: 'Abbé Robert Sagna',
    },
  }),
];

const ligne = (nom: string) =>
  screen.getByText(nom).closest('a') as HTMLElement;

describe('Présence dans la messagerie', () => {
  beforeEach(() => {
    server.use(
      http.get(`${env.API_URL}/v1/messaging/conversations/`, () =>
        HttpResponse.json(conversations),
      ),
    );
  });

  test('fidèle : « En ligne », « Vu aujourd’hui à 8:02 », rien pour une présence masquée', async () => {
    let demande = '';
    server.use(
      http.get(`${env.API_URL}/v1/me/`, () =>
        HttpResponse.json(createUser({ id: 'me', role: 'fidele' })),
      ),
      http.get(`${env.API_URL}/v1/messaging/presence/`, ({ request }) => {
        demande = new URL(request.url).searchParams.get('users') ?? '';
        return HttpResponse.json([
          {
            user_id: 'pere-emmanuel-tine',
            visible: true,
            online: true,
            last_seen_at: null,
          },
          {
            user_id: 'abbe-augustin-ndiaye',
            visible: true,
            online: false,
            last_seen_at: new Date(
              new Date().setUTCHours(8, 2, 0, 0),
            ).toISOString(),
          },
        ]);
      }),
    );
    renderApp(<ConversationList />);
    await screen.findByText('Père Emmanuel Tine');
    expect(
      await within(ligne('Père Emmanuel Tine')).findByText('En ligne'),
    ).toBeInTheDocument();
    expect(
      await within(ligne('Abbé Augustin Ndiaye')).findByText(
        "Vu aujourd'hui à 8:02",
      ),
    ).toBeInTheDocument();
    expect(
      ligne('Abbé Robert Sagna').querySelector('[data-presence]'),
    ).toBeNull();
    expect(demande.split(',').sort()).toEqual([
      'abbe-augustin-ndiaye',
      'abbe-robert-sagna',
      'pere-emmanuel-tine',
    ]);
    expect(
      await screen.findByText(/Votre présence n'est pas affichée aux prêtres/),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Modifier' })).toHaveAttribute(
      'href',
      '/app/profil#personnalisation',
    );
  });

  test('un événement presence.changed met à jour la liste', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/me/`, () =>
        HttpResponse.json(createUser({ id: 'me', role: 'fidele' })),
      ),
      http.get(`${env.API_URL}/v1/messaging/presence/`, () =>
        HttpResponse.json([]),
      ),
    );
    renderApp(<ConversationList />);
    await screen.findByText('Abbé Robert Sagna');
    expect(
      within(ligne('Abbé Robert Sagna')).queryByText('En ligne'),
    ).toBeNull();
    act(() => {
      useRealtimeStore.getState().setPresences([
        {
          user_id: 'abbe-robert-sagna',
          visible: true,
          online: true,
          last_seen_at: null,
        },
      ]);
    });
    expect(
      within(ligne('Abbé Robert Sagna')).getByText('En ligne'),
    ).toBeInTheDocument();
  });

  test('staff : « Vous apparaissez en ligne » et la légende', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/me/`, () =>
        HttpResponse.json(
          createUser({
            id: 'me',
            role: 'parish_admin',
            pastoral_role: 'pretre' as never,
          }),
        ),
      ),
      http.get(`${env.API_URL}/v1/me/presence/`, () =>
        HttpResponse.json({
          montrer_presence: null,
          effective: true,
          default: true,
        }),
      ),
    );
    renderApp(<ConversationList />);
    expect(
      await screen.findByText(/Vous apparaissez en ligne/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/n'apparaissent que pour les fidèles qui l'ont activé/),
    ).toBeInTheDocument();
  });
});
