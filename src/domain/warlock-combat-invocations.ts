import {
  agonizingBlastBonus,
  eldritchSpearRangeBonusMeters,
  hasWarlockInvocation,
  repellingBlastPushMeters,
  type WarlockRulesCharacter,
} from './warlock-levels-1-5';

type ClassLevel = { classId?: string; id?: string; level?: number };
type PactSlot = { level?: number; current?: number; max?: number };

type CombatInvocationCharacter = WarlockRulesCharacter & {
  classLevels?: ClassLevel[];
  pactSlots?: PactSlot[] | null;
  turn?: { eldritchSmiteUsed?: boolean; [key: string]: unknown };
};

export type EldritchSmiteOffer = {
  slotLevel: number;
  dice: number;
  damageFormula: string;
  mayProneHugeOrSmaller: true;
};

export function warlockLevelForCombat(character: CombatInvocationCharacter): number {
  const entry = (character.classLevels || []).find((candidate) => (candidate.classId || candidate.id) === 'occultiste');
  if (entry) return Math.max(0, Math.floor(Number(entry.level) || 0));
  return character.classId === 'occultiste' ? Math.max(0, Math.floor(Number(character.level) || 0)) : 0;
}

export function eldritchSmiteDice(slotLevel: number): number {
  return Math.max(0, Math.floor(Number(slotLevel) || 0)) + 1;
}

export function eldritchSmiteOffer(character: CombatInvocationCharacter, weaponId?: string | null): EldritchSmiteOffer | null {
  if (warlockLevelForCombat(character) < 5) return null;
  if (!hasWarlockInvocation(character, 'pact-blade') || !hasWarlockInvocation(character, 'eldritch-smite')) return null;
  if (!weaponId || character.pactBladeWeaponId !== weaponId || character.turn?.eldritchSmiteUsed) return null;
  const slot = (character.pactSlots || []).find((candidate) => Number(candidate.current) > 0 && Number(candidate.level) > 0);
  if (!slot) return null;
  const slotLevel = Math.floor(Number(slot.level));
  const dice = eldritchSmiteDice(slotLevel);
  return { slotLevel, dice, damageFormula: `${dice}d8 Force`, mayProneHugeOrSmaller: true };
}

export function eldritchBlastBeamCount(characterLevel: number): number {
  const level = Math.max(1, Math.floor(Number(characterLevel) || 1));
  if (level >= 17) return 4;
  if (level >= 11) return 3;
  if (level >= 5) return 2;
  return 1;
}

export function attackRollCountForCantrip(cantripId: string, characterLevel: number): number {
  return cantripId === 'explosion-occulte' ? eldritchBlastBeamCount(characterLevel) : 1;
}

export function effectiveEldritchSpearRangeMeters(
  character: CombatInvocationCharacter,
  cantripId: string,
  baseRange: string,
): number | null {
  const match = String(baseRange || '').match(/(\d+(?:[.,]\d+)?)\s*m\b/i);
  if (!match) return null;
  const base = Number(match[1].replace(',', '.'));
  const bonus = eldritchSpearRangeBonusMeters(character, cantripId, warlockLevelForCombat(character));
  return bonus > 0 ? base + bonus : null;
}

export function repellingBlastResolution(character: CombatInvocationCharacter, cantripId: string, characterLevel: number) {
  const pushMeters = repellingBlastPushMeters(character, cantripId);
  if (pushMeters <= 0) return null;
  return {
    pushMeters,
    attackRolls: attackRollCountForCantrip(cantripId, characterLevel),
    maximumTargetSize: 'Grande',
  } as const;
}

export function agonizingCantripDamageDisplay(
  character: CombatInvocationCharacter,
  cantripId: string,
  characterLevel: number,
  baseDie: string | null,
): string | null {
  if (!baseDie) return null;
  const bonus = agonizingBlastBonus(character, cantripId);
  if (cantripId === 'explosion-occulte') {
    const beams = eldritchBlastBeamCount(characterLevel);
    const perBeam = bonus ? `1d10${bonus >= 0 ? '+' : ''}${bonus}` : '1d10';
    return beams > 1 ? `${beams} × (${perBeam})` : perBeam;
  }
  if (!bonus) return baseDie;
  return `${baseDie}${bonus >= 0 ? '+' : ''}${bonus}`;
}
