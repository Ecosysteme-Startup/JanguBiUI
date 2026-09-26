import { ids, parishes } from '@/testing/mocks/db';

/** Données démo du lot F6 (demandes d'actes), forme ProcessorOutput complète. */
export const saintesTherese = parishes[2];

export const ACTE_IDS = {
  submitted: 'd0c00000-0000-4000-8000-000000000001',
  verification: 'd0c00000-0000-4000-8000-000000000002',
  info: 'd0c00000-0000-4000-8000-000000000003',
  ready: 'd0c00000-0000-4000-8000-000000000004',
  collected: 'd0c00000-0000-4000-8000-000000000005',
  rejected: 'd0c00000-0000-4000-8000-000000000006',
};

const LABELS: Record<string, string> = {
  submitted: 'Soumise',
  under_verification: 'En vérification',
  info_requested: 'Complément demandé',
  ready_for_pickup: 'Prête à retirer',
  collected: 'Retirée',
  rejected: 'Rejetée',
  cancelled: 'Annulée',
};

export const TYPE_LABELS: Record<string, string> = {
  baptism: 'Certificat de baptême',
  first_communion: 'Attestation de première communion',
  confirmation: 'Attestation de confirmation',
  religious_marriage: 'Attestation de mariage religieux',
  godparent: 'Attestation parrain / marraine',
  other: 'Autre document',
};

export type Log = { from_status: string; to_status: string; comment: string; created_at: string; changed_by_name?: string; by_requester?: boolean };

/** Équipe de la paroisse (titulaires d'actes.traiter) : `aa` est l'utilisateur connecté des tests. */
export const TEAM = [
  { id: '5f0c0000-0000-4000-8000-0000000000aa', full_name: 'Marie-Thérèse Diouf' },
  { id: '5f0c0000-0000-4000-8000-0000000000bb', full_name: 'Germaine Faye' },
];
export const teamName = (id: string | null) => TEAM.find((t) => t.id === id)?.full_name ?? null;

export const REASON_LABELS_MOCK: Record<string, string> = {
  religious_marriage: 'Mariage religieux',
  godparent: 'Parrain / marraine',
  catechism: 'Inscription catéchèse',
  parish_file: 'Dossier paroissial',
  personal: 'Usage personnel',
  other: 'Autre',
};

export type MockAttachment = { id: number; name: string; content_type: string; size: number | null; uploaded_at: string };

export type MockActe = {
  id: string;
  reference: string;
  document_type: string;
  document_type_label: string;
  document_type_free: string;
  reason: string;
  reason_free: string;
  status: string;
  status_label: string;
  target_node: { id: string; name: string };
  requester_last_name: string;
  requester_first_names: string;
  date_of_birth: string;
  place_of_birth: string;
  contact_phone: string;
  contact_email: string;
  registered_last_name: string;
  registered_first_names: string;
  father_last_name: string;
  mother_last_name: string;
  sacrament_approximate_date: string;
  sacrament_location: string;
  additional_info: string;
  document_details: Record<string, string>;
  rejection_reason: string;
  pickup_mode: string;
  pickup_place: { name: string; address: string } | null;
  pickup_hours: string;
  pickup_message: string;
  history: Log[];
  register: { volume: string; page: string; number: string; marginal_notes: string };
  assigned_to_id: string | null;
  attachments: MockAttachment[];
  age_days: number | null;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  mine: boolean;
};

const log = (from: string, to: string, created_at: string, comment = ''): Log =>
  from === '' ? { from_status: from, to_status: to, comment, created_at, changed_by_name: 'Marie-Thérèse Diouf', by_requester: true } : { from_status: from, to_status: to, comment, created_at, changed_by_name: 'Germaine Faye', by_requester: false };

const base = (over: Partial<MockActe> & Pick<MockActe, 'id' | 'reference' | 'status'>): MockActe => ({
  document_type: 'baptism',
  document_type_label: TYPE_LABELS.baptism,
  document_type_free: '',
  reason: 'religious_marriage',
  reason_free: '',
  status_label: LABELS[over.status],
  target_node: { id: saintesTherese.id, name: saintesTherese.name },
  requester_last_name: 'Diouf',
  requester_first_names: 'Marie-Thérèse Ndèye',
  date_of_birth: '1992-03-14',
  place_of_birth: 'Dakar',
  contact_phone: '+221 77 418 26 90',
  contact_email: 'marie-therese.diouf@example.sn',
  registered_last_name: '',
  registered_first_names: '',
  father_last_name: 'Étienne Diouf',
  mother_last_name: 'Hélène Gomis',
  sacrament_approximate_date: '08/1992',
  sacrament_location: saintesTherese.name,
  additional_info: '',
  document_details: {},
  rejection_reason: '',
  pickup_mode: 'secretariat',
  pickup_place: null,
  pickup_hours: '',
  pickup_message: '',
  history: [log('', 'submitted', '2026-09-21T10:14:00+00:00')],
  register: { volume: '', page: '', number: '', marginal_notes: '' },
  assigned_to_id: null,
  attachments: [],
  age_days: 1,
  is_overdue: false,
  created_at: '2026-09-21T10:14:00+00:00',
  updated_at: '2026-09-22T09:02:00+00:00',
  closed_at: null,
  mine: true,
  ...over,
});

