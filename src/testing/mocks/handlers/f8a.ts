import { http, HttpResponse } from 'msw';

import { apiUrl } from '@/testing/mocks/api-url';
import { ids } from '@/testing/mocks/db';
import { f8aCategories, f8aState, nodeChildren, officeCatalogue, personsDirectory, places, registrations, typeDelaysOf } from '@/testing/mocks/db-f8a';

/** Enveloppe d'erreur V1 (SRS §7). */
export const v1Error = (status: number, code: string, message: string, details: Record<string, unknown> = {}) =>
  HttpResponse.json({ error: { code, message, details } }, { status });

const page = <T,>(items: T[], url: URL) => {
  const limit = Number(url.searchParams.get('limit') ?? 10);
  const offset = Number(url.searchParams.get('offset') ?? 0);
  return HttpResponse.json({ limit, offset, count: items.length, next: null, previous: null, results: items.slice(offset, offset + limit) });
};

const now = () => '2026-09-25T09:41:00+00:00';

const articleHandlers = [
  http.get(apiUrl('/news/categories/'), () => HttpResponse.json(f8aCategories)),
  http.get(apiUrl('/staff/news/'), ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    const place = url.searchParams.get('place');
    f8aState.lastNewsQuery = Object.fromEntries(url.searchParams);
    const items = f8aState.articles.filter(
      (a) =>
        (!status || a.status === status) &&
        (!type || a.content_type === type) &&
        (!q || `${a.title} ${String(a.content ?? '')}`.toLowerCase().includes(q)) &&
        (!place || (a.scope as { place_id: number | null }).place_id === Number(place)),
    );
    return page(items, url);
  }),
  http.get(apiUrl('/staff/news/sunday-sheet/'), ({ request }) => {
    const url = new URL(request.url);
    const sunday = url.searchParams.get('date') ?? '2026-09-27';
    const items = f8aState.articles
      .filter((a) => a.is_sunday_notice && a.sunday_date === sunday && (a.status === 'published' || a.status === 'scheduled'))
      .map((a) => ({ id: a.id, title: a.title, excerpt: a.excerpt, content: a.content, content_format: a.content_format, scope: a.scope, status: a.status }));
    return HttpResponse.json({ node_id: url.searchParams.get('node'), node_name: 'Saint-Dominique', sunday, items: [...items, ...f8aState.dioceseSheetItems] });
  }),
  http.post(apiUrl('/staff/news/'), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    f8aState.lastBody = body;
    if (!body.category_id) return v1Error(400, 'validation_error', 'Les données envoyées sont invalides.', { category_id: ['Ce champ est obligatoire.'] });
    const created = {
      id: `a0000000-0000-4000-8000-0000000000${String(f8aState.articles.length + 10)}`,
      slug: 'nouvelle',
      category: f8aCategories.find((c) => c.id === body.category_id) ?? null,
      author_name: 'Mme Germaine Faye',
      scope: { node_id: body.node_id, node_name: 'Saint-Dominique', place_id: body.place_id ?? null, place_name: body.place_id ? 'Église Saint-Dominique' : null },
      status: 'draft',
      publish_at: null,
      published_at: null,
      unpublished_at: null,
      unpublish_reason: '',
      reads_count: 0,
      created_at: now(),
      updated_at: now(),
      notify_followers: true,
      cover_image_alt: '',
      cover_image_decorative: false,
      ...body,
      cover_image_id: body.cover_image_id ?? null,
      cover_image_url: body.cover_image_id ? `https://minio.test/covers/${String(body.cover_image_id)}.jpg` : null,
      title: String(body.title),
    };
    f8aState.articles = [created, ...f8aState.articles];
    return HttpResponse.json(created, { status: 201 });
  }),
  http.get(apiUrl('/staff/news/:id/'), ({ params }) => {
    const found = f8aState.articles.find((a) => a.id === params.id);
    return found ? HttpResponse.json(found) : v1Error(404, 'not_found', 'Article introuvable.');
  }),
  http.patch(apiUrl('/staff/news/:id/'), async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    f8aState.lastBody = body;
    const found = f8aState.articles.find((a) => a.id === params.id);
    if (!found) return v1Error(404, 'not_found', 'Article introuvable.');
    const placeId = 'place_id' in body ? (body.place_id as number | null) : (found.scope as { place_id: number | null }).place_id;
    const updated = {
      ...found,
      ...body,
      scope: { ...(found.scope as object), place_id: placeId, place_name: places.find((p) => p.id === placeId)?.name ?? null },
      ...('cover_image_id' in body
        ? { cover_image_url: body.cover_image_id ? `https://minio.test/covers/${String(body.cover_image_id)}.jpg` : null }
        : {}),
      title: String(body.title ?? found.title),
      updated_at: now(),
    };
    f8aState.articles = f8aState.articles.map((a) => (a.id === found.id ? updated : a));
    return HttpResponse.json(updated);
  }),
  http.delete(apiUrl('/staff/news/:id/'), ({ params }) => {
    f8aState.articles = f8aState.articles.filter((a) => a.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),
  http.post(apiUrl('/staff/news/:id/publish/'), async ({ params, request }) => {
    const body = (await request.json()) as { publish_at?: string; notify?: boolean };
    f8aState.lastPublishBody = body;
    const found = f8aState.articles.find((a) => a.id === params.id);
    if (!found) return v1Error(404, 'not_found', 'Article introuvable.');
    const notify = body.notify ?? found.notify_followers;
    const updated = body.publish_at
      ? { ...found, status: 'scheduled', publish_at: body.publish_at, notify_followers: notify }
      : { ...found, status: 'published', published_at: now(), notify_followers: notify };
    f8aState.articles = f8aState.articles.map((a) => (a.id === found.id ? updated : a));
    return HttpResponse.json(updated);
  }),
  http.post(apiUrl('/staff/news/:id/unpublish/'), async ({ params, request }) => {
    f8aState.lastBody = await request.json();
    const found = f8aState.articles.find((a) => a.id === params.id);
    if (!found) return v1Error(404, 'not_found', 'Article introuvable.');
    const updated = { ...found, status: 'unpublished', unpublished_at: now() };
    f8aState.articles = f8aState.articles.map((a) => (a.id === found.id ? updated : a));
    return HttpResponse.json(updated);
  }),
];

const placeHandlers = [
  http.get(apiUrl('/hierarchy/nodes/:nodeId/places/'), ({ params }) => HttpResponse.json(params.nodeId === ids.saintDominique ? places : [])),
  http.get(apiUrl('/hierarchy/nodes/:nodeId/children/'), ({ params }) => HttpResponse.json(params.nodeId === ids.saintDominique ? nodeChildren : [])),
  http.get(apiUrl('/hierarchy/places/:placeId/schedule/'), ({ params }) => HttpResponse.json(f8aState.schedules[Number(params.placeId)] ?? [])),
  http.put(apiUrl('/hierarchy/places/:placeId/schedule/'), async ({ params, request }) => {
    const body = (await request.json()) as { items: Record<string, unknown>[] };
    f8aState.lastBody = body;
    const saved = body.items.map((item, i) => ({ end_time: null, language: '', note: '', valid_from: null, valid_to: null, ...item, id: 100 + i }));
    f8aState.schedules = { ...f8aState.schedules, [Number(params.placeId)]: saved as never };
    return HttpResponse.json(saved);
  }),
  http.get(apiUrl('/hierarchy/places/:placeId/exceptions/'), ({ params }) => HttpResponse.json(f8aState.exceptions[Number(params.placeId)] ?? [])),
  http.post(apiUrl('/hierarchy/places/:placeId/exceptions/'), async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    f8aState.lastBody = body;
    const created = { id: 200, cancelled: false, start_time: null, end_time: null, note: '', ...body };
    const placeId = Number(params.placeId);
    f8aState.exceptions = { ...f8aState.exceptions, [placeId]: [...(f8aState.exceptions[placeId] ?? []), created] };
    return HttpResponse.json(created, { status: 201 });
  }),
  http.delete(apiUrl('/hierarchy/places/:placeId/exceptions/:exceptionId/'), ({ params }) => {
    const placeId = Number(params.placeId);
    f8aState.exceptions = { ...f8aState.exceptions, [placeId]: (f8aState.exceptions[placeId] ?? []).filter((e) => e.id !== Number(params.exceptionId)) };
    return new HttpResponse(null, { status: 204 });
  }),
];

