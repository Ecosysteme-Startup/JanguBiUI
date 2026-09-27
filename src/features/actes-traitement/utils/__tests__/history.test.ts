import { complementReceived, historyEntryLabel, statusSince } from '../history';

const log = (from_status: string, to_status: string, created_at: string, by_requester = false) => ({
  from_status,
  to_status,
  created_at,
  comment: '',
  changed_by_name: by_requester ? 'Marie-Thérèse Diouf' : 'Germaine Faye',
  by_requester,
});

const history = [
  log('', 'submitted', '2026-09-20T18:04:00Z', true),
  log('submitted', 'under_verification', '2026-09-21T09:10:00Z'),
  log('under_verification', 'info_requested', '2026-09-23T11:20:00Z'),
  log('info_requested', 'under_verification', '2026-09-24T08:52:00Z', true),
];

describe('historique d’une demande', () => {
  it('repère le complément reçu du fidèle tant que la demande est en vérification', () => {
    expect(complementReceived({ status: 'under_verification', history })?.created_at).toBe('2026-09-24T08:52:00Z');
    expect(complementReceived({ status: 'ready_for_pickup', history })).toBeNull();
    expect(complementReceived({ status: 'under_verification', history: history.slice(0, 2) })).toBeNull();
  });

  it('nomme chaque étape comme la maquette', () => {
    expect(history.map(historyEntryLabel)).toEqual(['Soumise depuis l’espace fidèle', 'Passée en vérification', 'Complément demandé', 'Complément reçu']);
    expect(historyEntryLabel(log('under_verification', 'ready_for_pickup', '2026-09-25T10:00:00Z'))).toBe('Prête à retirer');
    expect(historyEntryLabel(log('ready_for_pickup', 'collected', '2026-09-26T10:00:00Z'))).toBe('Original remis');
  });

  it('date le statut courant de sa dernière entrée', () => {
    expect(statusSince({ status: 'under_verification', history })).toBe('2026-09-24T08:52:00Z');
    expect(statusSince({ status: 'rejected', history })).toBeNull();
  });
});
