import { describe, expect, it } from 'vitest';
import { activateStarryForm, activateWrathOfSea } from './druid-level3-subclasses';
import { druidConditionImmune, druidDynamicResistances, withDruidDynamicDamageProfile } from './druid-dynamic-defenses';
import { resolveDamageAmount } from './damage';

const base = (level: number, subclass: string) => ({
  classId: 'druide',
  level,
  subclass,
  classLevels: [{ classId: 'druide', level, subclass }],
  abilities: { wis: 18 },
  resources: [{ name: 'Forme sauvage', current: 4, max: 4 }],
  conditions: [],
  resistances: [],
});

describe('Cercles druidiques · défenses dynamiques', () => {
  it('Garde de la nature applique la résistance du terrain et immunise contre Empoisonné', () => {
    const land = { ...base(10, 'Cercle de la Terre'), circleLandType: 'arid' as const };
    expect(druidDynamicResistances(land)).toContain('feu');
    expect(druidConditionImmune(land, 'Empoisonné')).toBe(true);
    expect(druidConditionImmune(land, 'Charmé')).toBe(false);
    expect(resolveDamageAmount(withDruidDynamicDamageProfile(land), 11, 'feu').final).toBe(5);
  });

  it('Né de la tempête applique froid, foudre et tonnerre uniquement pendant Courroux de la mer', () => {
    const sea = base(10, 'Cercle de la Mer');
    expect(druidDynamicResistances(sea)).toEqual([]);
    const active = activateWrathOfSea(sea);
    expect(druidDynamicResistances(active)).toEqual(expect.arrayContaining(['froid', 'foudre', 'tonnerre']));
    expect(resolveDamageAmount(withDruidDynamicDamageProfile(active), 10, 'foudre').final).toBe(5);
  });

  it('Plein d’étoiles applique les trois résistances physiques seulement en Forme étoilée', () => {
    const stars = base(14, 'Cercle des Étoiles');
    expect(druidDynamicResistances(stars)).toEqual([]);
    const active = activateStarryForm(stars, 'dragon');
    expect(druidDynamicResistances(active)).toEqual(expect.arrayContaining(['contondants', 'perforants', 'tranchants']));
    expect(resolveDamageAmount(withDruidDynamicDamageProfile(active), 9, 'tranchants').final).toBe(4);
  });

  it('fusionne les résistances dynamiques avec celles déjà possédées', () => {
    const stars = activateStarryForm({ ...base(14, 'Cercle des Étoiles'), resistances: ['feu'] }, 'archer');
    expect(withDruidDynamicDamageProfile(stars).resistances).toEqual(expect.arrayContaining(['feu', 'contondants', 'perforants', 'tranchants']));
  });
});
