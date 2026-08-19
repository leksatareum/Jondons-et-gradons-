import { describe, expect, it } from 'vitest';

import { concentrationDifficulty, resolveDamageAmount } from './damage';

describe('resolveDamageAmount', () => {
  it('applique la résistance avant la vulnérabilité et arrondit vers le bas', () => {
    expect(resolveDamageAmount({ resistances: ['feu'], vulnerabilities: ['feu'] }, 23, 'feu')).toMatchObject({
      final: 22,
      resistant: true,
      vulnerable: true,
    });
  });

  it('ne cumule pas une résistance générale et une résistance typée', () => {
    expect(resolveDamageAmount({ conditions: [{ label: 'Pétrifié' }], resistances: ['feu'] }, 19, 'feu').final).toBe(9);
  });

  it('donne priorité à l’immunité', () => {
    expect(resolveDamageAmount({ immunities: ['froid'], vulnerabilities: ['froid'] }, 40, 'froid')).toMatchObject({
      final: 0,
      immune: true,
      vulnerable: false,
    });
  });
});

describe('concentrationDifficulty', () => {
  it('respecte le minimum de 10 et le maximum de 30', () => {
    expect(concentrationDifficulty(1)).toBe(10);
    expect(concentrationDifficulty(45)).toBe(22);
    expect(concentrationDifficulty(100)).toBe(30);
  });
});
