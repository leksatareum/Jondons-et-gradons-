import {
  activeEffectsOf,
  addEffect,
  mechanicallyActiveEffects,
  removeEffect,
  type ActiveEffect,
  type EffectModifier,
  type EffectState,
} from './effects';

export type LegacyCondition = {
  label: string;
  detail?: string;
  effectId?: string;
  sourceId?: string;
  casterId?: string;
  effectSourceType?: ActiveEffect['sourceType'];
  effectDuration?: ActiveEffect['duration'];
  effectRepeatSave?: ActiveEffect['repeatSave'];
  effectDamageTriggeredSave?: ActiveEffect['damageTriggeredSave'];
  effectEscapeCheck?: ActiveEffect['escapeCheck'];
  effectPeriodicDamage?: ActiveEffect['periodicDamage'];
  effectPotency?: number;
  effectAppliedOrder?: number;
  effectCreatedRound?: number;
  [key: string]: unknown;
};

type WithConditions = EffectState & { conditions?: LegacyCondition[] };

const effectConditionModifiers = (effect: ActiveEffect): Extract<EffectModifier, { type: 'condition' }>[] =>
  effect.modifiers.filter((modifier): modifier is Extract<EffectModifier, { type: 'condition' }> => modifier.type === 'condition');

const periodicLabel = (effect: ActiveEffect): string => {
  if (!effect.periodicDamage) return effect.sourceName;
  const timing = effect.periodicDamage.timing === 'start-turn' ? 'début du tour' : 'fin du tour';
  return `${effect.sourceName} · ${timing} : ${effect.periodicDamage.dice} ${effect.periodicDamage.damageType}`;
};

/**
 * L'ancien écran de jeu lit encore `conditions`. Le moteur d'effets reste la
 * source de vérité : cette fonction ne fait qu'en produire une projection UI.
 */
export function syncEffectConditions<T extends WithConditions>(state: T): T {
  const manual = (state.conditions || []).filter((condition) => !condition.effectId);
  const manualLabels = new Set(manual.map((condition) => condition.label));
  const generated: LegacyCondition[] = [];

  mechanicallyActiveEffects(state).forEach((effect) => {
    effectConditionModifiers(effect).forEach((modifier) => {
      if (manualLabels.has(modifier.condition)) return;
      generated.push({
        label: modifier.condition,
        detail: periodicLabel(effect),
        effectId: effect.id,
        sourceId: effect.sourceId,
        casterId: effect.casterId,
      });
    });
  });

  return { ...state, conditions: [...manual, ...generated] } as T;
}

export function addCharacterEffect<T extends WithConditions>(state: T, effect: ActiveEffect): T {
  return syncEffectConditions(addEffect(state, effect));
}

export function removeCharacterEffect<T extends WithConditions>(state: T, effectId: string): T {
  return syncEffectConditions(removeEffect(state, effectId));
}

/**
 * Les lignes d'encounter ne possèdent pas encore de colonne `activeEffects`.
 * On sérialise donc les métadonnées mécaniques dans le JSON `conditions`, déjà
 * persisté par l'API, puis on peut reconstruire l'ActiveEffect au chargement.
 */
export function serializeEncounterEffect(effect: ActiveEffect): LegacyCondition[] {
  const conditionModifiers = effectConditionModifiers(effect);
  return conditionModifiers.map((modifier) => ({
    label: modifier.condition,
    detail: periodicLabel(effect),
    effectId: effect.id,
    sourceId: effect.sourceId,
    casterId: effect.casterId,
    effectSourceType: effect.sourceType,
    effectDuration: effect.duration,
    effectRepeatSave: effect.repeatSave,
    effectDamageTriggeredSave: effect.damageTriggeredSave,
    effectEscapeCheck: effect.escapeCheck,
    effectPeriodicDamage: effect.periodicDamage,
    effectPotency: effect.potency,
    effectAppliedOrder: effect.appliedOrder,
    effectCreatedRound: effect.createdRound,
  }));
}

export function encounterEffectsFromConditions(
  conditions: LegacyCondition[] | undefined,
  targetId: string,
): ActiveEffect[] {
  const byId = new Map<string, ActiveEffect>();
  (conditions || []).forEach((condition) => {
    if (!condition.effectId || !condition.sourceId || !condition.effectSourceType || !condition.effectDuration) return;
    const existing = byId.get(condition.effectId);
    const modifier: EffectModifier = { type: 'condition', condition: condition.label };
    if (existing) {
      if (!existing.modifiers.some((item) => item.type === 'condition' && item.condition === condition.label)) {
        existing.modifiers.push(modifier);
      }
      return;
    }
    byId.set(condition.effectId, {
      id: condition.effectId,
      sourceId: condition.sourceId,
      sourceName: condition.detail?.split(' · ')[0] || condition.sourceId,
      sourceType: condition.effectSourceType,
      targetId,
      casterId: condition.casterId,
      duration: condition.effectDuration,
      modifiers: [modifier],
      repeatSave: condition.effectRepeatSave,
      damageTriggeredSave: condition.effectDamageTriggeredSave,
      escapeCheck: condition.effectEscapeCheck,
      periodicDamage: condition.effectPeriodicDamage,
      potency: condition.effectPotency,
      appliedOrder: condition.effectAppliedOrder,
      createdRound: condition.effectCreatedRound,
    });
  });
  return [...byId.values()];
}

export function addEncounterEffect<T extends { id: string; conditions?: LegacyCondition[] }>(
  combatant: T,
  effect: ActiveEffect,
): T {
  const withoutSameId = (combatant.conditions || []).filter((condition) => condition.effectId !== effect.id);
  return { ...combatant, conditions: [...withoutSameId, ...serializeEncounterEffect(effect)] };
}

export function removeEncounterEffect<T extends { conditions?: LegacyCondition[] }>(combatant: T, effectId: string): T {
  return { ...combatant, conditions: (combatant.conditions || []).filter((condition) => condition.effectId !== effectId) };
}

export function removeEncounterConcentrationFromCaster<T extends { conditions?: LegacyCondition[] }>(
  combatant: T,
  casterId: string,
): T {
  return {
    ...combatant,
    conditions: (combatant.conditions || []).filter((condition) =>
      !(condition.effectId && condition.casterId === casterId && condition.effectDuration?.kind === 'concentration')),
  };
}

export function characterConcentrationEffectsFromCaster(state: EffectState, casterId: string): ActiveEffect[] {
  return activeEffectsOf(state).filter((effect) => effect.casterId === casterId && effect.duration.kind === 'concentration');
}
