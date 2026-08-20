import { describe, expect, it } from 'vitest';
import { deriveCharacter } from './derive';
import { EMPTY_LIVE_STATE, type CharacterSheet } from './character';

const fiche = (over: Partial<CharacterSheet> = {}): CharacterSheet => ({
  id: 'f', name: 'Fixture', speciesId: 'humain', lineageId: null, ancestryId: null, size: null,
  backgroundId: 'sage',
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  alignment: null,
  classLevels: [{ classId: 'occultiste', level: 2, subclass: null, subclassId: null }],
  classChoices: {}, skillProficiencies: [], expertise: [], toolProficiencies: [],
  languages: [], featIds: [], abilityImprovements: [], cantrips: [], spells: [],
  inventory: [], armorId: null, shield: false, gold: 0,
  live: { ...EMPTY_LIVE_STATE, hitDiceSpent: {}, spellSlotsSpent: {}, resourcesSpent: {}, conditions: [] },
  ...over,
});

describe('DD de sauvegarde et bonus d’attaque de sort', () => {
  it('dérive les deux nombres depuis la caractéristique de la classe', () => {
    const derived = deriveCharacter(fiche({
      abilities: { str: 8, dex: 10, con: 14, int: 15, wis: 13, cha: 15 },
    }));
    // Charisme 15 (+2), maîtrise +2 au niveau 2.
    expect(derived.spellcasting.numbers.occultiste).toEqual({
      ability: 'cha', saveDc: 12, attackBonus: 4,
    });
  });

  it('un multiclassé garde un jeu de nombres par classe', () => {
    const derived = deriveCharacter(fiche({
      abilities: { str: 8, dex: 10, con: 14, int: 10, wis: 16, cha: 18 },
      classLevels: [
        { classId: 'occultiste', level: 2, subclass: null, subclassId: null },
        { classId: 'druide', level: 1, subclass: null, subclassId: null },
      ],
    }));
    // Maîtrise +2 (niveau total 3). Charisme +4, Sagesse +3.
    expect(derived.spellcasting.numbers.occultiste.saveDc).toBe(14);
    expect(derived.spellcasting.numbers.druide.saveDc).toBe(13);
    expect(derived.spellcasting.numbers.occultiste.ability).toBe('cha');
    expect(derived.spellcasting.numbers.druide.ability).toBe('wis');
  });

  it('une classe sans magie ne produit aucun nombre', () => {
    const derived = deriveCharacter(fiche({
      classLevels: [{ classId: 'roublard', level: 3, subclass: null, subclassId: null }],
    }));
    expect(derived.spellcasting.numbers).toEqual({});
  });
});

describe('sorts préparables — lus dans la table, pas calculés', () => {
  it('la caractéristique d’incantation ne change pas le nombre', () => {
    const faible = deriveCharacter(fiche({
      classLevels: [{ classId: 'druide', level: 2, subclass: null, subclassId: null }],
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 6, cha: 10 },
    }));
    const fort = deriveCharacter(fiche({
      classLevels: [{ classId: 'druide', level: 2, subclass: null, subclassId: null }],
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 20, cha: 10 },
    }));
    expect(faible.spellcasting.preparedMax.druide).toBe(5);
    expect(fort.spellcasting.preparedMax.druide).toBe(5);
    // Elle change bien le DD, en revanche.
    expect(fort.spellcasting.numbers.druide.saveDc)
      .toBeGreaterThan(faible.spellcasting.numbers.druide.saveDc);
  });
});
