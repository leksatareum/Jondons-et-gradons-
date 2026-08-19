import { describe, expect, it } from 'vitest';

import {
  applyWildResurgence,
  canRestoreWildShapeWithSlot,
  magicalCunningRecoveredSlots,
  rangerDamageCannotBreakConcentration,
  rangerShortRestExhaustion,
  rangerTirelessUses,
  wildResurgenceSlotOptions,
} from './class-session-rules';

describe('Druide — Résurgence sauvage', () => {
  const character = {
    slots: [{ level: 1, current: 0, max: 4 }, { level: 2, current: 1, max: 2 }],
    pactSlots: [{ level: 3, current: 1, max: 2, pact: true }],
    resources: [
      { name: 'Forme sauvage', current: 0, max: 2 },
      { name: 'Résurgence sauvage', current: 1, max: 1 },
    ],
    turn: { action: false, wildResurgenceUsed: false },
  };

  it('peut dépenser n’importe quel emplacement disponible si aucune Forme sauvage ne reste', () => {
    expect(canRestoreWildShapeWithSlot(character)).toBe(true);
    expect(wildResurgenceSlotOptions(character).map(({ level, pact }) => [level, pact]))
      .toEqual([[2, false], [3, true]]);
    const result = applyWildResurgence(character, { direction: 'slot-to-shape', pool: 'slots', level: 2 });
    expect(result.applied).toBe(true);
    expect(result.character.slots?.find((slot) => slot.level === 2)?.current).toBe(0);
    expect(result.character.resources?.find((resource) => resource.name === 'Forme sauvage')?.current).toBe(1);
    expect(result.character.resources?.find((resource) => resource.name === 'Résurgence sauvage')?.current).toBe(1);
    expect(result.character.turn?.wildResurgenceUsed).toBe(true);
  });

  it('ne peut rendre qu’une Forme sauvage par tour via un emplacement', () => {
    const alreadyUsed = { ...character, turn: { wildResurgenceUsed: true } };
    expect(canRestoreWildShapeWithSlot(alreadyUsed)).toBe(false);
  });

  it('ne peut pas dépenser un emplacement tant qu’une utilisation de Forme sauvage reste', () => {
    const hasShape = { ...character, resources: [{ name: 'Forme sauvage', current: 1, max: 2 }, { name: 'Résurgence sauvage', current: 1, max: 1 }] };
    expect(canRestoreWildShapeWithSlot(hasShape)).toBe(false);
  });

  it('convertit une Forme sauvage en emplacement de niveau 1 supplémentaire une fois par repos long', () => {
    const source = { ...character, resources: [{ name: 'Forme sauvage', current: 2, max: 2 }, { name: 'Résurgence sauvage', current: 1, max: 1 }] };
    const result = applyWildResurgence(source, { direction: 'shape-to-slot' });
    expect(result.applied).toBe(true);
    expect(result.character.slots?.find((slot) => slot.level === 1)).toMatchObject({ current: 1, max: 4, temporary: 1 });
    expect(result.character.resources?.find((resource) => resource.name === 'Forme sauvage')?.current).toBe(1);
    expect(result.character.resources?.find((resource) => resource.name === 'Résurgence sauvage')?.current).toBe(0);
  });
});

describe('Rôdeur — règles de session', () => {
  it('Infatigable utilise le modificateur de Sagesse, minimum 1', () => {
    expect(rangerTirelessUses(4)).toBe(4);
    expect(rangerTirelessUses(0)).toBe(1);
    expect(rangerTirelessUses(-2)).toBe(1);
  });

  it('un repos court réduit l’épuisement à partir du niveau 10 de rôdeur', () => {
    expect(rangerShortRestExhaustion(9, 3)).toBe(3);
    expect(rangerShortRestExhaustion(10, 3)).toBe(2);
    expect(rangerShortRestExhaustion(10, 0)).toBe(0);
  });

  it('Chasseur implacable protège uniquement Marque du chasseur à partir du niveau 13', () => {
    expect(rangerDamageCannotBreakConcentration(12, 'Marque du chasseur')).toBe(false);
    expect(rangerDamageCannotBreakConcentration(13, 'Marque du chasseur')).toBe(true);
    expect(rangerDamageCannotBreakConcentration(20, 'Passage sans trace')).toBe(false);
  });
});

describe('Occultiste — Ruse magique', () => {
  it('rend au plus la moitié des emplacements de pacte, arrondie au supérieur', () => {
    expect(magicalCunningRecoveredSlots(0, 3, 11)).toBe(2);
    expect(magicalCunningRecoveredSlots(2, 3, 11)).toBe(3);
  });

  it('Maître occulte rend tous les emplacements au niveau 20', () => {
    expect(magicalCunningRecoveredSlots(0, 4, 20)).toBe(4);
  });
});
