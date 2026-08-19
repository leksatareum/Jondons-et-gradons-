export type SpellManagementMode = 'spellbook' | 'long-rest' | 'long-rest-one' | 'level-up' | 'none';

const LONG_REST_PREPARERS = new Set(['clerc', 'druide', 'paladin']);
const LONG_REST_SINGLE_SWAP = new Set(['rodeur']);
const LEVEL_UP_PREPARERS = new Set(['barde', 'ensorceleur', 'occultiste']);

const isLevelUpThirdCaster = (classId: string | null | undefined, subclass?: string | null): boolean =>
  (classId === 'guerrier' && /chevalier\s+occulte|eldritch\s+knight/i.test(subclass || ''))
  || (classId === 'roublard' && /filou\s+arcanique|arcane\s+trickster/i.test(subclass || ''));

export function spellManagementMode(classId: string | null | undefined, subclass?: string | null): SpellManagementMode {
  if (classId === 'magicien') return 'spellbook';
  if (classId && LONG_REST_PREPARERS.has(classId)) return 'long-rest';
  if (classId && LONG_REST_SINGLE_SWAP.has(classId)) return 'long-rest-one';
  if (classId && LEVEL_UP_PREPARERS.has(classId)) return 'level-up';
  if (isLevelUpThirdCaster(classId, subclass)) return 'level-up';
  return 'none';
}

export function canChangePreparedSpells(classId: string, preparationOpen: boolean, subclass?: string | null): boolean {
  const mode = spellManagementMode(classId, subclass);
  return (mode === 'long-rest' || mode === 'spellbook') && preparationOpen;
}

export function canReplaceSpellOnLongRest(classId: string, preparationOpen: boolean, subclass?: string | null): boolean {
  return preparationOpen && spellManagementMode(classId, subclass) === 'long-rest-one';
}

export function canReplaceSpellOnLevelUp(classId: string, subclass?: string | null): boolean {
  return spellManagementMode(classId, subclass) === 'level-up';
}

const LEVEL_UP_CANTRIP_REPLACERS = new Set(['barde', 'clerc', 'druide', 'ensorceleur', 'occultiste']);

export function canReplaceCantripOnLevelUp(classId: string, subclass?: string | null): boolean {
  return LEVEL_UP_CANTRIP_REPLACERS.has(classId) || isLevelUpThirdCaster(classId, subclass);
}

export function canReplaceCantripOnLongRest(classId: string): boolean {
  return classId === 'magicien';
}

export function scribingCost(spellLevel: number): { gold: number; hours: number } {
  const level = Math.max(1, Math.floor(spellLevel));
  return { gold: level * 50, hours: level * 2 };
}

export function newSpellStartsPrepared(classId: string): boolean {
  return classId !== 'magicien';
}