const seed = (): MockActe[] => [
  base({ id: ACTE_IDS.submitted, reference: 'DOC-20260923-00419', status: 'submitted', document_type: 'godparent', document_type_label: TYPE_LABELS.godparent, reason: 'godparent', document_details: { celebration_type: 'Baptême' }, target_node: { id: ids.saintDominique, name: 'Saint-Dominique' } }),
  base({
    id: ACTE_IDS.verification,
    reference: 'DOC-20260921-00412',
    status: 'under_verification',
    history: [
      log('', 'submitted', '2026-09-21T10:14:00+00:00'),
      log('submitted', 'under_verification', '2026-09-22T09:02:00+00:00'),
    ],
    register: { volume: 'II', page: '47', number: '187', marginal_notes: '' },
    assigned_to_id: '5f0c0000-0000-4000-8000-0000000000bb',
    attachments: [{ id: 31, name: 'carte-bapteme-1992.jpg', content_type: 'image/jpeg', size: 421_888, uploaded_at: '2026-09-21T10:14:00+00:00' }],
    age_days: 9,
    is_overdue: true,
  }),
  base({
    id: ACTE_IDS.info,
    reference: 'DOC-20260919-00414',
    status: 'info_requested',
    document_type: 'confirmation',
    document_type_label: TYPE_LABELS.confirmation,
    history: [
      log('', 'submitted', '2026-09-19T08:00:00+00:00'),
      log('submitted', 'under_verification', '2026-09-20T09:00:00+00:00'),
      log('under_verification', 'info_requested', '2026-09-22T09:05:00+00:00', 'Pouvez-vous nous indiquer le nom de votre marraine ?'),
    ],
  }),
  base({
    id: ACTE_IDS.ready,
    reference: 'DOC-20260915-00408',
    status: 'ready_for_pickup',
    document_type: 'confirmation',
    document_type_label: TYPE_LABELS.confirmation,
    target_node: { id: parishes[1].id, name: parishes[1].name },
    pickup_place: { name: 'Secrétariat de la Cathédrale', address: 'Boulevard de la République, Plateau' },
    pickup_hours: 'Lundi – vendredi, 9 h-12 h',
    pickup_message: 'Présentez-vous avec une pièce d’identité.',
    history: [
      log('', 'submitted', '2026-09-15T08:00:00+00:00'),
      log('submitted', 'under_verification', '2026-09-16T09:00:00+00:00'),
      log('under_verification', 'ready_for_pickup', '2026-09-23T11:00:00+00:00', 'Présentez-vous avec une pièce d’identité.'),
    ],
  }),
  base({
    id: ACTE_IDS.collected,
    reference: 'DOC-20260901-00401',
    status: 'collected',
    document_type: 'first_communion',
    document_type_label: TYPE_LABELS.first_communion,
    reason: 'catechism',
    closed_at: '2026-09-15T10:00:00+00:00',
    age_days: null,
    history: [
      log('', 'submitted', '2026-09-01T08:00:00+00:00'),
      log('submitted', 'under_verification', '2026-09-02T09:00:00+00:00'),
      log('under_verification', 'ready_for_pickup', '2026-09-05T11:00:00+00:00'),
      log('ready_for_pickup', 'collected', '2026-09-15T10:00:00+00:00'),
    ],
  }),
  base({
    id: ACTE_IDS.rejected,
    reference: 'DOC-20260904-00399',
    status: 'rejected',
    reason: 'personal',
    rejection_reason: 'Aucun acte à ce nom dans nos registres.',
    closed_at: '2026-09-11T10:00:00+00:00',
    age_days: null,
    history: [
      log('', 'submitted', '2026-09-04T08:00:00+00:00'),
      log('submitted', 'under_verification', '2026-09-05T09:00:00+00:00'),
      log('under_verification', 'rejected', '2026-09-11T10:00:00+00:00', 'Aucun acte à ce nom dans nos registres.'),
    ],
  }),
];

export const actesState: {
  requests: MockActe[];
  notes: Record<string, { id: number; author_id: string | null; author_name: string; content: string; created_at: string }[]>;
  lastAssign: { id: string; body: Record<string, unknown> } | null;
  lastCreate: Record<string, unknown> | null;
  lastSupplement: Record<string, unknown> | null;
  lastTransition: { id: string; transition: string; body: Record<string, unknown> } | null;
  uploads: number;
} = { requests: [], notes: {}, lastAssign: null, lastCreate: null, lastSupplement: null, lastTransition: null, uploads: 0 };

export const resetActes = () => {
  actesState.requests = seed();
  actesState.notes = {
    [ACTE_IDS.verification]: [
      { id: 1, author_id: '5f0c0000-0000-4000-8000-0000000000bb', author_name: 'Germaine Faye', content: 'Deux baptêmes au même nom en 1992 : vérifier la marraine.', created_at: '2026-09-22T10:36:00+00:00' },
    ],
  };
  actesState.lastCreate = null;
  actesState.lastAssign = null;
  actesState.lastSupplement = null;
  actesState.lastTransition = null;
  actesState.uploads = 0;
};
resetActes();

export const STATUS_LABELS = LABELS;

export const ORIGINAL_NOTICE =
  "L'acte vous sera remis en original, signé par le curé (ou la personne qu'il mandate) et revêtu du sceau de la paroisse. Aucun acte n'est délivré par voie numérique.";
