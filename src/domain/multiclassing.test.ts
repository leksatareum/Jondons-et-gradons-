import { describe, expect, it } from 'vitest';
import {
  advanceClassLevel,
  canEnterNewClass,
  cantripScalingLevel,
  hitDicePool,
  meetsPrimaryRequirement,
  multiclassAttacksPerAction,
  multiclassCasterLevel,
  multiclassPrerequisiteFailures,
  multiclassSpellSlots,
  pactMagicSlots,
  primaryRequirementLabel,
  totalCharacterLevel,
  type ClassLevel,
} from './multiclassing';

describe('prérequis de multiclassage', () => {
  const abilities = { str: 13, dex: 12, con: 10, int: 10, wis: 14, cha: 8 };

  it('gère les alternatives et les doubles prérequis', () => {
    expect(meetsPrimaryRequirement(abilities, 'guerrier')).toBe(true);
    expect(meetsPrimaryRequirement(abilities, 'moine')).toBe(false);
    expect(primaryRequirementLabel('paladin')).toBe('FOR 13+ et CHA 13+');
  });

  it('exige les caractéristiques de toutes les classes actuelles et de la nouvelle', () => {
    const levels: ClassLevel[] = [{ classId: 'barbare', level: 4 }];
    expect(canEnterNewClass(abilities, levels, 'druide')).toBe(true);
    expect(canEnterNewClass(abilities, levels, 'paladin')).toBe(false);
    expect(multiclassPrerequisiteFailures(abilities, levels, 'paladin')).toEqual(['paladin']);
  });
});

describe('progression multiclassée', () => {
  it('récupère la sous-classe principale des anciennes sauvegardes', async () => {
    const { normalizeClassLevels } = await import('./multiclassing');
    expect(normalizeClassLevels({
      classId: 'guerrier', level: 5, subclass: 'Champion',
      classLevels: [{ classId: 'guerrier', level: 5 }],
    })[0].subclass).toBe('Champion');
  });

  it('sépare le niveau total et les niveaux de classe', () => {
    const levels: ClassLevel[] = [{ classId: 'guerrier', level: 3 }, { classId: 'roublard', level: 2 }];
    expect(totalCharacterLevel(levels)).toBe(5);
    expect(cantripScalingLevel(levels)).toBe(5);
    expect(advanceClassLevel(levels, 'roublard')).toEqual([
      { classId: 'guerrier', level: 3 },
      { classId: 'roublard', level: 3 },
    ]);
  });

  it('regroupe les dés de vie par type', () => {
    expect(hitDicePool([
      { classId: 'clerc', level: 5 },
      { classId: 'paladin', level: 5 },
    ])).toEqual([{ die: 10, max: 5 }, { die: 8, max: 5 }]);
  });

  it("n'additionne pas les Attaques supplémentaires", () => {
    expect(multiclassAttacksPerAction([
      { classId: 'barbare', level: 5 },
      { classId: 'guerrier', level: 11 },
    ], { thirstingBlade: true })).toBe(3);
  });
});

describe('incantation multiclassée', () => {
  it('applique le niveau effectif et les arrondis du tableau multiclassé', () => {
    const levels: ClassLevel[] = [
      { classId: 'rodeur', level: 4 },
      { classId: 'ensorceleur', level: 3 },
    ];
    expect(multiclassCasterLevel(levels)).toBe(5);
    expect(multiclassSpellSlots(levels).map(({ level, max }) => [level, max])).toEqual([[1, 4], [2, 3], [3, 2]]);
  });

  it('compte seulement les tiers-lanceurs qualifiés', () => {
    expect(multiclassCasterLevel([
      { classId: 'guerrier', level: 6, subclassId: 'occulte' },
      { classId: 'roublard', level: 5, subclass: 'Filou arcanique' },
      { classId: 'magicien', level: 2 },
    ])).toBe(5);
    expect(multiclassCasterLevel([{ classId: 'guerrier', level: 12, subclass: 'Champion' }])).toBe(0);
  });

  it('garde la Magie de pacte dans une réserve distincte', () => {
    const levels: ClassLevel[] = [{ classId: 'magicien', level: 3 }, { classId: 'occultiste', level: 5 }];
    expect(multiclassSpellSlots(levels).map(({ level, max }) => [level, max])).toEqual([[1, 4], [2, 2]]);
    expect(pactMagicSlots(levels)).toEqual([{ level: 3, current: 2, max: 2, pact: true }]);
  });
});
