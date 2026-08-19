import { describe, expect, it } from 'vitest';
import {
  druidElementalFuryChoice,
  druidPotentSpellcastingDamageFormula,
  druidPotentSpellcastingRangeLabel,
  druidPrimalStrikeAvailable,
  druidPrimalStrikeDamage,
  normalizeDruidElementalDamageType,
} from './druid-elemental-fury';

const druid = (level: number, choice: 'frappe-primordiale' | 'incantation-puissante', wis = 18) => ({
  classId: 'druide',
  level,
  classLevels: [{ classId: 'druide', level }],
  classSelections: { druide: { elementalFury: choice } },
  abilities: { wis },
  turn: {},
});

describe('Druide · Fureur élémentaire PHB 2024', () => {
  it('ne s’active qu’au niveau 7 et conserve le choix stocké', () => {
    expect(druidElementalFuryChoice(druid(6, 'frappe-primordiale'))).toBeNull();
    expect(druidElementalFuryChoice(druid(7, 'frappe-primordiale'))).toBe('frappe-primordiale');
    expect(druidElementalFuryChoice(druid(7, 'incantation-puissante'))).toBe('incantation-puissante');
  });

  it('Frappe primordiale passe de 1d8 à 2d8 au niveau 15 et reste une fois par tour', () => {
    expect(druidPrimalStrikeDamage(druid(7, 'frappe-primordiale'))).toBe('1d8');
    expect(druidPrimalStrikeDamage(druid(15, 'frappe-primordiale'))).toBe('2d8');
    expect(druidPrimalStrikeAvailable(druid(15, 'frappe-primordiale'))).toBe(true);
    expect(druidPrimalStrikeAvailable({ ...druid(15, 'frappe-primordiale'), turn: { primalStrikeUsed: true } })).toBe(false);
  });

  it('Incantation puissante ajoute le modificateur de SAG uniquement aux cantrips de Druide', () => {
    const caster = druid(7, 'incantation-puissante', 18);
    const cantrip = { lv: 0, r: '18 m' };
    expect(druidPotentSpellcastingDamageFormula(caster, cantrip, 'druide', '2d8')).toBe('2d8+4');
    expect(druidPotentSpellcastingDamageFormula(caster, cantrip, 'clerc', '2d8')).toBe('2d8');
    expect(druidPotentSpellcastingDamageFormula(caster, { lv: 1, r: '18 m' }, 'druide', '2d8')).toBe('2d8');
  });

  it('Incantation puissante améliorée ajoute 90 m à une portée de cantrip d’au moins 3 m', () => {
    const caster = druid(15, 'incantation-puissante');
    expect(druidPotentSpellcastingRangeLabel(caster, { lv: 0, r: '18 m' }, 'druide')).toBe('108 m');
    expect(druidPotentSpellcastingRangeLabel(caster, { lv: 0, r: '3 m' }, 'druide')).toBe('93 m');
    expect(druidPotentSpellcastingRangeLabel(caster, { lv: 0, r: 'Contact' }, 'druide')).toBe('Contact');
    expect(druidPotentSpellcastingRangeLabel(druid(14, 'incantation-puissante'), { lv: 0, r: '18 m' }, 'druide')).toBe('18 m');
  });

  it('normalise uniquement les quatre types élémentaires autorisés', () => {
    expect(normalizeDruidElementalDamageType('Foudre')).toBe('foudre');
    expect(normalizeDruidElementalDamageType('FEU')).toBe('feu');
    expect(normalizeDruidElementalDamageType('acide')).toBeNull();
  });
});
