export type WarlockHighLevelCharacter = {
  level?: number;
  classId?: string;
  subclass?: string | null;
  abilities?: Record<string, number>;
  classLevels?: Array<{ classId?: string; id?: string; level?: number; subclass?: string | null }>;
  classSelections?: Record<string, { invocations?: string | string[] }>;
  classChoices?: { invocations?: string | string[] };
  pactBladeWeaponId?: string | null;
  [key: string]: unknown;
};

export type AberrantSpiritVariant = 'beholderkin' | 'mind-flayer' | 'slaad';

export type CreateThrallCompanion = {
  id: string;
  name: string;
  source: 'great-old-one-create-thrall';
  kind: 'Aberration';
  variant: AberrantSpiritVariant;
  ac: number;
  hp: number;
  hpMax: number;
  hpTemp: number;
  speed: string;
  cr: '—';
  initiativeMode: 'after-owner';
  commandMode: 'verbal-free';
  spellLevel: number;
  remainingRounds: number;
  multiattack: number;
  attackBonus: number;
  attackName: string;
  attackRange: string;
  damageFormula: string;
  damageType: string;
  special: string | null;
  conditions: string[];
  turn: { action: boolean; bonus: boolean; reaction: boolean; createThrallHexBonusUsed?: boolean };
};

const selectedInvocationIds = (character: WarlockHighLevelCharacter): string[] => {
  const raw = character.classSelections?.occultiste?.invocations
    ?? (character.classId === 'occultiste' ? character.classChoices?.invocations : undefined)
    ?? [];
  return Array.isArray(raw) ? raw.map(String).filter(Boolean) : raw ? [String(raw)] : [];
};

const invocationBaseId = (value: string): string => String(value || '').split('@')[0];

export function warlockLevelElevenToFourteen(character: WarlockHighLevelCharacter): number {
  const entry = (character.classLevels || []).find((candidate) => (candidate.classId || candidate.id) === 'occultiste');
  if (entry) return Math.max(0, Math.floor(Number(entry.level) || 0));
  return character.classId === 'occultiste' ? Math.max(0, Math.floor(Number(character.level) || 0)) : 0;
}

export function warlockHighLevelSubclass(character: WarlockHighLevelCharacter): string {
  const entry = (character.classLevels || []).find((candidate) => (candidate.classId || candidate.id) === 'occultiste');
  return String(entry?.subclass || (character.classId === 'occultiste' ? character.subclass : '') || '');
}

export function isGreatOldOneLevelFourteen(character: WarlockHighLevelCharacter): boolean {
  return warlockLevelElevenToFourteen(character) >= 14
    && /grand\s+ancien|great\s+old\s+one/i.test(warlockHighLevelSubclass(character));
}

export function devouringBladeEligible(character: WarlockHighLevelCharacter, weaponId?: string | null): boolean {
  const invocations = selectedInvocationIds(character).map(invocationBaseId);
  return warlockLevelElevenToFourteen(character) >= 12
    && Boolean(weaponId && character.pactBladeWeaponId === weaponId)
    && invocations.includes('pact-blade')
    && invocations.includes('thirsting-blade')
    && invocations.includes('devouring-blade');
}

export function createThrallCanModifySummon(character: WarlockHighLevelCharacter, spellId: string): boolean {
  return isGreatOldOneLevelFourteen(character) && spellId === 'invocation-aberration';
}

export function createThrallTemporaryHp(character: WarlockHighLevelCharacter): number {
  if (!isGreatOldOneLevelFourteen(character)) return 0;
  const charisma = Number(character.abilities?.cha ?? 10);
  const charismaModifier = Math.floor((charisma - 10) / 2);
  return Math.max(0, warlockLevelElevenToFourteen(character) + charismaModifier);
}

const proficiencyBonus = (character: WarlockHighLevelCharacter): number => {
  const totalLevel = Math.max(1, Math.floor(Number(character.level) || warlockLevelElevenToFourteen(character) || 1));
  return 2 + Math.floor((totalLevel - 1) / 4);
};

const spellAttackBonus = (character: WarlockHighLevelCharacter): number => {
  const charisma = Number(character.abilities?.cha ?? 10);
  return proficiencyBonus(character) + Math.floor((charisma - 10) / 2);
};

