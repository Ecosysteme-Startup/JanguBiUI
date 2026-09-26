import { http, HttpResponse } from 'msw';

import { apiUrl } from '@/testing/mocks/api-url';
import { ids } from '@/testing/mocks/db';
import {
  accountExtras,
  auditEvents,
  f8bState,
  nodeDashboard,
  nodeTypes,
  officeCatalogue,
  places,
  platformDashboard,
} from '@/testing/mocks/db-f8b';
import { personsDirectory } from '@/testing/mocks/db-f8a';

const page = <T>(items: T[], url: URL) => {
  const limit = Number(url.searchParams.get('limit') ?? 10);
  const offset = Number(url.searchParams.get('offset') ?? 0);
  return { count: items.length, next: null, previous: null, results: items.slice(offset, offset + limit) };
};

const log = async (request: Request) => {
  let body: unknown;
  try {
    body = request.method === 'GET' ? undefined : await request.clone().json();
  } catch {
    body = undefined;
  }
  f8bState.requests.push({ method: request.method, url: request.url, body });
};

const pathOf = (id: string) => {
  const chain: string[] = [];
  let current = f8bState.nodes.find((n) => n.id === id);
  while (current) {
    chain.unshift(current.id);
    const parent = current.parent_id;
    current = parent ? f8bState.nodes.find((n) => n.id === parent) : undefined;
  }
  return chain;
};

const importReport = (dryRun: boolean) => ({
  dry_run: dryRun,
  applied: !dryRun,
  valid: 3,
  warnings: 1,
  errors: 0,
  lines: [
    { line: 2, status: 'ok', message: 'Nomination créée.', code: 'cure' },
    { line: 3, status: 'ok', message: 'Fin de mandat au 30/09.', code: 'vicaire_paroissial' },
    { line: 4, status: 'warning', message: 'Clerc pas encore vérifié par la chancellerie.', code: 'vicaire_paroissial' },
  ],
});

const accountDetail = (id: string) => {
  const account = f8bState.accounts.find((a) => a.id === id);
  return account ? { ...account, ...accountExtras[id] } : undefined;
};

/** Handlers propres au lot F8b (routes absentes des handlers partagés). */
/** Titre de la nomination, comme l'API : libellé de la qualité, sinon de la première, sinon de l'office. */
const titleOf = (office: { label: string; qualities?: { code: string; label: string }[] } | undefined, quality: string | undefined, code: string) =>
  office?.qualities?.find((q) => q.code === quality)?.label ?? office?.qualities?.[0]?.label ?? office?.label ?? code;

