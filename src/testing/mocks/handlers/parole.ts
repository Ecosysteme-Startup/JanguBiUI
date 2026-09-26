import { http, HttpResponse } from 'msw';

import { apiUrl } from '@/testing/mocks/api-url';
import { bibleSearchResults, chapterVerses, liturgyDayFor, rosaryToday, testaments } from '@/testing/mocks/db-parole';

/** Lot F5a : jour liturgique daté, méditation, Bible, chapelet (contrat de `apps/liturgy|bible|rosary`). */
export const paroleHandlers = [
  http.get(apiUrl('/liturgy/:day/'), ({ params }) => {
    const day = String(params.day);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return HttpResponse.json({ detail: 'Introuvable.' }, { status: 404 });
    return HttpResponse.json(liturgyDayFor(day));
  }),

  http.get(apiUrl('/bible/testaments/'), () => HttpResponse.json(testaments)),
  http.get(apiUrl('/bible/books/:bookId/chapters/:chapter/verses/'), ({ params, request }) => {
    const all = chapterVerses[`${String(params.bookId)}-${String(params.chapter)}`] ?? [];
    const url = new URL(request.url);
    // Une page couvre un chapitre entier : 200 par défaut et au plus (`VerseListApi.Pagination`).
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 200), 200);
    const offset = Number(url.searchParams.get('offset') ?? 0);
    return HttpResponse.json({ count: all.length, next: null, previous: null, results: all.slice(offset, offset + limit) });
  }),
  http.get(apiUrl('/bible/search/'), ({ request }) => {
    const q = new URL(request.url).searchParams.get('q') ?? '';
    return HttpResponse.json(q.toLowerCase().includes('vanit') ? bibleSearchResults : []);
  }),

  http.get(apiUrl('/rosary/today/'), () => HttpResponse.json(rosaryToday)),
];
