import { http, HttpResponse } from 'msw';

import { apiUrl } from '@/testing/mocks/api-url';
import { ids, onboardingState, parishes } from '@/testing/mocks/db';

const consentStatus = () => ({
  current_version: '2026-09',
  given_version: onboardingState.consent ?? '',
  given_at: onboardingState.consent ? '2026-09-25T10:00:00+00:00' : null,
  required: !onboardingState.consent,
});

/** Onboarding : annuaire public, paroisse suivie, consentement, préférences. */
export const onboardingHandlers = [
  http.get(apiUrl('/public/nodes/'), ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('type') === 'diocese') {
      const dioceses = [{ id: ids.dakar, name: 'Archidiocèse de Dakar', code: 'DAK', is_active_on_platform: false }];
      return HttpResponse.json({ count: dioceses.length, next: null, previous: null, results: dioceses });
    }
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    const results = parishes.filter((p) => `${p.name} ${p.city} ${p.address}`.toLowerCase().includes(q));
    return HttpResponse.json({ count: results.length, next: null, previous: null, results });
  }),
  http.get(apiUrl('/me/consent/'), () => HttpResponse.json(consentStatus())),
  http.post(apiUrl('/me/consent/'), async ({ request }) => {
    const body = (await request.json()) as { version: string };
    onboardingState.consent = body.version;
    return HttpResponse.json(consentStatus());
  }),
  http.put(apiUrl('/me/paroisse-suivie/'), async ({ request }) => {
    const body = (await request.json()) as { node_id: string | null };
    onboardingState.paroisse = body.node_id;
    return HttpResponse.json({ node_id: body.node_id });
  }),
  http.put(apiUrl('/me/notification-preferences/'), async ({ request }) => {
    const body = (await request.json()) as { topic_annonces?: boolean };
    onboardingState.annonces = body.topic_annonces ?? null;
    return HttpResponse.json(body);
  }),
];
