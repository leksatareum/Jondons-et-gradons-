export type RechargeTiming = 'court' | 'long' | 'court_ou_long' | 'initiative' | 'tour' | 'condition' | 'jamais' | 'unknown';

export type RecoveryPolicy = {
  recharge?: RechargeTiming;
  shortRecovery?: number | 'all';
  shortRecoveryFrom?: number;
};

export const restoresOnLongRest = (timing: RechargeTiming): boolean =>
  timing === 'long' || timing === 'court' || timing === 'court_ou_long';

export const restoresAllOnShortRest = (timing: RechargeTiming): boolean =>
  timing === 'court' || timing === 'court_ou_long';

/**
 * Calcule la valeur d'une réserve après un repos court. Certaines capacités
 * 2024 rendent une seule utilisation, tandis que d'autres rendent toute la
 * réserve seulement à partir d'un palier de classe.
 */
export function currentAfterShortRest(
  current: number,
  maximum: number,
  policy: RecoveryPolicy,
  sourceClassLevel: number,
): number {
  const boundedCurrent = Math.max(0, Math.min(maximum, current));
  if (policy.shortRecoveryFrom && sourceClassLevel < policy.shortRecoveryFrom) return boundedCurrent;
  if (policy.shortRecovery === 'all') return maximum;
  if (typeof policy.shortRecovery === 'number') return Math.min(maximum, boundedCurrent + Math.max(0, policy.shortRecovery));
  return restoresAllOnShortRest(policy.recharge || 'unknown') ? maximum : boundedCurrent;
}
