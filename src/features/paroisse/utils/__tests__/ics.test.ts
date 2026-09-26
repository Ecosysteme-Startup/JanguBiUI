import { eventIcs } from '@/features/paroisse/utils/ics';

describe('eventIcs', () => {
  it('produit un VEVENT en UTC, texte échappé', () => {
    const ics = eventIcs(
      { id: 42, title: 'Récollection; CEB, jour 1', description: 'Ligne 1\nLigne 2', location: 'Salle paroissiale', start_at: '2026-10-10T09:00:00Z', end_at: '2026-10-10T16:00:00Z' },
      'https://jangubi.test/app/paroisse/evenements/42',
      new Date('2026-09-26T12:00:00Z'),
    );
    expect(ics).toContain('BEGIN:VCALENDAR\r\n');
    expect(ics).toContain('UID:evenement-42@jangubi\r\n');
    expect(ics).toContain('DTSTART:20261010T090000Z\r\n');
    expect(ics).toContain('DTEND:20261010T160000Z\r\n');
    expect(ics).toContain('DTSTAMP:20260926T120000Z\r\n');
    expect(ics).toContain('SUMMARY:Récollection\\; CEB\\, jour 1\r\n');
    expect(ics).toContain('DESCRIPTION:Ligne 1\\nLigne 2\r\n');
    expect(ics).toContain('LOCATION:Salle paroissiale\r\n');
    expect(ics).toContain('URL:https://jangubi.test/app/paroisse/evenements/42\r\n');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });
});
