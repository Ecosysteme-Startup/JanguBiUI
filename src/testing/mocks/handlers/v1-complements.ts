import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';

import { NOEUD_ARCHIDIOCESE, NOEUD_SAINT_DOMINIQUE } from '../noeuds-v2';

// Compléments V1 (backend docs/API-V1-COMPLEMENTS.md) : intentions de messe,
// comptes du clergé, recherche transverse, tâches du jour, équipe des
// compteurs, épinglage. Formes calquées sur les sérialiseurs ; données des
// maquettes (Marie-Thérèse Diouf, Saint-Dominique, Père Emmanuel Tine).

const API = `${env.API_URL}`;

const page = <T>(rows: T[], request: Request, defaut = 10) => {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') ?? defaut);
  const offset = Number(url.searchParams.get('offset') ?? 0);
  return {
    count: rows.length,
    next:
      offset + limit < rows.length
        ? `${url.pathname}?offset=${offset + limit}`
        : null,
    previous:
      offset > 0
        ? `${url.pathname}?offset=${Math.max(0, offset - limit)}`
        : null,
    results: rows.slice(offset, offset + limit),
  };
};

const erreur = (status: number, code: string, message: string) =>
  HttpResponse.json({ error: { code, message, details: {} } }, { status });

const SD = { id: NOEUD_SAINT_DOMINIQUE, name: 'Saint-Dominique' };
const EGLISE_SD = { id: 12, name: 'Église Saint-Dominique' };

export const NOTICE_OFFRANDE =
  "L'application ne reçoit aucune offrande. Selon l'usage, l'offrande de messe se remet directement au secrétariat de la paroisse.";

// --- Intentions de messe ------------------------------------------------------------

type Intention = {
  id: string;
  parish: { id: string; name: string };
  place: { id: number; name: string } | null;
  kind: string;
  intention: string;
  is_anonymous: boolean;
  requested_date: string | null;
  requested_mass: string;
  status: string;
  scheduled_date: string | null;
  scheduled_mass: string;
  scheduled_time: string | null;
  refusal_reason: string;
  celebrated_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  requester_name: string;
  decided_at: string | null;
};

