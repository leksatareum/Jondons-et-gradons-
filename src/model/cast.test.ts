import { describe, expect, it } from 'vitest';
import { spendResource } from './cast';
import { EMPTY_LIVE_STATE, type CharacterSheet } from './character';

const fiche = (over: Partial<CharacterSheet> = {}): CharacterSheet => ({
  id: 'f', name: 'Fixture', speciesId: 'humain', lineageId: null, ancestryId: null, size: null,
  backgroundId: 'sage',
  abilities: { str: 10, dex: 10, con: 14, int: 10, wis: 16, cha: 16 },
  alignment: null,
  classLevels: [{ classId: 'magicien', level: 5, subclass: null, subclassId: null }],
  classChoices: {}, skillProficiencies: [], expertise: [], toolProficiencies: [],
  languages: [], featIds: [], abilityImprovements: [], cantrips: [], spells: [],
  inventory: [], armorId: null, shield: false, gold: 0,
  live: { ...EMPTY_LIVE_STATE, hitDiceSpent: {}, spellSlotsSpent: {}, resourcesSpent: {}, conditions: [] },
  ...over,
});

describe('dépenser la ressource d’une carte jouée', () => {
  it('un sort payé par un emplacement incrémente le compteur de son rang', () => {
    const suivante = spendResource(fiche(), 'emplacement-1');
    expect(suivante.live.spellSlotsSpent).toEqual({ 1: 1 });
  });

  it('un second lancement au même rang s’accumule, sans toucher aux autres rangs', () => {
    const premiere = spendResource(fiche(), 'emplacement-2');
    const seconde = spendResource(premiere, 'emplacement-2');
    const troisieme = spendResource(seconde, 'emplacement-1');
    expect(troisieme.live.spellSlotsSpent).toEqual({ 1: 1, 2: 2 });
  });

  it('la réserve de pacte se dépense à part, jamais confondue avec les emplacements', () => {
    const suivante = spendResource(fiche(), 'pacte');
    expect(suivante.live.pactSlotsSpent).toBe(1);
    expect(suivante.live.spellSlotsSpent).toEqual({});
  });

  it('une ressource nommée (don accordé…) s’accumule sous sa propre clé', () => {
    const premiere = spendResource(fiche(), 'genie-du-desert');
    const seconde = spendResource(premiere, 'genie-du-desert');
    expect(seconde.live.resourcesSpent).toEqual({ 'genie-du-desert': 2 });
  });

  it('ne touche à rien d’autre sur la fiche — ni les décisions, ni le reste de `live`', () => {
    const depart = fiche({ live: { ...fiche().live, damageTaken: 4, temporaryHp: 2 } });
    const suivante = spendResource(depart, 'emplacement-1');
    expect(suivante.live.damageTaken).toBe(4);
    expect(suivante.live.temporaryHp).toBe(2);
    expect(suivante.name).toBe(depart.name);
    expect(suivante.classLevels).toBe(depart.classLevels);
  });
});
