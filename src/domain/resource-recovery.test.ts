import { describe, expect, it } from 'vitest';
import { currentAfterShortRest, restoresOnLongRest } from './resource-recovery';

describe('récupération des ressources 2024', () => {
  it('rend une seule utilisation aux réserves à récupération partielle', () => {
    expect(currentAfterShortRest(0, 4, { recharge: 'long', shortRecovery: 1 }, 10)).toBe(1);
    expect(currentAfterShortRest(3, 4, { recharge: 'long', shortRecovery: 1 }, 10)).toBe(4);
  });

  it("n'active la récupération courte de l'Inspiration bardique qu'au niveau 5", () => {
    const fontOfInspiration = { recharge: 'long' as const, shortRecovery: 'all' as const, shortRecoveryFrom: 5 };
    expect(currentAfterShortRest(0, 4, fontOfInspiration, 4)).toBe(0);
    expect(currentAfterShortRest(0, 4, fontOfInspiration, 5)).toBe(4);
  });

  it('considère qu’une recharge courte revient aussi au repos long', () => {
    expect(restoresOnLongRest('court')).toBe(true);
    expect(restoresOnLongRest('long')).toBe(true);
    expect(restoresOnLongRest('initiative')).toBe(false);
  });
});
