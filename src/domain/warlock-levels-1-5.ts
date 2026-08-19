export type WarlockPactSlot = {
  level: number;
  current: number;
  max: number;
  [key: string]: unknown;
};

export type WarlockRulesCharacter = {
  level?: number;
  classId?: string;
  abilities?: Record<string, number>;
  classLevels?: Array<{ classId?: string; id?: string; level?: number }>;
  classSelections?: Record<string, { invocations?: string | string[] }>;
  classChoices?: { invocations?: string | string[] };
  pactBladeWeaponId?: string | null;
  pactSlots?: WarlockPactSlot[] | null;
  turn?: Record<string, unknown>;
  [key: string]: unknown;
};

const invocationIds = (character: WarlockRulesCharacter): string[] => {
  const selected = character.classSelections?.occultiste?.invocations
    ?? (character.classId === 'occultiste' ? character.classChoices?.invocations : null)
    ?? [];
  if (Array.isArray(selected)) return selected.map(String).filter(Boolean);
  return selected ? [String(selected)] : [];
};

const warlockLevelOf = (character: WarlockRulesCharacter): number => {
  const entry = (character.classLevels || []).find((candidate) => (candidate.classId || candidate.id) === 'occultiste');
  if (entry) return Math.max(0, Math.floor(Number(entry.level) || 0));
  return character.classId === 'occultiste' ? Math.max(0, Math.floor(Number(character.level) || 0)) : 0;
};

export const invocationBaseId = (optionId: string): string => String(optionId || '').split('@')[0];
export const invocationTargetId = (optionId: string): string | null => {
  const parts = String(optionId || '').split('@');
  return parts.length > 1 ? parts.slice(1).join('@') : null;
};

export const hasWarlockInvocation = (character: WarlockRulesCharacter, baseId: string): boolean =>
  invocationIds(character).some((optionId) => invocationBaseId(optionId) === baseId);

export const hasInvocationForTarget = (character: WarlockRulesCharacter, baseId: string, targetId: string): boolean =>
  invocationIds(character).some((optionId) => invocationBaseId(optionId) === baseId && invocationTargetId(optionId) === targetId);

export const pactBladeAbilityModifier = (character: WarlockRulesCharacter, weaponId?: string | null): number | null => {
  if (!weaponId || !hasWarlockInvocation(character, 'pact-blade') || character.pactBladeWeaponId !== weaponId) return null;
  const cha = Number(character.abilities?.cha ?? 10);
  return Math.floor((cha - 10) / 2);
};

export const pactBladeGrantsProficiency = (character: WarlockRulesCharacter, weaponId?: string | null): boolean =>
  Boolean(weaponId && hasWarlockInvocation(character, 'pact-blade') && character.pactBladeWeaponId === weaponId);

export const thirstingBladeApplies = (character: WarlockRulesCharacter, weaponId?: string | null): boolean =>
  Boolean(weaponId && character.pactBladeWeaponId === weaponId
    && hasWarlockInvocation(character, 'pact-blade')
    && hasWarlockInvocation(character, 'thirsting-blade'));

export const devouringBladeApplies = (character: WarlockRulesCharacter, weaponId?: string | null): boolean =>
  Boolean(warlockLevelOf(character) >= 12
    && thirstingBladeApplies(character, weaponId)
    && hasWarlockInvocation(character, 'devouring-blade'));

export const attacksWithWeapon = (character: WarlockRulesCharacter, weaponId: string | null | undefined, baseAttacks: number): number => {
  if (devouringBladeApplies(character, weaponId)) return Math.max(baseAttacks, 3);
  return thirstingBladeApplies(character, weaponId) ? Math.max(baseAttacks, 2) : baseAttacks;
};

export const agonizingBlastBonus = (character: WarlockRulesCharacter, cantripId: string): number => {
  if (!hasInvocationForTarget(character, 'agonizing-blast', cantripId)) return 0;
  const cha = Number(character.abilities?.cha ?? 10);
  return Math.floor((cha - 10) / 2);
};

export const eldritchMindConcentrationAdvantage = (character: WarlockRulesCharacter): boolean =>
  hasWarlockInvocation(character, 'eldritch-mind');

export const eldritchSpearRangeBonusMeters = (character: WarlockRulesCharacter, cantripId: string, warlockLevel: number): number =>
  hasInvocationForTarget(character, 'eldritch-spear', cantripId) ? Math.max(0, Math.floor(warlockLevel)) * 9 : 0;

export const eldritchSpearEffectiveRangeMeters = (
  character: WarlockRulesCharacter,
  cantripId: string,
  baseRangeMeters: number,
  warlockLevel = warlockLevelOf(character),
): number => Math.max(0, Number(baseRangeMeters) || 0) + eldritchSpearRangeBonusMeters(character, cantripId, warlockLevel);

export const repellingBlastPushMeters = (character: WarlockRulesCharacter, cantripId: string): number =>
  hasInvocationForTarget(character, 'repelling-blast', cantripId) ? 3 : 0;

export const repellingBlastCanPushSize = (size: string): boolean => {
  const normalized = String(size || '').trim().toLocaleLowerCase('fr');
  return new Set(['tp', 'très petite', 'tres petite', 'tiny', 'p', 'petite', 'small', 'm', 'moyenne', 'medium', 'g', 'grande', 'large']).has(normalized);
};

export const eldritchSmiteDamageDice = (slotLevel: number): string => `${Math.max(1, Math.floor(Number(slotLevel) || 0)) + 1}d8`;

export const eldritchSmiteAvailableSlots = (character: WarlockRulesCharacter, weaponId?: string | null): WarlockPactSlot[] => {
  if (warlockLevelOf(character) < 5
      || !weaponId
      || character.pactBladeWeaponId !== weaponId
      || !hasWarlockInvocation(character, 'pact-blade')
      || !hasWarlockInvocation(character, 'eldritch-smite')
      || character.turn?.eldritchSmiteUsed) return [];
  return (character.pactSlots || []).filter((slot) => slot.current > 0);
};

export const canEldritchSmite = (character: WarlockRulesCharacter, weaponId?: string | null): boolean =>
  eldritchSmiteAvailableSlots(character, weaponId).length > 0;

export type EldritchSmiteResult = {
  character: WarlockRulesCharacter;
  slotLevel: number;
  damageDice: string;
  damageType: 'Force';
  proneMaxSize: 'TG';
};

export const spendEldritchSmite = (
  character: WarlockRulesCharacter,
  weaponId: string | null | undefined,
  slotLevel: number,
): EldritchSmiteResult | null => {
  const level = Math.max(1, Math.floor(Number(slotLevel) || 0));
  if (!canEldritchSmite(character, weaponId)) return null;
  const selected = (character.pactSlots || []).find((slot) => slot.level === level && slot.current > 0);
  if (!selected) return null;

  return {
    character: {
      ...character,
      pactSlots: (character.pactSlots || []).map((slot) => slot.level === level
        ? { ...slot, current: Math.max(0, slot.current - 1) }
        : slot),
      turn: { ...(character.turn || {}), eldritchSmiteUsed: true },
    },
    slotLevel: level,
    damageDice: eldritchSmiteDamageDice(level),
    damageType: 'Force',
    proneMaxSize: 'TG',
  };
};

export const devilSightRangeMeters = (character: WarlockRulesCharacter): number =>
  hasWarlockInvocation(character, 'devils-sight') ? 36 : 0;
