import type { Conversation } from '../../api/schemas';
import { previewOf } from '../participants';

const conversation = (last: Conversation['last_message']) =>
  ({ last_message: last }) as Conversation;

describe('previewOf', () => {
  it('préfixe « Vous : » le dernier message envoyé par soi', () => {
    const c = conversation({ id: 'm1', sender_id: 'moi', content: 'Merci, mon Père.', sent_at: '2026-09-25T08:00:00Z' });
    expect(previewOf(c, 'moi')).toBe('Vous : Merci, mon Père.');
  });

  it('laisse le message du correspondant tel quel', () => {
    const c = conversation({ id: 'm1', sender_id: 'pretre', content: 'Je vous réponds ce soir.', sent_at: '2026-09-25T08:00:00Z' });
    expect(previewOf(c, 'moi')).toBe('Je vous réponds ce soir.');
  });

  it('signale une conversation vide', () => {
    expect(previewOf(conversation(null), 'moi')).toBe('Aucun message pour l’instant');
  });
});
