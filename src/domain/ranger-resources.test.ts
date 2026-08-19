import { describe, expect, it } from 'vitest';
import { hunterMarkFreeCastUses, natureVeilUses } from './ranger-resources';

describe('Marque du chasseur sans emplacement — égale au bonus de maîtrise', () => {
  it.each([
    [1, 2], [4, 2],
    [5, 3], [8, 3],
    [9, 4], [17, 6], [20, 6],
  ])('niveau %i → %i usages', (level, expected) => {
    expect(hunterMarkFreeCastUses(level)).toBe(expected);
  });
});

describe('Voile de la nature — dès le niveau 14, modificateur de Sagesse (min 1)', () => {
  it('indisponible avant le niveau 14', () => {
    expect(natureVeilUses(13, 5)).toBe(0);
  });
  it('minimum 1 même avec un modificateur nul ou négatif', () => {
    expect(natureVeilUses(14, 0)).toBe(1);
    expect(natureVeilUses(14, -1)).toBe(1);
  });
  it('suit le modificateur de Sagesse au-delà de 1', () => {
    expect(natureVeilUses(14, 4)).toBe(4);
  });
});
