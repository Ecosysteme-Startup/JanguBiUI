import { paths } from '@/config/paths';

import { dayGroupOf, describeNotification, notificationTime } from '../describe';

describe('describeNotification', () => {
  it('renvoie vers le profil pour une demande de complément, sans motif dans la notification', () => {
    const view = describeNotification({
      id: 'n9',
      event_type: 'personnes.complement',
      payload: { statut: 'complement' },
      is_read: false,
      read_at: null,
      created_at: '2026-09-25T09:41:00+00:00',
    });

    expect(view).toMatchObject({ title: 'Complément demandé pour votre déclaration', href: paths.app.etatDeVie.getHref() });
  });
});

describe('describeNotification — chancellerie', () => {
  it('renvoie vers l’annuaire du clergé quand une personne a complété sa déclaration', () => {
    const view = describeNotification({
      id: 'n10',
      event_type: 'personnes.complement_fourni',
      payload: { person_id: 'p1', node_id: 'd1' },
      is_read: false,
      read_at: null,
      created_at: '2026-09-26T09:41:00+00:00',
    });

    expect(view).toMatchObject({ title: 'Déclaration d’état de vie complétée', href: paths.espace.clerge.getHref('d1') });
  });
});

describe('dayGroupOf / notificationTime', () => {
  const now = new Date('2026-09-24T12:00:00');
  it('range par aujourd’hui, cette semaine, plus tôt', () => {
    expect(dayGroupOf('2026-09-24T10:13:00', now)).toBe('Aujourd’hui');
    expect(dayGroupOf('2026-09-22T10:13:00', now)).toBe('Cette semaine');
    expect(dayGroupOf('2026-09-16T10:13:00', now)).toBe('Plus tôt');
  });
  it('affiche l’heure, le jour abrégé ou la date', () => {
    expect(notificationTime('2026-09-24T10:13:00', now)).toBe('10:13');
    expect(notificationTime('2026-09-22T10:13:00', now)).toBe('mar.');
    expect(notificationTime('2026-09-16T10:13:00', now)).toBe('16 sept.');
  });
});
