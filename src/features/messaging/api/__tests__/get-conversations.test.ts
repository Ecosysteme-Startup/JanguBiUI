import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createConversation } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';

import { getConversations } from '../get-conversations';

const makeConv = (id: string) =>
  createConversation({
    id,
    participant_a: {
      id: `user-${id}`,
      email: `user${id}@test.sn`,
      full_name: `User ${id}`,
    },
  });

describe('getConversations — parseConversations', () => {
  test('handles a flat array response from backend', async () => {
    const conv1 = makeConv('c1');
    const conv2 = makeConv('c2');

    server.use(
      http.get(`${env.API_URL}/v1/messaging/conversations/`, () =>
        HttpResponse.json([conv1, conv2]),
      ),
    );

    const result = await getConversations();
    expect(result.count).toBe(2);
    expect(result.results).toHaveLength(2);
    expect(result.results[0].id).toBe('c1');
    expect(result.results[1].id).toBe('c2');
  });

  test('handles a paginated { count, results } response', async () => {
    const conv = makeConv('c3');

    server.use(
      http.get(`${env.API_URL}/v1/messaging/conversations/`, () =>
        HttpResponse.json({ count: 1, results: [conv] }),
      ),
    );

    const result = await getConversations();
    expect(result.count).toBe(1);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].id).toBe('c3');
  });

  test('returns empty results when backend sends empty flat array', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/messaging/conversations/`, () =>
        HttpResponse.json([]),
      ),
    );

    const result = await getConversations();
    expect(result.count).toBe(0);
    expect(result.results).toHaveLength(0);
  });

  test('returns empty results when paginated response has no results key', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/messaging/conversations/`, () =>
        HttpResponse.json({ count: 0 }),
      ),
    );

    const result = await getConversations();
    expect(result.count).toBe(0);
    expect(result.results).toHaveLength(0);
  });

  test('passes search param to the API', async () => {
    const capturedUrls: string[] = [];

    server.use(
      http.get(`${env.API_URL}/v1/messaging/conversations/`, ({ request }) => {
        capturedUrls.push(request.url);
        return HttpResponse.json([]);
      }),
    );

    await getConversations('père jean');
    expect(capturedUrls[0]).toContain('search=');
  });
});
