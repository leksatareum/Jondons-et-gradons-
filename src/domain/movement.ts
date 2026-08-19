export type MovementMode = 'walk' | 'climb' | 'swim' | 'crawl';

export type MovementCostOptions = {
  mode?: MovementMode;
  difficultTerrain?: boolean;
  hasMatchingSpeed?: boolean;
};

export type JumpDistances = {
  runningLongMeters: number;
  standingLongMeters: number;
  runningHighMeters: number;
  standingHighMeters: number;
  verticalReachMeters: number;
};

const METERS_PER_FOOT = 0.3;

const bounded = (value: number, minimum = 0): number =>
  Math.max(minimum, Number.isFinite(value) ? value : minimum);

/** Arrondit sur la grille métrique de 1,50 m utilisée à la table. */
export const toGridMeters = (meters: number): number =>
  Math.round(bounded(meters) / 1.5) * 1.5;

/**
 * Calcule combien de mètres de déplacement sont dépensés.
 * Ramper, nager ou escalader sans vitesse dédiée ajoute 1 mètre de coût par
 * mètre parcouru. Le terrain difficile ajoute le même surcoût et se cumule.
 */
export function movementCostMeters(distanceMeters: number, options: MovementCostOptions = {}): number {
  const distance = bounded(distanceMeters);
  const mode = options.mode || 'walk';
  const specialMovement = mode === 'crawl' || mode === 'climb' || mode === 'swim';
  const specialSurcharge = specialMovement && !options.hasMatchingSpeed ? 1 : 0;
  const terrainSurcharge = options.difficultTerrain ? 1 : 0;
  return distance * (1 + specialSurcharge + terrainSurcharge);
}

export function remainingMovementMeters(
  speedMeters: number,
  distanceMeters: number,
  options: MovementCostOptions = {},
): number {
  return Math.max(0, bounded(speedMeters) - movementCostMeters(distanceMeters, options));
}

/** Se relever consomme la moitié de la vitesse totale du personnage. */
export const standUpCostMeters = (speedMeters: number): number => bounded(speedMeters) / 2;

/**
 * Distances de saut 2024. Un saut avec élan exige 3 m de déplacement juste
 * avant le saut. Sans cet élan, la distance est divisée par deux. Le saut
 * consomme toujours le déplacement disponible.
 */
export function jumpDistances(
  strengthScore: number,
  heightMeters = 1.75,
): JumpDistances {
  const strength = Math.max(1, Math.trunc(bounded(strengthScore, 1)));
  const modifier = Math.floor((strength - 10) / 2);
  const runningLongMeters = strength * METERS_PER_FOOT;
  const runningHighMeters = Math.max(0, 3 + modifier) * METERS_PER_FOOT;
  return {
    runningLongMeters,
    standingLongMeters: runningLongMeters / 2,
    runningHighMeters,
    standingHighMeters: runningHighMeters / 2,
    verticalReachMeters: runningHighMeters + bounded(heightMeters) * 1.5,
  };
}

export function canCompleteMovement(
  speedMeters: number,
  distanceMeters: number,
  options: MovementCostOptions = {},
): boolean {
  return movementCostMeters(distanceMeters, options) <= bounded(speedMeters);
}