const agendaHandlers = [
  http.get(apiUrl('/staff/agenda/'), ({ request }) => {
    const url = new URL(request.url);
    f8aState.agendaQueries = [...f8aState.agendaQueries, Object.fromEntries(url.searchParams)];
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const items = f8aState.events.filter((e) => (!from || e.end_at.slice(0, 10) >= from) && (!to || e.start_at.slice(0, 10) <= to));
    return page(items, url);
  }),
  http.post(apiUrl('/staff/agenda/'), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    f8aState.lastBody = body;
    const created = {
      id: 300 + f8aState.events.length,
      node_name: 'Saint-Dominique',
      registrations_count: 0,
      seats_taken: 0,
      seats_remaining: null,
      registration_closes_at: null,
      is_full: false,
      is_registered: false,
      is_cancelled: false,
      max_participants: null,
      place_id: null,
      ...body,
    } as unknown as (typeof f8aState.events)[number];
    f8aState.events = [...f8aState.events, created];
    return HttpResponse.json(created, { status: 201 });
  }),
  http.patch(apiUrl('/staff/agenda/:id/'), async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    f8aState.lastBody = body;
    const found = f8aState.events.find((e) => e.id === Number(params.id));
    if (!found) return v1Error(404, 'not_found', 'Événement introuvable.');
    const updated = { ...found, ...body } as typeof found;
    f8aState.events = f8aState.events.map((e) => (e.id === found.id ? updated : e));
    return HttpResponse.json(updated);
  }),
  http.delete(apiUrl('/staff/agenda/:id/'), ({ params }) => {
    f8aState.events = f8aState.events.map((e) => (e.id === Number(params.id) ? { ...e, is_cancelled: true } : e));
    return new HttpResponse(null, { status: 204 });
  }),
  http.get(apiUrl('/staff/agenda/:id/registrations/'), ({ request }) => page(registrations, new URL(request.url))),
];

