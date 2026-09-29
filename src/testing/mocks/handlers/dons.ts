import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { page } from '@/lib/pagination';

import { networkDelay } from '../utils';

import { PAROISSES } from './paroisses';

// Dons du fidèle (apps/donations, routes V1) — Marie-Thérèse Diouf,
// paroisse Saint-Dominique, dimanche 27 septembre 2026.
const API = `${env.API_URL}/v1`;

const erreur = (status: number, code: string, message: string) =>
  HttpResponse.json({ error: { code, message } }, { status });

export const FONDS_QUETE = '7c1e4a52-0d3b-4f7e-9a61-5e2b8d4c1a01';
export const FONDS_CAMPAGNE = '7c1e4a52-0d3b-4f7e-9a61-5e2b8d4c1a02';

const fonds = [
  {
    id: FONDS_QUETE,
    kind: 'quete_dominicale',
    destination: 'paroisse',
    title: 'Quête du dimanche 27 septembre',
    description: '',
    starts_on: '2026-09-27',
    ends_on: '2026-09-27',
    goal_amount: null,
    raised: 0,
    status: 'ouvert',
    image_url: null,
    place: null,
    messe_anticipee_incluse: true,
  },
  {
    id: FONDS_CAMPAGNE,
    kind: 'campagne',
    destination: 'paroisse',
    title: 'Réfection de la toiture',
    description: 'Remplacer les tôles du bas-côté avant l’hivernage.',
    starts_on: '2026-09-01',
    ends_on: '2026-12-31',
    goal_amount: 3_000_000,
    raised: 1_214_830,
    status: 'ouvert',
    image_url: null,
    place: null,
    messe_anticipee_incluse: false,
  },
];

const pageSaintDominique = {
  parish: {
    id: PAROISSES.saintDominique.id,
    name: 'Saint-Dominique',
    city: 'Dakar',
  },
  enabled: true,
  authorization: {
    reference: 'ARCH-DK-2026-014',
    date: '2026-09-01',
    text: 'Collecte autorisée par l’Ordinaire (réf. ARCH-DK-2026-014).',
  },
  suggested_amounts: [1000, 2000, 5000, 10000],
  min_amount: 200,
  max_amount: 2_000_000,
  fee_rate_bp: 200,
  funds: fonds,
};

const mesDons = [
  {
    id: '9a3f6c10-5b2e-4d8a-8f41-3c7e2a1b0d01',
    reference: 'DON-2026-000412',
    receipt_number: 'R-2026-000187',
    fund: {
      id: FONDS_CAMPAGNE,
      title: 'Réfection de la toiture',
      kind: 'campagne',
    },
    parish: 'Saint-Dominique',
    amount: 10000,
    fee_amount: 200,
    fees_covered: true,
    charged_amount: 10200,
    status: 'confirme',
    channel: 'en_ligne',
    payment_method: 'wave',
    anonymous: false,
    created_at: '2026-09-20T09:12:00Z',
    confirmed_at: '2026-09-20T09:13:10Z',
    receipt_available: true,
  },
  {
    id: '9a3f6c10-5b2e-4d8a-8f41-3c7e2a1b0d02',
    reference: 'DON-2026-000398',
    receipt_number: null,
    fund: {
      id: FONDS_QUETE,
      title: 'Quête du dimanche 13 septembre',
      kind: 'quete_dominicale',
    },
    parish: 'Saint-Dominique',
    amount: 2000,
    fee_amount: 40,
    fees_covered: false,
    charged_amount: 2000,
    status: 'echoue',
    channel: 'en_ligne',
    payment_method: null,
    anonymous: false,
    created_at: '2026-09-13T10:40:00Z',
    confirmed_at: null,
    receipt_available: false,
  },
];

