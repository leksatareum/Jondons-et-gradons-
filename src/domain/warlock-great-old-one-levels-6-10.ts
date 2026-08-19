export type WarlockClassLevel = {
  classId?: string;
  id?: string;
  level?: number;
  subclass?: string | null;
};

export type WarlockResource = {
  name?: string;
  resourceKey?: string;
  current: number;
  max: number;
  [key: string]: unknown;
};

export type WarlockPactSlot = {
  level: number;
  current: number;
  max: number;
  [key: string]: unknown;
};

export type AwakenedMindBond = {
  targetName: string;
  clairvoyantCombatantPending?: boolean;
  clairvoyantCombatantActive?: boolean;
  [key: string]: unknown;
};

export type EldritchHexAbility = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export type GreatOldOneCharacter = {
  level?: number;
  classId?: string;
  subclass?: string | null;
  abilities?: Record<string, number>;
  classLevels?: WarlockClassLevel[];
  resources?: WarlockResource[];
  pactSlots?: WarlockPactSlot[] | null;
  awakenedMindBond?: AwakenedMindBond | null;
  greatOldOneHex?: { targetName: string; ability: EldritchHexAbility } | null;
  conditions?: Array<{ label?: string; detail?: string; [key: string]: unknown }>;
  turn?: Record<string, unknown>;
  [key: string]: unknown;
};

const resourceIdentity = (resource: WarlockResource): string => String(resource.resourceKey || resource.name || '');

export function warlockLevelSixToTen(character: GreatOldOneCharacter): number {
  const entry = (character.classLevels || []).find((candidate) => (candidate.classId || candidate.id) === 'occultiste');
  if (entry) return Math.max(0, Math.floor(Number(entry.level) || 0));
  return character.classId === 'occultiste' ? Math.max(0, Math.floor(Number(character.level) || 0)) : 0;
}

export function totalCharacterLevelSixToTen(character: GreatOldOneCharacter): number {
  const entries = character.classLevels || [];
  if (entries.length > 0) return Math.max(1, entries.reduce((sum, entry) => sum + Math.max(0, Math.floor(Number(entry.level) || 0)), 0));
  return Math.max(1, Math.floor(Number(character.level) || 1));
}

export function proficiencyBonusSixToTen(character: GreatOldOneCharacter): number {
  return 2 + Math.floor((totalCharacterLevelSixToTen(character) - 1) / 4);
}

export function greatOldOneSubclass(character: GreatOldOneCharacter): boolean {
  const entry = (character.classLevels || []).find((candidate) => (candidate.classId || candidate.id) === 'occultiste');
  const subclass = entry?.subclass || (character.classId === 'occultiste' ? character.subclass : null);
  return subclass === 'Patron Grand Ancien';
}

export function greatOldOneSpellSaveDc(character: GreatOldOneCharacter): number {
  const cha = Math.floor((Number(character.abilities?.cha ?? 10) - 10) / 2);
  return 8 + proficiencyBonusSixToTen(character) + cha;
}

export function clairvoyantCombatantResource(character: GreatOldOneCharacter): WarlockResource | null {
  return (character.resources || []).find((resource) => resourceIdentity(resource) === 'Combattant clairvoyant' || resource.name === 'Combattant clairvoyant') || null;
}

export function clairvoyantCombatantEligible(character: GreatOldOneCharacter): boolean {
  return greatOldOneSubclass(character) && warlockLevelSixToTen(character) >= 6;
}

export function awakenedMindBondWithClairvoyantTrigger(
  character: GreatOldOneCharacter,
  bond: AwakenedMindBond,
): AwakenedMindBond {
  const resource = clairvoyantCombatantResource(character);
  return {
    ...bond,
    clairvoyantCombatantPending: Boolean(clairvoyantCombatantEligible(character) && resource && resource.current > 0),
    clairvoyantCombatantActive: false,
  };
}

export function resolveClairvoyantCombatant(
  character: GreatOldOneCharacter,
  saveFailed: boolean,
): GreatOldOneCharacter {
  const resource = clairvoyantCombatantResource(character);
  const bond = character.awakenedMindBond;
  if (!clairvoyantCombatantEligible(character) || !resource || resource.current <= 0 || !bond?.clairvoyantCombatantPending) return character;

  return {
    ...character,
    resources: (character.resources || []).map((entry) => resourceIdentity(entry) === resourceIdentity(resource)
      ? { ...entry, current: Math.max(0, entry.current - 1) }
      : entry),
    awakenedMindBond: {
      ...bond,
      clairvoyantCombatantPending: false,
      clairvoyantCombatantActive: saveFailed,
    },
  };
}

