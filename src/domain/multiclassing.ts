export const CLASS_IDS = [
  'barbare', 'barde', 'clerc', 'druide', 'guerrier', 'moine',
  'paladin', 'rodeur', 'roublard', 'ensorceleur', 'occultiste', 'magicien',
] as const;

export type ClassId = typeof CLASS_IDS[number];
export type AbilityId = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export type AbilityScores = Partial<Record<AbilityId, number>>;

export type ClassLevel = {
  classId: ClassId;
  level: number;
  subclass?: string | null;
  subclassId?: string | null;
};

export type MulticlassProficiencies = {
  hitDie: true;
  armor: string[];
  shield: boolean;
  weapons: 'martial' | null;
  skills: { count: number; from: 'any' | 'class' | null };
  tools: string[];
};

type Requirement = AbilityId[];

/**
 * Chaque groupe représente une alternative. Tous les groupes doivent être
 * satisfaits : le Guerrier exige FOR ou DEX, le Moine exige DEX et SAG.
 */
export const PRIMARY_ABILITY_REQUIREMENTS: Record<ClassId, Requirement[]> = {
  barbare: [['str']],
  barde: [['cha']],
  clerc: [['wis']],
  druide: [['wis']],
  guerrier: [['str', 'dex']],
  moine: [['dex'], ['wis']],
  paladin: [['str'], ['cha']],
  rodeur: [['dex'], ['wis']],
  roublard: [['dex']],
  ensorceleur: [['cha']],
  occultiste: [['cha']],
  magicien: [['int']],
};

export const CLASS_HIT_DICE: Record<ClassId, number> = {
  barbare: 12,
  guerrier: 10,
  paladin: 10,
  rodeur: 10,
  barde: 8,
  clerc: 8,
  druide: 8,
  moine: 8,
  roublard: 8,
  occultiste: 8,
  ensorceleur: 6,
  magicien: 6,
};

const noExtraTraining = (): MulticlassProficiencies => ({
  hitDie: true,
  armor: [],
  shield: false,
  weapons: null,
  skills: { count: 0, from: null },
  tools: [],
});

/** Entraînements reçus au premier niveau pris dans une nouvelle classe. */
export const MULTICLASS_PROFICIENCIES: Record<ClassId, MulticlassProficiencies> = {
  barbare: { ...noExtraTraining(), weapons: 'martial', armor: ['Légère', 'Intermédiaire'], shield: true },
  barde: { ...noExtraTraining(), armor: ['Légère'], skills: { count: 1, from: 'any' }, tools: ['Instrument de musique au choix'] },
  clerc: { ...noExtraTraining(), armor: ['Légère', 'Intermédiaire'], shield: true },
  druide: { ...noExtraTraining(), armor: ['Légère'], shield: true },
  guerrier: { ...noExtraTraining(), weapons: 'martial', armor: ['Légère', 'Intermédiaire'], shield: true },
  moine: noExtraTraining(),
  paladin: { ...noExtraTraining(), weapons: 'martial', armor: ['Légère', 'Intermédiaire'], shield: true },
  rodeur: { ...noExtraTraining(), weapons: 'martial', armor: ['Légère', 'Intermédiaire'], shield: true, skills: { count: 1, from: 'class' } },
  roublard: { ...noExtraTraining(), armor: ['Légère'], skills: { count: 1, from: 'class' }, tools: ['Outils de voleur'] },
  ensorceleur: noExtraTraining(),
  occultiste: { ...noExtraTraining(), armor: ['Légère'] },
  magicien: noExtraTraining(),
};

export const MULTICLASS_SPELL_SLOTS = [
  [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1],
] as const;

