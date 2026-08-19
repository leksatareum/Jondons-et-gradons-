import { describe, expect, it } from 'vitest';
import {
  archfeyFeyStepUses,
  celestialHealingLightDice,
  fiendDarkOnesLuckUses,
  greatOldOneClairvoyantCombatantUses,
} from './warlock-patron-resources';

describe('Patron Céleste — Lumière guérisseuse', () => {
  it('indisponible avant le niveau 3, puis niveau + 1 dés', () => {
    expect(celestialHealingLightDice(2)).toBe(0);
    expect(celestialHealingLightDice(3)).toBe(4);
    expect(celestialHealingLightDice(20)).toBe(21);
  });
});

describe('Patron Fiélon — Chance du Ténébreux', () => {
  it('indisponible avant le niveau 6, puis modificateur de Charisme (min 1)', () => {
    expect(fiendDarkOnesLuckUses(5, 5)).toBe(0);
    expect(fiendDarkOnesLuckUses(6, 0)).toBe(1);
    expect(fiendDarkOnesLuckUses(6, 4)).toBe(4);
  });
});

describe('Patron Grand Ancien — Combattant clairvoyant', () => {
  it('suit le bonus de maîtrise à partir du niveau 6', () => {
    expect(greatOldOneClairvoyantCombatantUses(5)).toBe(0);
    expect(greatOldOneClairvoyantCombatantUses(6)).toBe(3);
    expect(greatOldOneClairvoyantCombatantUses(9)).toBe(4);
    expect(greatOldOneClairvoyantCombatantUses(13)).toBe(5);
    expect(greatOldOneClairvoyantCombatantUses(17)).toBe(6);
  });
});

describe('Patron Archifée — Pas des fées', () => {
  it('suit le bonus de maîtrise à partir du niveau 3', () => {
    expect(archfeyFeyStepUses(2)).toBe(0);
    expect(archfeyFeyStepUses(3)).toBe(2);
    expect(archfeyFeyStepUses(5)).toBe(3);
    expect(archfeyFeyStepUses(9)).toBe(4);
    expect(archfeyFeyStepUses(13)).toBe(5);
    expect(archfeyFeyStepUses(17)).toBe(6);
  });
});
