import { describe, expect, it } from 'vitest';
import {
  archfeyFeyStepUses,
  celestialHealingLightDice,
  fiendDarkOnesLuckUses,
  GREAT_OLD_ONE_CLAIRVOYANT_RECHARGE,
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

describe('Patron Grand Ancien — Combattant clairvoyant (corrigé depuis la sortie construite)', () => {
  it('une seule utilisation à partir du niveau 6, pas une table calquée sur la maîtrise', () => {
    expect(greatOldOneClairvoyantCombatantUses(5)).toBe(0);
    expect(greatOldOneClairvoyantCombatantUses(6)).toBe(1);
    expect(greatOldOneClairvoyantCombatantUses(20)).toBe(1);
  });

  it('se recharge au repos court, pas au repos long', () => {
    expect(GREAT_OLD_ONE_CLAIRVOYANT_RECHARGE).toBe('court');
  });
});

describe('Patron Archifée — Pas des fées (corrigé depuis la sortie construite)', () => {
  it('suit le modificateur de Charisme (minimum 1) à partir du niveau 3', () => {
    expect(archfeyFeyStepUses(2, 4)).toBe(0);
    expect(archfeyFeyStepUses(3, 4)).toBe(4);
    expect(archfeyFeyStepUses(3, 0)).toBe(1);
    expect(archfeyFeyStepUses(20, -1)).toBe(1);
  });
});
