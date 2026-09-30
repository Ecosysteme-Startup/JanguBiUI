import { http, HttpResponse } from 'msw';

import { apiUrl } from '@/testing/mocks/api-url';
import {
  activations,
  campaignDetail,
  cashCollections,
  confirmedDonation,
  donorSummary,
  donsIds,
  donsState,
  health,
  impereeFollow,
  imperees,
  myDonations,
  operations,
  parishSummary,
  payouts,
  pendingDonation,
  publicFunds,
  publicParish,
  reconciliation,
  staffFunds,
} from '@/testing/mocks/db-dons';

const page = <T>(results: T[], url: string) => {
  const params = new URL(url).searchParams;
  const limit = Number(params.get('limit') ?? 20);
  const offset = Number(params.get('offset') ?? 0);
  return { limit, offset, count: results.length, next: null, previous: null, results: results.slice(offset, offset + limit) };
};

const error = (status: number, code: string, message: string, details: Record<string, string[]> = {}) =>
  HttpResponse.json({ error: { code, message, details } }, { status });

/** Dons et quêtes (apps/donations, ADR-017), conformes à `schema.yml`. */
export const donsHandlers = [
  // Public
  http.get(apiUrl('/public/dons/paroisses/:nodeId/'), () => HttpResponse.json(publicParish())),
  http.get(apiUrl('/public/dons/fonds/:fundId/'), ({ params }) => {
    if (params.fundId === donsIds.toiture) return HttpResponse.json(campaignDetail());
    const f = publicFunds().find((x) => x.id === params.fundId);
    if (!f) return error(404, 'not_found', 'Fonds introuvable.');
    return HttpResponse.json({ ...f, parish: publicParish().parish, updates: [] });
  }),

  // Paiement
  http.post(apiUrl('/dons/checkout/'), async ({ request }) => {
    const body = (await request.json()) as { fund_id: string; amount: number; fees_covered: boolean };
    donsState.checkouts.push({ body, idempotencyKey: request.headers.get('Idempotency-Key') });
    if (body.amount < 100) return error(400, 'validation_error', 'Le montant minimum est de 100 FCFA.', { amount: ['Le montant minimum est de 100 FCFA.'] });
    const fee = Math.ceil(body.amount * 0.02);
    return HttpResponse.json(
      {
        donation_id: donsIds.donConfirme,
        reference: '4817-2093-6651',
        status: 'initie',
        checkout_url: 'https://paydunya.com/sandbox-checkout/invoice/test_4817',
        amount: body.amount,
        fee_amount: fee,
        charged_amount: body.fees_covered ? body.amount + fee : body.amount,
        net_amount: body.fees_covered ? body.amount : body.amount - fee,
      },
      { status: 201 },
    );
  }),
  http.get(apiUrl('/dons/checkout/:donationId/'), ({ params }) => {
    const next = donsState.statusSequence.shift();
    if (next) return HttpResponse.json({ ...confirmedDonation(), status: next, receipt_number: next === 'confirme' ? 'SD-2026-00147' : null });
    if (params.donationId === donsIds.donEnAttente) return HttpResponse.json(pendingDonation());
    return HttpResponse.json(confirmedDonation());
  }),

  // Fidèle
  http.get(apiUrl('/me/dons/resume/'), ({ request }) =>
    HttpResponse.json(donorSummary(Number(new URL(request.url).searchParams.get('year') ?? 2026))),
  ),
  http.get(apiUrl('/me/dons/:donationId/recu/'), () =>
    new HttpResponse(new Blob(['%PDF-1.4 reçu'], { type: 'application/pdf' }), { headers: { 'Content-Type': 'application/pdf' } }),
  ),
  http.get(apiUrl('/me/dons/'), ({ request }) => {
    const params = new URL(request.url).searchParams;
    const year = params.get('year');
    const fundId = params.get('fund');
    const rows = myDonations().filter((d) => (!year || d.created_at.startsWith(year)) && (!fundId || d.fund.id === fundId));
    return HttpResponse.json(page(rows, request.url));
  }),

  // Paroisse
  http.get(apiUrl('/staff/dons/fonds/'), ({ request }) => {
    const params = new URL(request.url).searchParams;
    const kind = params.get('kind');
    const status = params.get('status');
    return HttpResponse.json(staffFunds().filter((f) => (!kind || f.kind === kind) && (!status || f.status === status)));
  }),
  http.post(apiUrl('/staff/dons/fonds/'), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    if (body.starts_on && body.ends_on && String(body.ends_on) < String(body.starts_on)) {
      return error(400, 'validation_error', 'La fin doit suivre le début.', { ends_on: ['La fin doit suivre le début.'] });
    }
    return HttpResponse.json(
      { ...staffFunds()[2], ...body, id: 'd0000000-0000-4000-8000-000000000099', status: 'brouillon', raised: 0, donations_count: 0, published_at: null },
      { status: 201 },
    );
  }),
  http.get(apiUrl('/staff/dons/fonds/:fundId/'), ({ params }) => {
    const f = staffFunds().find((x) => x.id === params.fundId);
    return f ? HttpResponse.json(f) : error(404, 'not_found', 'Fonds introuvable.');
  }),
  http.patch(apiUrl('/staff/dons/fonds/:fundId/'), async ({ params, request }) => {
    const f = staffFunds().find((x) => x.id === params.fundId) ?? staffFunds()[2];
    return HttpResponse.json({ ...f, ...((await request.json()) as object) });
  }),
  http.post(apiUrl('/staff/dons/fonds/:fundId/publier/'), ({ params }) =>
    HttpResponse.json({ ...(staffFunds().find((x) => x.id === params.fundId) ?? staffFunds()[2]), id: params.fundId, status: 'ouvert' }),
  ),
  http.post(apiUrl('/staff/dons/fonds/:fundId/clore/'), ({ params }) =>
    HttpResponse.json({ ...(staffFunds().find((x) => x.id === params.fundId) ?? staffFunds()[2]), id: params.fundId, status: 'clos' }),
  ),
  http.post(apiUrl('/staff/dons/fonds/:fundId/nouvelles/'), async ({ request }) =>
    HttpResponse.json(
      { id: 3, body: ((await request.json()) as { body: string }).body, created_at: '2026-09-28T09:00:00+00:00', author_name: 'Cécile Coly' },
      { status: 201 },
    ),
  ),
  http.get(apiUrl('/staff/dons/synthese/'), () => HttpResponse.json(parishSummary())),
  http.get(apiUrl('/staff/dons/operations/'), ({ request }) => {
    const params = new URL(request.url).searchParams;
    const rows = operations().filter(
      (o) =>
        (!params.get('fund') || o.fund.id === params.get('fund')) &&
        (!params.get('status') || o.status === params.get('status')) &&
        (!params.get('channel') || o.channel === params.get('channel')),
    );
    return HttpResponse.json(page(rows, request.url));
  }),
  http.post(apiUrl('/staff/dons/operations/:donationId/rembourser/'), ({ params }) => {
    const o = operations().find((x) => x.id === params.donationId) ?? operations()[1];
    return HttpResponse.json({ ...o, status: 'rembourse' });
  }),
  // Fonds proposés pour la quête d'une messe : quête impérée d'abord (samedi soir compris si la
  // messe anticipée est incluse), puis la quête dominicale ouverte à cette date.
  http.get(apiUrl('/staff/dons/quetes/fonds-proposes/'), ({ request }) => {
    const params = new URL(request.url).searchParams;
    const date = params.get('date');
    if (!params.get('node') || !date) return error(400, 'validation_error', 'Le nœud et la date sont obligatoires.');
    const eve = (d: string) => new Date(Date.parse(`${d}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
    const opens = (f: ReturnType<typeof staffFunds>[number]) =>
      f.kind === 'quete_imperee' && f.messe_anticipee_incluse && f.starts_on ? eve(f.starts_on) : f.starts_on;
    const rows = staffFunds()
      .filter((f) => f.status === 'ouvert' && (f.kind === 'quete_imperee' || f.kind === 'quete_dominicale'))
      .filter((f) => (!opens(f) || opens(f)! <= date) && (!f.ends_on || date <= f.ends_on))
      .sort((a, b) => Number(b.kind === 'quete_imperee') - Number(a.kind === 'quete_imperee'));
    return HttpResponse.json(rows);
  }),
  http.get(apiUrl('/staff/dons/quetes/'), ({ request }) => {
    const status = new URL(request.url).searchParams.get('status');
    return HttpResponse.json(page(cashCollections().filter((c) => !status || c.status === status), request.url));
  }),
  http.post(apiUrl('/staff/dons/quetes/'), async ({ request }) => {
    const body = (await request.json()) as { counter_one: string; counter_two: string; amount: number; mass_date: string; mass_label: string };
    donsState.cashCreated.push(body);
    if (body.counter_one.trim().toLowerCase() === body.counter_two.trim().toLowerCase()) {
      return error(400, 'validation_error', 'Deux personnes différentes doivent compter la quête.', {
        counter_two: ['Deux personnes différentes doivent compter la quête.'],
      });
    }
    return HttpResponse.json({ ...cashCollections()[0], ...body, id: 6, status: 'saisie', entered_by: 'Cécile Coly' }, { status: 201 });
  }),
  http.post(apiUrl('/staff/dons/quetes/:id/valider/'), ({ params }) => {
    donsState.validated.push(Number(params.id));
    const c = cashCollections().find((x) => x.id === Number(params.id)) ?? cashCollections()[0];
    return HttpResponse.json({ ...c, status: 'validee', validated_by: 'Cécile Coly', validated_at: '2026-09-28T09:00:00+00:00' });
  }),
  http.post(apiUrl('/staff/dons/quetes/:id/rejeter/'), async ({ params, request }) => {
    const c = cashCollections().find((x) => x.id === Number(params.id)) ?? cashCollections()[0];
    return HttpResponse.json({ ...c, status: 'rejetee', rejection_reason: ((await request.json()) as { reason: string }).reason });
  }),
  http.get(apiUrl('/staff/dons/export/'), ({ request }) => {
    const file = new URL(request.url).searchParams.get('fichier') ?? 'csv';
    donsState.exports.push(file);
    return new HttpResponse(new Blob(['﻿date;reference;fonds;montant\n'], { type: 'text/csv' }), {
      headers: { 'Content-Type': file === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv' },
    });
  }),
  http.get(apiUrl('/staff/dons/rapprochement/'), () => HttpResponse.json(reconciliation())),
  http.get(apiUrl('/staff/dons/reversements/'), ({ request }) => HttpResponse.json(page(payouts(), request.url))),

  // Diocèse
  http.get(apiUrl('/staff/dons/quetes-imperees/'), () => HttpResponse.json(imperees())),
  http.post(apiUrl('/staff/dons/quetes-imperees/'), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...imperees()[1], ...body, id: 'd0000000-0000-4000-8000-000000000098', status: 'ouvert', raised: 0 }, { status: 201 });
  }),
  http.get(apiUrl('/staff/dons/quetes-imperees/:fundId/suivi/'), ({ params }) => HttpResponse.json(impereeFollow(String(params.fundId)))),

  // Plateforme
  http.get(apiUrl('/platform/dons/sante/'), () => HttpResponse.json(health())),
  http.get(apiUrl('/platform/dons/activations/'), () => HttpResponse.json(activations())),
  http.put(apiUrl('/platform/dons/activations/'), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...activations()[0], ...body, node: activations()[0].node });
  }),
];
