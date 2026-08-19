import { describe, expect, it } from 'vitest';
import { witchSightRangeMeters } from './warlock-levels-15-20';

const warlock = (level: number, invocations: string[] = []) => ({
  classId: 'occultiste',
  level,
  classLevels: [{ classId: 'occultiste', level }],
  classSelections: { occultiste: { invocations } },
});

describe('Occultiste PHB 2024 niveaux 15 à 20', () => {
  it('Vision de sorcier accorde Vision lucide à 9 m seulement à partir du niveau 15', () => {
    expect(witchSightRangeMeters(warlock(15, ['witch-sight']))).toBe(9);
    expect(witchSightRangeMeters(warlock(14, ['witch-sight']))).toBe(0);
    expect(witchSightRangeMeters(warlock(20, []))).toBe(0);
  });
});
