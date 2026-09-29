import {
  randEmail,
  randFirstName,
  randLastName,
  randUuid,
  randParagraph as _paragraph,
  randWord,
  randPastDate as _pastDate,
  randPhoneNumber,
  randText as _text,
} from '@ngneat/falso';

const randNumber = ({
  min = 0,
  max = 1000,
}: { min?: number; max?: number } = {}) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randPastDate = () => _pastDate();

const randParagraph = () => _paragraph();

const randText = (_options?: { charCount?: number }) => _text();

import type { DocumentRequest } from '@/features/documents/types';
import type { Conversation, Message } from '@/features/messaging/types';
import type {
  Article,
  ArticleDetail,
  ArticleCategory,
} from '@/features/news/types';
import type { PastoralRole, User, UserRole } from '@/lib/auth';

// ----------------------------------------------------------------
// User
// ----------------------------------------------------------------

// Contrat réel de /v1/me/ : les deux dimensions sont des champs SÉPARÉS.
// `role` (UserRole) = capacité d'administration digitale (jamais une valeur
// pastorale). `pastoral_role` (PastoralRole | null) = identité dans l'Église.
// Un fidèle laïc inscrit normalement a role='fidele' et pastoral_role=null
// (cf. backend user_register_fidele). Le clergé porte pastoral_role.
export const createUser = (overrides?: Partial<User>): User => ({
  id: randUuid(),
  email: randEmail(),
  phone_number: randPhoneNumber(),
  role: 'fidele' as UserRole,
  pastoral_role: null,
  onboarding_state: 'completed',
  is_active: true,
  is_verified: true,
  is_admin: false,
  is_staff: false,
  diocese: null,
  province: null,
  profile: {
    first_name: randFirstName(),
    last_name: randLastName(),
    title: undefined,
    phone: randPhoneNumber(),
    primary_parish: null,
    avatar: null,
  },
  ...overrides,
});

export const createAdminUser = (overrides?: Partial<User>): User =>
  createUser({
    role: 'parish_admin',
    is_admin: true,
    ...overrides,
  });

// Clergé : identité pastorale dans `pastoral_role`, `role` reste 'fidele' tant
// que le clergé n'est pas aussi administrateur digital (le curé peut cumuler une
// RoleAssignment, mais ça ne change pas `role`). Reflète le contrat réel de /me.
export const createClergyUser = (
  pastoral_role: PastoralRole = 'pretre',
  overrides?: Partial<User>,
): User =>
  createUser({
    role: 'fidele' as UserRole,
    pastoral_role,
    ...overrides,
  });

// ----------------------------------------------------------------
// Document Request
// ----------------------------------------------------------------

const DOCUMENT_TYPES = [
  'Baptême',
  'Confirmation',
  'Mariage',
  'Première communion',
  'Attestation de mariage',
  'Extrait de registre',
];

export const createDocumentRequest = (
  overrides?: Partial<DocumentRequest>,
): DocumentRequest => ({
  id: randUuid(),
  document_type:
    DOCUMENT_TYPES[randNumber({ min: 0, max: DOCUMENT_TYPES.length - 1 })],
  status: 'submitted',
  requester_name: `${randFirstName()} ${randLastName()}`,
  created_at: randPastDate().toISOString(),
  updated_at: randPastDate().toISOString(),
  notes: null,
  parish_name: null,
  ...overrides,
});

// ----------------------------------------------------------------
// Conversation
// ----------------------------------------------------------------

export const createConversation = (
  overrides?: Partial<Conversation>,
): Conversation => ({
  id: randUuid(),
  participant_a: {
    id: randUuid(),
    email: randEmail(),
    full_name: `${randFirstName()} ${randLastName()}`,
  },
  participant_b: {
    id: randUuid(),
    email: randEmail(),
    full_name: `${randFirstName()} ${randLastName()}`,
  },
  last_message: {
    id: randUuid(),
    content: randText({ charCount: 60 }),
    sent_at: randPastDate().toISOString(),
  },
  last_message_at: randPastDate().toISOString(),
  unread_count: 0,
  ...overrides,
});

