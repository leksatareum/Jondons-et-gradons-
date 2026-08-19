export type InvocationSelection = string | string[];

export type PactSpell = {
  id: string;
  lv?: number;
  ri?: boolean;
  [key: string]: unknown;
};

export type PactTomeBook = {
  cantrips: string[];
  rituals: string[];
};

export type PactCompanion = {
  id?: string;
  family?: string;
  source?: string;
  turn?: Record<string, boolean>;
  [key: string]: unknown;
};

export type PactCharacter = {
  classId?: string;
  classSelections?: Record<string, { invocations?: InvocationSelection }>;
  classChoices?: { invocations?: InvocationSelection };
  cantrips?: string[];
  cantripSources?: Record<string, string | string[]>;
  spells?: Array<Record<string, any>>;
  companions?: PactCompanion[];
  turn?: Record<string, any>;
  pactBladeWeaponId?: string | null;
  pactBladeDamageType?: string | null;
  pactTomeBook?: PactTomeBook | null;
  pactTomeConjureAvailable?: boolean;
  [key: string]: unknown;
};

export const PACT_BLADE_DAMAGE_TYPES = ['normal', 'Nécrotique', 'Psychique', 'Radiant'] as const;
export type PactBladeDamageType = typeof PACT_BLADE_DAMAGE_TYPES[number];

const selectedInvocationIds = (character: PactCharacter): string[] => {
  const raw = character.classSelections?.occultiste?.invocations
    ?? (character.classId === 'occultiste' ? character.classChoices?.invocations : undefined)
    ?? [];
  return Array.isArray(raw) ? raw.map(String).filter(Boolean) : raw ? [String(raw)] : [];
};

export function hasPactInvocation(character: PactCharacter, invocationId: string): boolean {
  return selectedInvocationIds(character).some((optionId) => optionId.split('@')[0] === invocationId);
}

export function pactBladeDamageType(character: PactCharacter, weaponId?: string | null, normalType = ''): string {
  if (!weaponId || character.pactBladeWeaponId !== weaponId || !hasPactInvocation(character, 'pact-blade')) return normalType;
  const chosen = String(character.pactBladeDamageType || 'normal');
  return chosen === 'normal' ? normalType : chosen;
}

export function bindPactBlade(
  character: PactCharacter,
  weaponId: string,
  damageType: PactBladeDamageType = 'normal',
): PactCharacter {
  if (!hasPactInvocation(character, 'pact-blade') || !String(weaponId || '').trim()) return character;
  return { ...character, pactBladeWeaponId: weaponId, pactBladeDamageType: damageType };
}

export function endPactBlade(character: PactCharacter): PactCharacter {
  if (!character.pactBladeWeaponId && !character.pactBladeDamageType) return character;
  const conjuredAttackId = String(character.pactBladeConjuredAttackId || '');
  return {
    ...character,
    pactBladeWeaponId: null,
    pactBladeDamageType: null,
    pactBladeConjuredAttackId: null,
    attacks: conjuredAttackId
      ? ((character.attacks as Array<Record<string, unknown>> | undefined) || []).filter((attack) => attack.id !== conjuredAttackId)
      : character.attacks,
  };
}

export function pactTomeEligibleCantrips(spells: PactSpell[], preparedIds: string[]): PactSpell[] {
  const blocked = new Set(preparedIds);
  return spells.filter((spell) => Number(spell.lv) === 0 && !blocked.has(spell.id));
}

export function pactTomeEligibleRituals(spells: PactSpell[], preparedIds: string[]): PactSpell[] {
  const blocked = new Set(preparedIds);
  return spells.filter((spell) => Number(spell.lv) === 1 && spell.ri === true && !blocked.has(spell.id));
}

