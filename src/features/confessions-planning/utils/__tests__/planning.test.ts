import type { PlanningSlot } from '../../api/schemas';
import { dayRange, slotMinutes, timeColumns, upcomingDays, usualSchedule, withoutTitle } from '../planning';

const place = { id: 11, name: 'Église Saint-Dominique', address: '', node_id: 'n' };
const slot = (id: number, day: string, time: string, over: Partial<PlanningSlot> = {}): PlanningSlot => {
  const start = `${day}T${time}:00`;
  const [h, m] = time.split(':').map(Number);
  const end = `${day}T${String(h + Math.floor((m + 10) / 60)).padStart(2, '0')}:${String((m + 10) % 60).padStart(2, '0')}:00`;
  return { id, starts_at: start, ends_at: end, status: 'libre', place, priest_id: 'p1', priest_name: 'Abbé A. Ndiaye', is_mine: false, booking: null, ...over };
};

const booked = { status: 'reserve' as const, booking: { id: 1, status: 'reservee', person: 'R. D.' } };

const saturday = [slot(1, '2026-09-26', '16:00', booked), slot(2, '2026-09-26', '16:10'), slot(3, '2026-09-26', '17:50', { priest_id: 'p2' })];
const later = [slot(4, '2026-10-03', '16:00', booked), slot(5, '2026-10-03', '16:10'), slot(6, '2026-10-10', '16:00', { status: 'bloque' })];

describe('grille de confessions', () => {
  it('liste les heures de début du jour, dans l’ordre, sans doublon', () => {
    expect(timeColumns([...saturday, slot(7, '2026-09-26', '16:00', { priest_id: 'p2' })])).toEqual(['16:00', '16:10', '17:50']);
  });

  it('donne la plage et la durée des créneaux', () => {
    expect(dayRange(saturday)).toBe('16:00 – 18:00');
    expect(slotMinutes(saturday)).toBe(10);
  });

  it('résume les jours ouverts après la semaine affichée', () => {
    expect(upcomingDays([...saturday, ...later], '2026-09-27')).toEqual([
      { day: '2026-10-03', range: '16:00 – 16:20', open: 2, booked: 1 },
      { day: '2026-10-10', range: '16:00 – 16:10', open: 0, booked: 0 },
    ]);
  });

  it('déduit la plage habituelle du jour le plus fréquent', () => {
    expect(usualSchedule([...saturday, ...later])).toEqual({ weekday: 'samedi', range: '16:00 – 18:00' });
    expect(usualSchedule([])).toBeNull();
  });

  it('retire le titre du nom pour les initiales', () => {
    expect(withoutTitle('Abbé A. Ndiaye')).toBe('A. Ndiaye');
    expect(withoutTitle('Père Emmanuel Tine')).toBe('Emmanuel Tine');
    expect(withoutTitle('Germaine Faye')).toBe('Germaine Faye');
  });
});
