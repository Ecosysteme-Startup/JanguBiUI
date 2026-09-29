import {
  arrondiMillier,
  formatDuree,
  formatFcfa,
  formatNombre,
  formatSecondes,
  partPourcent,
} from '../format';
import { trierAlphabetique, trierParEcheance } from '../ordre';

describe('formats des montants', () => {
  test('espaces insécables et unité FCFA', () => {
    expect(formatNombre(1214830)).toBe('1\u00A0214\u00A0830');
    expect(formatFcfa(356330)).toBe('356\u00A0330\u00A0FCFA');
    expect(formatNombre(-7120)).toBe('\u2212\u00A07\u00A0120');
  });

  test('arrondi au millier le plus proche', () => {
    expect(arrondiMillier(1214830)).toBe(1215000);
    expect(arrondiMillier(259905)).toBe(260000);
    expect(arrondiMillier(236400)).toBe(236000);
    expect(arrondiMillier(674525)).toBe(675000);
    expect(arrondiMillier(44000)).toBe(44000);
    expect(arrondiMillier(499)).toBe(0);
  });

  test('parts en pourcentage entier, total nul sans division', () => {
    expect(partPourcent(259905, 1214830)).toBe(21);
    expect(partPourcent(47, 58)).toBe(81);
    expect(partPourcent(3, 0)).toBe(0);
  });

  test('durées et délais', () => {
    expect(formatDuree('2026-09-27T14:15:00Z', '2026-09-28T09:15:00Z')).toBe(
      '19 heures',
    );
    expect(formatDuree('2026-09-28T09:11:00Z', '2026-09-28T09:15:00Z')).toBe(
      '4 minutes',
    );
    expect(formatSecondes(41)).toBe('41\u00A0s');
    expect(formatSecondes(330)).toBe('5\u00A0min\u00A030');
  });
});

describe('règles d’ordre', () => {
  test('ordre alphabétique français, indépendant des montants', () => {
    const paroisses = [
      { nom: 'Saint-Dominique', montant: 1215000 },
      { nom: 'Sainte-Thérèse de Grand-Dakar', montant: 0 },
      { nom: 'Cathédrale Notre-Dame-des-Victoires', montant: 0 },
      { nom: 'Saint-Joseph de Médina', montant: 0 },
      { nom: 'Notre-Dame des Anges de Ouakam', montant: 0 },
    ];
    expect(
      trierAlphabetique(paroisses, (p) => p.nom).map((p) => p.nom),
    ).toEqual([
      'Cathédrale Notre-Dame-des-Victoires',
      'Notre-Dame des Anges de Ouakam',
      'Saint-Dominique',
      'Saint-Joseph de Médina',
      'Sainte-Thérèse de Grand-Dakar',
    ]);
  });

  test('« À traiter » : échéance la plus proche en premier', () => {
    const tries = trierParEcheance([
      { id: 'c', echeance: '2026-10-04T00:00:00Z' },
      { id: 'a', echeance: '2026-09-28T14:15:00Z' },
      { id: 'b', echeance: '2026-09-28T18:00:00Z' },
    ]);
    expect(tries.map((t) => t.id)).toEqual(['a', 'b', 'c']);
  });
});
