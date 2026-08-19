export type DamageSnapshot = {
  hp?: number | null;
  hpTemp?: number | null;
  deathStatus?: string | null;
};

const pool = (value: unknown): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, numeric) : 0;
};

/**
 * Le contrôle de dégâts de Table Connectée enregistre chaque application comme
 * une sauvegarde locale distincte. Une baisse de PV réels ou temporaires entre
 * les deux snapshots correspond donc à une instance de dégâts pour les effets
 * qui disent « chaque fois que la cible subit des dégâts ».
 */
export function runtimeDamageTaken(previous: DamageSnapshot | null | undefined, current: DamageSnapshot | null | undefined): number {
  if (!previous || !current) return 0;
  const before = pool(previous.hp) + pool(previous.hpTemp);
  const after = pool(current.hp) + pool(current.hpTemp);
  return Math.max(0, before - after);
}

export const shouldResolveDamageTriggeredSaves = (
  previous: DamageSnapshot | null | undefined,
  current: DamageSnapshot | null | undefined,
): boolean => current?.deathStatus !== 'dead' && runtimeDamageTaken(previous, current) > 0;
