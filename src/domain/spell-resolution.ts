import {
  buildPersistentSpellEffect,
  spellInitialSave,
  spellTargetCount,
  type SpellEffectDefinition,
} from '../content/spell-effects';
import type { ActiveEffect, SaveSpec } from './effects';

export type SpellTargetFacts = {
  id: string;
  /** Type de créature tel qu'il est connu par la table, par ex. Humanoïde. */
  creatureType?: string | null;
  /** Distance réelle mesurée sur le plateau physique. */
  distanceMeters?: number | null;
  /** Le lanceur voit-il effectivement la cible ? */
  visible?: boolean | null;
  /** Une trajectoire claire existe-t-elle, donc la cible n'est pas derrière un couvert total ? */
  clearPath?: boolean | null;
};

export type TargetValidationStatus = 'valid' | 'invalid' | 'needs-adjudication';

export type SpellTargetValidation = {
  status: TargetValidationStatus;
  reasons: string[];
  missingFacts: string[];
};

export type SavingThrowOutcome =
  | { kind: 'rolled'; total: number }
  | { kind: 'auto-success' }
  | { kind: 'auto-fail' };

export type SavingThrowSpellResolution = {
  validation: SpellTargetValidation;
  initialSave: SaveSpec | null;
  saveSucceeded: boolean | null;
  effect: ActiveEffect | null;
  maxTargets: number;
};

const normalize = (value: string): string =>
  value.toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/**
 * Vérifie uniquement les faits que l'application peut connaître.
 *
 * Table Connectée est utilisée avec un plateau physique : lorsqu'une distance,
 * une ligne de vue ou le chemin jusqu'à la cible n'est pas renseigné, le moteur
 * ne prétend pas que la cible est valide. Il renvoie needs-adjudication afin que
 * le joueur ou le meneur confirme le fait à la table.
 */
export function validateSpellTarget(
  definition: SpellEffectDefinition,
  target: SpellTargetFacts,
): SpellTargetValidation {
  const reasons: string[] = [];
  const missingFacts: string[] = [];

  if (definition.targeting.rangeMeters !== undefined) {
    if (target.distanceMeters === undefined || target.distanceMeters === null) {
      missingFacts.push('distance');
    } else if (target.distanceMeters > definition.targeting.rangeMeters) {
      reasons.push(`hors de portée (${target.distanceMeters} m > ${definition.targeting.rangeMeters} m)`);
    }
  }

  if (definition.targeting.requiresSight) {
    if (target.visible === undefined || target.visible === null) missingFacts.push('ligne de vue');
    else if (!target.visible) reasons.push('cible non visible');
  }

  // La plupart des sorts exigent un chemin clair. Un sort à portée Personnelle
  // déclenché par une attaque déjà résolue peut explicitement désactiver ce test.
  if (definition.targeting.requiresClearPath !== false) {
    if (target.clearPath === undefined || target.clearPath === null) missingFacts.push('chemin clair');
    else if (!target.clearPath) reasons.push('pas de chemin clair vers la cible');
  }

  const allowedTypes = definition.targeting.creatureTypes;
  if (allowedTypes?.length) {
    if (!target.creatureType) missingFacts.push('type de créature');
    else if (!allowedTypes.some((type) => normalize(type) === normalize(target.creatureType!))) {
      reasons.push(`type de créature invalide (${target.creatureType})`);
    }
  }

  if (reasons.length) return { status: 'invalid', reasons, missingFacts };
  if (missingFacts.length) return { status: 'needs-adjudication', reasons, missingFacts };
  return { status: 'valid', reasons, missingFacts };
}

export function savingThrowSucceeded(outcome: SavingThrowOutcome, dc: number): boolean {
  if (outcome.kind === 'auto-success') return true;
  if (outcome.kind === 'auto-fail') return false;
  return outcome.total >= dc;
}

/**
 * Résout la famille « sauvegarde initiale, puis effet persistant sur échec ».
 * La dépense d'emplacement/action reste volontairement dans le moteur de lancer
 * existant : même une cible invalide peut avoir coûté l'emplacement.
 */
export function resolveSavingThrowSpell(
  definition: SpellEffectDefinition,
  target: SpellTargetFacts,
  context: {
    casterId: string;
    sourceName: string;
    saveDc: number;
    slotLevel: number;
    appliedOrder: number;
    potency?: number;
    outcome: SavingThrowOutcome;
    /** Confirmation explicite du joueur/MJ quand les faits spatiaux sont gérés sur le plateau. */
    adjudicatedValid?: boolean;
  },
): SavingThrowSpellResolution {
  const validation = validateSpellTarget(definition, target);
  const initialSave = spellInitialSave(definition, context.saveDc);
  const maxTargets = spellTargetCount(definition, context.slotLevel);

  if (validation.status === 'invalid') {
    return { validation, initialSave, saveSucceeded: null, effect: null, maxTargets };
  }
  if (validation.status === 'needs-adjudication' && !context.adjudicatedValid) {
    return { validation, initialSave, saveSucceeded: null, effect: null, maxTargets };
  }
  if (!initialSave) {
    return { validation, initialSave: null, saveSucceeded: null, effect: null, maxTargets };
  }

  const success = savingThrowSucceeded(context.outcome, initialSave.dc);
  const effect = success ? null : buildPersistentSpellEffect(definition, {
    casterId: context.casterId,
    targetId: target.id,
    sourceName: context.sourceName,
    saveDc: context.saveDc,
    slotLevel: context.slotLevel,
    appliedOrder: context.appliedOrder,
    potency: context.potency ?? context.slotLevel,
  });

  return { validation, initialSave, saveSucceeded: success, effect, maxTargets };
}
