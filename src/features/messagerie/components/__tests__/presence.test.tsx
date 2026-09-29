import { act, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { useRealtimeStore } from '@/stores/realtime-store';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import type { Conversation } from '../../api/schemas';
import { ConversationList } from '../conversation-list';

vi.mock('zustand');

const moi = {
  id: 'me',
  email: 'mt.diouf@orange.sn',
  full_name: 'Marie-Thérèse Diouf',
};

const conversation = (
  id: string,
  peer: { id: string; full_name: string },
): Conversation => ({
  id,
  participant_a: moi,
  participant_b: { ...peer, email: `${peer.id}@sd.sn` },
  last_message: null,
  last_message_at: null,
  is_archived: false,
  unread_count: 0,
  confession_notice: '',
});

const conversations = [
  conversation('c-tine', {
    id: 'pere-emmanuel-tine',
    full_name: 'Père Emmanuel Tine',
  }),
  conversation('c-ndiaye', {
    id: 'abbe-augustin-ndiaye',
    full_name: 'Abbé Augustin Ndiaye',
  }),
  conversation('c-sagna', {
    id: 'abbe-robert-sagna',
    full_name: 'Abbé Robert Sagna',
  }),
];

const ligne = (nom: string) =>
  screen.getByText(nom).closest('a') as HTMLElement;
const liste = () =>
  renderApp(
    <ConversationList
      conversations={conversations}
      meId="me"
      hrefOf={(id) => `/app/pretres/conversations/${id}`}
      label="Conversations"
    />,
  );

describe('Présence dans la messagerie (décisions V2)', () => {
  beforeEach(() =>
    server.use(
      http.get(`${env.API_URL}/me/presence/`, () =>
        HttpResponse.json({
          montrer_presence: null,
          effective: false,
          default: false,
        }),
      ),
    ),
  );

  test('« En ligne », « Vu aujourd’hui à 8:02 », rien pour une présence masquée', async () => {
    let demande = '';
    server.use(
      http.get(`${env.API_URL}/messaging/presence/`, ({ request }) => {
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
    liste();
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
  });

  test('un événement presence.changed met à jour la liste', async () => {
    server.use(
      http.get(`${env.API_URL}/messaging/presence/`, () =>
        HttpResponse.json([]),
      ),
    );
    liste();
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

  test('présence masquée explicitement : rien n’est affiché (réciprocité)', async () => {
    server.use(
      http.get(`${env.API_URL}/me/presence/`, () =>
        HttpResponse.json({
          montrer_presence: false,
          effective: false,
          default: false,
        }),
      ),
      http.get(`${env.API_URL}/messaging/presence/`, () =>
        HttpResponse.json([
          {
            user_id: 'pere-emmanuel-tine',
            visible: true,
            online: true,
            last_seen_at: null,
          },
        ]),
      ),
    );
    liste();
    await screen.findByText('Père Emmanuel Tine');
    await new Promise((r) => setTimeout(r, 50));
    expect(
      within(ligne('Père Emmanuel Tine')).queryByText('En ligne'),
    ).toBeNull();
  });
});
