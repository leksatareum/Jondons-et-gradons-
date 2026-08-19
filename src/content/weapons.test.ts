import { describe, expect, it } from 'vitest';
import { WEAPON_MASTERIES, WEAPON_PRICES, WEAPONS, weaponById, weaponPriceGp } from './weapons';

describe('catalogue des armes — SRD 5.2 + maîtrises PHB 2024', () => {
  it('trente-huit armes, ids uniques', () => {
    expect(WEAPONS).toHaveLength(38);
    expect(new Set(WEAPONS.map((weapon) => weapon.id)).size).toBe(38);
  });

  it('chaque arme référence une maîtrise connue', () => {
    for (const weapon of WEAPONS) {
      expect(WEAPON_MASTERIES).toHaveProperty(weapon.mastery);
    }
  });

  it('les huit maîtrises sont représentées', () => {
    const used = new Set(WEAPONS.map((weapon) => weapon.mastery));
    expect(used.size).toBe(8);
  });

  it('toute entrée de WEAPON_PRICES correspond à une arme existante', () => {
    for (const id of Object.keys(WEAPON_PRICES)) {
      expect(weaponById(id)).toBeDefined();
    }
  });

  it('weaponPriceGp lit le champ cost en priorité, sinon la table de prix', () => {
    expect(weaponPriceGp('mousquet')).toBe(500);
    expect(weaponPriceGp('epeelongue')).toBe(15);
  });

  it('les armes finesse sont bien marquées', () => {
    expect(weaponById('rapiere')?.finesse).toBe(true);
    expect(weaponById('massue')?.finesse).toBeUndefined();
  });
});
