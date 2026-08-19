import type {
  ActiveEffect,
  DamageTriggeredSaveSpec,
  EffectDuration,
  EffectModifier,
  EscapeCheckSpec,
  PeriodicDamageSpec,
  SaveSpec,
} from '../domain/effects';

export type SpellSaveRule = Omit<SaveSpec, 'dc'>;
export type SpellDamageTriggeredSaveRule = Omit<DamageTriggeredSaveSpec, 'dc'>;
export type SpellEscapeRule = Omit<EscapeCheckSpec, 'dc'>;
export type SpellPeriodicDamage = PeriodicDamageSpec & { upcastDicePerSlot?: string };

export type SpellTargeting = {
  kind: 'self' | 'creature' | 'creatures' | 'point' | 'area';
  rangeMeters?: number;
  maxTargets?: number;
  requiresSight?: boolean;
  /** Faux pour un sort déclenché par une attaque déjà résolue, par exemple Frappe entravante. */
  requiresClearPath?: boolean;
  willingOnly?: boolean;
  creatureTypes?: string[];
  area?: { shape: 'sphere' | 'cube' | 'cone' | 'line' | 'cylinder' | 'emanation' | 'square'; sizeMeters: number };
};

export type SpellInstantEffect =
  | { type: 'damage'; dice: string; damageType: string; save?: SpellSaveRule; onSave?: 'half' | 'none' }
  | { type: 'heal'; dice: string; bonus?: string }
  | { type: 'temporary-hp'; dice?: string; value?: number };

export type SpellEffectDefinition = {
  spellId: string;
  baseLevel: number;
  targeting: SpellTargeting;
  duration?: EffectDuration;
  save?: SpellSaveRule;
  /** Rappel de table qui modifie la manière de lancer la sauvegarde initiale. */
  saveNote?: string;
  repeatSave?: SpellSaveRule;
  damageTriggeredSave?: SpellDamageTriggeredSaveRule;
  escapeCheck?: SpellEscapeRule;
  periodicDamage?: SpellPeriodicDamage;
  modifiers?: EffectModifier[];
  instant?: SpellInstantEffect[];
  concentration?: boolean;
  upcast?: {
    extraTargetsPerSlot?: number;
    damageDicePerSlot?: string;
  };
};

/**
 * Familles automatisées de manière sûre :
 * - sauvegarde initiale -> état persistant -> nouvelle sauvegarde ;
 * - sauvegarde initiale -> état persistant -> sauvegarde déclenchée par dégâts ;
 * - sauvegarde initiale -> état persistant -> action/test d'évasion.
 *
 * Les sorts de zone restent exclus tant que le point d'origine et l'appartenance
 * à la zone ne sont pas modélisés séparément des distances cible/lanceur.
 */
export const SPELL_EFFECTS: Record<string, SpellEffectDefinition> = {
  'immobilisation-personne': {
    spellId: 'immobilisation-personne',
    baseLevel: 2,
    targeting: {
      kind: 'creature',
      rangeMeters: 18,
      maxTargets: 1,
      requiresSight: true,
      creatureTypes: ['Humanoïde'],
    },
    duration: { kind: 'concentration', rounds: 10, expiresAt: 'end-turn' },
    concentration: true,
    save: { ability: 'SAG' },
    repeatSave: { ability: 'SAG', timing: 'end-turn', endsOnSuccess: true },
    modifiers: [{ type: 'condition', condition: 'Paralysé' }],
    upcast: { extraTargetsPerSlot: 1 },
  },
  'immobilisation-monstre': {
    spellId: 'immobilisation-monstre',
    baseLevel: 5,
    targeting: {
      kind: 'creature',
      rangeMeters: 27,
      maxTargets: 1,
      requiresSight: true,
    },
    duration: { kind: 'concentration', rounds: 10, expiresAt: 'end-turn' },
    concentration: true,
    save: { ability: 'SAG' },
    repeatSave: { ability: 'SAG', timing: 'end-turn', endsOnSuccess: true },
    modifiers: [{ type: 'condition', condition: 'Paralysé' }],
    upcast: { extraTargetsPerSlot: 1 },
  },
  'frappe-entravante': {
    spellId: 'frappe-entravante',
    baseLevel: 1,
    targeting: {
      kind: 'creature',
      maxTargets: 1,
      requiresClearPath: false,
    },
    duration: { kind: 'concentration', rounds: 10, expiresAt: 'end-turn' },
    concentration: true,
    save: { ability: 'FOR' },
    saveNote: 'Si la cible est de taille G ou supérieure, elle a avantage à cette sauvegarde.',
    modifiers: [{ type: 'condition', condition: 'Entravé' }],
    escapeCheck: {
      ability: 'FOR',
      skill: 'Athlétisme',
      actionRequired: true,
      helperAllowed: true,
      endsOnSuccess: true,
    },
    periodicDamage: {
      timing: 'start-turn',
      dice: '1d6',
      damageType: 'perforants',
      upcastDicePerSlot: '1d6',
    },
  },
  'rire-hideux': {
    spellId: 'rire-hideux',
    baseLevel: 1,
    targeting: {
      kind: 'creature',
      rangeMeters: 9,
      maxTargets: 1,
      requiresSight: true,
    },
    duration: { kind: 'concentration', rounds: 10, expiresAt: 'end-turn' },
    concentration: true,
    save: { ability: 'SAG' },
    repeatSave: { ability: 'SAG', timing: 'end-turn', endsOnSuccess: true },
    damageTriggeredSave: { ability: 'SAG', advantage: true, endsOnSuccess: true },
    modifiers: [
      { type: 'condition', condition: 'À terre' },
      { type: 'condition', condition: "Incapable d'agir" },
    ],
    upcast: { extraTargetsPerSlot: 1 },
  },
};

