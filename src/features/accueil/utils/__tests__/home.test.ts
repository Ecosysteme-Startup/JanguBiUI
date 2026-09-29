import { bookingIcs, countdownLabel, massDayLabel, nextBooking, timeHHMM, upcomingMasses } from '../home';

const occurrence = (date: string, start_time: string, kind = 'messe') => ({
  date,
  kind,
  start_time,
  end_time: null,
  place_id: 1,
  place_name: 'Église Saint-Dominique',
  language: 'fr',
  note: '',
  is_exception: false,
});

describe('upcomingMasses', () => {
  it('garde les messes à venir, dans l’ordre, sans les confessions ni les messes passées', () => {
    const now = new Date('2026-09-24T09:41:00');
    const week = {
      occurrences: [
        occurrence('2026-09-25', '07:00:00'),
        occurrence('2026-09-24', '07:00:00'),
        occurrence('2026-09-24', '18:30:00'),
        occurrence('2026-09-24', '16:00:00', 'confession'),
        occurrence('2026-09-26', '18:30:00'),
        occurrence('2026-09-27', '09:00:00'),
      ],
    };
    const result = upcomingMasses(week, now, 3);
    expect(result.map((o) => `${o.date} ${o.start_time}`)).toEqual([
      '2026-09-24 18:30:00',
      '2026-09-25 07:00:00',
      '2026-09-26 18:30:00',
    ]);
  });

  it('rend une liste vide sans semaine', () => {
    expect(upcomingMasses(undefined, new Date(), 3)).toEqual([]);
  });
});

describe('massDayLabel', () => {
  const now = new Date('2026-09-24T09:41:00');
  it('dit « ce soir » ou « ce matin » le jour même, « demain » le lendemain', () => {
    expect(massDayLabel('2026-09-24', '18:30:00', now)).toBe('ce soir');
    expect(massDayLabel('2026-09-24', '12:15:00', now)).toBe('aujourd’hui');
    expect(massDayLabel('2026-09-25', '07:00:00', new Date('2026-09-25T05:00:00'))).toBe('ce matin');
    expect(massDayLabel('2026-09-25', '07:00:00', now)).toBe('demain');
  });
  it('donne le jour abrégé au-delà', () => {
    expect(massDayLabel('2026-09-26', '18:30:00', now)).toBe('sam. 26');
  });
});

describe('countdownLabel', () => {
  const now = new Date('2026-09-24T09:41:00');
  it('compte les heures et minutes jusqu’à la messe du jour', () => {
    expect(countdownLabel('2026-09-24', '18:30:00', now)).toBe('Dans 8 h 49');
    expect(countdownLabel('2026-09-24', '10:41:00', now)).toBe('Dans 1 h');
    expect(countdownLabel('2026-09-24', '10:05:00', now)).toBe('Dans 24 min');
  });
  it('ne dit rien pour un autre jour ou une heure passée', () => {
    expect(countdownLabel('2026-09-25', '07:00:00', now)).toBeNull();
    expect(countdownLabel('2026-09-24', '07:00:00', now)).toBeNull();
  });
});

describe('timeHHMM', () => {
  it('coupe les secondes', () => {
    expect(timeHHMM('07:00:00')).toBe('07:00');
    expect(timeHHMM('18:30')).toBe('18:30');
  });
});

const booking = (id: number, starts_at: string, status = 'reservee') => ({
  id,
  status,
  slot: {
    id,
    starts_at,
    ends_at: new Date(new Date(starts_at).getTime() + 10 * 60 * 1000).toISOString(),
    place: { id: 1, name: 'Église Saint-Dominique', address: 'Point E, Dakar', node_id: 'n' },
    priest_id: 'p',
    priest_name: 'Abbé Augustin Ndiaye',
  },
});

describe('nextBooking', () => {
  const now = new Date('2026-09-24T09:41:00Z');
  it('choisit le prochain rendez-vous réservé', () => {
    const list = [
      booking(1, '2026-09-30T16:20:00Z'),
      booking(2, '2026-09-26T16:20:00Z', 'annulee_fidele'),
      booking(3, '2026-09-20T16:20:00Z'),
      booking(4, '2026-09-26T16:20:00Z'),
    ];
    expect(nextBooking(list, now)?.id).toBe(4);
  });
  it('rend null sans rendez-vous à venir', () => {
    expect(nextBooking([booking(3, '2026-09-20T16:20:00Z')], now)).toBeNull();
  });
});

describe('bookingIcs', () => {
  it('décrit le créneau sans aucun motif (RG-08)', () => {
    const ics = bookingIcs(booking(4, '2026-09-26T16:20:00Z'));
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('DTSTART:20260926T162000Z');
    expect(ics).toContain('DTEND:20260926T163000Z');
    expect(ics).toContain('SUMMARY:Confession avec Abbé Augustin Ndiaye');
    expect(ics).toContain('LOCATION:Église Saint-Dominique\\, Point E\\, Dakar');
    expect(ics).not.toMatch(/DESCRIPTION/);
    expect(ics.split('\r\n').at(-2)).toBe('END:VCALENDAR');
  });
});
