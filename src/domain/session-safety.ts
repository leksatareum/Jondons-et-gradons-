export type RestCandidate = { hp?: number; deathStatus?: string | null };

export const canStartShortRest = (character: RestCandidate): boolean =>
  (character.hp || 0) > 0 && character.deathStatus !== 'dead';

export type ExhaustionCharacter = {
  exhaustion?: number;
  deathStatus?: string | null;
  deathSaves?: { success: number; fail: number };
  conditions?: Array<{ label: string; [key: string]: unknown }>;
  pendingConcCheck?: unknown;
  pendingConcChecks?: unknown[];
  [key: string]: unknown;
};

/** Six niveaux d'épuisement tuent la créature. Diminuer ensuite le compteur ne ressuscite pas. */
export function applyExhaustionLevel<T extends ExhaustionCharacter>(character: T, requestedLevel: number): T {
  const exhaustion = Math.max(0, Math.min(6, Math.trunc(Number(requestedLevel) || 0)));
  if (exhaustion < 6) return { ...character, exhaustion };
  return {
    ...character,
    exhaustion,
    deathStatus: 'dead',
    deathSaves: { success: 0, fail: 3 },
    conditions: (character.conditions || []).filter((condition) => condition.label !== 'Concentration'),
    pendingConcCheck: null,
    pendingConcChecks: [],
  };
}

/**
 * La limite d'un emplacement de sort est par tour, pas jusqu'au prochain tour
 * propre du lanceur. Au début de chaque nouveau tour de combat, le budget est
 * donc rendu à toutes les créatures sans toucher à leurs actions/réactions.
 */
export function resetSpellSlotBudgetForNewTurn<T extends Record<string, unknown> | undefined>(turn: T): T {
  if (!turn || turn.spellSlotCast !== true) return turn;
  return { ...turn, spellSlotCast: false } as T;
}
