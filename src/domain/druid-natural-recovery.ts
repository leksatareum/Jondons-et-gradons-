import { druidLevel, isLandDruid, naturalRecoverySlotBudget, type LandStarsCharacter } from './druid-land-stars';

export type NaturalRecoverySlot = { level: number; current: number; max: number; temporary?: number; [key: string]: unknown };
export type NaturalRecoveryCharacter = LandStarsCharacter & {
  spells?: Array<{ id: string; source?: string; prepared?: boolean; [key: string]: unknown }>;
  slots?: NaturalRecoverySlot[] | null;
  naturalRecoveryFreeSpellUsed?: boolean;
  naturalRecoverySlotRecoveryUsed?: boolean;
  naturalRecoveryShortRestReady?: boolean;
};

export function naturalRecoveryFreeSpellAvailable(character: NaturalRecoveryCharacter, spellId: string): boolean {
  if (!isLandDruid(character) || druidLevel(character) < 6 || character.naturalRecoveryFreeSpellUsed) return false;
  return (character.spells || []).some((spell) => spell.id === spellId && spell.source === 'circle-land' && spell.prepared !== false);
}

export function markNaturalRecoveryFreeSpellUsed(character: NaturalRecoveryCharacter): NaturalRecoveryCharacter {
  if (!isLandDruid(character) || druidLevel(character) < 6 || character.naturalRecoveryFreeSpellUsed) return character;
  return { ...character, naturalRecoveryFreeSpellUsed: true };
}

export function markNaturalRecoveryAfterShortRest(character: NaturalRecoveryCharacter): NaturalRecoveryCharacter {
  if (!isLandDruid(character) || druidLevel(character) < 6 || character.naturalRecoverySlotRecoveryUsed) return character;
  return { ...character, naturalRecoveryShortRestReady: true };
}

export function naturalRecoveryMissingSlots(character: NaturalRecoveryCharacter): number[] {
  if (!character.naturalRecoveryShortRestReady || character.naturalRecoverySlotRecoveryUsed) return [];
  return (character.slots || []).flatMap((slot) => {
    if (slot.level >= 6) return [];
    const missing = Math.max(0, slot.max - slot.current);
    return Array.from({ length: missing }, () => slot.level);
  });
}

export function validateNaturalRecoverySelection(character: NaturalRecoveryCharacter, levels: number[]): boolean {
  if (!isLandDruid(character) || druidLevel(character) < 6 || !character.naturalRecoveryShortRestReady || character.naturalRecoverySlotRecoveryUsed) return false;
  const chosen = levels.map((level) => Math.trunc(level)).filter((level) => level > 0);
  if (chosen.length === 0 || chosen.some((level) => level >= 6)) return false;
  if (chosen.reduce((sum, level) => sum + level, 0) > naturalRecoverySlotBudget(character)) return false;

  const available = naturalRecoveryMissingSlots(character);
  const counts = new Map<number, number>();
  available.forEach((level) => counts.set(level, (counts.get(level) || 0) + 1));
  for (const level of chosen) {
    const left = counts.get(level) || 0;
    if (left <= 0) return false;
    counts.set(level, left - 1);
  }
  return true;
}

export function recoverNaturalRecoverySlots(character: NaturalRecoveryCharacter, levels: number[]): NaturalRecoveryCharacter {
  if (!validateNaturalRecoverySelection(character, levels)) return character;
  const remaining = new Map<number, number>();
  levels.forEach((level) => remaining.set(level, (remaining.get(level) || 0) + 1));
  return {
    ...character,
    slots: (character.slots || []).map((slot) => {
      const count = remaining.get(slot.level) || 0;
      if (count <= 0) return slot;
      return { ...slot, current: Math.min(slot.max, slot.current + count) };
    }),
    naturalRecoverySlotRecoveryUsed: true,
    naturalRecoveryShortRestReady: false,
  };
}

export function resetNaturalRecoveryLongRest(character: NaturalRecoveryCharacter): NaturalRecoveryCharacter {
  return {
    ...character,
    naturalRecoveryFreeSpellUsed: false,
    naturalRecoverySlotRecoveryUsed: false,
    naturalRecoveryShortRestReady: false,
  };
}
