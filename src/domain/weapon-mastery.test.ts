import { describe, expect, it } from 'vitest';

import { isWeaponEligibleForMastery, weaponMasteryCount, type MasteryWeapon } from './weapon-mastery';

const martialRanged: MasteryWeapon = { id: 'arc-long', cat: 'martial', melee: false, props: 'Munitions, lourde' };
const martialLight: MasteryWeapon = { id: 'epee-courte', cat: 'martial', melee: true, finesse: true, props: 'Finesse, légère' };
const martialHeavy: MasteryWeapon = { id: 'grande-hache', cat: 'martial', melee: true, props: 'Lourde, deux mains' };

describe('weaponMasteryCount', () => {
  it('ne donne pas la Maîtrise d’armes au Moine', () => {
    expect(weaponMasteryCount('moine', 20)).toBe(0);
  });

  it('garde deux choix au Paladin et au Rôdeur', () => {
    expect(weaponMasteryCount('paladin', 20)).toBe(2);
    expect(weaponMasteryCount('rodeur', 20)).toBe(2);
  });

  it('fait progresser les choix du Guerrier', () => {
    expect([1, 4, 10, 16].map((level) => weaponMasteryCount('guerrier', level))).toEqual([3, 4, 5, 6]);
  });
});

describe('isWeaponEligibleForMastery', () => {
  it('limite le Barbare aux armes de corps à corps', () => {
    expect(isWeaponEligibleForMastery('barbare', martialHeavy)).toBe(true);
    expect(isWeaponEligibleForMastery('barbare', martialRanged)).toBe(false);
  });

  it('limite les armes martiales du Roublard à Finesse ou Légère', () => {
    expect(isWeaponEligibleForMastery('roublard', martialLight)).toBe(true);
    expect(isWeaponEligibleForMastery('roublard', martialHeavy)).toBe(false);
  });
});