export const PACT_MAGIC_SLOTS = [
  { count: 1, level: 1 }, { count: 2, level: 1 }, { count: 2, level: 2 }, { count: 2, level: 2 },
  { count: 2, level: 3 }, { count: 2, level: 3 }, { count: 2, level: 4 }, { count: 2, level: 4 },
  { count: 2, level: 5 }, { count: 2, level: 5 }, { count: 3, level: 5 }, { count: 3, level: 5 },
  { count: 3, level: 5 }, { count: 3, level: 5 }, { count: 3, level: 5 }, { count: 3, level: 5 },
  { count: 4, level: 5 }, { count: 4, level: 5 }, { count: 4, level: 5 }, { count: 4, level: 5 },
] as const;

export type SlotPool = { level: number; current: number; max: number; pact?: true };

const boundedLevel = (level: number): number => Math.max(0, Math.min(20, Math.trunc(level || 0)));

export function normalizeClassLevels(input: {
  classId?: string | null;
  level?: number | null;
  subclass?: string | null;
  classLevels?: Array<Partial<ClassLevel>> | null;
}): ClassLevel[] {
  const byClass = new Map<ClassId, ClassLevel>();

  for (const entry of input.classLevels || []) {
    if (!entry.classId || !CLASS_IDS.includes(entry.classId as ClassId)) continue;
    const classId = entry.classId as ClassId;
    const level = boundedLevel(entry.level || 0);
    if (!level) continue;
    const previous = byClass.get(classId);
    byClass.set(classId, {
      classId,
      level: Math.min(20, level + (previous?.level || 0)),
      subclass: entry.subclass ?? previous?.subclass ?? null,
      subclassId: entry.subclassId ?? previous?.subclassId ?? null,
    });
  }

  if (byClass.size === 0 && input.classId && CLASS_IDS.includes(input.classId as ClassId)) {
    byClass.set(input.classId as ClassId, {
      classId: input.classId as ClassId,
      level: Math.max(1, boundedLevel(input.level || 1)),
      subclass: input.subclass || null,
      subclassId: null,
    });
  } else if (input.classId && CLASS_IDS.includes(input.classId as ClassId) && input.subclass) {
    const primary = byClass.get(input.classId as ClassId);
    if (primary && !primary.subclass) {
      byClass.set(input.classId as ClassId, { ...primary, subclass: input.subclass });
    }
  }

  return Array.from(byClass.values());
}

export const totalCharacterLevel = (levels: ClassLevel[]): number =>
  Math.min(20, levels.reduce((total, entry) => total + boundedLevel(entry.level), 0));

export const classLevelOf = (levels: ClassLevel[], classId: ClassId): number =>
  levels.find((entry) => entry.classId === classId)?.level || 0;

export function advanceClassLevel(levels: ClassLevel[], classId: ClassId): ClassLevel[] {
  if (totalCharacterLevel(levels) >= 20) return levels.map((entry) => ({ ...entry }));
  const exists = levels.some((entry) => entry.classId === classId);
  return exists
    ? levels.map((entry) => entry.classId === classId ? { ...entry, level: entry.level + 1 } : { ...entry })
    : [...levels.map((entry) => ({ ...entry })), { classId, level: 1, subclass: null, subclassId: null }];
}

export function meetsPrimaryRequirement(abilities: AbilityScores, classId: ClassId): boolean {
  return PRIMARY_ABILITY_REQUIREMENTS[classId].every((alternatives) =>
    alternatives.some((ability) => (abilities[ability] || 0) >= 13));
}

export function primaryRequirementLabel(classId: ClassId): string {
  const labels: Record<AbilityId, string> = {
    str: 'FOR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'SAG', cha: 'CHA',
  };
  return PRIMARY_ABILITY_REQUIREMENTS[classId]
    .map((alternatives) => `${alternatives.map((ability) => labels[ability]).join(' ou ')} 13+`)
    .join(' et ');
}

export function canEnterNewClass(abilities: AbilityScores, levels: ClassLevel[], targetClassId: ClassId): boolean {
  if (classLevelOf(levels, targetClassId) > 0 || totalCharacterLevel(levels) >= 20) return false;
  return levels.every((entry) => meetsPrimaryRequirement(abilities, entry.classId))
    && meetsPrimaryRequirement(abilities, targetClassId);
}

