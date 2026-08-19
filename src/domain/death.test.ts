import { describe, expect, it } from 'vitest';

import {
  applyDamageAtZero,
  isZeroHpIncapacitated,
  resolveDeathSave,
  stabilizeDeathState,
  zeroHpAutoFailsSave,
} from './death';

const dying = { hp: 0, hpMax: 20, deathStatus: 'dying' as const, deathSaves: { success: 0, fail: 0 } };

describe('jets contre la mort', () => {
  it('stabilise à la troisième réussite et remet les compteurs à zéro', () => {
    const two = { ...dying, deathSaves: { success: 2, fail: 1 } };
    expect(resolveDeathSave(two, 'success')).toMatchObject({
      deathStatus: 'stable', deathSaves: { success: 0, fail: 0 },
    });
  });

  it('un 1 naturel compte deux échecs', () => {
    expect(resolveDeathSave(dying, 'nat1')).toMatchObject({ deathStatus: 'dying', deathSaves: { success: 0, fail: 2 } });
  });

  it('un 20 naturel rend 1 PV et efface les jets', () => {
    expect(resolveDeathSave({ ...dying, deathSaves: { success: 1, fail: 2 } }, 'nat20')).toMatchObject({
      hp: 1, deathStatus: null, deathSaves: { success: 0, fail: 0 },
    });
  });
});

describe('stabilisation et dégâts à 0 PV', () => {
  it('la stabilisation remet succès et échecs à zéro', () => {
    expect(stabilizeDeathState({ hp: 0, hpMax: 20, deathStatus: 'dying' as const, deathSaves: { success: 2, fail: 1 } }))
      .toMatchObject({ deathStatus: 'stable', deathSaves: { success: 0, fail: 0 } });
  });

  it('un dégât sur une créature stable relance les jets avec un échec', () => {
    expect(applyDamageAtZero({ hp: 0, hpMax: 20, deathStatus: 'stable' as const, deathSaves: { success: 0, fail: 0 } }, 3))
      .toMatchObject({ deathStatus: 'dying', deathSaves: { success: 0, fail: 1 } });
  });

  it('un critique à 0 PV inflige deux échecs', () => {
    expect(applyDamageAtZero({ hp: 0, hpMax: 20, deathStatus: 'dying' as const, deathSaves: { success: 1, fail: 0 } }, 3, true))
      .toMatchObject({ deathStatus: 'dying', deathSaves: { success: 1, fail: 2 } });
  });

  it('des dégâts au moins égaux au maximum de PV tuent immédiatement à 0 PV', () => {
    expect(applyDamageAtZero(dying, 20)).toMatchObject({ deathStatus: 'dead', deathSaves: { success: 0, fail: 3 } });
  });
});

describe('0 PV implique incapacité et inconscience mécanique', () => {
  it('bloque l’action pour mourant ou stable', () => {
    expect(isZeroHpIncapacitated({ hp: 0, deathStatus: 'dying' })).toBe(true);
    expect(isZeroHpIncapacitated({ hp: 0, deathStatus: 'stable' })).toBe(true);
    expect(isZeroHpIncapacitated({ hp: 1, deathStatus: null })).toBe(false);
  });

  it('fait échouer automatiquement les sauvegardes de Force et Dextérité', () => {
    const stable = { hp: 0, deathStatus: 'stable' as const };
    expect(zeroHpAutoFailsSave(stable, 'str')).toBe(true);
    expect(zeroHpAutoFailsSave(stable, 'dex')).toBe(true);
    expect(zeroHpAutoFailsSave(stable, 'con')).toBe(false);
  });
});
