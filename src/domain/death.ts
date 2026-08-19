export type DeathSaves = { success: number; fail: number };
export type DeathStatus = 'dying' | 'stable' | 'dead' | null;

export type DeathTracked = {
  hp: number;
  hpMax: number;
  deathStatus?: DeathStatus;
  deathSaves?: DeathSaves;
  [key: string]: unknown;
};

export const emptyDeathSaves = (): DeathSaves => ({ success: 0, fail: 0 });

export const isZeroHpIncapacitated = (character: Pick<DeathTracked, 'hp' | 'deathStatus'>): boolean =>
  character.hp <= 0 || character.deathStatus === 'dying' || character.deathStatus === 'stable' || character.deathStatus === 'dead';

export const zeroHpAutoFailsSave = (
  character: Pick<DeathTracked, 'hp' | 'deathStatus'>,
  ability: string,
): boolean => isZeroHpIncapacitated(character) && (ability === 'str' || ability === 'dex');

export function stabilizeDeathState<T extends DeathTracked>(character: T): T {
  if (character.deathStatus === 'dead' || character.hp > 0) return character;
  return { ...character, deathStatus: 'stable', deathSaves: emptyDeathSaves() };
}

export function resolveDeathSave<T extends DeathTracked>(
  character: T,
  kind: 'success' | 'fail' | 'nat1' | 'nat20' | 'reset',
): T {
  if (character.deathStatus === 'dead' || character.deathStatus === 'stable') return character;
  if (kind === 'nat20') return { ...character, hp: 1, deathStatus: null, deathSaves: emptyDeathSaves() };

  const current = character.deathSaves || emptyDeathSaves();
  if (kind === 'reset') {
    return { ...character, deathSaves: emptyDeathSaves(), deathStatus: character.hp <= 0 ? 'dying' : null };
  }

  const success = kind === 'success' ? Math.min(3, current.success + 1) : current.success;
  const failGain = kind === 'nat1' ? 2 : kind === 'fail' ? 1 : 0;
  const fail = Math.min(3, current.fail + failGain);

  if (fail >= 3) return { ...character, deathStatus: 'dead', deathSaves: { success, fail: 3 } };
  if (success >= 3) return { ...character, deathStatus: 'stable', deathSaves: emptyDeathSaves() };
  return { ...character, deathStatus: 'dying', deathSaves: { success, fail } };
}

export function applyDamageAtZero<T extends DeathTracked>(
  character: T,
  damage: number,
  critical = false,
): T {
  const amount = Math.max(0, Math.floor(Number.isFinite(damage) ? damage : 0));
  if (character.hp > 0 || amount <= 0 || character.deathStatus === 'dead') return character;
  if (amount >= character.hpMax) {
    return { ...character, deathStatus: 'dead', deathSaves: { success: 0, fail: 3 } };
  }

  // Une créature stable qui subit des dégâts cesse d'être stable ; ses anciens
  // succès/échecs avaient déjà été remis à zéro au moment de la stabilisation.
  const current = character.deathStatus === 'stable' ? emptyDeathSaves() : (character.deathSaves || emptyDeathSaves());
  const fail = Math.min(3, current.fail + (critical ? 2 : 1));
  return {
    ...character,
    deathStatus: fail >= 3 ? 'dead' : 'dying',
    deathSaves: { success: current.success, fail },
  };
}
