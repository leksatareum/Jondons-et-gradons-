import { isMoonDruid, type WildShapeCharacter } from './wild-shape';

export type MoonAdvancedCharacter = WildShapeCharacter & {
  moonlightStepUsed?: number;
};

const druidLevel = (character: MoonAdvancedCharacter): number => {
  const entry = (character.classLevels || []).find((level) => (level.classId || level.id) === 'druide');
  return Number(entry?.level || (character.classId === 'druide' ? character.level : 0) || 0);
};

const wisdomModifier = (character: MoonAdvancedCharacter): number => Math.floor((Number(character.abilities?.wis ?? 10) - 10) / 2);

export function improvedCircleFormsRules(character: MoonAdvancedCharacter): {
  canChooseRadiantDamage: boolean;
  constitutionSaveBonus: number;
} {
  const active = isMoonDruid(character) && druidLevel(character) >= 6 && !!character.activeWildShape;
  return {
    canChooseRadiantDamage: active,
    constitutionSaveBonus: active ? wisdomModifier(character) : 0,
  };
}

export function moonlightStepMaxUses(character: MoonAdvancedCharacter): number {
  if (!isMoonDruid(character) || druidLevel(character) < 10) return 0;
  return Math.max(1, wisdomModifier(character));
}

export function moonlightStepRemaining(character: MoonAdvancedCharacter): number {
  return Math.max(0, moonlightStepMaxUses(character) - Math.max(0, Number(character.moonlightStepUsed || 0)));
}

export function spendMoonlightStep(character: MoonAdvancedCharacter): MoonAdvancedCharacter {
  if (moonlightStepRemaining(character) <= 0) return character;
  return { ...character, moonlightStepUsed: Number(character.moonlightStepUsed || 0) + 1 };
}

export function restoreMoonlightStepWithSpellSlot(character: MoonAdvancedCharacter, slotLevel: number): MoonAdvancedCharacter {
  if (slotLevel < 2 || moonlightStepMaxUses(character) <= 0 || Number(character.moonlightStepUsed || 0) <= 0) return character;
  return { ...character, moonlightStepUsed: Math.max(0, Number(character.moonlightStepUsed || 0) - 1) };
}

export function resetMoonlightStepLongRest(character: MoonAdvancedCharacter): MoonAdvancedCharacter {
  if (moonlightStepMaxUses(character) <= 0) return character;
  return { ...character, moonlightStepUsed: 0 };
}

export function moonlightStepRules(character: MoonAdvancedCharacter): {
  teleportMeters: number;
  advantageOnNextAttackThisTurn: boolean;
  canBringWillingCreature: boolean;
  allyStartDistanceMeters: number;
  allyDestinationDistanceMeters: number;
} | null {
  if (moonlightStepMaxUses(character) <= 0) return null;
  return {
    teleportMeters: 9,
    advantageOnNextAttackThisTurn: true,
    canBringWillingCreature: druidLevel(character) >= 14,
    allyStartDistanceMeters: 3,
    allyDestinationDistanceMeters: 3,
  };
}

export function lunarFormRules(character: MoonAdvancedCharacter): {
  extraRadiantDamage: string;
  oncePerTurn: true;
  sharedMoonlight: true;
} | null {
  if (!isMoonDruid(character) || druidLevel(character) < 14) return null;
  return { extraRadiantDamage: '2d10', oncePerTurn: true, sharedMoonlight: true };
}
