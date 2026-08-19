import { describe, expect, it } from 'vitest';
import { ARMOR_PRICES, ARMORS, SHIELD, armorById, armorClassFor, armorTiming } from './armor';

describe('catalogue des armures — SRD 5.2', () => {
  it('treize entrées (Sans armure incluse), ids uniques', () => {
    expect(ARMORS).toHaveLength(13);
    expect(new Set(ARMORS.map((armor) => armor.id)).size).toBe(13);
  });

  it('toute entrée de ARMOR_PRICES correspond à une armure existante', () => {
    for (const id of Object.keys(ARMOR_PRICES)) {
      expect(armorById(id)).toBeDefined();
    }
  });

  it('le Bouclier donne +2 à la CA', () => {
    expect(SHIELD.bonus).toBe(2);
  });
});

describe('classe d’armure effective', () => {
  it('armure légère : la Dextérité s’ajoute sans plafond', () => {
    expect(armorClassFor(armorById('cuir')!, 5)).toBe(16);
  });
  it('armure intermédiaire : la Dextérité est plafonnée à +2', () => {
    expect(armorClassFor(armorById('cuirasse')!, 5)).toBe(16);
    expect(armorClassFor(armorById('cuirasse')!, 1)).toBe(15);
  });
  it('armure lourde : la Dextérité ne s’ajoute pas', () => {
    expect(armorClassFor(armorById('mailles')!, 5)).toBe(16);
  });
});

describe('temps pour enfiler/retirer — vérifié PHB 2024', () => {
  it('légère : une minute dans les deux sens', () => {
    expect(armorTiming(armorById('cuir')!)).toEqual({ don: '1 minute', doff: '1 minute' });
  });
  it('intermédiaire : cinq minutes pour enfiler, une pour retirer', () => {
    expect(armorTiming(armorById('cuirasse')!)).toEqual({ don: '5 minutes', doff: '1 minute' });
  });
  it('lourde : dix minutes pour enfiler, cinq pour retirer', () => {
    expect(armorTiming(armorById('plates')!)).toEqual({ don: '10 minutes', doff: '5 minutes' });
  });
});
