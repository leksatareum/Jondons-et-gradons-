type ClassLevel = { classId?: string; id?: string; level?: number; subclass?: string | null };

type CharacterLike = {
  level?: number;
  classId?: string;
  subclass?: string | null;
  classLevels?: ClassLevel[];
  abilities?: { cha?: number };
};

const abilityMod = (score = 10) => Math.floor((Number(score) - 10) / 2);

export function warlockLevelOf(character: CharacterLike): number {
  const entry = (character.classLevels || []).find((candidate) => (candidate.classId || candidate.id) === 'occultiste');
  if (entry) return Math.max(0, Number(entry.level) || 0);
  return character.classId === 'occultiste' ? Math.max(0, Number(character.level) || 0) : 0;
}

export function warlockSubclassOf(character: CharacterLike): string {
  const entry = (character.classLevels || []).find((candidate) => (candidate.classId || candidate.id) === 'occultiste');
  if (entry?.subclass) return String(entry.subclass);
  return character.classId === 'occultiste' ? String(character.subclass || '') : '';
}

export function isGreatOldOneLevel3(character: CharacterLike): boolean {
  return warlockLevelOf(character) >= 3 && /grand ancien|great old one/i.test(warlockSubclassOf(character));
}

export function greatOldOnePatronSpellIds(warlockLevel: number): string[] {
  const ids = warlockLevel >= 3
    ? ['detection-pensees', 'murmures-dissonants', 'force-fantasmagorique', 'rire-hideux']
    : [];
  if (warlockLevel >= 5) ids.push('clairvoyance', 'faim-hadar');
  return ids;
}

export type AwakenedMindRules = {
  targetRangeMeters: number;
  communicationMiles: number;
  durationMinutes: number;
  action: 'bonus';
  requiresVisibleTarget: true;
  sharedLanguageRequired: true;
};

export function awakenedMindRules(character: CharacterLike): AwakenedMindRules | null {
  if (!isGreatOldOneLevel3(character)) return null;
  const level = warlockLevelOf(character);
  return {
    targetRangeMeters: 9,
    communicationMiles: Math.max(1, abilityMod(character.abilities?.cha ?? 10)),
    durationMinutes: level,
    action: 'bonus',
    requiresVisibleTarget: true,
    sharedLanguageRequired: true,
  };
}

export function greatOldOneSuppressesVerbalSomatic(
  character: CharacterLike,
  sourceClass: string,
  school: string,
): boolean {
  if (!isGreatOldOneLevel3(character) || sourceClass !== 'occultiste') return false;
  return /enchantement|illusion/i.test(String(school || ''));
}

export function greatOldOneCanConvertDamage(
  character: CharacterLike,
  sourceClass: string,
  spellDescription: string,
): boolean {
  return isGreatOldOneLevel3(character)
    && sourceClass === 'occultiste'
    && /d[eé]g[aâ]ts?/i.test(String(spellDescription || ''));
}
