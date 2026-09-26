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

    expect(view).toMatchObject({ title: 'Complément demandé pour votre déclaration', href: paths.app.profil.getHref() });
  });
});