// ----------------------------------------------------------------
// Message
// ----------------------------------------------------------------

export const createMessage = (overrides?: Partial<Message>): Message => ({
  id: randUuid(),
  client_message_id: null,
  content: randText({ charCount: 80 }),
  content_type: 'text',
  sender_id: randUuid(),
  sender_name: randFirstName(),
  reply_to_id: null,
  read_at: null,
  deleted_at: null,
  is_deleted: false,
  reactions: [],
  attachments: [],
  created_at: randPastDate().toISOString(),
  is_mine: false,
  ...overrides,
});

// ----------------------------------------------------------------
// Article
// ----------------------------------------------------------------

export const createArticleCategory = (
  overrides?: Partial<ArticleCategory>,
): ArticleCategory => ({
  id: randNumber({ min: 1, max: 100 }),
  name: randWord(),
  slug: randWord().toLowerCase(),
  icon: null,
  color: null,
  ...overrides,
});

export const createArticle = (overrides?: Partial<Article>): Article => ({
  id: randUuid(),
  title: randText({ charCount: 60 }),
  slug: randWord().toLowerCase(),
  excerpt: randText({ charCount: 120 }),
  cover_image_url: null,
  category: null,
  author_name: `${randFirstName()} ${randLastName()}`,
  scope_type: 'global',
  scope_type_label: 'Universel',
  scope_parish_id: null,
  scope_diocese_id: null,
  status: 'published',
  views_count: randNumber({ min: 0, max: 1000 }),
  published_at: randPastDate().toISOString(),
  created_at: randPastDate().toISOString(),
  ...overrides,
});

export const createArticleDetail = (
  overrides?: Partial<ArticleDetail>,
): ArticleDetail => ({
  ...createArticle(),
  content: `<p>${randParagraph()}</p>`,
  updated_at: randPastDate().toISOString(),
  unpublished_at: null,
  unpublished_by_name: null,
  unpublish_reason: null,
  ...overrides,
});

// ----------------------------------------------------------------
// Liturgy
// ----------------------------------------------------------------

export interface LiturgyReading {
  id: string;
  type: string;
  citation: string;
  text: string;
}

export interface LiturgyDay {
  date: string;
  season?: string;
  mystery?: string;
  readings: LiturgyReading[];
  offices: unknown[];
}

export const createLiturgyReading = (
  overrides?: Partial<LiturgyReading>,
): LiturgyReading => ({
  id: randUuid(),
  type: 'Première Lecture',
  citation: `Is ${randNumber({ min: 1, max: 66 })}, ${randNumber({ min: 1, max: 20 })}`,
  text: `<p>${randParagraph()}</p>`,
  ...overrides,
});

export const createLiturgyDay = (
  overrides?: Partial<LiturgyDay>,
): LiturgyDay => ({
  date: new Date().toISOString().split('T')[0],
  season: 'Temps ordinaire',
  mystery: undefined,
  readings: [
    createLiturgyReading({ type: 'Première Lecture' }),
    createLiturgyReading({ type: 'Psaume' }),
    createLiturgyReading({ type: 'Évangile' }),
  ],
  offices: [],
  ...overrides,
});

// ----------------------------------------------------------------
// Rosary / Chapelet
// ----------------------------------------------------------------

export interface RosaryGroup {
  readonly id: number;
  name: string;
  slug: string;
  readonly audio_file: string;
  readonly mysteries: string;
}

export interface RosaryDay {
  day: {
    id: number;
    weekday_display: string;
    group: RosaryGroup;
  };
}

export const createRosaryGroup = (
  overrides?: Partial<RosaryGroup>,
): RosaryGroup => ({
  id: randNumber({ min: 1, max: 4 }),
  name: 'Joyeux',
  slug: 'joyeux',
  mysteries:
    "L'Annonciation\nLa Visitation\nLa Nativité\nLa Présentation\nLe Recouvrement",
  audio_file: '',
  ...overrides,
});

export const createRosaryDay = (overrides?: Partial<RosaryDay>): RosaryDay => ({
  day: {
    id: 1,
    weekday_display: 'Lundi',
    group: createRosaryGroup(),
  },
  ...overrides,
});