export function validatePactTomeSelection(
  cantripIds: string[],
  ritualIds: string[],
  eligibleCantripIds: string[],
  eligibleRitualIds: string[],
): boolean {
  const cantrips = [...new Set(cantripIds)];
  const rituals = [...new Set(ritualIds)];
  if (cantrips.length !== 3 || rituals.length !== 2) return false;
  const cantripSet = new Set(eligibleCantripIds);
  const ritualSet = new Set(eligibleRitualIds);
  return cantrips.every((id) => cantripSet.has(id)) && rituals.every((id) => ritualSet.has(id));
}

const sourceClassesFor = (character: PactCharacter, cantripId: string): string[] => {
  const raw = character.cantripSources?.[cantripId];
  if (Array.isArray(raw)) return raw.map(String);
  return raw ? [String(raw)] : [];
};

export function openPactTomeConjuration(character: PactCharacter): PactCharacter {
  if (!hasPactInvocation(character, 'pact-tome')) return character;
  return { ...character, pactTomeConjureAvailable: true };
}

export function conjurePactTome(character: PactCharacter, cantripIds: string[], ritualIds: string[]): PactCharacter {
  if (!hasPactInvocation(character, 'pact-tome') || cantripIds.length !== 3 || ritualIds.length !== 2) return character;
  const previous = character.pactTomeBook || { cantrips: [], rituals: [] };
  const cantrips = new Set(character.cantrips || []);
  const cantripSources: Record<string, string[]> = Object.fromEntries(
    Object.keys(character.cantripSources || {}).map((id) => [id, sourceClassesFor(character, id)]),
  );

  previous.cantrips.forEach((id) => {
    const remainingSources = (cantripSources[id] || []).filter((source) => source !== 'pact-tome');
    if (remainingSources.length > 0) cantripSources[id] = remainingSources;
    else {
      delete cantripSources[id];
      cantrips.delete(id);
    }
  });
  cantripIds.forEach((id) => {
    cantrips.add(id);
    cantripSources[id] = [...new Set([...(cantripSources[id] || []), 'pact-tome'])];
  });

  const spells = (character.spells || [])
    .filter((entry) => entry.sourceClass !== 'pact-tome')
    .concat(ritualIds.map((id) => ({
      id,
      prepared: true,
      always: true,
      source: 'pact-tome',
      sourceClass: 'pact-tome',
      castingAbility: 'cha',
    })));

  return {
    ...character,
    cantrips: [...cantrips],
    cantripSources,
    spells,
    pactTomeBook: { cantrips: [...cantripIds], rituals: [...ritualIds] },
    pactTomeConjureAvailable: false,
  };
}

export type PactChainAttackResult = {
  character: PactCharacter;
  startedAttackAction: boolean;
  attacksRemaining: number;
};

export function forgoAttackForPactFamiliar(
  character: PactCharacter,
  companionId: string,
  attacksWhenStartingAction: number,
): PactChainAttackResult | null {
  if (!hasPactInvocation(character, 'pact-chain')) return null;
  const companions = character.companions || [];
  const companion = companions.find((entry) => entry.id === companionId);
  if (!companion || companion.source !== 'pact-chain' || companion.turn?.reaction) return null;

  const currentRemaining = Math.max(0, Math.floor(Number(character.turn?.attacksRemaining) || 0));
  const startedAttackAction = currentRemaining === 0;
  if (startedAttackAction && character.turn?.action) return null;
  const available = startedAttackAction ? Math.max(1, Math.floor(Number(attacksWhenStartingAction) || 1)) : currentRemaining;
  if (available <= 0) return null;

  const attacksRemaining = Math.max(0, available - 1);
  const turn = startedAttackAction
    ? { ...(character.turn || {}), action: true, attacksRemaining }
    : { ...(character.turn || {}), attacksRemaining };

  return {
    character: {
      ...character,
      turn,
      companions: companions.map((entry) => entry.id === companionId
        ? { ...entry, turn: { ...(entry.turn || {}), reaction: true } }
        : entry),
    },
    startedAttackAction,
    attacksRemaining,
  };
}
