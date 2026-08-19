export type SpellSlotLike = {
  level: number;
  current: number;
  max: number;
  pact?: boolean;
  temporary?: number;
  [key: string]: unknown;
};

export type ResourceLike = {
  name: string;
  current: number;
  max: number;
  [key: string]: unknown;
};

export type WildResurgenceCharacter = {
  slots?: SpellSlotLike[] | null;
  pactSlots?: SpellSlotLike[] | null;
  resources?: ResourceLike[] | null;
  turn?: Record<string, unknown> | null;
  [key: string]: unknown;
};

export type WildResurgenceSlotOption = {
  pool: 'slots' | 'pactSlots';
  level: number;
  current: number;
  pact: boolean;
};

export const rangerShortRestExhaustion = (rangerLevel: number, exhaustion: number): number =>
  rangerLevel >= 10 ? Math.max(0, Math.min(6, Math.trunc(exhaustion || 0)) - 1) : Math.max(0, Math.min(6, Math.trunc(exhaustion || 0)));

export const rangerDamageCannotBreakConcentration = (rangerLevel: number, concentrationDetail: string | null | undefined): boolean =>
  rangerLevel >= 13 && /marque du chasseur|hunter'?s mark/i.test(String(concentrationDetail || ''));

export const rangerTirelessUses = (wisdomModifier: number): number => Math.max(1, Math.trunc(wisdomModifier || 0));

export function wildResurgenceSlotOptions(character: WildResurgenceCharacter): WildResurgenceSlotOption[] {
  const standard = (character.slots || []).filter((slot) => slot.current > 0).map((slot) => ({
    pool: 'slots' as const, level: slot.level, current: slot.current, pact: false,
  }));
  const pact = (character.pactSlots || []).filter((slot) => slot.current > 0).map((slot) => ({
    pool: 'pactSlots' as const, level: slot.level, current: slot.current, pact: true,
  }));
  return [...standard, ...pact].sort((left, right) => left.level - right.level || Number(left.pact) - Number(right.pact));
}

export function canRestoreWildShapeWithSlot(character: WildResurgenceCharacter): boolean {
  const wildShape = (character.resources || []).find((resource) => resource.name === 'Forme sauvage');
  return Boolean(
    wildShape
    && wildShape.current === 0
    && character.turn?.wildResurgenceUsed !== true
    && wildResurgenceSlotOptions(character).length > 0,
  );
}

export function applyWildResurgence(
  character: WildResurgenceCharacter,
  options: { direction: 'slot-to-shape'; pool: 'slots' | 'pactSlots'; level: number } | { direction: 'shape-to-slot' },
): { character: WildResurgenceCharacter; applied: boolean } {
  const resources = character.resources || [];
  const wildShape = resources.find((resource) => resource.name === 'Forme sauvage');
  const resurgence = resources.find((resource) => resource.name === 'Résurgence sauvage');
  if (!wildShape) return { character, applied: false };

  if (options.direction === 'slot-to-shape') {
    if (!canRestoreWildShapeWithSlot(character)) return { character, applied: false };
    const key = options.pool;
    const pool = character[key] || [];
    const slot = pool.find((entry) => entry.level === options.level && entry.current > 0);
    if (!slot) return { character, applied: false };
    return {
      applied: true,
      character: {
        ...character,
        [key]: pool.map((entry) => entry === slot ? {
          ...entry,
          current: entry.current - 1,
          temporary: Math.max(0, (entry.temporary || 0) - 1),
        } : entry),
        resources: resources.map((resource) => resource === wildShape ? { ...resource, current: 1 } : resource),
        turn: { ...(character.turn || {}), wildResurgenceUsed: true },
      },
    };
  }

  if (!resurgence || resurgence.current <= 0 || wildShape.current <= 0) return { character, applied: false };
  const slots = character.slots || [];
  const levelOne = slots.find((slot) => slot.level === 1);
  const nextSlots = levelOne
    ? slots.map((slot) => slot === levelOne ? {
      ...slot,
      current: slot.current + 1,
      temporary: (slot.temporary || 0) + 1,
    } : slot)
    : [...slots, { level: 1, current: 1, max: 0, temporary: 1 }].sort((left, right) => left.level - right.level);
  return {
    applied: true,
    character: {
      ...character,
      slots: nextSlots,
      resources: resources.map((resource) => {
        if (resource === wildShape) return { ...resource, current: resource.current - 1 };
        if (resource === resurgence) return { ...resource, current: resource.current - 1 };
        return resource;
      }),
    },
  };
}

export const magicalCunningRecoveredSlots = (current: number, maximum: number, warlockLevel: number): number => {
  const max = Math.max(0, Math.trunc(maximum || 0));
  const now = Math.max(0, Math.min(max, Math.trunc(current || 0)));
  const recovered = warlockLevel >= 20 ? max : Math.ceil(max / 2);
  return Math.min(max, now + recovered);
};
