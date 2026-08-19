export type RangerHunterCharacter = {
  level?: number;
  classId?: string;
  subclass?: string | null;
  classLevels?: Array<{ classId?: string; id?: string; level?: number; subclass?: string | null }>;
  classSelections?: Record<string, Record<string, unknown>>;
  classChoices?: Record<string, unknown>;
  turn?: Record<string, unknown>;
  [key: string]: unknown;
};

export type HunterPreyChoice = 'colossus-slayer' | 'horde-breaker';

export const rangerLevelOf = (character: RangerHunterCharacter): number => {
  const entry = (character.classLevels || []).find((candidate) => (candidate.classId || candidate.id) === 'rodeur');
  if (entry) return Math.max(0, Math.floor(Number(entry.level) || 0));
  return character.classId === 'rodeur' ? Math.max(0, Math.floor(Number(character.level) || 0)) : 0;
};

export const rangerSubclassOf = (character: RangerHunterCharacter): string | null => {
  const entry = (character.classLevels || []).find((candidate) => (candidate.classId || candidate.id) === 'rodeur');
  return String(entry?.subclass || (character.classId === 'rodeur' ? character.subclass : '') || '') || null;
};

export const favoredEnemyFreeCasts = (level: number): number => {
  const value = Math.max(1, Math.floor(Number(level) || 1));
  if (value >= 17) return 6;
  if (value >= 13) return 5;
  if (value >= 9) return 4;
  if (value >= 5) return 3;
  return 2;
};

export const isHunterLevelThree = (character: RangerHunterCharacter): boolean =>
  rangerLevelOf(character) >= 3 && /chasseur|hunter/i.test(rangerSubclassOf(character) || '');

export const hunterPreyChoice = (character: RangerHunterCharacter): HunterPreyChoice | null => {
  if (!isHunterLevelThree(character)) return null;
  const selected = character.classSelections?.rodeur?.hunterPrey
    ?? (character.classId === 'rodeur' ? character.classChoices?.hunterPrey : null);
  const value = Array.isArray(selected) ? selected[0] : selected;
  return value === 'colossus-slayer' || value === 'horde-breaker' ? value : null;
};

export const colossusSlayerAvailable = (
  character: RangerHunterCharacter,
  options: { weaponHit: boolean; targetMissingHp: boolean },
): boolean => hunterPreyChoice(character) === 'colossus-slayer'
  && options.weaponHit
  && options.targetMissingHp
  && !character.turn?.hunterColossusSlayerUsed;

export const applyColossusSlayer = (character: RangerHunterCharacter): RangerHunterCharacter | null => {
  if (hunterPreyChoice(character) !== 'colossus-slayer' || character.turn?.hunterColossusSlayerUsed) return null;
  return { ...character, turn: { ...(character.turn || {}), hunterColossusSlayerUsed: true } };
};

export const hordeBreakerAvailable = (character: RangerHunterCharacter): boolean =>
  hunterPreyChoice(character) === 'horde-breaker' && !character.turn?.hunterHordeBreakerUsed;

export const applyHordeBreaker = (character: RangerHunterCharacter): RangerHunterCharacter | null => {
  if (!hordeBreakerAvailable(character)) return null;
  return { ...character, turn: { ...(character.turn || {}), hunterHordeBreakerUsed: true } };
};

export const hunterLoreAvailable = (character: RangerHunterCharacter, concentrationDetail?: string | null): boolean =>
  isHunterLevelThree(character) && /marque du chasseur|hunter.?s mark/i.test(String(concentrationDetail || ''));
