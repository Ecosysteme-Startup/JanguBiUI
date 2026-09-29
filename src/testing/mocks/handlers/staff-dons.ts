import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';

import { NOEUD_ARCHIDIOCESE, NOEUD_SAINT_DOMINIQUE } from './dons-analyse';

// Dons côté staff (`/v1/staff/dons/`) : fonds, quêtes en espèces, opérations,
// export, quêtes impérées et reversements. Exemples calqués sur les
// sérialiseurs du backend (apps/donations/serializers.py). Données fictives :
// paroisse Saint-Dominique, Mme Cécile Coly (économe), dimanche 27 septembre 2026.

const API = env.API_URL;

const page = <T>(rows: T[], request: Request, defaut = 20) => {
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

type Fonds = Record<string, unknown> & {
  id: string;
  status: string;
  kind: string;
};

const fonds = (
  id: string,
  title: string,
  kind: string,
  status: string,
  extra: Partial<Fonds> = {},
): Fonds => ({
  id,
  kind,
  destination: kind === 'quete_imperee' ? 'curie' : 'paroisse',
  title,
  description: '',
  starts_on: '2026-09-01',
  ends_on: null,
  goal_amount: null,
  raised: 0,
  status,
  image_url: null,
  place: null,
  messe_anticipee_incluse: false,
  node_id: NOEUD_SAINT_DOMINIQUE,
  parent_id: null,
  donations_count: 0,
  decided_by_office: '',
  authorization_ref: '',
  published_at: status === 'brouillon' ? null : '2026-09-01T08:00:00+00:00',
  closed_at: null,
  created_at: '2026-08-28T09:00:00+00:00',
  ...extra,
});

const fondsInitiaux = (): Fonds[] => [
  fonds(
    'f0000000-0000-4000-8000-000000000001',
    'Quête dominicale',
    'quete_dominicale',
    'ouvert',
    {
      raised: 1_245_000,
      donations_count: 86,
    },
  ),
  fonds(
    'f0000000-0000-4000-8000-000000000002',
    'Réfection de la toiture',
    'campagne',
    'ouvert',
    {
      goal_amount: 15_000_000,
      raised: 6_420_000,
      donations_count: 214,
    },
  ),
  fonds(
    'f0000000-0000-4000-8000-000000000003',
    'Denier du culte 2027',
    'contribution_annuelle',
    'brouillon',
  ),
  fonds(
    'f0000000-0000-4000-8000-000000000004',
    'Quête pour les séminaires',
    'quete_imperee',
    'ouvert',
    {
      parent_id: 'f1000000-0000-4000-8000-000000000001',
      raised: 312_500,
      donations_count: 12,
    },
  ),
];

type Quete = Record<string, unknown> & { id: number; status: string };

const quetesInitiales = (): Quete[] => [
  {
    id: 41,
    fund: {
      id: 'f0000000-0000-4000-8000-000000000001',
      title: 'Quête dominicale',
      kind: 'quete_dominicale',
    },
    place: 'Église Saint-Dominique',
    mass_date: '2026-09-27',
    mass_label: 'Messe de 10 h',
    amount: 387_500,
    counter_one: 'Jean Mendy',
    counter_two: 'Awa Faye',
    observation: '',
    status: 'saisie',
    entered_by: 'Cécile Coly',
    validated_by: null,
    validated_at: null,
    rejection_reason: '',
    deposit_id: null,
    created_at: '2026-09-27T12:10:00+00:00',
  },
  {
    id: 40,
    fund: {
      id: 'f0000000-0000-4000-8000-000000000001',
      title: 'Quête dominicale',
      kind: 'quete_dominicale',
    },
    place: 'Église Saint-Dominique',
    mass_date: '2026-09-20',
    mass_label: 'Messe de 10 h',
    amount: 362_000,
    counter_one: 'Jean Mendy',
    counter_two: 'Awa Faye',
    observation: '',
    status: 'validee',
    entered_by: 'Cécile Coly',
    validated_by: 'Emmanuel Tine',
    validated_at: '2026-09-21T09:00:00+00:00',
    rejection_reason: '',
    deposit_id: null,
    created_at: '2026-09-20T12:05:00+00:00',
  },
];

const operations = [
  {
    id: 'd0000000-0000-4000-8000-000000000001',
    reference: 'JB-2026-00412',
    receipt_number: 'R-2026-0412',
    fund: {
      id: 'f0000000-0000-4000-8000-000000000002',
      title: 'Réfection de la toiture',
      kind: 'campagne',
    },
    amount: 25_000,
    fee_amount: 250,
    fee_is_actual: true,
    charged_amount: 25_000,
    net_amount: 24_750,
    channel: 'en_ligne',
    source: 'app_android',
    payment_method: 'wave',
    place: null,
    status: 'confirme',
    created_at: '2026-09-27T09:12:00+00:00',
    confirmed_at: '2026-09-27T09:13:00+00:00',
    value_date: '2026-09-27',
    anonymous: false,
    donor: 'Don en ligne',
  },
  {
    id: 'd0000000-0000-4000-8000-000000000002',
    reference: 'QU-2026-00040',
    receipt_number: null,
    fund: {
      id: 'f0000000-0000-4000-8000-000000000001',
      title: 'Quête dominicale',
      kind: 'quete_dominicale',
    },
    amount: 362_000,
    fee_amount: 0,
    fee_is_actual: true,
    charged_amount: 362_000,
    net_amount: 362_000,
    channel: 'especes',
    source: 'inconnu',
    payment_method: 'especes',
    place: { id: 1, name: 'Église Saint-Dominique' },
    status: 'confirme',
    created_at: '2026-09-21T09:00:00+00:00',
    confirmed_at: '2026-09-21T09:00:00+00:00',
    value_date: '2026-09-20',
    anonymous: false,
    donor: 'Quête',
  },
];

const imperees = () => [
  {
    id: 'f1000000-0000-4000-8000-000000000001',
    title: 'Quête pour les séminaires',
    description: '',
    starts_on: '2026-09-27',
    ends_on: null,
    remit_by: '2026-10-04',
    messe_anticipee_incluse: true,
    status: 'ouvert',
    authorization_ref: 'ORD-2026-14',
    decided_by_office: 'econome_diocesain',
    raised: 4_870_000,
    parishes_count: 38,
    created_at: '2026-09-10T10:00:00+00:00',
  },
];

let etatFonds = fondsInitiaux();
let etatQuetes = quetesInitiales();
let etatImperees = imperees();

export const resetStaffDonsMocks = () => {
  etatFonds = fondsInitiaux();
  etatQuetes = quetesInitiales();
  etatImperees = imperees();
};

const exigeNoeud = (request: Request) =>
  new URL(request.url).searchParams.get('node');

export const staffDonsHandlers = [
  http.get(`${API}/v1/staff/dons/fonds/`, ({ request }) => {
    if (!exigeNoeud(request))
      return erreur(400, 'validation_error', 'Paroisse requise.');
    const statut = new URL(request.url).searchParams.get('status');
    return HttpResponse.json(
      etatFonds.filter((f) => !statut || f.status === statut),
    );
  }),
  http.post(`${API}/v1/staff/dons/fonds/`, async ({ request }) => {
    const body = (await request.json()) as Partial<Fonds> & {
      title: string;
      kind: string;
    };
    const nouveau = fonds(
      `f0000000-0000-4000-8000-${String(etatFonds.length + 1).padStart(12, '0')}`,
      body.title,
      body.kind,
      'brouillon',
      {
        description: body.description ?? '',
        goal_amount: body.goal_amount ?? null,
      },
    );
    etatFonds = [nouveau, ...etatFonds];
    return HttpResponse.json(nouveau, { status: 201 });
  }),
  http.post(`${API}/v1/staff/dons/fonds/:id/:etape/`, ({ params }) => {
    const f = etatFonds.find((x) => x.id === params.id);
    if (!f) return erreur(404, 'not_found', 'Fonds introuvable.');
    if (f.parent_id)
      return erreur(
        400,
        'imperee_from_diocese',
        'Cette quête impérée est gérée par le diocèse.',
      );
    f.status = params.etape === 'publier' ? 'ouvert' : 'clos';
    return HttpResponse.json(f);
  }),
  http.get(`${API}/v1/staff/dons/quetes/fonds-proposes/`, () =>
    HttpResponse.json(
      etatFonds.filter(
        (f) => f.status === 'ouvert' && f.kind.startsWith('quete'),
      ),
    ),
  ),
  http.get(`${API}/v1/staff/dons/quetes/`, ({ request }) => {
    const statut = new URL(request.url).searchParams.get('status');
    return HttpResponse.json(
      page(
        etatQuetes.filter((q) => !statut || q.status === statut),
        request,
      ),
    );
  }),
  http.post(`${API}/v1/staff/dons/quetes/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const f = etatFonds.find((x) => x.id === body.fund_id);
    const q: Quete = {
      id: 42 + etatQuetes.length,
      fund: { id: f?.id, title: f?.title, kind: f?.kind },
      place: null,
      mass_date: body.mass_date,
      mass_label: body.mass_label,
      amount: body.amount,
      counter_one: body.counter_one,
      counter_two: body.counter_two,
      observation: body.observation ?? '',
      status: 'saisie',
      entered_by: 'Cécile Coly',
      validated_by: null,
      validated_at: null,
      rejection_reason: '',
      deposit_id: null,
      created_at: '2026-09-27T12:30:00+00:00',
    };
    etatQuetes = [q, ...etatQuetes];
    return HttpResponse.json(q, { status: 201 });
  }),
  http.post(
    `${API}/v1/staff/dons/quetes/:id/:decision/`,
    async ({ params, request }) => {
      const q = etatQuetes.find((x) => x.id === Number(params.id));
      if (!q) return erreur(404, 'not_found', 'Quête introuvable.');
      if (q.status !== 'saisie')
        return erreur(
          400,
          'invalid_transition',
          'Cette saisie est déjà traitée.',
        );
      if (params.decision === 'valider') {
        Object.assign(q, {
          status: 'validee',
          validated_by: 'Emmanuel Tine',
          validated_at: '2026-09-27T13:00:00+00:00',
        });
      } else {
        const { reason } = (await request.json()) as { reason: string };
        Object.assign(q, { status: 'rejetee', rejection_reason: reason });
      }
      return HttpResponse.json(q);
    },
  ),
  http.get(`${API}/v1/staff/dons/operations/`, ({ request }) => {
    const canal = new URL(request.url).searchParams.get('channel');
    return HttpResponse.json(
      page(
        operations.filter((o) => !canal || o.channel === canal),
        request,
      ),
    );
  }),
  http.post(`${API}/v1/staff/dons/operations/:id/rembourser/`, ({ params }) => {
    const o = operations.find((x) => x.id === params.id);
    if (!o) return erreur(404, 'not_found', 'Opération introuvable.');
    return HttpResponse.json({ ...o, status: 'rembourse' });
  }),
  http.get(`${API}/v1/staff/dons/export/`, ({ request }) => {
    const p = new URL(request.url).searchParams;
    return new HttpResponse(
      'reference;date;fonds;montant\nJB-2026-00412;2026-09-27;Réfection de la toiture;25000\n',
      {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="dons-${p.get('date_from')}-${p.get('date_to')}.csv"`,
        },
      },
    );
  }),
  http.get(`${API}/v1/staff/dons/quetes-imperees/`, ({ request }) => {
    if (exigeNoeud(request) !== NOEUD_ARCHIDIOCESE)
      return erreur(400, 'not_a_diocese', "Ce nœud n'est pas un diocèse.");
    return HttpResponse.json(etatImperees);
  }),
  http.post(`${API}/v1/staff/dons/quetes-imperees/`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const q = {
      ...imperees()[0],
      id: `f1000000-0000-4000-8000-${String(etatImperees.length + 1).padStart(12, '0')}`,
      title: String(body.title),
      starts_on: String(body.starts_on),
      remit_by: String(body.remit_by ?? '2026-10-04'),
      authorization_ref: String(body.authorization_ref ?? ''),
      messe_anticipee_incluse: Boolean(body.messe_anticipee_incluse),
      raised: 0,
    };
    etatImperees = [q, ...etatImperees];
    return HttpResponse.json(q, { status: 201 });
  }),
  http.get(`${API}/v1/staff/dons/quetes-imperees/:id/suivi/`, () =>
    HttpResponse.json([
      {
        fund_id: 'f0000000-0000-4000-8000-000000000004',
        parish_id: NOEUD_SAINT_DOMINIQUE,
        parish: 'Saint-Dominique',
        status: 'ouvert',
        online: 125_000,
        cash: 187_500,
        count: 12,
        total: 312_500,
        remitted_confirmed: 0,
        remitted_declared: 187_500,
        to_remit: 0,
        remit_by: '2026-10-04',
      },
    ]),
  ),
  http.get(`${API}/v1/staff/dons/reversements/`, ({ request }) =>
    HttpResponse.json(
      page(
        [
          {
            id: 7,
            provider: 'wave',
            external_ref: 'WV-PAYOUT-2026-09-26',
            paid_at: '2026-09-26T18:00:00+00:00',
            gross_amount: 1_840_000,
            fee_amount: 18_400,
            net_amount: 1_821_600,
            status: 'rapproche',
            discrepancy_amount: 0,
            unmatched_count: 0,
            reconciled_at: '2026-09-27T07:00:00+00:00',
          },
        ],
        request,
      ),
    ),
  ),
];
