import { libellePresence } from '../format-presence';

const MAINTENANT = new Date('2026-09-27T09:41:00Z');
const p = (
  online: boolean | null,
  last_seen_at: string | null,
  visible = true,
) => ({
  user_id: 'u',
  visible,
  online,
  last_seen_at,
});

describe('libellePresence', () => {
  test('« En ligne », toujours avec son texte', () => {
    expect(libellePresence(p(true, null), MAINTENANT)).toEqual({
      etat: 'en_ligne',
      texte: 'En ligne',
    });
  });

  test('« Vu aujourd’hui à 8:02 », « Vu hier à 21:05 », « Vu le 22 sept. »', () => {
    expect(
      libellePresence(p(false, '2026-09-27T08:02:00+00:00'), MAINTENANT)?.texte,
    ).toBe("Vu aujourd'hui à 8:02");
    expect(
      libellePresence(p(false, '2026-09-26T21:05:00Z'), MAINTENANT)?.texte,
    ).toBe('Vu hier à 21:05');
    expect(
      libellePresence(p(false, '2026-09-22T10:00:00Z'), MAINTENANT)?.texte,
    ).toBe('Vu le 22 sept.');
  });

  test('rien au-delà de 7 jours, ni pour une présence masquée', () => {
    expect(
      libellePresence(p(false, '2026-09-19T10:00:00Z'), MAINTENANT),
    ).toBeNull();
    expect(libellePresence(p(true, null, false), MAINTENANT)).toBeNull();
    expect(libellePresence(p(null, null, false), MAINTENANT)).toBeNull();
    expect(libellePresence(undefined, MAINTENANT)).toBeNull();
  });
});