export function multiclassPrerequisiteFailures(
  abilities: AbilityScores,
  levels: ClassLevel[],
  targetClassId: ClassId,
): ClassId[] {
  const relevant = [...levels.map((entry) => entry.classId), targetClassId];
  return [...new Set(relevant)].filter((classId) => !meetsPrimaryRequirement(abilities, classId));
}

export function hitDicePool(levels: ClassLevel[]): Array<{ die: number; max: number }> {
  const dice = new Map<number, number>();
  for (const entry of levels) {
    const die = CLASS_HIT_DICE[entry.classId];
    dice.set(die, (dice.get(die) || 0) + entry.level);
  }
  return Array.from(dice, ([die, max]) => ({ die, max })).sort((left, right) => right.die - left.die);
}

const isEldritchKnight = (entry: ClassLevel): boolean =>
  entry.classId === 'guerrier' && (
    entry.subclassId === 'occulte'
    || /chevalier\s+occulte/i.test(entry.subclass || '')
    || /eldritch\s+knight/i.test(entry.subclass || '')
  );

const isArcaneTrickster = (entry: ClassLevel): boolean =>
  entry.classId === 'roublard' && (
    entry.subclassId === 'arcane'
    || /filou\s+arcanique/i.test(entry.subclass || '')
    || /arcane\s+trickster/i.test(entry.subclass || '')
  );

export function multiclassCasterLevel(levels: ClassLevel[]): number {
  const full = levels
    .filter((entry) => ['barde', 'clerc', 'druide', 'ensorceleur', 'magicien'].includes(entry.classId))
    .reduce((total, entry) => total + entry.level, 0);
  const half = levels
    .filter((entry) => entry.classId === 'paladin' || entry.classId === 'rodeur')
    .reduce((total, entry) => total + entry.level, 0);
  const third = levels
    .filter((entry) => isEldritchKnight(entry) || isArcaneTrickster(entry))
    .reduce((total, entry) => total + entry.level, 0);
  return Math.min(20, full + Math.ceil(half / 2) + Math.floor(third / 3));
}

export function multiclassSpellSlots(levels: ClassLevel[]): SlotPool[] {
  const casterLevel = multiclassCasterLevel(levels);
  if (casterLevel < 1) return [];
  return MULTICLASS_SPELL_SLOTS[casterLevel - 1]
    .map((max, index) => ({ level: index + 1, current: max, max }));
}

export function pactMagicSlots(levels: ClassLevel[]): SlotPool[] {
  const warlockLevel = classLevelOf(levels, 'occultiste');
  if (warlockLevel < 1) return [];
  const pact = PACT_MAGIC_SLOTS[warlockLevel - 1];
  return [{ level: pact.level, current: pact.count, max: pact.count, pact: true }];
}

export function attacksPerActionForClass(classId: ClassId, level: number): number {
  if (classId === 'guerrier') return level >= 20 ? 4 : level >= 11 ? 3 : level >= 5 ? 2 : 1;
  if (['barbare', 'moine', 'paladin', 'rodeur'].includes(classId)) return level >= 5 ? 2 : 1;
  return 1;
}

/** Les différentes sources d'Attaque supplémentaire ne s'additionnent pas. */
export function multiclassAttacksPerAction(
  levels: ClassLevel[],
  options: { thirstingBlade?: boolean; valorBard?: boolean } = {},
): number {
  const classMaximum = levels.reduce(
    (maximum, entry) => Math.max(maximum, attacksPerActionForClass(entry.classId, entry.level)),
    1,
  );
  const thirstingBlade = options.thirstingBlade && classLevelOf(levels, 'occultiste') >= 5 ? 2 : 1;
  const valorBard = options.valorBard && classLevelOf(levels, 'barde') >= 6 ? 2 : 1;
  return Math.max(classMaximum, thirstingBlade, valorBard);
}

/** La progression des sorts mineurs dépend du niveau total du personnage. */
export const cantripScalingLevel = (levels: ClassLevel[]): number => totalCharacterLevel(levels);
