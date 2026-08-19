import { describe, expect, it } from 'vitest';
import { applyWildShape } from './wild-shape';
import {
  improvedCircleFormsRules,
  lunarFormRules,
  moonlightStepMaxUses,
  moonlightStepRemaining,
  moonlightStepRules,
  resetMoonlightStepLongRest,
  restoreMoonlightStepWithSpellSlot,
  spendMoonlightStep,
} from './druid-moon-advanced';

const moon = (level: number, wis = 18) => ({
  level,
  classId: 'druide',
  subclass: 'Cercle de la Lune',
  classLevels: [{ classId: 'druide', level, subclass: 'Cercle de la Lune' }],
  abilities: { str: 8, dex: 14, con: 14, int: 12, wis, cha: 10 },
  attacks: [{ id: 'staff', name: 'Bâton', dice: '1d6+2' }],
  hpTemp: 0,
  resources: [{ name: 'Forme sauvage', current: 2, max: 2 }],
  conditions: [],
  turn: { action: false, bonus: false, reaction: false },
  wildShapeKnownForms: ['wolf', 'rat', 'spider', 'riding-horse'],
});

describe('Cercle de la Lune avancé · PHB 2024', () => {
  it('Formes de cercle améliorées ajoute le choix radiant et SAG aux JS CON seulement en Forme sauvage', () => {
    expect(improvedCircleFormsRules(moon(6))).toEqual({ canChooseRadiantDamage: false, constitutionSaveBonus: 0 });
    const shifted = applyWildShape(moon(6), 'wolf');
    expect(improvedCircleFormsRules(shifted)).toEqual({ canChooseRadiantDamage: true, constitutionSaveBonus: 4 });
  });

  it('Pas de lune donne SAG utilisations, minimum 1, et se recharge au repos long', () => {
    const level10 = moon(10);
    expect(moonlightStepMaxUses(level10)).toBe(4);
    expect(moonlightStepRemaining(level10)).toBe(4);
    const used = spendMoonlightStep(level10);
    expect(moonlightStepRemaining(used)).toBe(3);
    expect(resetMoonlightStepLongRest(used).moonlightStepUsed).toBe(0);
    expect(moonlightStepMaxUses(moon(10, 8))).toBe(1);
  });

  it('un emplacement de niveau 2+ restaure exactement une utilisation de Pas de lune', () => {
    const usedTwice = { ...moon(10), moonlightStepUsed: 2 };
    expect(restoreMoonlightStepWithSpellSlot(usedTwice, 1)).toBe(usedTwice);
    expect(restoreMoonlightStepWithSpellSlot(usedTwice, 2).moonlightStepUsed).toBe(1);
  });

  it('Pas de lune expose téléportation 9 m et avantage sur la prochaine attaque', () => {
    expect(moonlightStepRules(moon(9))).toBeNull();
    expect(moonlightStepRules(moon(10))).toEqual({
      teleportMeters: 9,
      advantageOnNextAttackThisTurn: true,
      canBringWillingCreature: false,
      allyStartDistanceMeters: 3,
      allyDestinationDistanceMeters: 3,
    });
  });

  it('Forme lunaire ajoute 2d10 radiants une fois par tour et Lumière partagée au niveau 14', () => {
    expect(lunarFormRules(moon(13))).toBeNull();
    expect(lunarFormRules(moon(14))).toEqual({ extraRadiantDamage: '2d10', oncePerTurn: true, sharedMoonlight: true });
    expect(moonlightStepRules(moon(14))?.canBringWillingCreature).toBe(true);
  });
});
