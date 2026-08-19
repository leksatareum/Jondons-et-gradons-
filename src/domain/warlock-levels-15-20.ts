export type HighWarlockCharacter = {
  level?: number;
  classId?: string;
  classLevels?: Array<{ classId?: string; id?: string; level?: number }>;
  classSelections?: Record<string, { invocations?: string | string[] }>;
  classChoices?: { invocations?: string | string[] };
  [key: string]: unknown;
};

const invocationIds = (character: HighWarlockCharacter): string[] => {
  const selected = character.classSelections?.occultiste?.invocations
    ?? (character.classId === 'occultiste' ? character.classChoices?.invocations : undefined)
    ?? [];
  return Array.isArray(selected) ? selected.map(String).filter(Boolean) : selected ? [String(selected)] : [];
};

export function warlockLevelFifteenToTwenty(character: HighWarlockCharacter): number {
  const entry = (character.classLevels || []).find((candidate) => (candidate.classId || candidate.id) === 'occultiste');
  if (entry) return Math.max(0, Math.floor(Number(entry.level) || 0));
  return character.classId === 'occultiste' ? Math.max(0, Math.floor(Number(character.level) || 0)) : 0;
}

export function hasHighWarlockInvocation(character: HighWarlockCharacter, invocationId: string): boolean {
  return invocationIds(character).some((optionId) => optionId.split('@')[0] === invocationId);
}

export function witchSightRangeMeters(character: HighWarlockCharacter): number {
  return warlockLevelFifteenToTwenty(character) >= 15 && hasHighWarlockInvocation(character, 'witch-sight') ? 9 : 0;
}
