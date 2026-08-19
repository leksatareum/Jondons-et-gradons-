export type EffectTiming = 'start-turn' | 'end-turn';
export type EffectDuration =
  | { kind: 'rounds'; rounds: number; expiresAt?: EffectTiming }
  | { kind: 'concentration'; rounds?: number; expiresAt?: EffectTiming }
  | { kind: 'until-save'; expiresAt?: EffectTiming }
  | { kind: 'permanent' };

export type AbilityId = 'FOR' | 'DEX' | 'CON' | 'INT' | 'SAG' | 'CHA';

export type SaveSpec = {
  ability: AbilityId;
  dc: number;
  timing?: EffectTiming;
  endsOnSuccess?: boolean;
};

/** Sauvegarde supplémentaire déclenchée par chaque instance de dégâts. */
export type DamageTriggeredSaveSpec = Omit<SaveSpec, 'timing'> & {
  advantage?: boolean;
};

/**
 * Certains effets PHB ne donnent pas une nouvelle sauvegarde : la créature
 * doit dépenser une action et réussir un test de caractéristique/compétence.
 * Ce contrat est volontairement distinct de repeatSave pour éviter de confondre
 * les deux mécaniques dans l'UI ou dans l'économie d'actions.
 */
export type EscapeCheckSpec = {
  ability: AbilityId;
  skill?: string;
  dc: number;
  actionRequired: boolean;
  endsOnSuccess?: boolean;
  /** Une autre créature à portée peut-elle tenter le test à la place de la cible ? */
  helperAllowed?: boolean;
};

export type PeriodicDamageSpec = {
  timing: EffectTiming;
  dice: string;
  damageType: string;
};

export type EffectModifier =
  | { type: 'condition'; condition: string }
  | { type: 'ac'; value: number }
  | { type: 'speed'; value: number; mode?: 'add' | 'multiply' | 'set' }
  | { type: 'advantage'; scope: string }
  | { type: 'disadvantage'; scope: string }
  | { type: 'resistance'; damageType: string }
  | { type: 'vulnerability'; damageType: string };

export type ActiveEffect = {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceType: 'spell' | 'feature' | 'feat' | 'item' | 'condition' | 'other';
  targetId: string;
  casterId?: string;
  duration: EffectDuration;
  modifiers: EffectModifier[];
  repeatSave?: SaveSpec;
  damageTriggeredSave?: DamageTriggeredSaveSpec;
  escapeCheck?: EscapeCheckSpec;
  periodicDamage?: PeriodicDamageSpec;
  /** Valeur comparable utilisée pour départager plusieurs lancements du même sort. */
  potency?: number;
  /** Ordre monotone du lancement ; le plus récent gagne à puissance égale. */
  appliedOrder?: number;
  createdRound?: number;
};

export type EffectState = { activeEffects?: ActiveEffect[] };

export const activeEffectsOf = (state: EffectState): ActiveEffect[] => state.activeEffects || [];

export function addEffect<T extends EffectState>(state: T, effect: ActiveEffect): T {
  const current = activeEffectsOf(state).filter((item) => item.id !== effect.id);
  return { ...state, activeEffects: [...current, effect] };
}

export function removeEffect<T extends EffectState>(state: T, effectId: string): T {
  return { ...state, activeEffects: activeEffectsOf(state).filter((effect) => effect.id !== effectId) };
}

export function removeEffectsFromSource<T extends EffectState>(state: T, sourceId: string, casterId?: string): T {
  return {
    ...state,
    activeEffects: activeEffectsOf(state).filter((effect) =>
      effect.sourceId !== sourceId || (casterId !== undefined && effect.casterId !== casterId)),
  };
}

/**
 * PHB 2024, Combining Spell Effects : des sorts différents se cumulent, mais
 * plusieurs lancements du même sort ne se cumulent pas. Le plus puissant
 * s'applique ; à puissance égale, le plus récent s'applique.
 *
 * Cette sélection est calculée par cible : un même lancement peut donc rester
 * actif sur plusieurs créatures sans être confondu avec un doublon.
 */
export function mechanicallyActiveEffects(state: EffectState): ActiveEffect[] {
  const winners = new Map<string, ActiveEffect>();
  for (const effect of activeEffectsOf(state)) {
    if (effect.sourceType !== 'spell') {
      winners.set(`effect:${effect.id}`, effect);
      continue;
    }
    const key = `spell:${effect.sourceId}:${effect.targetId}`;
    const previous = winners.get(key);
    if (!previous) {
      winners.set(key, effect);
      continue;
    }
    const potency = effect.potency ?? 0;
    const previousPotency = previous.potency ?? 0;
    const order = effect.appliedOrder ?? 0;
    const previousOrder = previous.appliedOrder ?? 0;
    if (potency > previousPotency || (potency === previousPotency && order >= previousOrder)) {
      winners.set(key, effect);
    }
  }
  return [...winners.values()];
}

