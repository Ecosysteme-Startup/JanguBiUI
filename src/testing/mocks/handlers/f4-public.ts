import { http, HttpResponse } from 'msw';

import { apiUrl } from '@/testing/mocks/api-url';
import { ids } from '@/testing/mocks/db';
import {
  contactState,
  directoryNodes,
  liturgyDayFor,
  nodeWeek,
  publicAnnouncements,
  publicEvents,
  toApiNode,
} from '@/testing/mocks/db-f4';

const paginate = <T,>(items: T[], url: URL, defaultLimit = 10) => {
  const limit = Number(url.searchParams.get('limit') ?? defaultLimit);
  const offset = Number(url.searchParams.get('offset') ?? 0);
  return { limit, offset, count: items.length, next: null, previous: null, results: items.slice(offset, offset + limit) };
};

/** Annuaire public (`GET /public/nodes/`) : type, q, city, diocese (sous-arbre), on_platform. */
export const directoryHandler = http.get(apiUrl('/public/nodes/'), ({ request }) => {
  const url = new URL(request.url);
  const type = url.searchParams.get('type') ?? 'paroisse';
  const q = (url.searchParams.get('q') ?? '').toLowerCase();
  const city = (url.searchParams.get('city') ?? '').toLowerCase();
  const within = url.searchParams.get('diocese');
  const onPlatform = url.searchParams.get('on_platform');
  const nodes = directoryNodes
    .filter((n) => n.type.code === type)
    .filter((n) => !q || `${n.name} ${n.city} ${n.code} ${n.address}`.toLowerCase().includes(q))
    .filter((n) => !city || n.city.toLowerCase().includes(city))
    .filter((n) => !within || n.within.includes(within))
    .filter((n) => onPlatform === null || String(n.is_active_on_platform) === onPlatform)
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    .map(toApiNode);
  return HttpResponse.json(paginate(nodes, url));
});

/** Handlers du site public (lot F4) ; `directoryHandler` est prioritaire dans les tests du lot. */
export const f4PublicHandlers = [
  http.get(apiUrl('/public/nodes/by-code/:code/'), ({ params }) => {
    const node = directoryNodes.find((n) => n.code === String(params.code));
    return node ? HttpResponse.json(toApiNode(node)) : HttpResponse.json({ error: { code: 'not_found', message: 'Nœud introuvable.' } }, { status: 404 });
  }),
  http.get(apiUrl('/liturgy/:day/'), ({ params }) => {
    const day = String(params.day);
    if (day === 'today') return undefined;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day < '2000-01-01') return HttpResponse.json({ detail: 'Introuvable.' }, { status: 404 });
    return HttpResponse.json(liturgyDayFor(day));
  }),
  http.get(apiUrl('/public/nodes/:nodeId/week/'), ({ params }) =>
    params.nodeId === ids.saintDominique
      ? HttpResponse.json(nodeWeek)
      : HttpResponse.json({ ...nodeWeek, places: [], occurrences: [] }),
  ),
  http.get(apiUrl('/news/'), ({ request }) => {
    const url = new URL(request.url);
    const node = url.searchParams.get('node');
    const items = publicAnnouncements.filter((a) => !node || a.scope.node_id === node);
    return HttpResponse.json(paginate(items, url));
  }),
  http.get(apiUrl('/agenda/'), ({ request }) => {
    const url = new URL(request.url);
    const node = url.searchParams.get('node');
    return HttpResponse.json(paginate(publicEvents.filter((e) => !node || e.node_id === node), url));
  }),
  http.post(apiUrl('/public/contact/'), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.email === 'string' && body.email.endsWith('@refuse.sn')) {
      return HttpResponse.json({ email: ['Cette adresse est refusée par le serveur.'] }, { status: 400 });
    }
    if (body.consentement !== true) return HttpResponse.json({ consentement: ['Ce champ est obligatoire.'] }, { status: 400 });
    contactState.last = body;
    return HttpResponse.json({ received: true }, { status: 201 });
  }),
  directoryHandler,
];
