import { allowedTransitions, isClosed } from '../transitions';

describe('allowedTransitions (SRS §8.1)', () => {
  it.each([
    ['submitted', ['start-verification']],
    ['under_verification', ['mark-ready', 'request-info', 'reject']],
    ['info_requested', []],
    ['ready_for_pickup', ['mark-collected']],
    ['collected', []],
    ['rejected', []],
    ['cancelled', []],
  ] as const)('au statut %s, propose %j', (status, expected) => {
    expect(allowedTransitions(status)).toEqual(expected);
  });

  it('ne permet jamais de rejeter une demande soumise ni une demande prête', () => {
    expect(allowedTransitions('submitted')).not.toContain('reject');
    expect(allowedTransitions('ready_for_pickup')).not.toContain('reject');
  });

  it('reconnaît les statuts clos', () => {
    expect(['collected', 'rejected', 'cancelled'].every((s) => isClosed(s as 'collected'))).toBe(true);
    expect(isClosed('under_verification')).toBe(false);
  });
});