export const effectConditions = (state: EffectState): string[] =>
  [...new Set(mechanicallyActiveEffects(state).flatMap((effect) => effect.modifiers)
    .filter((modifier): modifier is Extract<EffectModifier, { type: 'condition' }> => modifier.type === 'condition')
    .map((modifier) => modifier.condition))];

export const effectAcBonus = (state: EffectState): number =>
  mechanicallyActiveEffects(state).flatMap((effect) => effect.modifiers)
    .filter((modifier): modifier is Extract<EffectModifier, { type: 'ac' }> => modifier.type === 'ac')
    .reduce((sum, modifier) => sum + modifier.value, 0);

/**
 * Avance les durées liées au tour de la cible (par exemple « jusqu'à la fin de
 * son prochain tour »). Les durées de Concentration sont volontairement exclues
 * ici : leur chronologie appartient au lanceur, pas à chaque cible affectée.
 */
export function advanceEffects<T extends EffectState>(state: T, timing: EffectTiming): T {
  const activeEffects = activeEffectsOf(state).flatMap((effect) => {
    const duration = effect.duration;
    if (duration.kind !== 'rounds') return [effect];
    if ((duration.expiresAt || 'end-turn') !== timing) return [effect];
    const rounds = duration.rounds - 1;
    return rounds <= 0 ? [] : [{ ...effect, duration: { ...duration, rounds } } as ActiveEffect];
  });
  return { ...state, activeEffects };
}

/**
 * Avance, sur une cible donnée, les effets de Concentration provenant du
 * lanceur dont le tour vient d'atteindre le timing demandé. Le moteur de combat
 * appellera cette fonction sur toutes les créatures lorsque le tour du lanceur
 * avance, ce qui garde toutes ses cibles parfaitement synchronisées.
 */
export function advanceCasterConcentrationEffects<T extends EffectState>(
  state: T,
  casterId: string,
  timing: EffectTiming,
): T {
  const activeEffects = activeEffectsOf(state).flatMap((effect) => {
    const duration = effect.duration;
    if (effect.casterId !== casterId || duration.kind !== 'concentration' || duration.rounds === undefined) return [effect];
    if ((duration.expiresAt || 'end-turn') !== timing) return [effect];
    const rounds = duration.rounds - 1;
    return rounds <= 0 ? [] : [{ ...effect, duration: { ...duration, rounds } } as ActiveEffect];
  });
  return { ...state, activeEffects };
}

export function resolveRepeatedSave<T extends EffectState>(
  state: T,
  effectId: string,
  total: number,
  timing: EffectTiming,
): { state: T; resolved: boolean; success: boolean | null } {
  const effect = activeEffectsOf(state).find((item) => item.id === effectId);
  if (!effect?.repeatSave || (effect.repeatSave.timing || 'end-turn') !== timing) {
    return { state, resolved: false, success: null };
  }
  const success = total >= effect.repeatSave.dc;
  if (success && effect.repeatSave.endsOnSuccess !== false) {
    return { state: removeEffect(state, effectId), resolved: true, success };
  }
  return { state, resolved: true, success };
}

/** Résout une sauvegarde que l'effet exige immédiatement après une instance de dégâts. */
export function resolveDamageTriggeredSave<T extends EffectState>(
  state: T,
  effectId: string,
  total: number,
): { state: T; resolved: boolean; success: boolean | null } {
  const effect = activeEffectsOf(state).find((item) => item.id === effectId);
  if (!effect?.damageTriggeredSave) return { state, resolved: false, success: null };
  const success = total >= effect.damageTriggeredSave.dc;
  if (success && effect.damageTriggeredSave.endsOnSuccess !== false) {
    return { state: removeEffect(state, effectId), resolved: true, success };
  }
  return { state, resolved: true, success };
}

/** Résout un test volontaire fait en dépensant l'action demandée par l'effet. */
export function resolveEscapeCheck<T extends EffectState>(
  state: T,
  effectId: string,
  total: number,
): { state: T; resolved: boolean; success: boolean | null } {
  const effect = activeEffectsOf(state).find((item) => item.id === effectId);
  if (!effect?.escapeCheck) return { state, resolved: false, success: null };
  const success = total >= effect.escapeCheck.dc;
  if (success && effect.escapeCheck.endsOnSuccess !== false) {
    return { state: removeEffect(state, effectId), resolved: true, success };
  }
  return { state, resolved: true, success };
}

export function breakConcentration<T extends EffectState>(state: T, casterId: string): T {
  return {
    ...state,
    activeEffects: activeEffectsOf(state).filter((effect) =>
      !(effect.casterId === casterId && effect.duration.kind === 'concentration')),
  };
}