const intention = (
  n: number,
  o: Partial<Intention> & Pick<Intention, 'intention' | 'status'>,
): Intention => ({
  id: `1e000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  parish: SD,
  place: null,
  kind: 'defunt',
  is_anonymous: false,
  requested_date: '2026-10-11',
  requested_mass: '11:30',
  scheduled_date: null,
  scheduled_mass: '',
  scheduled_time: null,
  refusal_reason: '',
  celebrated_at: null,
  cancelled_at: null,
  created_at: '2026-09-27T10:12:00+00:00',
  requester_name: 'Marie-Thérèse Diouf',
  decided_at: null,
  ...o,
});

const intentionsInitiales = (): Intention[] => [
  intention(1, {
    intention: "Pour le repos de l'âme de Joseph Diouf",
    status: 'planifiee',
    requested_date: '2026-11-02',
    requested_mass: '18:30',
    scheduled_date: '2026-11-02',
    scheduled_mass: 'Messe de 18 h 30',
    scheduled_time: '18:30:00',
    place: EGLISE_SD,
  }),
  intention(2, {
    kind: 'action_de_graces',
    intention:
      'Action de grâce pour les 25 ans de mariage de Paul et Agnès Sarr',
    status: 'recue',
    is_anonymous: true,
  }),
  intention(3, {
    kind: 'particuliere',
    intention: 'Pour la guérison de Mme Awa Faye',
    status: 'refusee',
    requested_date: '2026-10-04',
    refusal_reason:
      'Les intentions de la messe du dimanche 4 octobre sont déjà complètes. Une messe de semaine ou un autre dimanche reste possible.',
  }),
  intention(4, {
    kind: 'defunt',
    intention:
      'Pour le repos de l’âme de Marguerite Mendy, un an après son rappel à Dieu',
    status: 'recue',
    requested_date: '2026-10-17',
    requested_mass: '18:30',
    requester_name: 'Jean-Baptiste Mendy',
  }),
  intention(5, {
    kind: 'defunt',
    intention: 'Pour le repos de l’âme de Rose Gomis',
    status: 'recue',
    requested_date: null,
    requested_mass: '',
    requester_name: 'Cécile Coly',
  }),
];

let intentions = intentionsInitiales();

// Messes du jour (horaires `MassSchedule` du lieu) et plafond par messe (§5.2).
const MESSES_SD = [
  { start_time: '07:00:00', label: 'Messe de 7 h', language: 'fr' },
  { start_time: '10:00:00', label: 'Messe de 10 h', language: 'fr' },
  { start_time: '18:30:00', label: 'Messe de 18 h 30', language: 'fr' },
];
let plafond: number | null = 5;
type PlafondMesse = {
  id: number;
  place_id: number;
  start_time: string;
  weekday: number | null;
  date: string | null;
  max_intentions: number | null;
};
let plafondsMesses: PlafondMesse[] = [];
const heureLongue = (t: string) => (t.length === 5 ? `${t}:00` : t);
/** 0 = lundi … 6 = dimanche. */
const jourSemaine = (date: string) =>
  (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7;
const plafondEffectif = (
  date: string,
  heure: string,
): { max: number | null; source: 'date' | 'horaire' | 'paroisse' } => {
  const d = plafondsMesses.find(
    (p) => p.date === date && heureLongue(p.start_time) === heure,
  );
  if (d) return { max: d.max_intentions, source: 'date' };
  const h = plafondsMesses.find(
    (p) =>
      p.weekday === jourSemaine(date) && heureLongue(p.start_time) === heure,
  );
  if (h) return { max: h.max_intentions, source: 'horaire' };
  return { max: plafond, source: 'paroisse' };
};

const comptees = (date: string, heure: string, sauf?: string) =>
  intentions.filter(
    (i) =>
      i.id !== sauf &&
      ['planifiee', 'celebree'].includes(i.status) &&
      i.scheduled_date === date &&
      i.scheduled_time === heure,
  );

const messesDuJour = (date: string) =>
  MESSES_SD.map((m) => {
    const n = comptees(date, m.start_time).length;
    const { max, source } = plafondEffectif(date, m.start_time);
    return {
      place_id: EGLISE_SD.id,
      place_name: EGLISE_SD.name,
      ...m,
      note: '',
      intentions_count: n,
      max_intentions: max,
      cap_source: source,
      remaining: max === null ? null : Math.max(0, max - n),
      is_full: max !== null && n >= max,
    };
  });

const sansHeure = (date: string) =>
  intentions.filter(
    (i) =>
      ['planifiee', 'celebree'].includes(i.status) &&
      i.scheduled_date === date &&
      !MESSES_SD.some((m) => m.start_time === i.scheduled_time),
  );

const ligneFeuille = (i: Intention) => ({
  id: i.id,
  kind: i.kind,
  kind_label:
    { defunt: 'Pour un défunt', action_de_graces: 'Action de grâce' }[i.kind] ??
    'Intention particulière',
  intention: i.intention,
  announced_as: i.is_anonymous ? 'Une personne' : i.requester_name,
  status: i.status,
});

const MOI = 'Marie-Thérèse Diouf';

const versFidele = (i: Intention) => {
  const { requester_name: _r, decided_at: _d, ...reste } = i;
  return { ...reste, notice: NOTICE_OFFRANDE };
};
const versStaff = (i: Intention) => ({
  ...i,
  announced_as: i.is_anonymous ? 'Une personne' : i.requester_name,
});

const intentionsHandlers = [
  http.get(`${API}/mass-intentions/notice/`, () =>
    HttpResponse.json({ notice: NOTICE_OFFRANDE }),
  ),
  http.get(`${API}/mass-intentions/mine/`, ({ request }) =>
    HttpResponse.json(
      page(
        intentions.filter((i) => i.requester_name === MOI).map(versFidele),
        request,
        20,
      ),
    ),
  ),
  http.post(`${API}/mass-intentions/`, async ({ request }) => {
    const b = (await request.json()) as Record<string, unknown>;
    const i = intention(intentions.length + 1, {
      kind: String(b.kind),
      intention: String(b.intention),
      is_anonymous: !!b.is_anonymous,
      requested_date: b.requested_date ? String(b.requested_date) : null,
      requested_mass: String(b.requested_mass ?? ''),
      status: 'recue',
    });
    intentions.unshift(i);
    return HttpResponse.json(versFidele(i), { status: 201 });
  }),
  http.post(`${API}/mass-intentions/:id/cancel/`, ({ params }) => {
    const i = intentions.find((x) => x.id === params.id);
    if (!i) return erreur(404, 'not_found', 'Intention introuvable.');
    i.status = 'annulee';
    i.cancelled_at = '2026-09-27T11:00:00+00:00';
    return HttpResponse.json(versFidele(i));
  }),
  http.get(`${API}/mass-intentions/parish/`, ({ request }) => {
    const url = new URL(request.url);
    if (!url.searchParams.get('node'))
      return erreur(400, 'validation_error', 'La paroisse est obligatoire.');
    const statut = url.searchParams.get('status');
    return HttpResponse.json(
      page(
        intentions.filter((i) => !statut || i.status === statut).map(versStaff),
        request,
      ),
    );
  }),
  http.get(`${API}/mass-intentions/parish/messes/`, ({ request }) => {
    const url = new URL(request.url);
    const date = url.searchParams.get('date') ?? '';
    if (!url.searchParams.get('node') || !date)
      return erreur(400, 'validation_error', 'Paroisse et date obligatoires.');
    return HttpResponse.json({
      node: SD,
      date,
      max_per_mass: plafond,
      masses: messesDuJour(date),
      without_time_count: sansHeure(date).length,
    });
  }),
  http.get(`${API}/mass-intentions/parish/feuille/`, ({ request }) => {
    const url = new URL(request.url);
    const date = url.searchParams.get('date') ?? '';
    if (!url.searchParams.get('node') || !date)
      return erreur(400, 'validation_error', 'Paroisse et date obligatoires.');
    return HttpResponse.json({
      node: SD,
      date,
      masses: messesDuJour(date).map((m) => ({
        ...m,
        intentions: comptees(date, m.start_time).map(ligneFeuille),
      })),
      other_intentions: sansHeure(date).map((i) => ({
        ...ligneFeuille(i),
        scheduled_mass: i.scheduled_mass,
      })),
    });
  }),
  http.get(`${API}/mass-intentions/parish/reglages/`, () =>
    HttpResponse.json({ node: SD.id, max_per_mass: plafond }),
  ),
  http.patch(`${API}/mass-intentions/parish/reglages/`, async ({ request }) => {
    const b = (await request.json()) as { max_per_mass?: number | null };
    const v = b.max_per_mass === null ? null : Number(b.max_per_mass);
    if (v !== null && (!Number.isInteger(v) || v < 1 || v > 50))
      return erreur(
        400,
        'max_invalid',
        'Le nombre d’intentions par messe va de 1 à 50.',
      );
    plafond = v;
    return HttpResponse.json({ node: SD.id, max_per_mass: plafond });
  }),
  http.get(`${API}/mass-intentions/parish/messes/plafond/`, () =>
    HttpResponse.json(plafondsMesses),
  ),
  http.put(
    `${API}/mass-intentions/parish/messes/plafond/`,
    async ({ request }) => {
      const b = (await request.json()) as Omit<PlafondMesse, 'id'>;
      const aJour = b.weekday !== null && b.weekday !== undefined;
      const aDate = !!b.date;
      if (aJour === aDate)
        return erreur(
          400,
          'weekday_or_date',
          'Indiquez soit un jour de la semaine, soit une date.',
        );
      if (aJour && (b.weekday! < 0 || b.weekday! > 6))
        return erreur(400, 'weekday_invalid', 'Jour de la semaine invalide.');
      const v = b.max_intentions;
      if (v !== null && (!Number.isInteger(v) || v < 1 || v > 50))
        return erreur(
          400,
          'max_invalid',
          'Le nombre d’intentions par messe va de 1 à 50.',
        );
      if (b.place_id !== EGLISE_SD.id)
        return erreur(
          400,
          'place_outside',
          'Ce lieu n’est pas de la paroisse.',
        );
      const cle = (p: PlafondMesse | Omit<PlafondMesse, 'id'>) =>
        `${p.place_id}|${heureLongue(p.start_time)}|${p.weekday ?? ''}|${p.date ?? ''}`;
      const cap: PlafondMesse = {
        id: plafondsMesses.length + 1,
        place_id: b.place_id,
        start_time: heureLongue(b.start_time),
        weekday: aJour ? b.weekday : null,
        date: aDate ? b.date : null,
        max_intentions: v,
      };
      plafondsMesses = [
        ...plafondsMesses.filter((p) => cle(p) !== cle(cap)),
        cap,
      ];
      return HttpResponse.json(cap);
    },
  ),
  http.delete(
    `${API}/mass-intentions/parish/messes/plafond/`,
    ({ request }) => {
      const u = new URL(request.url).searchParams;
      const heure = heureLongue(u.get('start_time') ?? '');
      const wd = u.get('weekday');
      const date = u.get('date');
      plafondsMesses = plafondsMesses.filter(
        (p) =>
          !(
            heureLongue(p.start_time) === heure &&
            String(p.place_id) === u.get('place_id') &&
            (date ? p.date === date : String(p.weekday) === wd)
          ),
      );
      return new HttpResponse(null, { status: 204 });
    },
  ),
  http.post(
    `${API}/mass-intentions/:id/accept/`,
    async ({ params, request }) => {
      const i = intentions.find((x) => x.id === params.id);
      if (!i) return erreur(404, 'not_found', 'Intention introuvable.');
      const b = (await request.json()) as {
        scheduled_date: string;
        scheduled_mass?: string;
        scheduled_time?: string | null;
        place_id?: number | null;
      };
      const heure = b.scheduled_time
        ? `${b.scheduled_time.slice(0, 5)}:00`
        : null;
      if (heure) {
        if (!b.place_id && !i.place)
          return erreur(
            400,
            'place_required',
            'Choisissez le lieu de la messe.',
          );
        const { max } = plafondEffectif(b.scheduled_date, heure);
        if (
          max !== null &&
          comptees(b.scheduled_date, heure, i.id).length >= max
        )
          return erreur(
            409,
            'mass_full',
            'Cette messe a déjà toutes ses intentions.',
          );
      }
      i.status = 'planifiee';
      i.scheduled_date = b.scheduled_date;
      i.scheduled_mass = b.scheduled_mass ?? '';
      i.scheduled_time = heure;
      if (b.place_id) i.place = EGLISE_SD;
      i.decided_at = '2026-09-27T11:00:00+00:00';
      return HttpResponse.json(versStaff(i));
    },
  ),
  http.post(
    `${API}/mass-intentions/:id/decline/`,
    async ({ params, request }) => {
      const i = intentions.find((x) => x.id === params.id);
      if (!i) return erreur(404, 'not_found', 'Intention introuvable.');
      const { reason } = (await request.json()) as { reason?: string };
      if (!reason?.trim())
        return erreur(400, 'reason_required', 'Le motif est obligatoire.');
      i.status = 'refusee';
      i.refusal_reason = reason;
      return HttpResponse.json(versStaff(i));
    },
  ),
  http.post(`${API}/mass-intentions/:id/celebrate/`, ({ params }) => {
    const i = intentions.find((x) => x.id === params.id);
    if (!i) return erreur(404, 'not_found', 'Intention introuvable.');
    i.status = 'celebree';
    i.celebrated_at = '2026-09-27T12:00:00+00:00';
    return HttpResponse.json(versStaff(i));
  }),
];

// --- Comptes du clergé --------------------------------------------------------------

export const JETON_INVITATION = 'jeton-demo-emmanuel';

type InvitationMock = Record<string, unknown> & { id: string; status: string };

const invitationsInitiales = (): InvitationMock[] => [
  {
    id: '1a000000-0000-4000-8000-000000000001',
    email: 'abbe.ndour@archidakar.sn',
    first_name: 'Paul',
    last_name: 'Ndour',
    node: {
      id: 'sp000000-0000-4000-8000-000000000001',
      name: 'Saint-Pierre des Baobabs',
    },
    etat_de_vie: 'clerc',
    degre_ordre: 'pretre',
    status: 'en_attente',
    expires_at: '2026-10-06T09:00:00+00:00',
    invited_by_name: 'Moustoifa Ben',
    accepted_at: null,
    revoked_at: null,
    created_at: '2026-09-22T09:00:00+00:00',
  },
  {
    id: '1a000000-0000-4000-8000-000000000002',
    email: 'diacre.sarr@archidakar.sn',
    first_name: 'Luc',
    last_name: 'Sarr',
    node: SD,
    etat_de_vie: 'clerc',
    degre_ordre: 'diacre_permanent',
    status: 'en_attente',
    expires_at: '2026-10-02T09:00:00+00:00',
    invited_by_name: 'Moustoifa Ben',
    accepted_at: null,
    revoked_at: null,
    created_at: '2026-09-18T09:00:00+00:00',
  },
];

type CompteMock = Record<string, unknown> & {
  id: string;
  statut_verification: string;
  is_active: boolean;
};

/** Pièce justificative (§5.3) telle que la renvoie le sérialiseur. */
const pieceJustificative = (id: number) => ({
  id,
  file_name: 'lettre-de-nomination.pdf',
  file_type: 'application/pdf',
  url: `http://localhost:8001/media/files/${id}/lettre-de-nomination.pdf`,
});

