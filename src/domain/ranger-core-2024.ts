export type RangerCoreCharacter = {
  level?: number;
  classId?: string;
  classLevels?: Array<{ classId?: string; id?: string; level?: number; subclass?: string | null }>;
  abilities?: Record<string, number>;
  exhaustion?: number;
  conditions?: Array<{ label?: string; detail?: string }>;
  hunterMarkTarget?: string | null;
  [key: string]: unknown;
};

const normalize = (value: unknown): string => String(value || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('fr');

export const rangerCoreLevel = (character: RangerCoreCharacter): number => {
  const entry = (character.classLevels || []).find((candidate) => (candidate.classId || candidate.id) === 'rodeur');
  if (entry) return Math.max(0, Math.floor(Number(entry.level) || 0));
  return character.classId === 'rodeur' ? Math.max(0, Math.floor(Number(character.level) || 0)) : 0;
};

export const rangerWisdomModifier = (character: RangerCoreCharacter): number =>
  Math.floor((Number(character.abilities?.wis ?? 10) - 10) / 2);

export const tirelessMaxUses = (character: RangerCoreCharacter): number =>
  rangerCoreLevel(character) >= 10 ? Math.max(1, rangerWisdomModifier(character)) : 0;

export const applyRangerTirelessShortRest = <T extends RangerCoreCharacter>(character: T): T => {
  if (rangerCoreLevel(character) < 10 || Number(character.exhaustion || 0) <= 0) return character;
  return { ...character, exhaustion: Math.max(0, Number(character.exhaustion || 0) - 1) };
};

export const isHuntersMarkConcentration = (character: RangerCoreCharacter, detail?: string | null): boolean => {
  const concentration = detail ?? (character.conditions || []).find((condition) => condition.label === 'Concentration')?.detail;
  return /marque du chasseur|hunter.?s mark/i.test(String(concentration || ''));
};

export const relentlessHunterProtectsConcentration = (character: RangerCoreCharacter, detail?: string | null): boolean =>
  rangerCoreLevel(character) >= 13 && isHuntersMarkConcentration(character, detail);

export const hunterMarkActiveOnTarget = (character: RangerCoreCharacter, targetName: string): boolean => {
  if (!isHuntersMarkConcentration(character)) return false;
  const stored = normalize(character.hunterMarkTarget);
  const target = normalize(targetName);
  return !!stored && !!target && stored === target;
};

export const hunterMarkDamageDie = (character: RangerCoreCharacter): '1d6' | '1d10' =>
  rangerCoreLevel(character) >= 20 ? '1d10' : '1d6';

export const hunterMarkDamageFormula = (character: RangerCoreCharacter, targetName: string, baseFormula: string): string =>
  hunterMarkActiveOnTarget(character, targetName) ? `${baseFormula}+${hunterMarkDamageDie(character)}` : baseFormula;

export const preciseHunterApplies = (character: RangerCoreCharacter, targetName: string): boolean =>
  rangerCoreLevel(character) >= 17 && hunterMarkActiveOnTarget(character, targetName);

export const feralSensesRangeMeters = (character: RangerCoreCharacter): number =>
  rangerCoreLevel(character) >= 18 ? 9 : 0;
