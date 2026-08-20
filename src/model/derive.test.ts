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

describe('compétences — bonus final, maîtrise et Expertise', () => {
  it('une compétence non maîtrisée n’a que le modificateur de caractéristique', () => {
    const derived = deriveCharacter(fiche({
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 16, cha: 10 },
    }));
    const perception = derived.skills.find((skill) => skill.id === 'perception')!;
    expect(perception).toMatchObject({ ability: 'wis', proficient: false, expertise: false, bonus: 3 });
  });

  it('la maîtrise de fond ajoute le bonus de maîtrise, sans qu’il faille la choisir', () => {
    // Fond Sage : Arcanes et Histoire, sans rien ajouter à `skillProficiencies`.
    const derived = deriveCharacter(fiche({
      backgroundId: 'sage',
      abilities: { str: 10, dex: 10, con: 10, int: 14, wis: 10, cha: 10 },
      classLevels: [{ classId: 'occultiste', level: 2, subclass: null, subclassId: null }], // maîtrise +2
    }));
    const arcanes = derived.skills.find((skill) => skill.id === 'arcanes')!;
    expect(arcanes).toMatchObject({ proficient: true, expertise: false, bonus: 4 }); // +2 (INT) +2 (maîtrise)
  });

  it('une maîtrise choisie sur la fiche compte à égalité avec celle du fond', () => {
    const derived = deriveCharacter(fiche({
      skillProficiencies: ['discretion'],
      abilities: { str: 10, dex: 14, con: 10, int: 10, wis: 10, cha: 10 },
    }));
    expect(derived.skills.find((skill) => skill.id === 'discretion')).toMatchObject({ proficient: true, bonus: 4 });
  });

  it('l’Expertise double le bonus de maîtrise, jamais la caractéristique', () => {
    const derived = deriveCharacter(fiche({
      skillProficiencies: ['discretion'], expertise: ['discretion'],
      abilities: { str: 10, dex: 14, con: 10, int: 10, wis: 10, cha: 10 }, // Dex +2
      classLevels: [{ classId: 'occultiste', level: 5, subclass: null, subclassId: null }], // maîtrise +3
    }));
    expect(derived.skills.find((skill) => skill.id === 'discretion')).toMatchObject({
      proficient: true, expertise: true, bonus: 8, // +2 (DEX) + 2×3 (maîtrise doublée)
    });
  });

  it('l’Expertise sans la maîtrise sous-jacente ne double rien — juste le modificateur', () => {
    // Une fiche mal formée ne doit pas produire un bonus fantôme.
    const derived = deriveCharacter(fiche({
      expertise: ['discretion'], // pas dans skillProficiencies
      abilities: { str: 10, dex: 14, con: 10, int: 10, wis: 10, cha: 10 },
    }));
    expect(derived.skills.find((skill) => skill.id === 'discretion')).toMatchObject({
      proficient: false, expertise: false, bonus: 2,
    });
  });

  it('les 18 compétences du PHB sont toutes présentes', () => {
    expect(deriveCharacter(fiche()).skills).toHaveLength(18);
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
