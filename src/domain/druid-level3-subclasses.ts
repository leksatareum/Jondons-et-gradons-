export type DruidSubclassCharacter = {
  level?: number;
  classId?: string;
  subclass?: string | null;
  classLevels?: Array<{ classId?: string; id?: string; level?: number; subclass?: string | null }>;
  abilities?: Record<string, number>;
  resources?: Array<{ name: string; current: number; max: number; [key: string]: unknown }>;
  turn?: Record<string, unknown>;
  conditions?: Array<{ label: string; detail?: string; [key: string]: unknown }>;
  slots?: Array<{ level: number; current: number; max: number }>;
  pactSlots?: Array<{ level: number; current: number; max: number }>;
  wrathOfSea?: WrathOfSeaState | null;
  starryForm?: StarryFormState | null;
  [key: string]: unknown;
};

const mod = (score: number) => Math.floor((score - 10) / 2);

export const druidLevelForSubclass = (character: DruidSubclassCharacter): number => {
  const entry = (character.classLevels || []).find((level) => (level.classId || level.id) === 'druide');
  return Number(entry?.level || (character.classId === 'druide' ? character.level : 0) || 0);
};

export const druidSubclassFor = (character: DruidSubclassCharacter): string => {
  const entry = (character.classLevels || []).find((level) => (level.classId || level.id) === 'druide');
  return String(entry?.subclass || (character.classId === 'druide' ? character.subclass : '') || '');
};

export const wisdomModifier = (character: DruidSubclassCharacter): number => mod(Number(character.abilities?.wis ?? 10));

const wildShape = (character: DruidSubclassCharacter) => (character.resources || []).find((resource) => resource.name === 'Forme sauvage');

export const canSpendWildShape = (character: DruidSubclassCharacter): boolean => (wildShape(character)?.current || 0) > 0;

export const spendWildShape = (character: DruidSubclassCharacter): DruidSubclassCharacter => {
  if (!canSpendWildShape(character)) return character;
  return {
    ...character,
    resources: (character.resources || []).map((resource) => resource.name === 'Forme sauvage'
      ? { ...resource, current: Math.max(0, resource.current - 1) } : resource),
  };
};

export type LandsAidResolution = { damageDice: string; healingDice: string; saveAbility: 'con'; radiusMeters: number; rangeMeters: number };

export function landsAid(character: DruidSubclassCharacter): { character: DruidSubclassCharacter; resolution: LandsAidResolution } | null {
  const level = druidLevelForSubclass(character);
  if (level < 3 || !/cercle de la terre|circle of the land|\bterre\b/i.test(druidSubclassFor(character)) || !canSpendWildShape(character)) return null;
  const dice = level >= 14 ? '4d6' : level >= 10 ? '3d6' : '2d6';
  return {
    character: spendWildShape(character),
    resolution: { damageDice: dice, healingDice: dice, saveAbility: 'con', radiusMeters: 3, rangeMeters: 18 },
  };
}

export type WrathOfSeaState = {
  active: true;
  radiusMeters: number;
  durationMinutes: number;
  damageDice: string;
  saveAbility: 'con';
  pushMeters: number;
  host?: 'self' | 'ally' | 'both';
  allyName?: string;
};

const isSeaDruid = (character: DruidSubclassCharacter) => /cercle de la mer|circle of the sea|\bmer\b/i.test(druidSubclassFor(character));
const isStarsDruid = (character: DruidSubclassCharacter) => /cercle des étoiles|circle of the stars|\bétoiles?\b|\bstars?\b/i.test(druidSubclassFor(character));

export function activateWrathOfSea(character: DruidSubclassCharacter): DruidSubclassCharacter {
  const level = druidLevelForSubclass(character);
  if (level < 3 || !isSeaDruid(character) || !canSpendWildShape(character)) return character;
  const dice = Math.max(1, wisdomModifier(character));
  const spent = spendWildShape(character);
  return {
    ...spent,
    wrathOfSea: {
      active: true,
      radiusMeters: level >= 6 ? 3 : 1.5,
      durationMinutes: 10,
      damageDice: `${dice}d6`,
      saveAbility: 'con',
      pushMeters: 4.5,
      host: 'self',
    },
  };
}

export function seaPassiveBenefits(character: DruidSubclassCharacter): { swimSpeedEqualsSpeed: boolean } {
  return { swimSpeedEqualsSpeed: isSeaDruid(character) && druidLevelForSubclass(character) >= 6 };
}

export function seaStormbornBenefits(character: DruidSubclassCharacter): { flySpeedEqualsSpeed: boolean; resistances: Array<'froid' | 'foudre' | 'tonnerre'> } {
  const selfHostsWrath = character.wrathOfSea?.host !== 'ally';
  const active = isSeaDruid(character) && druidLevelForSubclass(character) >= 10 && !!character.wrathOfSea && selfHostsWrath;
  return {
    flySpeedEqualsSpeed: active,
    resistances: active ? ['froid', 'foudre', 'tonnerre'] : [],
  };
}

