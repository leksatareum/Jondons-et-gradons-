import {
  hunterMarkActiveOnTarget,
  hunterMarkDamageDie,
  rangerCoreLevel,
  rangerWisdomModifier,
  type RangerCoreCharacter,
} from './ranger-core-2024';

export type RangerSubclassCharacter = RangerCoreCharacter & {
  subclass?: string | null;
  classLevels?: Array<{ classId?: string; id?: string; level?: number; subclass?: string | null }>;
  classSelections?: Record<string, Record<string, unknown>>;
  classChoices?: Record<string, unknown>;
  turn?: Record<string, unknown>;
};

export type RangerSubclassId = 'beast-master' | 'fey-wanderer' | 'gloom-stalker' | 'hunter';

const normalize = (value: unknown): string => String(value || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('fr');

export const rangerSubclassName = (character: RangerSubclassCharacter): string => {
  const entry = (character.classLevels || []).find((candidate) => (candidate.classId || candidate.id) === 'rodeur');
  return String(entry?.subclass || (character.classId === 'rodeur' ? character.subclass : '') || '');
};

export const rangerSubclassId = (character: RangerSubclassCharacter): RangerSubclassId | null => {
  const value = normalize(rangerSubclassName(character));
  if (/maitre des betes|beast master|bestial/.test(value)) return 'beast-master';
  if (/vagabond feerique|fey wanderer|feerique/.test(value)) return 'fey-wanderer';
  if (/traqueur des tenebres|gloom stalker|tenebres/.test(value)) return 'gloom-stalker';
  if (/chasseur|hunter/.test(value)) return 'hunter';
  return null;
};

const hasSubclassAt = (character: RangerSubclassCharacter, subclass: RangerSubclassId, level: number): boolean =>
  rangerCoreLevel(character) >= level && rangerSubclassId(character) === subclass;

// Beast Master
export const beastMasterStrikeCount = (character: RangerSubclassCharacter): number => {
  if (!hasSubclassAt(character, 'beast-master', 3)) return 0;
  return rangerCoreLevel(character) >= 11 ? 2 : 1;
};

export const beastMasterMarkedTargetForceBonus = (
  character: RangerSubclassCharacter,
  targetName: string,
  alreadyUsedThisTurn = Boolean(character.turn?.beastMasterHunterMarkUsed),
): '1d6' | '1d10' | null => {
  if (!hasSubclassAt(character, 'beast-master', 11) || alreadyUsedThisTurn) return null;
  return hunterMarkActiveOnTarget(character, targetName) ? hunterMarkDamageDie(character) : null;
};

export const beastMasterShareSelfSpellRangeMeters = (character: RangerSubclassCharacter): number =>
  hasSubclassAt(character, 'beast-master', 15) ? 9 : 0;

// Fey Wanderer
export const feyDreadfulStrikeDie = (character: RangerSubclassCharacter): '1d4' | '1d6' | null => {
  if (!hasSubclassAt(character, 'fey-wanderer', 3)) return null;
  return rangerCoreLevel(character) >= 11 ? '1d6' : '1d4';
};

export const feyOtherworldlyGlamourBonus = (character: RangerSubclassCharacter): number =>
  hasSubclassAt(character, 'fey-wanderer', 3) ? Math.max(1, rangerWisdomModifier(character)) : 0;

export const feyBeguilingTwistRangeMeters = (character: RangerSubclassCharacter): number =>
  hasSubclassAt(character, 'fey-wanderer', 7) ? 36 : 0;

export const feyReinforcements = (character: RangerSubclassCharacter) => hasSubclassAt(character, 'fey-wanderer', 11)
  ? { freeCastsPerLongRest: 1, materialComponentRequired: false, concentrationCanBeRemoved: true, concentrationlessDurationRounds: 10 }
  : null;

export const mistyWandererFreeUses = (character: RangerSubclassCharacter): number =>
  hasSubclassAt(character, 'fey-wanderer', 15) ? Math.max(1, rangerWisdomModifier(character)) : 0;

export const mistyWandererPassengerRangeMeters = (character: RangerSubclassCharacter): number =>
  hasSubclassAt(character, 'fey-wanderer', 15) ? 1.5 : 0;

// Gloom Stalker
export const gloomInitiativeModifier = (character: RangerSubclassCharacter): number =>
  hasSubclassAt(character, 'gloom-stalker', 3) ? rangerWisdomModifier(character) : 0;

export const gloomFirstTurnSpeedBonusMeters = (character: RangerSubclassCharacter): number =>
  hasSubclassAt(character, 'gloom-stalker', 3) ? 3 : 0;

export const gloomDreadfulStrike = (character: RangerSubclassCharacter) => {
  if (!hasSubclassAt(character, 'gloom-stalker', 3)) return null;
  return {
    damage: rangerCoreLevel(character) >= 11 ? '2d8' as const : '2d6' as const,
    maxUses: Math.max(1, rangerWisdomModifier(character)),
    oncePerTurn: true,
  };
};

export const gloomDarkvisionRangeMeters = (character: RangerSubclassCharacter, currentRangeMeters = 0): number => {
  if (!hasSubclassAt(character, 'gloom-stalker', 3)) return Math.max(0, currentRangeMeters);
  return currentRangeMeters > 0 ? currentRangeMeters + 18 : 18;
};

export const gloomIronMindOptions = (
  character: RangerSubclassCharacter,
  alreadyHasWisdomSaveProficiency: boolean,
): Array<'wis' | 'int' | 'cha'> => {
  if (!hasSubclassAt(character, 'gloom-stalker', 7)) return [];
  return alreadyHasWisdomSaveProficiency ? ['int', 'cha'] : ['wis'];
};

export const gloomStalkersFlurry = (character: RangerSubclassCharacter) => hasSubclassAt(character, 'gloom-stalker', 11)
  ? { suddenStrikeSecondaryDistanceMeters: 1.5, massFearRadiusMeters: 3, frightenedUntilStartOfNextTurn: true }
  : null;

export const shadowyDodgeTeleportMeters = (character: RangerSubclassCharacter): number =>
  hasSubclassAt(character, 'gloom-stalker', 15) ? 9 : 0;

// Hunter
export const hunterDefensiveTactics = (character: RangerSubclassCharacter): Array<'escape-the-horde' | 'multiattack-defense'> =>
  hasSubclassAt(character, 'hunter', 7) ? ['escape-the-horde', 'multiattack-defense'] : [];

export const hunterSuperiorPreySecondaryRangeMeters = (character: RangerSubclassCharacter): number =>
  hasSubclassAt(character, 'hunter', 11) ? 9 : 0;

export const hunterSuperiorPreyBonus = (
  character: RangerSubclassCharacter,
  markedTargetName: string,
  alreadyUsedThisTurn = Boolean(character.turn?.hunterSuperiorPreyUsed),
): '1d6' | '1d10' | null => {
  if (!hasSubclassAt(character, 'hunter', 11) || alreadyUsedThisTurn) return null;
  return hunterMarkActiveOnTarget(character, markedTargetName) ? hunterMarkDamageDie(character) : null;
};

export const hunterSuperiorDefenseAvailable = (character: RangerSubclassCharacter): boolean =>
  hasSubclassAt(character, 'hunter', 15);