export const f8bHandlers = [
  // Tableaux de bord
  http.get(apiUrl('/dashboards/nodes/:nodeId/'), ({ params }) => {
    const n = f8bState.nodes.find((x) => x.id === params.nodeId);
    return n ? HttpResponse.json(nodeDashboard(n.id, n.name, n.type.code)) : HttpResponse.json({ detail: 'Introuvable.' }, { status: 404 });
  }),
  http.get(apiUrl('/dashboards/platform/'), () => HttpResponse.json(platformDashboard)),

  // Arbre
  http.get(apiUrl('/hierarchy/node-types/'), () => HttpResponse.json(nodeTypes)),
  http.get(apiUrl('/hierarchy/nodes/'), ({ request }) => {
    const url = new URL(request.url);
    const within = url.searchParams.get('within');
    const parent = url.searchParams.get('parent');
    const type = url.searchParams.get('type');
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    const onPlatform = url.searchParams.get('on_platform');
    const items = f8bState.nodes.filter(
      (n) =>
        (!within || (n.id !== within && pathOf(n.id).includes(within))) &&
        (!parent || n.parent_id === parent) &&
        (!type || n.type.code === type) &&
        (!q || `${n.name} ${n.code} ${n.city}`.toLowerCase().includes(q)) &&
        (onPlatform === null || String(n.is_active_on_platform) === onPlatform),
    );
    return HttpResponse.json(page(items, url));
  }),
  http.post(apiUrl('/hierarchy/nodes/'), async ({ request }) => {
    await log(request);
    const body = (await request.json()) as { name: string; type: string; parent_id: string; code?: string };
    const parent = f8bState.nodes.find((n) => n.id === body.parent_id);
    if (!body.name) return HttpResponse.json({ name: ['Ce champ est obligatoire.'] }, { status: 400 });
    const created = {
      ...f8bState.nodes[0],
      id: `0b7b1f0e-0000-4000-8000-${String(f8bState.nodes.length + 100).padStart(12, '0')}`,
      type: { code: body.type, label: body.type },
      name: body.name,
      code: body.code || 'AUTO',
      depth: (parent?.depth ?? 0) + 1,
      parent_id: body.parent_id,
      has_children: false,
    };
    f8bState.nodes = [...f8bState.nodes.map((n) => (n.id === body.parent_id ? { ...n, has_children: true } : n)), created];
    return HttpResponse.json(created, { status: 201 });
  }),
  http.get(apiUrl('/hierarchy/nodes/:nodeId/children/'), ({ params }) =>
    HttpResponse.json(f8bState.nodes.filter((n) => n.parent_id === params.nodeId)),
  ),
  http.get(apiUrl('/hierarchy/nodes/:nodeId/places/'), ({ params }) =>
    HttpResponse.json(places.filter((p) => p.node_id === params.nodeId)),
  ),
  http.post(apiUrl('/hierarchy/nodes/:nodeId/places/'), async ({ request, params }) => {
    await log(request);
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ id: 99, node_id: params.nodeId, is_active: true, lat: null, lng: null, ...body }, { status: 201 });
  }),
  http.post(apiUrl('/hierarchy/import/nodes/'), ({ request }) =>
    HttpResponse.json(importReport(new URL(request.url).searchParams.get('dry_run') !== 'false')),
  ),
  http.post(apiUrl('/hierarchy/import/places/'), ({ request }) =>
    HttpResponse.json(importReport(new URL(request.url).searchParams.get('dry_run') !== 'false')),
  ),

  // Nominations
  http.get(apiUrl('/hierarchy/assignments/'), ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const office = url.searchParams.get('office');
    const nodeId = url.searchParams.get('node');
    const items = f8bState.assignments.filter(
      (a) => (!status || a.status === status) && (!office || a.office === office) && (!nodeId || pathOf(a.node.id).includes(nodeId)),
    );
    return HttpResponse.json(page(items, url));
  }),
  http.post(apiUrl('/hierarchy/assignments/'), async ({ request }) => {
    await log(request);
    const body = (await request.clone().json()) as Record<string, string>;
    const found = personsDirectory.find((p) => p.id === body.person_id);
    const node = f8bState.nodes.find((n) => n.id === body.node_id);
    const created = {
      id: 900 + f8bState.assignments.length,
      person: { id: body.person_id, email: 'personne@example.sn', full_name: found?.full_name ?? 'Personne' },
      office: body.office,
      office_label: titleOf(officeCatalogue.find((o) => o.code === body.office), body.quality, body.office),
      quality: body.quality || officeCatalogue.find((o) => o.code === body.office)?.qualities?.[0]?.code || '',
      node: { id: body.node_id, name: node?.name ?? '', code: node?.code ?? '', type: node?.type.code ?? '' },
      start_date: body.start_date,
      end_date: null,
      status: 'active',
      appointed_by_id: null,
      decree_ref: body.decree_ref ?? '',
      note: body.note ?? '',
      created_at: '2026-09-25T09:41:00+00:00',
    };
    f8bState.assignments = [created, ...f8bState.assignments];
    return HttpResponse.json(created, { status: 201 });
  }),
  http.patch(apiUrl('/hierarchy/assignments/:id/'), async ({ request, params }) => {
    await log(request);
    const body = (await request.json()) as { action: 'terminer' | 'annuler' | 'qualifier'; quality?: string };
    if (body.action === 'qualifier') {
      const found = f8bState.assignments.find((a) => String(a.id) === params.id);
      const office = officeCatalogue.find((o) => o.code === found?.office);
      if (!found || !office?.qualities?.some((q) => q.code === body.quality)) {
        return HttpResponse.json({ error: { code: 'invalid_quality', message: 'Qualité inconnue pour cet office.' } }, { status: 400 });
      }
      const qualified = { ...found, quality: body.quality, office_label: titleOf(office, body.quality, found.office) };
      f8bState.assignments = f8bState.assignments.map((a) => (a.id === found.id ? qualified : a));
      return HttpResponse.json(qualified);
    }
    const status = body.action === 'terminer' ? 'terminee' : 'annulee';
    f8bState.assignments = f8bState.assignments.map((a) =>
      String(a.id) === params.id ? { ...a, status, end_date: body.action === 'terminer' ? '2026-09-25' : a.end_date } : a,
    );
    return HttpResponse.json(f8bState.assignments.find((a) => String(a.id) === params.id));
  }),
  http.post(apiUrl('/hierarchy/assignments/import/'), ({ request }) => {
    const url = new URL(request.url);
    if (!url.searchParams.get('effective_date'))
      return HttpResponse.json({ effective_date: ['Ce champ est obligatoire.'] }, { status: 400 });
    f8bState.requests.push({ method: 'POST', url: request.url });
    return HttpResponse.json(importReport(url.searchParams.get('dry_run') !== 'false'));
  }),

  // Vérifications
  http.get(apiUrl('/hierarchy/verifications/'), ({ request }) => {
    const url = new URL(request.url);
    const statut = url.searchParams.get('statut');
    return HttpResponse.json(page(f8bState.verifications.filter((v) => !statut || v.statut_verification === statut), url));
  }),
  http.post(apiUrl('/hierarchy/verifications/:personId/decision/'), async ({ request, params }) => {
    await log(request);
    const body = (await request.json()) as { decision: string; note: string };
    if (body.decision === 'complement' && !body.note?.trim())
      return HttpResponse.json(
        { error: { code: 'note_required', message: 'Indiquez ce qui manque : le motif est transmis à la personne.', details: { note: 'obligatoire' } } },
        { status: 400 },
      );
    const person = f8bState.verifications.find((v) => v.id === params.personId);
    const decided = { ...person!, statut_verification: body.decision, verification_note: body.note };
    // Complément demandé : la déclaration reste dans la file, en attente de la personne.
    f8bState.verifications =
      body.decision === 'complement'
        ? f8bState.verifications.map((v) => (v.id === params.personId ? decided : v))
        : f8bState.verifications.filter((v) => v.id !== params.personId);
    return HttpResponse.json(decided);
  }),

  // Retraits de capacités
  http.get(apiUrl('/hierarchy/capability-overrides/'), () => HttpResponse.json(f8bState.overrides)),
  http.post(apiUrl('/hierarchy/capability-overrides/'), async ({ request }) => {
    await log(request);
    const body = (await request.json()) as { diocese_node_id: string; office: string; capability: string };
    const created = { id: f8bState.overrides.length + 10, ...body };
    f8bState.overrides = [...f8bState.overrides, created];
    return HttpResponse.json(created, { status: 201 });
  }),
  http.delete(apiUrl('/hierarchy/capability-overrides/:id/'), async ({ request, params }) => {
    await log(request);
    f8bState.overrides = f8bState.overrides.filter((o) => String(o.id) !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),

  // Journal d'audit
  http.get(apiUrl('/audit/'), async ({ request }) => {
    await log(request);
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    // `node` : ce nœud et son sous-arbre (Saint-Dominique est dans l'archidiocèse de Dakar).
    const node = url.searchParams.get('node');
    const inSubtree = (id: string | null) => !node || id === node || (node === ids.dakar && id === ids.saintDominique);
    return HttpResponse.json(
      page(
        auditEvents.filter((e) => (!action || e.action.startsWith(action)) && inSubtree(e.node_id)),
        url,
      ),
    );
  }),

  // Comptes (contrat du brief, pas encore dans schema.yml)
  http.get(apiUrl('/platform/accounts/'), ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    const status = url.searchParams.get('status');
    const items = f8bState.accounts.filter(
      (a) => (!q || `${a.full_name} ${a.email}`.toLowerCase().includes(q)) && (!status || a.status === status),
    );
    return HttpResponse.json(page(items, url));
  }),
  http.get(apiUrl('/platform/accounts/:id/'), ({ params }) => {
    const detail = accountDetail(String(params.id));
    return detail ? HttpResponse.json(detail) : HttpResponse.json({ detail: 'Introuvable.' }, { status: 404 });
  }),
  ...(['lock', 'unlock', 'logout-sessions', 'require-mfa'] as const).map((action) =>
    http.post(apiUrl(`/platform/accounts/:id/${action}/`), async ({ request, params }) => {
      await log(request);
      const id = String(params.id);
      f8bState.accounts = f8bState.accounts.map((a) => {
        if (a.id !== id) return a;
        if (action === 'lock') return { ...a, status: 'verrouille' as const };
        if (action === 'unlock') return { ...a, status: 'actif' as const };
        if (action === 'require-mfa') return { ...a, mfa: 'totp' as const };
        return a;
      });
      const detail = accountDetail(id);
      return HttpResponse.json(action === 'logout-sessions' ? { ...detail, sessions: [] } : detail);
    }),
  ),
];

/**
 * Routes partagées avec les shells (détail de nœud, catalogue d'offices) : installées
 * par les tests du lot via `server.use(...f8bOverrides)` pour ne pas changer les réponses
 * des autres lots. Un nœud inconnu retombe sur le handler partagé.
 */
export const f8bOverrides = [
  http.get(apiUrl('/hierarchy/nodes/:nodeId/'), ({ params }) => {
    const n = f8bState.nodes.find((x) => x.id === params.nodeId);
    return n ? HttpResponse.json(n) : undefined;
  }),
  http.patch(apiUrl('/hierarchy/nodes/:nodeId/'), async ({ request, params }) => {
    await log(request);
    const body = (await request.json()) as Record<string, unknown>;
    f8bState.nodes = f8bState.nodes.map((n) => (n.id === params.nodeId ? { ...n, ...body } : n));
    return HttpResponse.json(f8bState.nodes.find((n) => n.id === params.nodeId));
  }),
  http.get(apiUrl('/hierarchy/office-types/'), () => HttpResponse.json(officeCatalogue)),
];
