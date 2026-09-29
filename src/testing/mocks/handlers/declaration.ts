import { http, HttpResponse } from 'msw';

import { apiUrl } from '@/testing/mocks/api-url';
import { f5bState } from '@/testing/mocks/db-f5b';

/** Annuaire des diocèses et instituts (incardination, institut de vie consacrée). */
export const declarationNodes = {
  dakar: { id: 'd1000000-0000-4000-8000-000000000001', name: 'Archidiocèse de Dakar', code: 'dakar', type: 'diocese', city: 'Dakar' },
  thies: { id: 'd1000000-0000-4000-8000-000000000002', name: 'Diocèse de Thiès', code: 'thies', type: 'diocese', city: 'Thiès' },
  spiritains: { id: 'e1000000-0000-4000-8000-000000000001', name: 'Congrégation du Saint-Esprit', code: 'cssp', type: 'institut', city: 'Dakar' },
};

export const declarationState = {
  submissions: [] as Record<string, unknown>[],
  /** Nombre de fichiers téléversés (le nom ne survit pas au FormData de jsdom). */
  uploads: 0,
  /** Réponse d'erreur imposée au prochain envoi de la déclaration. */
  submitError: null as { status: number; body: Record<string, unknown> } | null,
};

export const resetDeclarationState = () => {
  declarationState.submissions = [];
  declarationState.uploads = 0;
  declarationState.submitError = null;
};

const page = <T,>(results: T[]) => ({ count: results.length, next: null, previous: null, results });
const nodeById = (id: unknown) => Object.values(declarationNodes).find((n) => n.id === id) ?? null;
const ref = (id: unknown) => {
  const node = nodeById(id);
  return node ? { id: node.id, name: node.name, code: node.code, type: node.type } : null;
};

/** Déclaration d'état de vie (POST /me/declaration/) et justificatifs (/files/upload/standard/). */
export const declarationHandlers = [
  http.get(apiUrl('/public/nodes/'), ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    if (type !== 'diocese' && type !== 'institut') return undefined;
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    const found = Object.values(declarationNodes).filter((n) => n.type === type && `${n.name} ${n.city}`.toLowerCase().includes(q));
    return HttpResponse.json(page(found.map((n) => ({ ...n, is_active_on_platform: true }))));
  }),
  http.post(apiUrl('/files/upload/standard/'), () => {
    declarationState.uploads += 1;
    return HttpResponse.json({ id: 700 + declarationState.uploads }, { status: 201 });
  }),
  http.post(apiUrl('/me/declaration/'), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    declarationState.submissions.push(body);
    if (declarationState.submitError) {
      const { status, body: errorBody } = declarationState.submitError;
      return HttpResponse.json(errorBody, { status });
    }
    const previous = (f5bState.declaration ?? {}) as { attachments?: unknown[] };
    const ids = (body.attachment_file_ids as number[] | undefined) ?? [];
    const added = ids.map((id) => ({
      id,
      file_name: `justificatif-${id}.pdf`,
      file_type: 'application/pdf',
      url: `https://fichiers.example.sn/${id}`,
      created_at: '2026-09-26T09:00:00+00:00',
    }));
    f5bState.declaration = {
      ...previous,
      etat_de_vie: body.etat_de_vie,
      degre_ordre: body.degre_ordre ?? 'aucun',
      statut_verification: 'declare',
      declared_at: '2026-09-26T09:00:00+00:00',
      incardination_node: ref(body.incardination_node_id),
      institut_node: ref(body.institut_node_id),
      attachments: [...(previous.attachments ?? []), ...added],
    };
    return HttpResponse.json(f5bState.declaration);
  }),
];
