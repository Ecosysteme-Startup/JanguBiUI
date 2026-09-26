import type { Slot } from '../../api/schemas';
import { nextConfessionDay } from '../next-confession';

const place = { id: 1, name: 'Église Saint-Dominique', address: '', node_id: 'n' };
const slot = (id: number, starts: string, ends: string): Slot => ({
  id,
  starts_at: starts,
  ends_at: ends,
  place,
  priest_id: 'p',
  priest_name: 'Abbé',
});

describe('prochain jour de confession', () => {
  it('rien sans créneau', () => {
    expect(nextConfessionDay([])).toBeNull();
  });

  it('le premier jour, sa plage, le lieu et la durée d’un créneau', () => {
    const next = nextConfessionDay([
      slot(3, '2026-10-03T16:00:00', '2026-10-03T16:10:00'),
      slot(2, '2026-09-26T17:50:00', '2026-09-26T18:00:00'),
      slot(1, '2026-09-26T16:00:00', '2026-09-26T16:10:00'),
    ]);
    expect(next).toEqual({
      day: '2026-09-26',
      from: '2026-09-26T16:00:00',
      to: '2026-09-26T18:00:00',
      place: 'Église Saint-Dominique',
      minutes: 10,
    });
  });
});