/** Recherche de la personne à nommer (offices.nommer) : 2 caractères au moins, sinon 400. */
export const personSearchHandler = http.get(apiUrl('/hierarchy/persons/'), ({ request }) => {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();
  if (q.length < 2) return v1Error(400, 'validation_error', 'Les données envoyées sont invalides.', { q: ['Au moins 2 caractères.'] });
  const words = q.split(/\s+/);
  return page(
    personsDirectory.filter((p) => words.every((w) => `${p.full_name} ${p.email_masked}`.toLowerCase().includes(w))),
    url,
  );
});

/** Titre de la nomination, comme l'API : libellé de la qualité, sinon de la première, sinon de l'office. */
const titleOf = (office: { label: string; qualities?: { code: string; label: string }[] } | undefined, quality: string | undefined, code: string) =>
  office?.qualities?.find((q) => q.code === quality)?.label ?? office?.qualities?.[0]?.label ?? office?.label ?? code;

const equipeHandlers = [
  personSearchHandler,
  http.get(apiUrl('/hierarchy/assignments/'), ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    return page(
      f8aState.assignments.filter((a) => !status || a.status === status),
      url,
    );
  }),
  http.post(apiUrl('/hierarchy/assignments/'), async ({ request }) => {
    const body = (await request.json()) as Record<string, string>;
    f8aState.lastBody = body;
    const office = officeCatalogue.find((o) => o.code === body.office);
    const created = {
      id: 500,
      person: { id: body.person_id, email: 'elisabeth@example.sn', full_name: 'Élisabeth Gomis' },
      office: body.office,
      office_label: titleOf(office, body.quality, body.office),
      quality: body.quality || office?.qualities?.[0]?.code || '',
      node: { id: body.node_id, name: 'Saint-Dominique', code: 'SD', type: 'paroisse' },
      start_date: body.start_date,
      end_date: null,
      status: 'active',
      appointed_by_id: 'p-ndiaye',
      decree_ref: body.decree_ref,
      note: body.note,
      created_at: now(),
    };
    f8aState.assignments = [created, ...f8aState.assignments];
    return HttpResponse.json(created, { status: 201 });
  }),
  http.patch(apiUrl('/hierarchy/assignments/:id/'), async ({ params, request }) => {
    const body = (await request.json()) as { action: string; quality?: string };
    f8aState.lastBody = body;
    const found = f8aState.assignments.find((a) => a.id === Number(params.id));
    if (!found) return v1Error(404, 'not_found', 'Nomination introuvable.');
    if (body.action === 'qualifier') {
      const office = officeCatalogue.find((o) => o.code === found.office);
      if (!office?.qualities?.some((q) => q.code === body.quality)) return v1Error(400, 'invalid_quality', 'Qualité inconnue pour cet office.');
      const qualified = { ...found, quality: body.quality, office_label: titleOf(office, body.quality, found.office) };
      f8aState.assignments = f8aState.assignments.map((a) => (a.id === found.id ? qualified : a));
      return HttpResponse.json(qualified);
    }
    const updated = { ...found, status: body.action === 'terminer' ? 'terminee' : 'annulee', end_date: '2026-09-25' };
    f8aState.assignments = f8aState.assignments.map((a) => (a.id === found.id ? updated : a));
    return HttpResponse.json(updated);
  }),
];

