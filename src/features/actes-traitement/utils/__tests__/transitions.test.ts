import { allowedTransitions, isClosed } from '../transitions';
import { actesHandlers } from '@/testing/mocks/handlers/f6-actes';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...actesHandlers));

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
