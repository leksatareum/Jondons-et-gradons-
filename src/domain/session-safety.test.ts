import { describe, expect, it } from 'vitest';

import { applyExhaustionLevel, canStartShortRest, resetSpellSlotBudgetForNewTurn } from './session-safety';

describe('short rest guard', () => {
  it('exige au moins 1 PV', () => {
    expect(canStartShortRest({ hp: 0, deathStatus: 'dying' })).toBe(false);
    expect(canStartShortRest({ hp: 1, deathStatus: null })).toBe(true);
  });

  it('refuse un personnage mort même avec des PV incohérents', () => {
    expect(canStartShortRest({ hp: 12, deathStatus: 'dead' })).toBe(false);
  });
});

describe('exhaustion death', () => {
  it('ne tue pas au niveau 5', () => {
    const next = applyExhaustionLevel({ exhaustion: 4, deathStatus: null }, 5);
    expect(next).toMatchObject({ exhaustion: 5, deathStatus: null });
  });

  it('tue au niveau 6 et rompt la concentration', () => {
    const next = applyExhaustionLevel({
      exhaustion: 5,
      deathStatus: null,
      deathSaves: { success: 2, fail: 0 },
      conditions: [{ label: 'Concentration', detail: 'Vol' }, { label: 'Invisible' }],
      pendingConcCheck: { dc: 10 },
      pendingConcChecks: [{ dc: 10 }],
    }, 6);
    expect(next).toMatchObject({
      exhaustion: 6,
      deathStatus: 'dead',
      deathSaves: { success: 0, fail: 3 },
      pendingConcCheck: null,
      pendingConcChecks: [],
    });
    expect(next.conditions).toEqual([{ label: 'Invisible' }]);
  });
});

describe('spell slot budget', () => {
  it('se réinitialise au changement de tour sans rendre action ou réaction', () => {
    expect(resetSpellSlotBudgetForNewTurn({ action: true, bonus: false, reaction: true, spellSlotCast: true }))
      .toEqual({ action: true, bonus: false, reaction: true, spellSlotCast: false });
  });

  it('conserve la même référence si aucun emplacement n’a été dépensé', () => {
    const turn = { action: true, spellSlotCast: false };
    expect(resetSpellSlotBudgetForNewTurn(turn)).toBe(turn);
  });
});
