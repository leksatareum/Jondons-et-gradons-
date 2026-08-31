import { describe, expect, it } from 'vitest';
import { resolveActionableItem, resolveHealingItem } from './consumable-ownership';

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

describe('reconnaître un objet à raccourci de Combat', () => {
  it('les consommables à effet de combat connu', () => {
    expect(resolveActionableItem({ name: 'Potion de soins' })?.actionSlot).toBe('bonus');
    expect(resolveActionableItem({ name: 'Antitoxine' })?.actionSlot).toBe('bonus');
    expect(resolveActionableItem({ name: 'Poison simple' })?.actionSlot).toBe('bonus');
    expect(resolveActionableItem({ name: 'Acide' })?.actionSlot).toBe('action');
    expect(resolveActionableItem({ name: 'Feu grégeois' })?.actionSlot).toBe('action');
    expect(resolveActionableItem({ name: 'Eau bénite' })?.actionSlot).toBe('action');
    expect(resolveActionableItem({ name: 'Parchemin de sort mineur' })?.actionSlot).toBe('action');
  });

  it('un objet consommable mais sans action de combat ne résout à rien — du papier blanc n’est pas un raccourci', () => {
    expect(resolveActionableItem({ name: 'Parchemin' })).toBeUndefined(); // du papier, pas un sort
    expect(resolveActionableItem({ name: 'Rations (1 jour)' })).toBeUndefined();
    expect(resolveActionableItem({ name: 'Torche' })).toBeUndefined();
  });

  it('catalogId prime quand il est renseigné', () => {
    expect(resolveActionableItem({ name: 'Fiole verte', catalogId: 'av-antitoxine' })?.actionSlot).toBe('bonus');
  });
});
