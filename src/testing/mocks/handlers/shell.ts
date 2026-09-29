import { http, HttpResponse } from 'msw';

import { apiUrl } from '@/testing/mocks/api-url';
import { ids, liturgyToday, me, mockState } from '@/testing/mocks/db';

/** Données des shells : liturgie du jour, profil, capacités, offices, ancêtres. */
export const shellHandlers = [
  http.get(apiUrl('/liturgy/today/'), () => HttpResponse.json(liturgyToday)),
  http.get(apiUrl('/me/'), () => HttpResponse.json(me)),
  http.get(apiUrl('/me/capacites/'), () => HttpResponse.json(mockState.grants)),
  http.get(apiUrl('/hierarchy/office-types/'), () =>
    HttpResponse.json([
      { code: 'secretaire_paroissial', label: 'Secrétaire paroissiale' },
      { code: 'chancelier', label: 'Chancelier' },
      { code: 'cure', label: 'Curé' },
    ]),
  ),
  http.get(apiUrl('/hierarchy/nodes/:nodeId/ancestors/'), ({ params }) =>
    HttpResponse.json(
      params.nodeId === ids.saintDominique
        ? [{ id: ids.dakar, name: 'Archidiocèse de Dakar', code: 'DAK' }]
        : [{ id: 'prov', name: 'Province de Dakar', code: 'PDK' }],
    ),
  ),
  http.get(apiUrl('/hierarchy/nodes/:nodeId/'), ({ params }) =>
    params.nodeId === ids.thies
      ? HttpResponse.json({ id: ids.thies, name: 'Diocèse de Thiès', code: 'THI', type: { code: 'diocese', label: 'Diocèse' } })
      : HttpResponse.json({ detail: 'Introuvable.' }, { status: 404 }),
  ),
];
