import { storeUrl } from '@/config/env';

describe('storeUrl (JB-WEB-001)', () => {
  it('garde une vraie fiche de store', () => {
    expect(storeUrl('https://apps.apple.com/app/id6470000000')).toBe('https://apps.apple.com/app/id6470000000');
  });

  it('traite les valeurs vides comme absentes', () => {
    expect(storeUrl(undefined)).toBeUndefined();
    expect(storeUrl('   ')).toBeUndefined();
  });

  it('traite les gabarits « placeholder » non remplacés comme absents', () => {
    expect(storeUrl('https://example.com/app')).toBeUndefined();
    expect(storeUrl('https://play.google.com/store/apps/details?id=com.changeme')).toBeUndefined();
    expect(storeUrl('https://apps.apple.com/app/id0000000000')).toBeUndefined();
    expect(storeUrl('#')).toBeUndefined();
    expect(storeUrl('TODO')).toBeUndefined();
  });

  it('traite une URL mal formée comme absente', () => {
    expect(storeUrl('pas-une-url')).toBeUndefined();
  });
});
