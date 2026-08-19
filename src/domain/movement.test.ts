import { describe, expect, it } from 'vitest';
import {
  canCompleteMovement,
  jumpDistances,
  movementCostMeters,
  remainingMovementMeters,
  standUpCostMeters,
  toGridMeters,
} from './movement';

describe('mouvement 2024', () => {
  it('cumule terrain difficile et déplacement spécial sans vitesse dédiée', () => {
    expect(movementCostMeters(3, { mode: 'climb', difficultTerrain: true })).toBe(9);
    expect(movementCostMeters(3, { mode: 'swim', hasMatchingSpeed: true })).toBe(3);
  });

  it('suit le déplacement restant et la capacité à terminer le trajet', () => {
    expect(remainingMovementMeters(9, 3, { mode: 'crawl' })).toBe(3);
    expect(canCompleteMovement(9, 6, { difficultTerrain: true })).toBe(false);
  });

  it('fait payer la moitié de la vitesse pour se relever', () => {
    expect(standUpCostMeters(9)).toBe(4.5);
  });

  it('calcule les sauts avec ou sans élan', () => {
    const jump = jumpDistances(16, 1.8);
    expect(jump.runningLongMeters).toBeCloseTo(4.8);
    expect(jump.standingLongMeters).toBeCloseTo(2.4);
    expect(jump.runningHighMeters).toBeCloseTo(1.8);
    expect(jump.standingHighMeters).toBeCloseTo(0.9);
    expect(jump.verticalReachMeters).toBeCloseTo(4.5);
  });

  it('arrondit une distance sur la grille de 1,50 m', () => {
    expect(toGridMeters(4.8)).toBe(4.5);
  });
});

