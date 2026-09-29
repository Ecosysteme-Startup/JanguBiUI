import { describe, expect, it } from 'vitest';

import { donationPlaceId, donationSource } from '../source';

describe('donationSource', () => {
  it('reprend un canal connu', () => {
    expect(donationSource('app_ios')).toBe('app_ios');
    expect(donationSource('qr')).toBe('qr');
  });

  it('retombe sur « web » sans paramètre ou avec une valeur inconnue', () => {
    expect(donationSource(null)).toBe('web');
    expect(donationSource(undefined)).toBe('web');
    expect(donationSource('facebook')).toBe('web');
  });
});

describe('donationPlaceId', () => {
  it('accepte un entier positif', () => {
    expect(donationPlaceId('12')).toBe(12);
  });

  it('ignore le reste', () => {
    expect(donationPlaceId(null)).toBeNull();
    expect(donationPlaceId('0')).toBeNull();
    expect(donationPlaceId('-3')).toBeNull();
    expect(donationPlaceId('abc')).toBeNull();
  });
});