const ROLES_EN_ATTENTE = ['declare', 'complement'];

/** Filtres `role`, `statut`, `q` (le sous-arbre `diocese` n'est pas simulé). */
const filtrerComptes = (rows: CompteMock[], request: Request) => {
  const p = new URL(request.url).searchParams;
  const role = p.get('role');
  const statut = p.get('statut');
  const q = (p.get('q') ?? '').toLowerCase();
  return rows.filter(
    (c) =>
      (!role ||
        (role === 'consacre'
          ? c.etat_de_vie === 'consacre'
          : c.degre_ordre === role)) &&
      (!statut ||
        (statut === 'en_attente'
          ? ROLES_EN_ATTENTE.includes(c.statut_verification)
          : c.statut_verification === statut)) &&
      (!q ||
        `${String(c.full_name)} ${String(c.email)}`.toLowerCase().includes(q)),
  );
};

const comptesInitiaux = (): CompteMock[] => [
  {
    id: 'c0000000-0000-4000-8000-000000000001',
    email: 'p.diatta@archidakar.sn',
    full_name: 'Pierre Diatta',
    etat_de_vie: 'clerc',
    degre_ordre: 'pretre',
    statut_verification: 'declare',
    verification_note: '',
    declared_at: '2026-09-28T08:00:00+00:00',
    is_active: false,
    node: {
      id: 'st000000-0000-4000-8000-000000000001',
      name: 'Sainte-Thérèse de Grand-Dakar',
    },
    justificatif: pieceJustificative(77),
  },
  {
    id: 'c0000000-0000-4000-8000-000000000002',
    email: 'l.faye@archidakar.sn',
    full_name: 'Luc Faye',
    etat_de_vie: 'clerc',
    degre_ordre: 'diacre_permanent',
    statut_verification: 'declare',
    verification_note: '',
    declared_at: '2026-09-25T08:00:00+00:00',
    is_active: false,
    node: SD,
    justificatif: null,
  },
  {
    id: 'c0000000-0000-4000-8000-000000000003',
    email: 'e.tine@archidakar.sn',
    full_name: 'Emmanuel Tine',
    etat_de_vie: 'clerc',
    degre_ordre: 'pretre',
    statut_verification: 'verifie',
    verification_note: '',
    declared_at: '2026-09-02T08:00:00+00:00',
    is_active: true,
    node: SD,
    justificatif: pieceJustificative(61),
  },
];

