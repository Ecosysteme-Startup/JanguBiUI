import { FEATURES } from '../features';
import { ROUTES_MANQUANTES } from '../fonctionnalites';

// Compléments V1 (backend docs/API-V1-COMPLEMENTS.md §5) : ces écrans ont leur
// route, ils ne sont plus derrière un indicateur. Le reste reste masqué.
describe('indicateurs de fonctionnalité', () => {
  test('intentions et invitations du clergé ne sont plus des indicateurs', () => {
    expect(Object.keys(FEATURES)).not.toContain('intentions');
    expect(Object.keys(ROUTES_MANQUANTES)).not.toContain('invitationsClerge');
    expect(Object.keys(ROUTES_MANQUANTES)).not.toContain('intentionsMesse');
  });

  test('les écrans sans route restent masqués', () => {
    expect(Object.keys(FEATURES)).toEqual(
      expect.arrayContaining([
        'tv',
        'transfert',
        'assistant',
        'heures',
        'lectio',
        'parcours',
        'chapeletCommunautaire',
        'reflexionPastorale',
      ]),
    );
    expect(Object.keys(ROUTES_MANQUANTES)).toEqual(
      expect.arrayContaining([
        'transferts',
        'messagerieClericale',
        'jangubiTv',
        'reflexionPastorale',
      ]),
    );
  });
});
