import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { useState } from 'react';

import { env } from '@/config/env';
import { createUser } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp, screen } from '@/testing/test-utils';

import {
  ALL_SCOPE,
  buildScopeFilterOptions,
  NewsScopeFilter,
  scopeFilterToParams,
  type ScopeFilterValue,
} from '../news-scope-filter';

// Aminata : 2 églises → 2 paroisses → 2 diocèses.
const MEMBERSHIPS = [
  {
    id: 1,
    church: { id: 111, name: 'Église A' },
    parish: { id: 11, name: 'Saint-Pierre' },
    diocese: { id: 1, name: 'Diocèse de Dakar' },
    is_primary: true,
  },
  {
    id: 2,
    church: { id: 211, name: 'Église B' },
    parish: { id: 21, name: 'Sainte-Anne' },
    diocese: { id: 2, name: 'Diocèse de Thiès' },
    is_primary: false,
  },
];

function mockMe(memberships = MEMBERSHIPS) {
  server.use(
    http.get(`${env.API_URL}/v1/me/`, () =>
      HttpResponse.json(createUser({ memberships })),
    ),
  );
}

function Harness() {
  const [scope, setScope] = useState<ScopeFilterValue>(ALL_SCOPE);
  return (
    <div>
      <NewsScopeFilter value={scope} onChange={setScope} />
      <p data-testid="active">{JSON.stringify(scope)}</p>
    </div>
  );
}

describe('buildScopeFilterOptions / scopeFilterToParams (purs)', () => {
  test('ordre Tous · Universel · diocèses · paroisses · églises, dédupliqués', () => {
    const opts = buildScopeFilterOptions([
      ...MEMBERSHIPS,
      // 3e appartenance partageant le diocèse 1 et la paroisse 11 → pas de doublon.
      {
        id: 3,
        church: { id: 311, name: 'Église C' },
        parish: { id: 11, name: 'Saint-Pierre' },
        diocese: { id: 1, name: 'Diocèse de Dakar' },
        is_primary: false,
      },
    ]);
    const labels = opts.map((o) => o.label);
    expect(labels.slice(0, 2)).toEqual(['Tous', 'Universel']);
    expect(labels.filter((l) => l === 'Diocèse de Dakar')).toHaveLength(1);
    expect(labels.filter((l) => l === 'Saint-Pierre')).toHaveLength(1);
    expect(labels).toContain('Église C');
  });

  test('aucune appartenance → seuls Tous/Universel', () => {
    expect(buildScopeFilterOptions([]).map((o) => o.label)).toEqual([
      'Tous',
      'Universel',
    ]);
  });

  test('mapping vers params serveur', () => {
    expect(scopeFilterToParams({ kind: 'all' })).toEqual({});
    expect(scopeFilterToParams({ kind: 'global' })).toEqual({
      scope_type: 'global',
    });
    expect(
      scopeFilterToParams({ kind: 'church', id: 111, name: 'Église A' }),
    ).toEqual({ scope_type: 'church', scope_id: 111 });
  });
});

describe('NewsScopeFilter (rendu + sélection)', () => {
  beforeEach(() => mockMe());

  test('affiche SES 2 églises + 2 paroisses + 2 diocèses + Universel + Tous', async () => {
    renderApp(<Harness />);
    await screen.findByRole('button', { name: 'Église A' });
    for (const label of [
      'Tous',
      'Universel',
      'Diocèse de Dakar',
      'Diocèse de Thiès',
      'Saint-Pierre',
      'Sainte-Anne',
      'Église A',
      'Église B',
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  test("une église hors appartenances n'est jamais proposée", async () => {
    renderApp(<Harness />);
    await screen.findByRole('button', { name: 'Église A' });
    expect(
      screen.queryByRole('button', { name: 'Église Z' }),
    ).not.toBeInTheDocument();
  });

  test('clic « Église A » → portée church 111 + chip actif', async () => {
    renderApp(<Harness />);
    await userEvent.click(await screen.findByRole('button', { name: 'Église A' }));

    const active = screen.getByTestId('active');
    expect(active).toHaveTextContent('"kind":"church"');
    expect(active).toHaveTextContent('"id":111');
    expect(screen.getByRole('button', { name: 'Église A' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
