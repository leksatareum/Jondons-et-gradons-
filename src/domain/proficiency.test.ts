import { describe, expect, it } from 'vitest';
import { proficiencyBonus } from './proficiency';

describe('bonus de maîtrise (PHB 2024, inchangé depuis 2014)', () => {
  it.each([
    [1, 2], [4, 2],
    [5, 3], [8, 3],
    [9, 4], [12, 4],
    [13, 5], [16, 5],
    [17, 6], [20, 6],
  ])('niveau %i → +%i', (level, expected) => {
    expect(proficiencyBonus(level)).toBe(expected);
  });
});