export const donsHandlers = [
  http.get(`${API}/public/dons/paroisses/:id/`, async ({ params }) => {
    await networkDelay();
    if (params.id === PAROISSES.saintDominique.id)
      return HttpResponse.json(pageSaintDominique);
    const n = Object.values(PAROISSES).find((p) => p.id === params.id);
    if (!n) return erreur(404, 'not_found', 'Paroisse introuvable.');
    // Paroisse non activée : page servie, collecte fermée.
    return HttpResponse.json({
      ...pageSaintDominique,
      parish: { id: n.id, name: n.name, city: n.city },
      enabled: false,
      authorization: null,
      funds: [],
    });
  }),

  http.get(`${API}/public/dons/fonds/:id/`, async ({ params }) => {
    await networkDelay();
    const f = fonds.find((x) => x.id === params.id);
    if (!f) return erreur(404, 'not_found', 'Fonds introuvable.');
    return HttpResponse.json({
      ...f,
      parish: pageSaintDominique.parish,
      updates: [],
    });
  }),

  http.post(`${API}/dons/checkout/`, async ({ request }) => {
    await networkDelay();
    const body = (await request.json()) as {
      fund_id: string;
      amount: number;
      fees_covered: boolean;
    };
    if (!fonds.some((f) => f.id === body.fund_id))
      return erreur(404, 'not_found', 'Fonds introuvable.');
    if (body.amount < 200 || body.amount > 2_000_000)
      return erreur(400, 'invalid_amount', 'Montant hors des bornes.');
    const fee = Math.ceil((body.amount * 200) / 10_000);
    return HttpResponse.json(
      {
        donation_id: '9a3f6c10-5b2e-4d8a-8f41-3c7e2a1b0d99',
        reference: 'DON-2026-000431',
        status: 'initie',
        checkout_url: 'https://paiement.exemple.sn/checkout/DON-2026-000431',
        amount: body.amount,
        fee_amount: fee,
        charged_amount: body.fees_covered ? body.amount + fee : body.amount,
        net_amount: body.fees_covered ? body.amount : body.amount - fee,
      },
      { status: 201 },
    );
  }),

  http.get(`${API}/dons/checkout/:id/`, async ({ params }) => {
    await networkDelay();
    const d = mesDons.find((x) => x.id === params.id);
    if (!d) return erreur(404, 'not_found', 'Don introuvable.');
    return HttpResponse.json({
      id: d.id,
      reference: d.reference,
      receipt_number: d.receipt_number,
      status: d.status,
      fund: d.fund,
      parish: d.parish,
      amount: d.amount,
      fees_covered: d.fees_covered,
      charged_amount: d.charged_amount,
      confirmed_at: d.confirmed_at,
    });
  }),

  http.get(`${API}/me/dons/`, async ({ request }) => {
    await networkDelay();
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? 10);
    const offset = Number(url.searchParams.get('offset') ?? 0);
    return HttpResponse.json(
      page(mesDons.slice(offset, offset + limit), {
        limit,
        offset,
        count: mesDons.length,
      }),
    );
  }),

  http.get(`${API}/me/dons/resume/`, async ({ request }) => {
    await networkDelay();
    const year = Number(new URL(request.url).searchParams.get('year') ?? 2026);
    return HttpResponse.json({
      year,
      total: 10000,
      count: 1,
      by_fund: [
        {
          fund_id: FONDS_CAMPAGNE,
          title: 'Réfection de la toiture',
          parish: 'Saint-Dominique',
          total: 10000,
          count: 1,
        },
      ],
    });
  }),

  http.get(`${API}/me/dons/:id/recu/`, async ({ params }) => {
    await networkDelay();
    const d = mesDons.find((x) => x.id === params.id);
    if (!d || d.status !== 'confirme')
      return erreur(
        404,
        'receipt_unavailable',
        "Le reçu n'est disponible que pour un don confirmé.",
      );
    return new HttpResponse(
      new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
      {
        headers: { 'Content-Type': 'application/pdf' },
      },
    );
  }),
];
