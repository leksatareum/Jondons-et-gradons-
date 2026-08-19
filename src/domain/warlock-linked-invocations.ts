export type InvocationSelection = string | string[];

export type LinkedWarlockCharacter = {
  level?: number;
  classId?: string;
  abilities?: { cha?: number; [key: string]: number | undefined };
  classLevels?: Array<{ classId?: string; id?: string; level?: number }>;
  classSelections?: Record<string, { invocations?: InvocationSelection }>;
  classChoices?: { invocations?: InvocationSelection };
  turn?: Record<string, unknown>;
  gazeTwoMinds?: GazeTwoMindsBond | null;
  [key: string]: unknown;
};

export type GazeTwoMindsBond = {
  targetName: string;
  specialSenses: string;
  remainingOwnerTurnEnds: number;
  castingOriginMaxDistanceMeters: 18;
  samePlaneRequired: true;
};

export type InvestmentMovement = 'fly' | 'swim';
export type InvestmentDamageType = 'Nécrotique' | 'Radiant';

export type InvestedFamiliar = {
  family?: string;
  source?: string;
  speed?: string;
  investmentChainMaster?: boolean;
  investmentMovement?: InvestmentMovement | null;
  investmentDamageType?: InvestmentDamageType | null;
  saveDc?: number;
  resistanceToNextDamage?: boolean;
  [key: string]: unknown;
};

const selectedInvocationIds = (character: LinkedWarlockCharacter): string[] => {
  const raw = character.classSelections?.occultiste?.invocations
    ?? (character.classId === 'occultiste' ? character.classChoices?.invocations : undefined)
    ?? [];
  return Array.isArray(raw) ? raw.map(String).filter(Boolean) : raw ? [String(raw)] : [];
};

const hasInvocation = (character: LinkedWarlockCharacter, id: string): boolean =>
  selectedInvocationIds(character).some((optionId) => optionId.split('@')[0] === id);

export function linkedWarlockLevel(character: LinkedWarlockCharacter): number {
  const entry = (character.classLevels || []).find((candidate) => (candidate.classId || candidate.id) === 'occultiste');
  if (entry) return Math.max(0, Math.floor(Number(entry.level) || 0));
  return character.classId === 'occultiste' ? Math.max(0, Math.floor(Number(character.level) || 0)) : 0;
}

export function characterLevel(character: LinkedWarlockCharacter): number {
  const levels = character.classLevels || [];
  if (levels.length > 0) return Math.max(1, levels.reduce((sum, entry) => sum + Math.max(0, Math.floor(Number(entry.level) || 0)), 0));
  return Math.max(1, Math.floor(Number(character.level) || 1));
}

export function proficiencyBonusAtLevel(level: number): number {
  return 2 + Math.floor((Math.max(1, Math.floor(Number(level) || 1)) - 1) / 4);
}

export function warlockSpellSaveDc(character: LinkedWarlockCharacter): number {
  const cha = Math.floor((Number(character.abilities?.cha ?? 10) - 10) / 2);
  return 8 + proficiencyBonusAtLevel(characterLevel(character)) + cha;
}

export function hasGazeOfTwoMinds(character: LinkedWarlockCharacter): boolean {
  return linkedWarlockLevel(character) >= 5 && hasInvocation(character, 'gaze-of-two-minds');
}

export function beginGazeOfTwoMinds(character: LinkedWarlockCharacter, targetName: string, specialSenses = ''): LinkedWarlockCharacter {
  if (!hasGazeOfTwoMinds(character) || !String(targetName || '').trim()) return character;
  return {
    ...character,
    gazeTwoMinds: {
      targetName: String(targetName).trim(),
      specialSenses: String(specialSenses || '').trim(),
      remainingOwnerTurnEnds: 2,
      castingOriginMaxDistanceMeters: 18,
      samePlaneRequired: true,
    },
  };
}

export function maintainGazeOfTwoMinds(character: LinkedWarlockCharacter): LinkedWarlockCharacter {
  if (!hasGazeOfTwoMinds(character) || !character.gazeTwoMinds) return character;
  return { ...character, gazeTwoMinds: { ...character.gazeTwoMinds, remainingOwnerTurnEnds: 2 } };
}

export function advanceGazeOfTwoMindsAtTurnEnd(character: LinkedWarlockCharacter): LinkedWarlockCharacter {
  const bond = character.gazeTwoMinds;
  if (!bond) return character;
  const remaining = Math.max(0, Number(bond.remainingOwnerTurnEnds || 0) - 1);
  return { ...character, gazeTwoMinds: remaining > 0 ? { ...bond, remainingOwnerTurnEnds: remaining } : null };
}

export function hasInvestmentOfChainMaster(character: LinkedWarlockCharacter): boolean {
  return linkedWarlockLevel(character) >= 5
    && hasInvocation(character, 'pact-chain')
    && hasInvocation(character, 'investment-chain-master');
}

export function isPactChainFamiliar(companion: InvestedFamiliar | null | undefined): boolean {
  return Boolean(companion && companion.family === 'familiar' && companion.source === 'pact-chain');
}

const stripInvestmentSpeed = (speed: string): string => String(speed || '')
  .split(' · ')
  .filter((part) => !/^vol 12 m$/i.test(part.trim()) && !/^nage 12 m$/i.test(part.trim()))
  .join(' · ');

export function applyInvestmentToFamiliar(
  character: LinkedWarlockCharacter,
  companion: InvestedFamiliar,
  movement: InvestmentMovement | null = (companion.investmentMovement as InvestmentMovement | null) || null,
): InvestedFamiliar {
  if (!hasInvestmentOfChainMaster(character) || !isPactChainFamiliar(companion)) return companion;
  const baseSpeed = stripInvestmentSpeed(String(companion.speed || ''));
  const extraSpeed = movement === 'fly' ? 'vol 12 m' : movement === 'swim' ? 'nage 12 m' : '';
  return {
    ...companion,
    investmentChainMaster: true,
    investmentMovement: movement,
    speed: [baseSpeed, extraSpeed].filter(Boolean).join(' · '),
    saveDc: warlockSpellSaveDc(character),
  };
}

export function investedFamiliarDamageType(
  character: LinkedWarlockCharacter,
  companion: InvestedFamiliar,
  damageType: InvestmentDamageType,
): InvestedFamiliar {
  if (!hasInvestmentOfChainMaster(character) || !isPactChainFamiliar(companion)) return companion;
  return { ...companion, investmentChainMaster: true, investmentDamageType: damageType };
}

export function grantInvestmentResistance(
  character: LinkedWarlockCharacter,
  companion: InvestedFamiliar,
): InvestedFamiliar {
  if (!hasInvestmentOfChainMaster(character) || !isPactChainFamiliar(companion)) return companion;
  return { ...companion, investmentChainMaster: true, resistanceToNextDamage: true };
}

export function resolveInvestedFamiliarDamage(companion: InvestedFamiliar, damage: number): { companion: InvestedFamiliar; damage: number } {
  const announced = Math.max(0, Math.floor(Number(damage) || 0));
  if (!companion.resistanceToNextDamage) return { companion, damage: announced };
  return {
    companion: { ...companion, resistanceToNextDamage: false },
    damage: Math.floor(announced / 2),
  };
}
