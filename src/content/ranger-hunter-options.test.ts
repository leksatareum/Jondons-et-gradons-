import { describe, expect, it } from 'vitest';
import { HUNTER_DEFENSE, HUNTER_PREY } from './ranger-hunter-options';

/**
 * Vérifié contre le PHB 2024, p. 127. Ce fichier portait auparavant les
 * options de 2014 : une troisième Tactique défensive qui n'existe pas, et un
 * « +4 CA » remplacé par le désavantage.
 */
describe('sous-classe Chasseur — options vérifiées contre le PHB 2024 (p. 127)', () => {
  it('Proie du chasseur propose deux options', () => {
    expect(HUNTER_PREY.map((option) => option.id)).toEqual(['colossus-slayer', 'horde-breaker']);
  });

  it('Tactique défensive en propose deux, pas trois', () => {
    expect(HUNTER_DEFENSE.map((option) => option.id)).toEqual(['escape-horde', 'multiattack-defense']);
  });

  it('Défense contre les attaques multiples impose le désavantage, elle ne donne plus +4 CA', () => {
    const option = HUNTER_DEFENSE.find((entry) => entry.id === 'multiattack-defense')!;
    expect(option.desc).toMatch(/désavantage/i);
    expect(option.desc).not.toMatch(/\+4/);
  });
});