export const spellEffectById = (spellId: string): SpellEffectDefinition | null =>
  SPELL_EFFECTS[spellId] || null;

export function spellTargetCount(definition: SpellEffectDefinition, slotLevel: number): number {
  const base = definition.targeting.maxTargets ?? 1;
  const extraPerSlot = definition.upcast?.extraTargetsPerSlot ?? 0;
  return base + Math.max(0, slotLevel - definition.baseLevel) * extraPerSlot;
}

export const spellInitialSave = (definition: SpellEffectDefinition, dc: number): SaveSpec | null =>
  definition.save ? { ...definition.save, dc } : null;

const addDice = (base: string, extra: string, count: number): string => {
  if (count <= 0) return base;
  const baseMatch = /^(\d+)d(\d+)$/.exec(base.trim());
  const extraMatch = /^(\d+)d(\d+)$/.exec(extra.trim());
  if (!baseMatch || !extraMatch || baseMatch[2] !== extraMatch[2]) return `${base} + ${count}×${extra}`;
  return `${Number(baseMatch[1]) + Number(extraMatch[1]) * count}d${baseMatch[2]}`;
};

export function periodicDamageAtSlot(definition: SpellEffectDefinition, slotLevel: number): PeriodicDamageSpec | undefined {
  const periodic = definition.periodicDamage;
  if (!periodic) return undefined;
  const levelsAbove = Math.max(0, slotLevel - definition.baseLevel);
  return {
    timing: periodic.timing,
    damageType: periodic.damageType,
    dice: periodic.upcastDicePerSlot
      ? addDice(periodic.dice, periodic.upcastDicePerSlot, levelsAbove)
      : periodic.dice,
  };
}

export function buildPersistentSpellEffect(
  definition: SpellEffectDefinition,
  context: {
    casterId: string;
    targetId: string;
    sourceName: string;
    saveDc: number;
    slotLevel: number;
    appliedOrder: number;
    potency?: number;
  },
): ActiveEffect | null {
  if (!definition.duration || !(definition.modifiers?.length)) return null;
  return {
    id: `spell:${definition.spellId}:${context.casterId}:${context.targetId}:${context.appliedOrder}`,
    sourceId: definition.spellId,
    sourceName: context.sourceName,
    sourceType: 'spell',
    targetId: context.targetId,
    casterId: context.casterId,
    duration: definition.duration,
    modifiers: definition.modifiers,
    repeatSave: definition.repeatSave ? { ...definition.repeatSave, dc: context.saveDc } : undefined,
    damageTriggeredSave: definition.damageTriggeredSave ? { ...definition.damageTriggeredSave, dc: context.saveDc } : undefined,
    escapeCheck: definition.escapeCheck ? { ...definition.escapeCheck, dc: context.saveDc } : undefined,
    periodicDamage: periodicDamageAtSlot(definition, context.slotLevel),
    potency: context.potency,
    appliedOrder: context.appliedOrder,
  };
}
