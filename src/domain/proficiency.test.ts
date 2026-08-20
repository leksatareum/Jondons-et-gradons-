import { describe, expect, it } from 'vitest';
import { proficiencyBonus, proficiencyBonusForChallengeRating } from './proficiency';

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

describe('bonus de maîtrise d’une créature (Manuel des Monstres, table par FP)', () => {
  it.each([
    ['0', 2], ['1/8', 2], ['1/4', 2], ['1/2', 2], ['1', 2], ['4', 2],
    ['5', 3], ['8', 3],
    ['9', 4], ['12', 4],
    ['13', 5], ['16', 5],
    ['17', 6], ['20', 6],
    ['21', 7], ['24', 7],
    ['25', 8], ['28', 8],
    ['29', 9], ['30', 9],
  ])('FP %s → +%i', (cr, expected) => {
    expect(proficiencyBonusForChallengeRating(cr)).toBe(expected);
  });
});