/** Handlers du lot F8a (back-office paroisse). */
export const f8aHandlers = [...articleHandlers, ...placeHandlers, ...agendaHandlers, ...equipeHandlers];

/**
 * Surcharges à poser avec `server.use(...)` : le détail complet du nœud et le catalogue
 * d'offices avec capacités (les handlers du shell n'en renvoient qu'un résumé).
 */
export const f8aOverrides = [
  http.get(apiUrl('/hierarchy/office-types/'), () => HttpResponse.json(officeCatalogue)),
  http.get(apiUrl('/hierarchy/nodes/:nodeId/settings/'), ({ params }) =>
    params.nodeId === ids.saintDominique ? HttpResponse.json(f8aState.settings) : v1Error(404, 'not_found', 'Nœud introuvable.'),
  ),
  http.patch(apiUrl('/hierarchy/nodes/:nodeId/settings/'), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.email === 'string' && body.email.endsWith('@refuse.sn')) {
      return v1Error(400, 'validation_error', 'Données invalides.', { email: ['Cette adresse est refusée par le serveur.'] });
    }
    f8aState.lastBody = body;
    f8aState.settings = { ...f8aState.settings, ...body, updated_at: '2026-09-26T09:00:00Z' } as typeof f8aState.settings;
    return HttpResponse.json(f8aState.settings);
  }),
  http.get(apiUrl('/staff/documents/nodes/:nodeId/type-delays/'), ({ params }) =>
    params.nodeId === ids.saintDominique
      ? HttpResponse.json(typeDelaysOf(f8aState.typeDelays, f8aState.settings.acts_delay_days))
      : v1Error(404, 'not_found', 'Nœud introuvable.'),
  ),
  http.put(apiUrl('/staff/documents/nodes/:nodeId/type-delays/'), async ({ request }) => {
    const body = (await request.json()) as { items: { document_type: string; days: number | null }[] };
    f8aState.lastTypeDelaysBody = body;
    const next = { ...f8aState.typeDelays };
    body.items.forEach((item) => {
      next[item.document_type] = item.days;
    });
    f8aState.typeDelays = next;
    return HttpResponse.json(typeDelaysOf(f8aState.typeDelays, f8aState.settings.acts_delay_days));
  }),
  http.get(apiUrl('/hierarchy/nodes/:nodeId/'), ({ params }) =>
    params.nodeId === ids.saintDominique ? HttpResponse.json(f8aState.node) : v1Error(404, 'not_found', 'Nœud introuvable.'),
  ),
  http.patch(apiUrl('/hierarchy/nodes/:nodeId/'), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    f8aState.lastBody = body;
    f8aState.node = { ...f8aState.node, ...body } as typeof f8aState.node;
    return HttpResponse.json(f8aState.node);
  }),
];
