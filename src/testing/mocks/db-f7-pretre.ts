import { ids, me } from '@/testing/mocks/db';

/** Données du lot F7 (Parler à un prêtre, confession), reprises des maquettes. */
export const f7Ids = {
  tine: 'a7000000-0000-4000-8000-000000000001',
  ndiaye: 'a7000000-0000-4000-8000-000000000002',
  sagna: 'a7000000-0000-4000-8000-000000000003',
  manga: 'a7000000-0000-4000-8000-000000000004',
  sene: 'a7000000-0000-4000-8000-000000000005',
  convTine: 'c7000000-0000-4000-8000-000000000001',
  convNdiaye: 'c7000000-0000-4000-8000-000000000002',
  convSene: 'c7000000-0000-4000-8000-000000000003',
  aumonerie: 'b7000000-0000-4000-8000-000000000009',
};

export const CONFESSION_NOTICE =
  'La confession ne peut pas se faire par message. Pour recevoir le sacrement de réconciliation, prenez rendez-vous avec un prêtre : la confession se vit en présence du prêtre.';

export const MINOR_MESSAGE =
  'La messagerie avec un prêtre est réservée aux personnes majeures. Si tu as moins de 18 ans, parle à un prêtre de ta paroisse avec tes parents ou ton catéchiste, ou prends rendez-vous à l’accueil.';

const parish = {
  id: ids.saintDominique,
  name: 'Saint-Dominique',
  type: 'paroisse',
};

export const priests = [
  {
    user_id: f7Ids.ndiaye,
    full_name: 'Abbé Augustin Ndiaye',
    office: { code: 'cure', label: 'Curé' },
    nodes: [parish],
    availability: null,
  },
  {
    user_id: f7Ids.tine,
    full_name: 'Père Emmanuel Tine',
    office: { code: 'vicaire_paroissial', label: 'Vicaire paroissial' },
    nodes: [parish],
    availability: {
      accepts_new_conversations: true,
      absent_until: null,
      reply_windows: [{ weekday: 1, start: '15:00', end: '18:00' }],
      note: '',
    },
  },
  {
    user_id: f7Ids.sagna,
    full_name: 'Abbé Robert Sagna',
    office: { code: 'vicaire_paroissial', label: 'Vicaire paroissial' },
    nodes: [parish],
    availability: {
      accepts_new_conversations: true,
      absent_until: '2099-09-28',
      reply_windows: [],
      note: '',
    },
  },
  {
    user_id: f7Ids.manga,
    full_name: 'Abbé Pascal Manga',
    office: { code: 'aumonier', label: 'Aumônier' },
    nodes: [
      {
        id: f7Ids.aumonerie,
        name: 'Aumônerie de la Cité universitaire',
        type: 'aumonerie',
      },
    ],
    availability: null,
  },
];

const person = (id: string, first: string, last: string, email: string) => ({
  id,
  full_name: `${first} ${last}`,
  email,
});
const meParticipant = person(me.id, 'Marie-Thérèse', 'Diouf', me.email);

const conversation = (
  id: string,
  other: ReturnType<typeof person>,
  unread: number,
  last: string,
  at: string,
) => ({
  id,
  participant_a: meParticipant,
  participant_b: other,
  last_message: { id: `${id}-last`, content: last, sent_at: at },
  last_message_at: at,
  is_archived: false,
  cgu_accepted_by_a: null,
  cgu_accepted_by_b: null,
  scheduled_purge_at: null,
  unread_count: unread,
  confession_notice: CONFESSION_NOTICE,
  created_at: '2026-09-01T10:00:00+00:00',
});

export const makeConversations = () => [
  conversation(
    f7Ids.convTine,
    person(f7Ids.tine, 'Emmanuel', 'Tine', 'e.tine@example.sn'),
    1,
    'Pouvez-vous passer me voir tous les deux mardi ?',
    '2026-09-24T11:02:00+00:00',
  ),
  conversation(
    f7Ids.convNdiaye,
    person(f7Ids.ndiaye, 'Augustin', 'Ndiaye', 'a.ndiaye@example.sn'),
    0,
    'Merci mon Père, je préviens ma mère.',
    '2026-09-21T18:00:00+00:00',
  ),
];

const message = (
  id: string,
  sender: string,
  name: string,
  content: string,
  at: string,
  readAt: string | null = at,
) => ({
  id,
  sender_id: sender,
  sender_name: name,
  content,
  content_type: 'text',
  client_message_id: null as string | null,
  reply_to_id: null,
  read_at: readAt,
  deleted_at: null,
  is_deleted: false,
  reactions: [],
  attachments: [],
  created_at: at,
});

