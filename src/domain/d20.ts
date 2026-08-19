export type RollMode = 'normal' | 'avantage' | 'désavantage';
export type RollSource = { mode: Exclude<RollMode, 'normal'>; source: string };

/** Une ou plusieurs sources opposées s'annulent entièrement, sans cumul. */
export function resolveRollMode(sources: RollSource[]): RollMode {
  const hasAdvantage = sources.some((source) => source.mode === 'avantage');
  const hasDisadvantage = sources.some((source) => source.mode === 'désavantage');
  if (hasAdvantage === hasDisadvantage) return 'normal';
  return hasAdvantage ? 'avantage' : 'désavantage';
}

export function proficiencyContribution(proficiencyBonus: number, multiplier: 0 | 0.5 | 1 | 2): number {
  if (multiplier === 0.5) return Math.floor(proficiencyBonus / 2);
  return proficiencyBonus * multiplier;
}

export const exhaustionD20Penalty = (level: number): number => -2 * Math.max(0, Math.min(6, Math.trunc(level || 0)));
export const exhaustionSpeedPenaltyMeters = (level: number): number => 1.5 * Math.max(0, Math.min(6, Math.trunc(level || 0)));

export function d20Total(die: number, modifiers: number[], exhaustionLevel = 0): number {
  const boundedDie = Math.max(1, Math.min(20, Math.trunc(die)));
  return boundedDie + modifiers.reduce((total, modifier) => total + modifier, 0) + exhaustionD20Penalty(exhaustionLevel);
}

export function passiveScore(modifier: number, mode: RollMode = 'normal'): number {
  return 10 + modifier + (mode === 'avantage' ? 5 : mode === 'désavantage' ? -5 : 0);
}