let invitations = invitationsInitiales();
let comptes = comptesInitiaux();

const clergeHandlers = [
  http.get(`${API}/clergy-accounts/invitations/`, ({ request }) => {
    const statut = new URL(request.url).searchParams.get('status');
    return HttpResponse.json(
      page(
        invitations.filter((i) => !statut || i.status === statut),
        request,
      ),
    );
  }),
  http.post(
    `${API}/clergy-accounts/invitations/validate/`,
    async ({ request }) => {
      const { token } = (await request.json()) as { token?: string };
      if (token !== JETON_INVITATION)
        return erreur(
          410,
          'invitation_invalide',
          'Cette invitation n’est plus valable.',
        );
      return HttpResponse.json({
        email_masked: 'e•••e@exemple.sn',
        first_name: 'Emmanuel',
        node_name: 'Saint-Dominique',
        etat_de_vie: 'clerc',
        degre_ordre: 'pretre',
        expires_at: '2026-10-13T09:00:00+00:00',
        register_url:
          'https://auth.exemple.sn/realms/jangubi/protocol/openid-connect/registrations?client_id=jangubi-web',
      });
    },
  ),
  http.post(
    `${API}/clergy-accounts/invitations/accept/`,
    async ({ request }) => {
      const { token, justificatif_id } = (await request.json()) as {
        token?: string;
        justificatif_id?: number;
      };
      if (token !== JETON_INVITATION)
        return erreur(
          410,
          'invitation_invalide',
          'Cette invitation n’est plus valable.',
        );
      return HttpResponse.json({
        id: 'c0000000-0000-4000-8000-0000000000e7',
        email: 'emmanuel.tine@exemple.sn',
        full_name: 'Emmanuel Tine',
        etat_de_vie: 'clerc',
        degre_ordre: 'pretre',
        statut_verification: 'declare',
        verification_note: '',
        declared_at: '2026-09-29T09:00:00+00:00',
        is_active: true,
        node: SD,
        justificatif: justificatif_id
          ? pieceJustificative(justificatif_id)
          : null,
      });
    },
  ),
  http.post(`${API}/clergy-accounts/invitations/`, async ({ request }) => {
    const b = (await request.json()) as Record<string, unknown>;
    if (
      invitations.some((i) => i.email === b.email && i.status === 'en_attente')
    )
      return erreur(
        400,
        'invitation_duplicate',
        'Une invitation est déjà en attente pour cette adresse.',
      );
    const inv: InvitationMock = {
      id: `1a000000-0000-4000-8000-${String(invitations.length + 1).padStart(12, '0')}`,
      email: String(b.email),
      first_name: String(b.first_name ?? ''),
      last_name: String(b.last_name ?? ''),
      node:
        b.node === NOEUD_ARCHIDIOCESE
          ? { id: NOEUD_ARCHIDIOCESE, name: 'Archidiocèse de Dakar' }
          : SD,
      etat_de_vie: String(b.etat_de_vie),
      degre_ordre: String(b.degre_ordre),
      status: 'en_attente',
      expires_at: '2026-10-13T09:00:00+00:00',
      invited_by_name: 'Moustoifa Ben',
      accepted_at: null,
      revoked_at: null,
      created_at: '2026-09-29T09:00:00+00:00',
      justificatif: b.justificatif_id
        ? pieceJustificative(Number(b.justificatif_id))
        : null,
    };
    invitations.unshift(inv);
    return HttpResponse.json(
      {
        ...inv,
        accept_url: `http://localhost:3000/accept-invitation?token=${JETON_INVITATION}`,
      },
      { status: 201 },
    );
  }),
  http.post(`${API}/clergy-accounts/invitations/:id/revoke/`, ({ params }) => {
    const i = invitations.find((x) => x.id === params.id);
    if (!i) return erreur(404, 'not_found', 'Invitation introuvable.');
    i.status = 'revoquee';
    i.revoked_at = '2026-09-29T09:00:00+00:00';
    return HttpResponse.json(i);
  }),
  http.get(`${API}/clergy-accounts/pending/`, ({ request }) =>
    HttpResponse.json(
      page(
        filtrerComptes(
          comptes.filter((c) =>
            ROLES_EN_ATTENTE.includes(c.statut_verification),
          ),
          request,
        ),
        request,
      ),
    ),
  ),
  http.get(`${API}/clergy-accounts/validated/`, ({ request }) =>
    HttpResponse.json(
      page(
        filtrerComptes(
          comptes.filter((c) => c.statut_verification === 'verifie'),
          request,
        ),
        request,
      ),
    ),
  ),
  http.get(`${API}/clergy-accounts/`, ({ request }) =>
    HttpResponse.json(page(filtrerComptes(comptes, request), request)),
  ),
  http.post(
    `${API}/clergy-accounts/:id/:action/`,
    async ({ params, request }) => {
      const c = comptes.find((x) => x.id === params.id);
      if (!c) return erreur(404, 'not_found', 'Compte introuvable.');
      switch (params.action) {
        case 'validate':
          c.statut_verification = 'verifie';
          break;
        case 'refuse': {
          const { reason } = (await request.json()) as { reason?: string };
          if (!reason?.trim())
            return erreur(400, 'reason_required', 'Le motif est obligatoire.');
          c.statut_verification = 'rejete';
          c.verification_note = reason;
          break;
        }
        case 'activate':
          c.is_active = true;
          break;
        case 'deactivate':
          c.is_active = false;
          break;
        default:
          return erreur(404, 'not_found', 'Action inconnue.');
      }
      return HttpResponse.json(c);
    },
  ),
];

