import { describe, expect, it } from 'vitest';
import { rollDie, rollFormula } from './dice';

describe('rollDie', () => {
  it('tire un entier entre 1 et le nombre de faces', () => {
    expect(rollDie(6, () => 0)).toBe(1);
    expect(rollDie(6, () => 0.999)).toBe(6);
    expect(rollDie(6, () => 0.5)).toBe(4);
  });

  it('ne déborde jamais même à la toute limite de [0, 1[', () => {
    expect(rollDie(4, () => 1)).toBe(4);
  });

  it('a bien une chance sur N par face — distribution uniforme sur un grand nombre de tirages', () => {
    const faces = 4;
    const tirages = 40_000;
    const compte = new Array(faces).fill(0);
    let graine = 1;
    // Générateur déterministe (pas Math.random) : le test reste reproductible.
    const pseudoAleatoire = () => {
      graine = (graine * 1103515245 + 12345) % 2147483648;
      return graine / 2147483648;
    };
    for (let i = 0; i < tirages; i++) compte[rollDie(faces, pseudoAleatoire) - 1] += 1;
    for (const n of compte) {
      // ~10 000 attendus par face ; large marge pour éviter un test fragile.
      expect(n).toBeGreaterThan(tirages / faces * 0.85);
      expect(n).toBeLessThan(tirages / faces * 1.15);
    }
  });
});

describe('rollFormula', () => {
  it('lit « NdM » simple', () => {
    const jet = rollFormula('1d8', () => 0.5);
    expect(jet).toEqual({ total: 5, des: [5], bonus: 0 });
  });

  it('lit « NdM+B »', () => {
    const jet = rollFormula('2d4+2', () => 0);
    expect(jet).toEqual({ total: 1 + 1 + 2, des: [1, 1], bonus: 2 });
  });

  it('lit un bonus négatif', () => {
    const jet = rollFormula('1d6-1', () => 0.999);
    expect(jet).toEqual({ total: 6 - 1, des: [6], bonus: -1 });
  });

  it('accepte les espaces autour du d et du signe', () => {
    expect(rollFormula('2 d 4 + 2', () => 0)?.total).toBe(4);
  });

  it('renvoie null pour ce qui n’est pas une formule de dés', () => {
    expect(rollFormula('Instantanée')).toBeNull();
    expect(rollFormula('0d4')).toBeNull();
    expect(rollFormula('2d0')).toBeNull();
  });

  it('somme bien plusieurs dés tirés indépendamment', () => {
    const valeurs = [0, 0.25, 0.5, 0.75]; // → 1, 2, 3, 4 sur un d4
    let i = 0;
    const jet = rollFormula('4d4', () => valeurs[i++]);
    expect(jet?.des).toEqual([1, 2, 3, 4]);
    expect(jet?.total).toBe(10);
  });
});
