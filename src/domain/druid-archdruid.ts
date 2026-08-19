type ClassLevel = { classId?: string; id?: string; level?: number };
type Resource = { name: string; current: number; max: number; [key: string]: unknown };
type SpellSlot = { level: number; current: number; max: number; temporary?: number; [key: string]: unknown };

export type ArchdruidCharacter = {
  classId?: string;
  level?: number;
  classLevels?: ClassLevel[];
  resources?: Resource[];
  slots?: SpellSlot[] | null;
  turn?: Record<string, unknown>;
  [key: string]: unknown;
};

const druidLevel = (character: ArchdruidCharacter): number => {
  const entry = (character.classLevels || []).find((level) => (level.classId || level.id) === 'druide');
  return Number(entry?.level || (character.classId === 'druide' ? character.level : 0) || 0);
};

const resourceOf = (character: ArchdruidCharacter, name: string): Resource | undefined =>
  character.resources?.find((resource) => resource.name === name);

export type NatureMagicianOption = { wildShapeUses: number; slotLevel: number };

export function natureMagicianOptions(character: ArchdruidCharacter): NatureMagicianOption[] {
  if (druidLevel(character) < 20) return [];
  const wildShape = resourceOf(character, 'Forme sauvage');
  const natureMagician = resourceOf(character, 'Magicien de la nature');
  if (!wildShape || wildShape.current <= 0 || !natureMagician || natureMagician.current <= 0) return [];
  return Array.from({ length: Math.min(4, wildShape.current) }, (_, index) => {
    const wildShapeUses = index + 1;
    return { wildShapeUses, slotLevel: wildShapeUses * 2 };
  });
}

export function convertWildShapeToSpellSlot(
  character: ArchdruidCharacter,
  wildShapeUses: number,
): ArchdruidCharacter {
  const uses = Math.trunc(wildShapeUses || 0);
  const option = natureMagicianOptions(character).find((candidate) => candidate.wildShapeUses === uses);
  if (!option) return character;

  const slots = character.slots || [];
  const existing = slots.find((slot) => slot.level === option.slotLevel);
  const nextSlots = existing
    ? slots.map((slot) => slot === existing ? {
      ...slot,
      current: slot.current + 1,
      temporary: Number(slot.temporary || 0) + 1,
    } : slot)
    : [...slots, { level: option.slotLevel, current: 1, max: 0, temporary: 1 }]
      .sort((left, right) => left.level - right.level);

  return {
    ...character,
    slots: nextSlots,
    resources: (character.resources || []).map((resource) => {
      if (resource.name === 'Forme sauvage') return { ...resource, current: resource.current - uses };
      if (resource.name === 'Magicien de la nature') return { ...resource, current: resource.current - 1 };
      return resource;
    }),
  };
}
