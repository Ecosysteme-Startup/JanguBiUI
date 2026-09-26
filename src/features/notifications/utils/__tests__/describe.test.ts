import { paths } from '@/config/paths';

import { describeNotification } from '../describe';

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
