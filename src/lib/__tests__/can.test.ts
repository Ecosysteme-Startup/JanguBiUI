import { can, contextsOf, officeTitle } from '@/lib/can';
import { grantsChancelier, grantsPlateforme, grantsSecretaire, ids } from '@/testing/mocks/db';

describe('can', () => {
  it('accorde une capacité détenue sur le nœud demandé', () => {
    expect(can(grantsSecretaire, 'actes.traiter', ids.saintDominique)).toBe(true);
  });

  it('refuse une capacité détenue sur un autre nœud', () => {
    expect(can(grantsSecretaire, 'actes.traiter', ids.dakar)).toBe(false);
  });

  it('refuse une capacité absente du catalogue de l’office', () => {
    expect(can(grantsSecretaire, 'messagerie.recevoir_fideles', ids.saintDominique)).toBe(false);
  });

  it('sans nœud, la capacité sur au moins un nœud suffit', () => {
    expect(can(grantsChancelier, 'structure.gerer')).toBe(true);
  });

  it('la plateforme exerce ses capacités sur tout l’arbre, sans actes.traiter (RG-09)', () => {
    expect(can(grantsPlateforme, 'structure.gerer', ids.thies)).toBe(true);
    expect(can(grantsPlateforme, 'plateforme.admin', null)).toBe(true);
    expect(can(grantsPlateforme, 'actes.traiter', ids.thies)).toBe(false);
  });
});

describe('contextsOf', () => {
  it('regroupe les capacités par nœud avec leurs offices', () => {
    const contexts = contextsOf([...grantsSecretaire, ...grantsChancelier]);
    expect(contexts).toEqual([
      {
        nodeId: ids.saintDominique,
        name: 'Saint-Dominique',
        type: 'paroisse',
        offices: ['secretaire_paroissial'],
        officeLabels: { secretaire_paroissial: 'Secrétaire paroissiale' },
      },
      { nodeId: ids.dakar, name: 'Archidiocèse de Dakar', type: 'diocese', offices: ['chancelier'], officeLabels: { chancelier: 'Chancelier' } },
    ]);
  });

  it('retient le titre réel de chaque nomination (« Administrateur paroissial », pas le libellé du catalogue)', () => {
    const [context] = contextsOf(grantsSecretaire.map((g) => ({ ...g, office: 'cure', office_label: 'Administrateur paroissial' })));
    expect(officeTitle(context!, 'cure', 'Curé / administrateur paroissial')).toBe('Administrateur paroissial');
  });

  it('se rabat sur le libellé fourni quand l’API ne donne pas de titre', () => {
    const [context] = contextsOf(grantsSecretaire.map((g) => ({ ...g, office_label: '' })));
    expect(officeTitle(context!, 'secretaire_paroissial', 'Secrétaire paroissial')).toBe('Secrétaire paroissial');
    expect(officeTitle(context!, undefined)).toBe('');
  });
});
