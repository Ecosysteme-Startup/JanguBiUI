import {
  createAdminUser,
  createClergyUser,
  createUser,
} from '@/testing/data-generators';

import {
  buildBottomNavItems,
  buildNavItems,
  buildOverflowNavItems,
} from '../nav-config';

const labels = (items: { label: string }[]) => items.map((i) => i.label);

// Décision UX verrouillée (F3a) : home pastorale + admin ACCESSIBLE. Un curé
// (parish_admin + pretre) garde sa nav clergé et reçoit une passerelle
// « Administration » ; les dimensions role/pastoral_role sont indépendantes.

describe('buildNavItems', () => {
  test('fidèle laïc : nav fidèle, ni Clergé ni Administration', () => {
    const items = labels(buildNavItems(createUser()));
    expect(items).toContain('Documents');
    // Compléments V1 : recherche transverse et intentions de messe branchées.
    expect(items).toContain('Recherche');
    expect(items).toContain('Intentions de messe');
    expect(items).not.toContain('Clergé');
    expect(items).not.toContain('Administration');
  });

  test('admin pur (sans pastoral_role) : nav admin, pas de Clergé', () => {
    const items = labels(buildNavItems(createAdminUser()));
    expect(items).toContain('Accueil');
    expect(items).not.toContain('Clergé');
    // Sa home EST l'admin (ITEM_ACCUEIL_ADMIN), pas de passerelle séparée.
    expect(items).not.toContain('Administration');
  });

  test('clergé non-admin : nav clergé SANS Administration', () => {
    const items = labels(buildNavItems(createClergyUser('pretre')));
    expect(items).toContain('Clergé');
    expect(items).not.toContain('Administration');
  });

  test('curé = parish_admin + pretre : nav clergé AVEC passerelle Administration', () => {
    const cure = createClergyUser('pretre', {
      role: 'parish_admin',
      is_admin: true,
    });
    const items = labels(buildNavItems(cure));
    expect(items).toContain('Clergé'); // home pastorale conservée
    expect(items).toContain('Administration'); // admin accessible
  });
});

describe('curé admin+clergé — accès admin sur mobile', () => {
  const cure = createClergyUser('pretre', {
    role: 'parish_admin',
    is_admin: true,
  });

  test('la bottom-nav reste clergé (pas de surcharge)', () => {
    expect(labels(buildBottomNavItems(cure))).not.toContain('Administration');
  });

  test('« Administration » est exposée via le menu overflow (≪ Plus ≫)', () => {
    expect(labels(buildOverflowNavItems(cure))).toContain('Administration');
  });
});