export function dismissWrathOfSea(character: DruidSubclassCharacter): DruidSubclassCharacter {
  if (!character.wrathOfSea) return character;
  return { ...character, wrathOfSea: null };
}

export type StarryForm = 'archer' | 'chalice' | 'dragon';
export type StarryFormState = {
  form: StarryForm;
  durationMinutes: number;
  brightLightMeters: number;
  dimLightExtraMeters: number;
  flySpeedMeters?: number;
  hover?: boolean;
  resistances?: Array<'contondants' | 'perforants' | 'tranchants'>;
};

const starryStateFor = (character: DruidSubclassCharacter, form: StarryForm): StarryFormState => {
  const level = druidLevelForSubclass(character);
  return {
    form,
    durationMinutes: 10,
    brightLightMeters: 3,
    dimLightExtraMeters: 3,
    ...(level >= 10 && form === 'dragon' ? { flySpeedMeters: 6, hover: true } : {}),
    ...(level >= 14 ? { resistances: ['contondants', 'perforants', 'tranchants'] as Array<'contondants' | 'perforants' | 'tranchants'> } : {}),
  };
};

export function activateStarryForm(character: DruidSubclassCharacter, form: StarryForm): DruidSubclassCharacter {
  if (druidLevelForSubclass(character) < 3 || !isStarsDruid(character) || !canSpendWildShape(character)) return character;
  const spent = spendWildShape(character);
  return { ...spent, starryForm: starryStateFor(character, form) };
}

export function switchStarryConstellation(character: DruidSubclassCharacter, form: StarryForm): DruidSubclassCharacter {
  if (!character.starryForm || !isStarsDruid(character) || druidLevelForSubclass(character) < 10) return character;
  return { ...character, starryForm: starryStateFor(character, form) };
}

export function dismissStarryForm(character: DruidSubclassCharacter): DruidSubclassCharacter {
  if (!character.starryForm) return character;
  return { ...character, starryForm: null };
}

export function starryArcherAttack(character: DruidSubclassCharacter): { toHitAbility: 'wis'; damage: string; rangeMeters: number } | null {
  if (character.starryForm?.form !== 'archer') return null;
  const die = druidLevelForSubclass(character) >= 10 ? '2d8' : '1d8';
  return { toHitAbility: 'wis', damage: `${die}${wisdomModifier(character) >= 0 ? '+' : ''}${wisdomModifier(character)}`, rangeMeters: 18 };
}

export function starryChaliceHealing(character: DruidSubclassCharacter): string | null {
  if (character.starryForm?.form !== 'chalice') return null;
  const wis = wisdomModifier(character);
  const die = druidLevelForSubclass(character) >= 10 ? '2d8' : '1d8';
  return `${die}${wis >= 0 ? '+' : ''}${wis}`;
}

export type StarryChaliceSpell = { lv?: number; d?: string; n?: string; id?: string };

const normalizeRuleText = (value: unknown): string => String(value || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function starryChaliceSpellMayRestoreHitPoints(spell: StarryChaliceSpell | null | undefined): boolean {
  if (!spell || Number(spell.lv || 0) < 1) return false;
  const text = normalizeRuleText(spell.d);
  if (!/(point[s]? de vie|\bpv\b)/.test(text)) return false;
  return /(recuper|rend|rendre|soign|gueri|restaur|regagn)/.test(text);
}

export function rollStarryChaliceHealing(character: DruidSubclassCharacter, random: () => number = Math.random): number | null {
  if (character.starryForm?.form !== 'chalice') return null;
  const dice = druidLevelForSubclass(character) >= 10 ? 2 : 1;
  const rolled = Array.from({ length: dice }, () => 1 + Math.floor(Math.max(0, Math.min(0.999999999, random())) * 8))
    .reduce((sum, value) => sum + value, 0);
  return Math.max(0, rolled + wisdomModifier(character));
}

export function starryDragonD20Floor(character: DruidSubclassCharacter, kind: 'int-check' | 'wis-check' | 'con-concentration'): number | null {
  if (character.starryForm?.form !== 'dragon') return null;
  return kind === 'int-check' || kind === 'wis-check' || kind === 'con-concentration' ? 10 : null;
}

export function starryDragonFlight(character: DruidSubclassCharacter): { speedMeters: number; hover: boolean } | null {
  if (character.starryForm?.form !== 'dragon' || druidLevelForSubclass(character) < 10) return null;
  return { speedMeters: 6, hover: true };
}

export function starryFormResistances(character: DruidSubclassCharacter): Array<'contondants' | 'perforants' | 'tranchants'> {
  if (!character.starryForm || druidLevelForSubclass(character) < 14) return [];
  return ['contondants', 'perforants', 'tranchants'];
}

export function starMapFreeGuidingBoltUses(character: DruidSubclassCharacter): number {
  if (druidLevelForSubclass(character) < 3 || !isStarsDruid(character)) return 0;
  return Math.max(1, wisdomModifier(character));
}

export function clearDruidSubclassTemporaryStates(character: DruidSubclassCharacter): DruidSubclassCharacter {
  return { ...character, wrathOfSea: null, starryForm: null };
}