export function declineClairvoyantCombatant(character: GreatOldOneCharacter): GreatOldOneCharacter {
  if (!character.awakenedMindBond?.clairvoyantCombatantPending) return character;
  return {
    ...character,
    awakenedMindBond: { ...character.awakenedMindBond, clairvoyantCombatantPending: false },
  };
}

export function restoreClairvoyantCombatantWithPactMagic(character: GreatOldOneCharacter): GreatOldOneCharacter {
  const resource = clairvoyantCombatantResource(character);
  const slot = (character.pactSlots || []).find((candidate) => candidate.current > 0);
  if (!clairvoyantCombatantEligible(character) || !resource || resource.current >= resource.max || !slot) return character;
  return {
    ...character,
    pactSlots: (character.pactSlots || []).map((candidate) => candidate.level === slot.level
      ? { ...candidate, current: Math.max(0, candidate.current - 1) }
      : candidate),
    resources: (character.resources || []).map((entry) => resourceIdentity(entry) === resourceIdentity(resource)
      ? { ...entry, current: entry.max }
      : entry),
  };
}

const sameTarget = (a: string | null | undefined, b: string | null | undefined): boolean =>
  Boolean(a && b && String(a).trim().toLocaleLowerCase('fr') === String(b).trim().toLocaleLowerCase('fr'));

export function clairvoyantCombatantAttackAdvantage(character: GreatOldOneCharacter, targetName: string): boolean {
  const bond = character.awakenedMindBond;
  return Boolean(clairvoyantCombatantEligible(character) && bond?.clairvoyantCombatantActive && sameTarget(bond.targetName, targetName));
}

export function clairvoyantCombatantTargetAttackDisadvantage(character: GreatOldOneCharacter, attackerName: string): boolean {
  return clairvoyantCombatantAttackAdvantage(character, attackerName);
}

export function thoughtShieldActive(character: GreatOldOneCharacter): boolean {
  return greatOldOneSubclass(character) && warlockLevelSixToTen(character) >= 10;
}

export function thoughtShieldReflection(character: GreatOldOneCharacter, damageTaken: number, damageType: string | null | undefined): number {
  if (!thoughtShieldActive(character) || String(damageType || '').toLocaleLowerCase('fr') !== 'psychique') return 0;
  return Math.max(0, Math.floor(Number(damageTaken) || 0));
}

export function hasEldritchHex(character: GreatOldOneCharacter): boolean {
  return greatOldOneSubclass(character) && warlockLevelSixToTen(character) >= 10;
}

export function setEldritchHexTarget(
  character: GreatOldOneCharacter,
  targetName: string,
  ability: EldritchHexAbility,
): GreatOldOneCharacter {
  if (!hasEldritchHex(character) || !String(targetName || '').trim()) return character;
  return { ...character, greatOldOneHex: { targetName: String(targetName).trim(), ability } };
}

export function activeEldritchHex(character: GreatOldOneCharacter): GreatOldOneCharacter['greatOldOneHex'] {
  if (!hasEldritchHex(character) || !character.greatOldOneHex) return null;
  const concentratingOnHex = (character.conditions || []).some((condition) =>
    condition.label === 'Concentration' && /maléfice/i.test(String(condition.detail || '')));
  return concentratingOnHex ? character.greatOldOneHex : null;
}

export function moveEldritchHexTarget(character: GreatOldOneCharacter, targetName: string): GreatOldOneCharacter {
  const active = activeEldritchHex(character);
  if (!active || !String(targetName || '').trim() || character.turn?.bonus) return character;
  return {
    ...character,
    greatOldOneHex: { ...active, targetName: String(targetName).trim() },
    turn: { ...(character.turn || {}), bonus: true },
  };
}

export function contactPatronEligible(character: GreatOldOneCharacter): boolean {
  return warlockLevelSixToTen(character) >= 9;
}

export function contactPatronResource(character: GreatOldOneCharacter): WarlockResource | null {
  return (character.resources || []).find((resource) => resourceIdentity(resource) === 'occultiste:spell:contact-autre-plan') || null;
}