// --- Recherche transverse -----------------------------------------------------------

const rechercheHandlers = [
  http.get(`${API}/search/`, ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').trim();
    if (q.length < 2)
      return erreur(400, 'recherche_trop_courte', 'Deux caractères au moins.');
    const types = (
      url.searchParams.get('types') ??
      'bible,paroisses,lieux,annonces,pretres,audio'
    ).split(',');
    const trouve = (s: string) =>
      s
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .toLowerCase()
        .includes(q.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase());
    const tous = {
      bible: [
        {
          id: 24049,
          book_name: 'Luc',
          book_slug: 'luc',
          book_id: 42,
          chapter_id: 1101,
          chapter: 1,
          verse: 49,
          text: 'Le Puissant fit pour moi des merveilles ; Saint est son nom !',
        },
      ],
      paroisses: [
        {
          id: NOEUD_SAINT_DOMINIQUE,
          code: 'DAK-SD',
          name: 'Saint-Dominique',
          type: 'paroisse',
          city: 'Dakar',
          on_platform: true,
        },
        {
          id: 'st000000-0000-4000-8000-000000000001',
          code: 'DAK-ST',
          name: 'Sainte-Thérèse de Grand-Dakar',
          type: 'paroisse',
          city: 'Dakar',
          on_platform: true,
        },
      ],
      lieux: [
        {
          id: 7,
          name: 'Église Saint-Dominique',
          kind: 'eglise',
          city: 'Dakar',
          node_id: NOEUD_SAINT_DOMINIQUE,
          node_name: 'Saint-Dominique',
        },
      ],
      annonces: [
        {
          id: 'c1000000-0000-4000-8000-000000000001',
          title: 'Fête de saint Michel, mardi 29',
          excerpt: 'Messe à 18:30',
          content_type: 'announcement',
          published_at: '2026-09-26T08:00:00+00:00',
          node_id: NOEUD_SAINT_DOMINIQUE,
          node_name: 'Saint-Dominique',
        },
      ],
      pretres: [
        {
          id: 'e7000000-0000-4000-8000-000000000001',
          name: 'Emmanuel Tine',
          office: 'Curé',
          node_id: NOEUD_SAINT_DOMINIQUE,
          node_name: 'Saint-Dominique',
        },
      ],
      audio: [
        {
          id: 'a0000000-0000-4000-8000-000000000001',
          title: 'Homélie de la fête de saint Michel',
          duration_seconds: 840,
          source_name: 'Emmanuel Tine',
          album_id: 'ab000000-0000-4000-8000-000000000001',
          album_title: 'Homélies de septembre',
        },
      ],
    } as const;
    const results: Record<
      string,
      { items: unknown[]; next_offset: number | null }
    > = {};
    for (const t of types) {
      const items = (tous[t as keyof typeof tous] ?? []) as readonly Record<
        string,
        unknown
      >[];
      results[t] = {
        items: items.filter((i) =>
          trouve(
            String(i.name ?? i.title ?? '') +
              ' ' +
              String(i.text ?? '') +
              ' ' +
              String(i.node_name ?? ''),
          ),
        ),
        next_offset: null,
      };
    }
    return HttpResponse.json({ q, results });
  }),
];

