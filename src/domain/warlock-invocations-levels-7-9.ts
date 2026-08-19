export type InvocationSelection = string | string[];

export type HitDiePool = { die: number; current: number; max: number; [key: string]: unknown };
export type WarlockSevenNineCharacter = {
  classId?: string;
  level?: number;
  abilities?: Record<string, number>;
  classLevels?: Array<{ classId?: string; id?: string; level?: number }>;
  classSelections?: Record<string, { invocations?: InvocationSelection }>;
  classChoices?: { invocations?: InvocationSelection };
  pactBladeWeaponId?: string | null;
  turn?: Record<string, any>;
  hp?: number;
  hpMax?: number;
  hitDicePools?: HitDiePool[];
  hitDiceLeft?: number;
  pactTomeBook?: { cantrips?: string[]; rituals?: string[] } | null;
  giftProtectorsNames?: string[];
  giftProtectorsUsed?: boolean;
  [key: string]: unknown;
};

export const LIFEDRINKER_DAMAGE_TYPES = ['Nécrotique', 'Psychique', 'Radiant'] as const;
export type LifedrinkerDamageType = typeof LIFEDRINKER_DAMAGE_TYPES[number];

const invocationIds = (character: WarlockSevenNineCharacter): string[] => {
  const raw = character.classSelections?.occultiste?.invocations
    ?? (character.classId === 'occultiste' ? character.classChoices?.invocations : undefined)
    ?? [];
  return Array.isArray(raw) ? raw.map(String).filter(Boolean) : raw ? [String(raw)] : [];
};

export function hasInvocationSevenNine(character: WarlockSevenNineCharacter, id: string): boolean {
  return invocationIds(character).some((optionId) => optionId.split('@')[0] === id);
}

export function warlockLevelSevenNine(character: WarlockSevenNineCharacter): number {
  const entry = (character.classLevels || []).find((candidate) => (candidate.classId || candidate.id) === 'occultiste');
  if (entry) return Math.max(0, Math.floor(Number(entry.level) || 0));
  return character.classId === 'occultiste' ? Math.max(0, Math.floor(Number(character.level) || 0)) : 0;
}

export function lifedrinkerEligible(character: WarlockSevenNineCharacter, weaponId?: string | null): boolean {
  return warlockLevelSevenNine(character) >= 9
    && hasInvocationSevenNine(character, 'lifedrinker')
    && hasInvocationSevenNine(character, 'pact-blade')
    && Boolean(weaponId && character.pactBladeWeaponId === weaponId)
    && !character.turn?.lifedrinkerUsed;
}

export function lifedrinkerHitDice(character: WarlockSevenNineCharacter): HitDiePool[] {
  return (character.hitDicePools || []).filter((pool) => Number(pool.current) > 0);
}

export type LifedrinkerResolution = {
  character: WarlockSevenNineCharacter;
  extraDamage: '1d6';
  damageType: LifedrinkerDamageType;
  healed: number;
  spentHitDie: number | null;
};

export function resolveLifedrinker(
  character: WarlockSevenNineCharacter,
  weaponId: string | null | undefined,
  damageType: LifedrinkerDamageType,
  hitDie: number | null = null,
  hitDieRoll: number | null = null,
): LifedrinkerResolution | null {
  if (!lifedrinkerEligible(character, weaponId) || !LIFEDRINKER_DAMAGE_TYPES.includes(damageType)) return null;

  let hitDicePools = character.hitDicePools || [];
  let healed = 0;
  let spentHitDie: number | null = null;
  if (hitDie != null && hitDieRoll != null) {
    const die = Math.max(1, Math.floor(Number(hitDie) || 0));
    const pool = hitDicePools.find((candidate) => candidate.die === die && candidate.current > 0);
    if (pool) {
      const roll = Math.max(1, Math.min(die, Math.floor(Number(hitDieRoll) || 0)));
      const con = Math.floor((Number(character.abilities?.con ?? 10) - 10) / 2);
      healed = Math.max(1, roll + con);
      spentHitDie = die;
      hitDicePools = hitDicePools.map((candidate) => candidate === pool ? { ...candidate, current: candidate.current - 1 } : candidate);
    }
  }

  const hp = Math.min(Number(character.hpMax) || Number(character.hp) || 0, (Number(character.hp) || 0) + healed);
  return {
    character: {
      ...character,
      hp,
      hitDicePools,
      hitDiceLeft: hitDicePools.length > 0 ? hitDicePools.reduce((sum, pool) => sum + Math.max(0, Number(pool.current) || 0), 0) : character.hitDiceLeft,
      turn: { ...(character.turn || {}), lifedrinkerUsed: true },
    },
    extraDamage: '1d6',
    damageType,
    healed,
    spentHitDie,
  };
}

export function giftProtectorsEligible(character: WarlockSevenNineCharacter): boolean {
  return warlockLevelSevenNine(character) >= 9
    && hasInvocationSevenNine(character, 'gift-of-the-protectors')
    && hasInvocationSevenNine(character, 'pact-tome')
    && Boolean(character.pactTomeBook);
}

export function giftProtectorsCapacity(character: WarlockSevenNineCharacter): number {
  const cha = Math.floor((Number(character.abilities?.cha ?? 10) - 10) / 2);
  return Math.max(1, cha);
}

const normalizedName = (name: string): string => String(name || '').trim().toLocaleLowerCase('fr');

export function addGiftProtectorName(character: WarlockSevenNineCharacter, name: string): WarlockSevenNineCharacter {
  if (!giftProtectorsEligible(character)) return character;
  const clean = String(name || '').trim();
  if (!clean) return character;
  const names = [...new Set((character.giftProtectorsNames || []).map((entry) => String(entry).trim()).filter(Boolean))];
  if (names.some((entry) => normalizedName(entry) === normalizedName(clean)) || names.length >= giftProtectorsCapacity(character)) return character;
  return { ...character, giftProtectorsNames: [...names, clean] };
}

export function removeGiftProtectorName(character: WarlockSevenNineCharacter, name: string): WarlockSevenNineCharacter {
  if (!giftProtectorsEligible(character)) return character;
  return { ...character, giftProtectorsNames: (character.giftProtectorsNames || []).filter((entry) => normalizedName(entry) !== normalizedName(name)) };
}

export function giftProtectorsCanSave(character: WarlockSevenNineCharacter, targetName: string): boolean {
  return giftProtectorsEligible(character)
    && !character.giftProtectorsUsed
    && (character.giftProtectorsNames || []).some((entry) => normalizedName(entry) === normalizedName(targetName));
}

export function triggerGiftProtectors(character: WarlockSevenNineCharacter): WarlockSevenNineCharacter {
  if (!giftProtectorsEligible(character) || character.giftProtectorsUsed) return character;
  return { ...character, giftProtectorsUsed: true };
}

export function resetGiftProtectors(character: WarlockSevenNineCharacter): WarlockSevenNineCharacter {
  return giftProtectorsEligible(character) ? { ...character, giftProtectorsUsed: false } : character;
}
