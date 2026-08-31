import { describe, expect, it } from 'vitest';
import { resolveHealingItem } from './consumable-ownership';

describe('reconnaître une potion de soins dans le sac', () => {
  it('un nom qui correspond exactement au catalogue', () => {
    expect(resolveHealingItem({ name: 'Potion de soins' })?.healDice).toBe('2d4+2');
  });

  it('insensible à la casse et aux accents', () => {
    expect(resolveHealingItem({ name: 'POTION DE SOINS' })?.healDice).toBe('2d4+2');
    expect(resolveHealingItem({ name: 'potion de soins' })?.healDice).toBe('2d4+2');
  });

  it('catalogId prime quand il est renseigné', () => {
    expect(resolveHealingItem({ name: 'Fiole mystère', catalogId: 'av-potion-soins' })?.healDice).toBe('2d4+2');
  });

  it('un objet qui n’est pas une potion de soins ne résout à rien', () => {
    expect(resolveHealingItem({ name: 'Corde' })).toBeUndefined();
    expect(resolveHealingItem({ name: 'Trousse de soins' })).toBeUndefined(); // pas de healDice — pas un jet de dés
    expect(resolveHealingItem({ name: 'Bidule', catalogId: 'inexistant' })).toBeUndefined();
  });
});
