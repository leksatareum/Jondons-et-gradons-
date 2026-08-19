import { describe, expect, it } from 'vitest';
import { ancestryOf, lineageOf, speciesById, speciesMagicFor, speciesResistancesFor, SPECIES } from './species';

describe('les dix espèces du PHB 2024', () => {
  it('dix espèces, ids uniques', () => {
    expect(SPECIES).toHaveLength(10);
    expect(new Set(SPECIES.map((species) => species.id)).size).toBe(10);
  });

  it('speciesById retrouve une espèce par id', () => {
    expect(speciesById('nain')?.darkvision).toBe(36);
    expect(speciesById('inexistant')).toBeUndefined();
  });
});

describe('lignages et ascendances', () => {
  it('un Drakéide a une résistance liée à son ascendance', () => {
    expect(ancestryOf('drakeide', 'rouge')?.damage).toBe('feu');
    expect(speciesResistancesFor('drakeide', null, 'rouge')).toEqual(['feu']);
  });

  it('un Tieffelin de legs infernal résiste au feu et connaît Trait de feu dès le niveau 1', () => {
    expect(lineageOf('tieffelin', 'infernal')?.resistance).toBe('feu');
    const magic = speciesMagicFor('tieffelin', 'infernal', 1);
    expect(magic.cantrips).toContain('thaumaturgie');
    expect(magic.cantrips).toContain('trait-feu');
    expect(magic.spells).toEqual([]);
  });

  it('les sorts de lignage n’apparaissent qu’à partir de leur niveau minimum', () => {
    const auNiveau2 = speciesMagicFor('tieffelin', 'infernal', 2).spells;
    const auNiveau3 = speciesMagicFor('tieffelin', 'infernal', 3).spells;
    const auNiveau5 = speciesMagicFor('tieffelin', 'infernal', 5).spells;
    expect(auNiveau2).toEqual([]);
    expect(auNiveau3).toEqual(['represailles-infernales']);
    expect(auNiveau5).toEqual(['represailles-infernales', 'tenebres']);
  });
});