// --- Tâches du jour, compteurs, épinglage -------------------------------------------

type CompteurMock = {
  id: number;
  nom: string;
  actif: boolean;
  ajoute_le: string;
};

const compteursInitiaux = (): CompteurMock[] => [
  {
    id: 1,
    nom: 'Jean Diouf',
    actif: true,
    ajoute_le: '2026-09-01T09:00:00+00:00',
  },
  {
    id: 2,
    nom: 'Awa Faye',
    actif: true,
    ajoute_le: '2026-09-01T09:00:00+00:00',
  },
];
let compteurs = compteursInitiaux();

const staffHandlers = [
  http.get(`${API}/staff/taches-du-jour/`, ({ request }) => {
    const node = new URL(request.url).searchParams.get('node');
    if (!node)
      return erreur(400, 'validation_error', 'Le nœud est obligatoire.');
    return HttpResponse.json({
      node: SD,
      date: '2026-09-27',
      tasks: [
        {
          code: 'demandes_a_traiter',
          label: 'Demandes d’actes à traiter',
          count: 2,
        },
        { code: 'quetes_a_confirmer', label: 'Quêtes à confirmer', count: 0 },
        {
          code: 'annonces_a_publier',
          label: 'Annonces en brouillon',
          count: 1,
        },
        {
          code: 'intentions_a_planifier',
          label: 'Intentions de messe à planifier',
          count: 2,
        },
        {
          code: 'confessions_du_jour',
          label: 'Créneaux de confession du jour',
          count: 1,
        },
      ],
      confessions: [
        {
          slot_id: 41,
          starts_at: '2026-09-27T17:00:00+00:00',
          ends_at: '2026-09-27T17:15:00+00:00',
          place_name: 'Église Saint-Dominique',
          priest_name: 'Emmanuel Tine',
          reserved: false,
        },
      ],
    });
  }),
  http.get(`${API}/staff/dons/compteurs/`, () =>
    HttpResponse.json({ compteurs, noms_recents: ['Paul Sarr'] }),
  ),
  http.post(`${API}/staff/dons/compteurs/`, async ({ request }) => {
    const { nom } = (await request.json()) as { nom?: string };
    if (!nom?.trim())
      return erreur(400, 'counter_name_required', 'Le nom est obligatoire.');
    if (
      compteurs.some(
        (c) => c.actif && c.nom.toLowerCase() === nom.trim().toLowerCase(),
      )
    )
      return erreur(
        400,
        'counter_duplicate',
        'Cette personne fait déjà partie de l’équipe.',
      );
    const c = {
      id: compteurs.length + 1,
      nom: nom.trim(),
      actif: true,
      ajoute_le: '2026-09-27T09:00:00+00:00',
    };
    compteurs.push(c);
    return HttpResponse.json(c, { status: 201 });
  }),
  http.patch(
    `${API}/staff/dons/compteurs/:id/`,
    async ({ params, request }) => {
      const c = compteurs.find((x) => x.id === Number(params.id));
      if (!c) return erreur(404, 'not_found', 'Compteur introuvable.');
      c.nom = ((await request.json()) as { nom: string }).nom;
      return HttpResponse.json(c);
    },
  ),
  http.delete(`${API}/staff/dons/compteurs/:id/`, ({ params }) => {
    const c = compteurs.find((x) => x.id === Number(params.id));
    if (!c) return erreur(404, 'not_found', 'Compteur introuvable.');
    c.actif = false;
    return new HttpResponse(null, { status: 204 });
  }),
];

/** Remet les données de ce module à l'état initial (tests). */
export const reinitialiserV1Complements = () => {
  intentions = intentionsInitiales();
  plafond = 5;
  plafondsMesses = [];
  invitations = invitationsInitiales();
  comptes = comptesInitiaux();
  compteurs = compteursInitiaux();
};

export const v1ComplementsHandlers = [
  ...intentionsHandlers,
  ...clergeHandlers,
  ...rechercheHandlers,
  ...staffHandlers,
];