/** Du plus récent au plus ancien, comme l'API. */
export const makeMessages = () => [
  message(
    'm4',
    f7Ids.tine,
    'Emmanuel Tine',
    'Pouvez-vous passer me voir tous les deux mardi, à 17 h 30, au presbytère ?',
    '2026-09-24T11:02:00+00:00',
    null,
  ),
  message(
    'm3',
    me.id,
    'Marie-Thérèse Diouf',
    'J’aurais aussi besoin d’un conseil.',
    '2026-09-24T10:41:00+00:00',
  ),
  message(
    'm2',
    f7Ids.tine,
    'Emmanuel Tine',
    'La session commence le samedi 17 octobre à 10 h.',
    '2026-09-22T21:03:00+00:00',
  ),
  message(
    'm1',
    me.id,
    'Marie-Thérèse Diouf',
    'Quand commence la préparation au mariage cette année ?',
    '2026-09-22T20:14:00+00:00',
  ),
];

export const f7State = {
  cguAccepted: true,
  conversations: makeConversations(),
  messages: makeMessages(),
  sent: [] as { content: string }[],
  markedRead: 0,
  created: [] as string[],
  availability: {
    accepts_new_conversations: true,
    absent_until: null as string | null,
    reply_windows: [] as unknown[],
    note: '',
  },
  bookings: [] as unknown[],
  bookingBodies: [] as unknown[],
  cancelledBookings: [] as number[],
  cancelledSlots: [] as { slotId: number; body: unknown }[],
  /** POST /staff/confessions/bookings/{id}/attendance/ reçus (le planning en tient compte). */
  attendance: [] as { bookingId: number; body: { attended: boolean } }[],
  rules: [] as unknown[],
  ruleBodies: [] as unknown[],
  deletedRules: [] as number[],
};

export const resetF7State = () => {
  Object.assign(f7State, {
    cguAccepted: true,
    conversations: makeConversations(),
    messages: makeMessages(),
    sent: [],
    markedRead: 0,
    created: [],
    availability: {
      accepts_new_conversations: true,
      absent_until: null,
      reply_windows: [],
      note: '',
    },
    bookings: [],
    bookingBodies: [],
    cancelledBookings: [],
    cancelledSlots: [],
    attendance: [],
    rules: [],
    ruleBodies: [],
    deletedRules: [],
  });
};

// --- Confession ------------------------------------------------------------------------

export const place = {
  id: 11,
  name: 'Église Saint-Dominique',
  address: 'Point E, Dakar',
  node_id: ids.saintDominique,
};

/** Samedi 26 septembre 2026 (semaine des maquettes), 16 h-17 h, créneaux de 10 min. */
export const SATURDAY = '2026-09-26';
const at = (day: string, h: number, m: number) =>
  `${day}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;

export const makeSlots = () =>
  [0, 10, 20, 30, 40, 50].flatMap((minute, i) => [
    {
      id: 100 + i,
      starts_at: at(SATURDAY, 16, minute),
      ends_at: at(SATURDAY, 16, minute + 10 > 59 ? 59 : minute + 10),
      status: 'libre',
      place,
      priest_id: f7Ids.ndiaye,
      priest_name: 'Abbé Augustin Ndiaye',
    },
    {
      id: 200 + i,
      starts_at: at(SATURDAY, 17, minute),
      ends_at: at(SATURDAY, 17, minute + 10 > 59 ? 59 : minute + 10),
      status: 'libre',
      place,
      priest_id: f7Ids.tine,
      priest_name: 'Père Emmanuel Tine',
    },
  ]);

export const makePlanning = (viewerIsPriest: boolean) => {
  const initials = (full: string, short: string) =>
    viewerIsPriest ? full : short;
  return [
    {
      ...makeSlots()[0],
      status: 'reserve',
      is_mine: false,
      booking: { id: 1, status: 'reservee', person: 'R. D.' },
    },
    { ...makeSlots()[2], status: 'libre', is_mine: false, booking: null },
    {
      ...makeSlots()[1],
      status: 'reserve',
      is_mine: viewerIsPriest,
      booking: {
        id: 2,
        status: 'reservee',
        person: initials('Aminata Kane', 'A. K.'),
      },
    },
    {
      ...makeSlots()[3],
      status: 'libre',
      is_mine: viewerIsPriest,
      booking: null,
    },
  ];
};

export const places = [
  {
    id: 11,
    node_id: ids.saintDominique,
    name: 'Église Saint-Dominique',
    kind: 'eglise',
    is_main: true,
    address: 'Point E',
    city: 'Dakar',
    lat: null,
    lng: null,
    is_active: true,
  },
  {
    id: 12,
    node_id: ids.saintDominique,
    name: 'Chapelle du Saint-Sacrement',
    kind: 'chapelle',
    is_main: false,
    address: '',
    city: 'Dakar',
    lat: null,
    lng: null,
    is_active: true,
  },
];
