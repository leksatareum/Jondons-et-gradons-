import { concentrationDifficulty } from './damage';

export type ConcentrationCheck = {
  dc: number;
  detail?: string | null;
  damageTaken?: number;
};

type LegacyConcentrationCheck = ConcentrationCheck | null | undefined;

/**
 * Migration douce : les anciennes sauvegardes n'avaient qu'un seul
 * `pendingConcCheck`. Une file explicite permet de conserver une sauvegarde
 * distincte pour chaque instance de dégâts reçue avant résolution de l'UI.
 */
export function normalizeConcentrationQueue(
  queue: readonly ConcentrationCheck[] | null | undefined,
  legacy: LegacyConcentrationCheck = null,
): ConcentrationCheck[] {
  if (Array.isArray(queue) && queue.length > 0) return queue.map((check) => ({ ...check }));
  return legacy ? [{ ...legacy }] : [];
}

export function enqueueConcentrationCheck(
  queue: readonly ConcentrationCheck[] | null | undefined,
  legacy: LegacyConcentrationCheck,
  damageTaken: number,
  detail: string | null = null,
): ConcentrationCheck[] {
  const current = normalizeConcentrationQueue(queue, legacy);
  const damage = Math.max(0, Math.floor(Number.isFinite(damageTaken) ? damageTaken : 0));
  if (damage <= 0) return current;
  return [...current, { dc: concentrationDifficulty(damage), detail, damageTaken: damage }];
}

export function resolveConcentrationCheckQueue(
  queue: readonly ConcentrationCheck[] | null | undefined,
  legacy: LegacyConcentrationCheck,
  success: boolean,
): { queue: ConcentrationCheck[]; keepConcentration: boolean; resolved: boolean } {
  const current = normalizeConcentrationQueue(queue, legacy);
  if (current.length === 0) return { queue: [], keepConcentration: true, resolved: false };
  if (!success) return { queue: [], keepConcentration: false, resolved: true };
  return { queue: current.slice(1), keepConcentration: true, resolved: true };
}
