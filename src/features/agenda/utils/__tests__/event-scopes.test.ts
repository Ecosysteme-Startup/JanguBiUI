import { describe, expect, test } from 'vitest';

import type { User } from '@/lib/auth';

import { availableEventScopes, defaultEventScope } from '../event-scopes';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u-1',
    email: 'test@example.com',
    role: 'fidele',
    pastoral_role: null,
    onboarding_state: 'completed',
    is_active: true,
    is_verified: true,
    is_admin: false,
    is_staff: false,
    profile: {} as User['profile'],
    ...overrides,
  } as User;
}

/** La paroisse principale vit sous `profile` dans la réponse /me. */
function withParish(user: User, parish: { id: number; name: string }): User {
  return { ...user, profile: { ...user.profile, primary_parish: parish } };
}

const PARISH = { id: 7, name: 'Saint-Joseph' };
const DIOCESE = { id: 3, name: 'Dakar' };
const PROVINCE = { id: 1, name: 'Dakar' };

describe('availableEventScopes', () => {
  test('un curé se voit proposer sa paroisse, jamais la portée globale', () => {
    // Arrange
    const user = withParish(
      makeUser({ pastoral_role: 'pretre', diocese: DIOCESE, province: PROVINCE }),
      PARISH,
    );

    // Act
    const scopes = availableEventScopes(user);

    // Assert
    expect(scopes.map((s) => s.value)).toEqual(['parish', 'diocese']);
  });

  test("la province dérivée n'ouvre PAS la portée globale", () => {
    // Un simple fidèle porte une province héritée de sa paroisse : elle ne
    // prouve aucune autorité et ne doit jamais débloquer 'global'.
    // Arrange
    const user = withParish(makeUser({ diocese: DIOCESE, province: PROVINCE }), PARISH);

    // Act
    const scopes = availableEventScopes(user);

    // Assert
    expect(scopes.some((s) => s.value === 'global')).toBe(false);
  });

  test('un admin province peut viser toute la plateforme', () => {
    // Arrange
    const user = makeUser({ role: 'province_admin', province: PROVINCE });

    // Act
    const scopes = availableEventScopes(user);

    // Assert
    expect(scopes.map((s) => s.value)).toEqual(['global']);
  });

  test('un archevêque peut viser toute la plateforme', () => {
    // Arrange
    const user = makeUser({ pastoral_role: 'archeveque', diocese: DIOCESE });

    // Act
    const scopes = availableEventScopes(user);

    // Assert
    expect(scopes.map((s) => s.value)).toEqual(['diocese', 'global']);
  });

  test('sans utilisateur, aucune portée', () => {
    expect(availableEventScopes(null)).toEqual([]);
  });
});

describe('defaultEventScope', () => {
  test('propose la portée la plus étroite — la paroisse pour un curé', () => {
    // Arrange
    const user = withParish(
      makeUser({ pastoral_role: 'pretre', diocese: DIOCESE }),
      PARISH,
    );

    // Act
    const scope = defaultEventScope(user);

    // Assert
    expect(scope).toEqual({
      value: 'parish',
      label: 'Ma paroisse — Saint-Joseph',
      scopeId: 7,
    });
  });

  test('un évêque sans paroisse retombe sur son diocèse', () => {
    // Arrange
    const user = makeUser({ pastoral_role: 'eveque', diocese: DIOCESE });

    // Act
    const scope = defaultEventScope(user);

    // Assert
    expect(scope?.value).toBe('diocese');
    expect(scope?.scopeId).toBe(3);
  });
});
