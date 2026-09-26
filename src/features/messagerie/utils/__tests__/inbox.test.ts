import type { Conversation } from '../../api/schemas';
import { filterConversations, isLate, isUnanswered } from '../inbox';

const ME = 'pretre';
const NOW = '2026-09-26T12:00:00+00:00';

const conv = (id: string, over: Partial<Conversation> & { lastFrom?: string | null; at?: string } = {}): Conversation => {
  const { lastFrom = 'fidele', at = '2026-09-26T10:00:00+00:00', ...rest } = over;
  return {
    id,
    participant_a: { id: 'fidele', full_name: `Fidèle ${id}`, email: '' },
    participant_b: { id: ME, full_name: 'Abbé', email: '' },
    last_message: lastFrom === null ? null : { id: `m-${id}`, sender_id: lastFrom, content: 'x', sent_at: at },
    last_message_at: lastFrom === null ? null : at,
    is_archived: false,
    unread_count: 0,
    confession_notice: '',
    ...rest,
  };
};

describe('boîte du prêtre (PAR-Messagerie)', () => {
  it('une conversation est sans réponse quand le dernier message vient du fidèle', () => {
    expect(isUnanswered(conv('a'), ME)).toBe(true);
    expect(isUnanswered(conv('b', { lastFrom: ME }), ME)).toBe(false);
    expect(isUnanswered(conv('c', { lastFrom: null }), ME)).toBe(false);
  });

  it('sans expéditeur connu (serveur ancien), se fie aux non-lus', () => {
    const old = { ...conv('d'), last_message: { id: 'm', content: 'x', sent_at: NOW } };
    expect(isUnanswered({ ...old, unread_count: 1 }, ME)).toBe(true);
    expect(isUnanswered(old, ME)).toBe(false);
  });

  it('en retard : sans réponse depuis plus de 24 h', () => {
    expect(isLate(conv('a', { at: '2026-09-25T09:00:00+00:00' }), ME, NOW)).toBe(true);
    expect(isLate(conv('b', { at: '2026-09-26T09:00:00+00:00' }), ME, NOW)).toBe(false);
    expect(isLate(conv('c', { lastFrom: ME, at: '2026-09-20T09:00:00+00:00' }), ME, NOW)).toBe(false);
  });

  it('« Sans réponse » : les plus anciennes d’abord, sans les archivées', () => {
    const list = [
      conv('recent', { at: '2026-09-26T10:00:00+00:00' }),
      conv('ancienne', { at: '2026-09-24T10:00:00+00:00' }),
      conv('repondue', { lastFrom: ME }),
      conv('archivee', { is_archived: true }),
    ];
    const groups = filterConversations(list, 'sans_reponse', ME);
    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBe('Sans réponse');
    expect(groups[0].hint).toBe('Les plus anciennes d’abord');
    expect(groups[0].conversations.map((c) => c.id)).toEqual(['ancienne', 'recent']);
  });

  it('« Toutes » : sans réponse puis répondu récemment (plus récentes d’abord)', () => {
    const list = [
      conv('r1', { lastFrom: ME, at: '2026-09-20T10:00:00+00:00' }),
      conv('r2', { lastFrom: ME, at: '2026-09-25T10:00:00+00:00' }),
      conv('s1'),
      conv('archivee', { is_archived: true }),
    ];
    const groups = filterConversations(list, 'toutes', ME);
    expect(groups.map((g) => g.title)).toEqual(['Sans réponse', 'Répondu récemment']);
    expect(groups[1].conversations.map((c) => c.id)).toEqual(['r2', 'r1']);
  });

  it('« Archivées » : seulement les archivées ; aucun groupe vide', () => {
    expect(filterConversations([conv('a')], 'archivees', ME)).toEqual([]);
    const groups = filterConversations([conv('a', { is_archived: true })], 'archivees', ME);
    expect(groups[0].title).toBe('Archivées');
    expect(filterConversations([conv('b', { lastFrom: ME })], 'toutes', ME).map((g) => g.title)).toEqual(['Répondu récemment']);
  });
});
