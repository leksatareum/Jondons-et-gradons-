export type RuntimeCondition = { label?: string; detail?: string; [key: string]: unknown };
export type RuntimeSlot = { level: number; current: number; max?: number; pact?: boolean; [key: string]: unknown };
export type RuntimeSpellEntry = {
  id: string;
  sourceClass?: string;
  castingAbility?: string;
  prepared?: boolean;
  always?: boolean;
  [key: string]: unknown;
};

export type RuntimeCharacter = {
  id?: string;
  campaignId?: string;
  classId?: string;
  level?: number;
  abilities?: Record<string, number>;
  conditions?: RuntimeCondition[];
  spells?: RuntimeSpellEntry[];
  slots?: RuntimeSlot[];
  pactSlots?: RuntimeSlot[];
  turn?: Record<string, unknown>;
  [key: string]: unknown;
};

export type RuntimeCombatant = {
  id: string;
  characterId?: string | null;
  name?: string;
  [key: string]: unknown;
};

export type RuntimeEncounter = {
  id?: string;
  round?: number;
  turnIndex?: number;
  status?: string;
  combatants?: RuntimeCombatant[];
  [key: string]: unknown;
};

export const normalizeRuntimeText = (value: unknown): string =>
  String(value || '').toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

export function concentrationName(character: RuntimeCharacter | null | undefined): string | null {
  const condition = (character?.conditions || []).find((entry) => entry?.label === 'Concentration');
  const detail = typeof condition?.detail === 'string' ? condition.detail.trim() : '';
  return detail || null;
}

const slotPools = (character: RuntimeCharacter | null | undefined): RuntimeSlot[] => [
  ...(character?.slots || []).map((slot) => ({ ...slot, pact: false })),
  ...(character?.pactSlots || []).map((slot) => ({ ...slot, pact: true })),
];

export type SpentSlot = { level: number; pact: boolean; amount: number };

export function inferSpentSlot(
  previous: RuntimeCharacter | null | undefined,
  current: RuntimeCharacter | null | undefined,
): SpentSlot | null {
  const before = new Map(slotPools(previous).map((slot) => [`${slot.pact ? 'pact' : 'spell'}:${slot.level}`, slot]));
  const spent: SpentSlot[] = [];
  slotPools(current).forEach((slot) => {
    const old = before.get(`${slot.pact ? 'pact' : 'spell'}:${slot.level}`);
    const amount = Math.max(0, Number(old?.current || 0) - Number(slot.current || 0));
    if (amount > 0) spent.push({ level: Number(slot.level), pact: !!slot.pact, amount });
  });
  if (!spent.length) return null;
  return spent.sort((left, right) => right.level - left.level || Number(right.pact) - Number(left.pact))[0];
}

/**
 * Détecte un vrai lancement de sort à Concentration à partir des mutations que
 * produit déjà l'application. Un simple tour où le personnage conserve sa
 * Concentration ne déclenche rien.
 */
export function concentrationCastSignal(
  previous: RuntimeCharacter | null | undefined,
  current: RuntimeCharacter | null | undefined,
): { name: string; spentSlot: SpentSlot | null } | null {
  const name = concentrationName(current);
  if (!name) return null;
  const oldName = concentrationName(previous);
  const spentSlot = inferSpentSlot(previous, current);
  const slotSpellStarted = previous?.turn?.spellSlotCast !== true && current?.turn?.spellSlotCast === true;
  if (normalizeRuntimeText(oldName) !== normalizeRuntimeText(name) || spentSlot || slotSpellStarted) {
    return { name, spentSlot };
  }
  return null;
}

const SPELL_ABILITIES: Record<string, string> = {
  magicien: 'int', guerrier: 'int', roublard: 'int',
  ensorceleur: 'cha', occultiste: 'cha', barde: 'cha', paladin: 'cha',
  clerc: 'wis', druide: 'wis', rodeur: 'wis',
};

export type CastingSource = { sourceClass: string; ability: string; ambiguous: boolean };

export function inferCastingSource(character: RuntimeCharacter, spellId: string): CastingSource {
  const matching = (character.spells || []).filter((entry) => entry.id === spellId);
  const preferred = matching.filter((entry) => entry.prepared || entry.always);
  const candidates = preferred.length ? preferred : matching;
  const normalized = candidates.map((entry) => ({
    sourceClass: entry.sourceClass || character.classId || 'inconnu',
    ability: entry.castingAbility || SPELL_ABILITIES[entry.sourceClass || character.classId || ''] || 'wis',
  }));
  const unique = [...new Map(normalized.map((entry) => [`${entry.sourceClass}:${entry.ability}`, entry])).values()];
  const chosen = unique[0] || {
    sourceClass: character.classId || 'inconnu',
    ability: SPELL_ABILITIES[character.classId || ''] || 'wis',
  };
  return { ...chosen, ambiguous: unique.length > 1 };
}

export const proficiencyBonusAtLevel = (level: number): number =>
  2 + Math.floor((Math.max(1, Number(level) || 1) - 1) / 4);

export const abilityModifier = (score: number): number => Math.floor(((Number(score) || 10) - 10) / 2);

export function runtimeSpellSaveDc(character: RuntimeCharacter, source: CastingSource): number {
  const innateSorcery = source.sourceClass === 'ensorceleur'
    && (character.conditions || []).some((condition) => condition.label === 'Sorcellerie innée');
  return 8 + proficiencyBonusAtLevel(character.level || 1)
    + abilityModifier(character.abilities?.[source.ability] ?? 10)
    + (innateSorcery ? 1 : 0);
}

export type TurnTransition = { ended: RuntimeCombatant | null; started: RuntimeCombatant | null };

const currentCombatant = (encounter: RuntimeEncounter | null | undefined): RuntimeCombatant | null => {
  const combatants = encounter?.combatants || [];
  if (!combatants.length) return null;
  const index = Math.max(0, Math.min(Number(encounter?.turnIndex) || 0, combatants.length - 1));
  return combatants[index] || null;
};

const encounterTurnKey = (encounter: RuntimeEncounter | null | undefined): string => {
  const current = currentCombatant(encounter);
  return `${encounter?.status || ''}:${encounter?.round || 0}:${encounter?.turnIndex || 0}:${current?.id || ''}`;
};

export function encounterTurnTransition(
  previous: RuntimeEncounter | null | undefined,
  current: RuntimeEncounter | null | undefined,
): TurnTransition | null {
  if (!previous || !current || encounterTurnKey(previous) === encounterTurnKey(current)) return null;
  return { ended: currentCombatant(previous), started: currentCombatant(current) };
}

export function isGameMasterRole(role: unknown): boolean {
  return ['gm', 'mj', 'master', 'dungeon-master', 'owner'].includes(normalizeRuntimeText(role));
}
