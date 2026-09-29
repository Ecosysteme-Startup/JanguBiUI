import {
  deviceLabel,
  downsamplePeaks,
  formatClock,
  formatRate,
  formatRemaining,
  positionValueText,
} from '../format';

describe('format du lecteur', () => {
  it('horloge et temps restant (vrai signe moins)', () => {
    expect(formatClock(112)).toBe('1:52');
    expect(formatClock(3725)).toBe('1:02:05');
    expect(formatClock(Number.NaN)).toBe('0:00');
    expect(formatRemaining(112, 252)).toBe('−2:20');
  });

  it('aria-valuetext en toutes lettres', () => {
    expect(positionValueText(112, 252)).toBe(
      '1 minute 52 secondes sur 4 minutes 12',
    );
    expect(positionValueText(0, 60)).toBe('0 seconde sur 1 minute');
    expect(positionValueText(61, 708)).toBe(
      '1 minute 1 seconde sur 11 minutes 48',
    );
  });

  it('vitesse à la française', () => {
    expect(formatRate(1.25)).toBe('1,25×');
    expect(formatRate(1)).toBe('1×');
  });

  it('réduit 200 pics à 84 barres (maximum par tranche, plancher 0,12)', () => {
    const peaks = Array.from({ length: 200 }, (_, i) => (i === 100 ? 1 : 0));
    const bars = downsamplePeaks(peaks, 84);
    expect(bars).toHaveLength(84);
    expect(Math.max(...bars)).toBe(1);
    expect(Math.min(...bars)).toBe(0.12);
    expect(downsamplePeaks([], 10)).toHaveLength(10);
  });

  it('nomme l’appareil de l’autre écoute', () => {
    expect(deviceLabel('android-mt-diouf')).toBe('votre téléphone Android');
    expect(deviceLabel('ios-1')).toBe('votre iPhone');
    expect(deviceLabel('web-ordinateur-paroisse')).toBe('un autre navigateur');
  });
});
