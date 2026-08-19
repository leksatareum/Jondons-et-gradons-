import { describe, expect, it } from 'vitest';

import { runtimeDamageTaken, shouldResolveDamageTriggeredSaves } from './damage-trigger';

describe('runtime damage trigger', () => {
  it('détecte les dégâts absorbés uniquement par les PV temporaires', () => {
    expect(runtimeDamageTaken({ hp: 20, hpTemp: 8 }, { hp: 20, hpTemp: 3 })).toBe(5);
  });

  it('détecte les dégâts qui traversent les PV temporaires', () => {
    expect(runtimeDamageTaken({ hp: 20, hpTemp: 3 }, { hp: 17, hpTemp: 0 })).toBe(6);
  });

  it('ne confond pas soin ou gain de PV temporaires avec des dégâts', () => {
    expect(runtimeDamageTaken({ hp: 12, hpTemp: 0 }, { hp: 17, hpTemp: 4 })).toBe(0);
  });

  it('ne demande pas de sauvegarde à une cible déjà morte', () => {
    expect(shouldResolveDamageTriggeredSaves(
      { hp: 5, hpTemp: 0, deathStatus: null },
      { hp: 0, hpTemp: 0, deathStatus: 'dead' },
    )).toBe(false);
  });
});