export function aberrantSpiritProfile(
  character: WarlockHighLevelCharacter,
  slotLevel: number,
  variant: AberrantSpiritVariant,
) {
  const level = Math.max(4, Math.floor(Number(slotLevel) || 4));
  const hpMax = 40 + Math.max(0, level - 4) * 10;
  const base = {
    ac: 11 + level,
    hpMax,
    multiattack: Math.max(1, Math.floor(level / 2)),
    attackBonus: spellAttackBonus(character),
  };

  if (variant === 'slaad') return {
    ...base,
    name: 'Esprit aberrant · Slaad',
    speed: '9 m',
    attackName: 'Griffe',
    attackRange: 'allonge 1,50 m',
    damageFormula: `1d10 + ${3 + level}`,
    damageType: 'Tranchant',
    special: 'Régénération 5 PV au début de son tour s’il lui reste au moins 1 PV ; une cible touchée ne peut pas récupérer de PV jusqu’au début du prochain tour du serviteur.',
  };

  if (variant === 'mind-flayer') return {
    ...base,
    name: 'Esprit aberrant · Flagelleur mental',
    speed: '9 m',
    attackName: 'Frappe psychique',
    attackRange: 'allonge 1,50 m',
    damageFormula: `1d8 + ${3 + level}`,
    damageType: 'Psychique',
    special: 'Aura murmurante : au début de son tour, les autres créatures à 1,50 m font une sauvegarde de Sagesse contre ton DD de sort ou subissent 2d6 dégâts psychiques.',
  };

  return {
    ...base,
    name: 'Esprit aberrant · Spectateur',
    speed: '9 m · vol 9 m (stationnaire)',
    attackName: 'Rayon oculaire',
    attackRange: '45 m',
    damageFormula: `1d8 + ${3 + level}`,
    damageType: 'Psychique',
    special: null,
  };
}

export function createThrallCompanion(
  character: WarlockHighLevelCharacter,
  slotLevel: number,
  variant: AberrantSpiritVariant,
  id: string,
): CreateThrallCompanion | null {
  if (!isGreatOldOneLevelFourteen(character)) return null;
  const profile = aberrantSpiritProfile(character, slotLevel, variant);
  return {
    id,
    name: profile.name,
    source: 'great-old-one-create-thrall',
    kind: 'Aberration',
    variant,
    ac: profile.ac,
    hp: profile.hpMax,
    hpMax: profile.hpMax,
    hpTemp: createThrallTemporaryHp(character),
    speed: profile.speed,
    cr: '—',
    initiativeMode: 'after-owner',
    commandMode: 'verbal-free',
    spellLevel: Math.max(4, Math.floor(Number(slotLevel) || 4)),
    remainingRounds: 10,
    multiattack: profile.multiattack,
    attackBonus: profile.attackBonus,
    attackName: profile.attackName,
    attackRange: profile.attackRange,
    damageFormula: profile.damageFormula,
    damageType: profile.damageType,
    special: profile.special,
    conditions: [],
    turn: { action: false, bonus: false, reaction: false, createThrallHexBonusUsed: false },
  };
}

export function createThrallHexBonusAvailable(
  companion: Pick<CreateThrallCompanion, 'source' | 'turn'>,
  targetName: string,
  hexTargetName?: string | null,
): boolean {
  if (companion.source !== 'great-old-one-create-thrall' || companion.turn?.createThrallHexBonusUsed) return false;
  const target = String(targetName || '').trim().toLocaleLowerCase('fr');
  const hexTarget = String(hexTargetName || '').trim().toLocaleLowerCase('fr');
  return Boolean(target && hexTarget && target === hexTarget);
}

export function advanceCreateThrallTurn(companion: CreateThrallCompanion): CreateThrallCompanion | null {
  const rounds = Math.max(0, Math.floor(Number(companion.remainingRounds) || 0) - 1);
  if (rounds <= 0) return null;
  const regeneratedHp = companion.variant === 'slaad' && companion.hp > 0
    ? Math.min(companion.hpMax, companion.hp + 5)
    : companion.hp;
  return {
    ...companion,
    hp: regeneratedHp,
    remainingRounds: rounds,
    turn: { action: false, bonus: false, reaction: false, createThrallHexBonusUsed: false },
  };
}
