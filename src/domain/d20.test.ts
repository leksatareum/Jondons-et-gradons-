import { describe, expect, it } from 'vitest';
import { d20Total, passiveScore, proficiencyContribution, resolveRollMode } from './d20';

describe('tests de d20', () => {
  it('annule toutes les sources opposées sans compter leur nombre', () => {
    expect(resolveRollMode([{ mode: 'avantage', source: 'Invisible' }, { mode: 'avantage', source: 'Aide' }, { mode: 'désavantage', source: 'Empoisonné' }])).toBe('normal');
  });

  it('applique maîtrise, demi-maîtrise et expertise sans fractions', () => {
    expect(proficiencyContribution(3, 0.5)).toBe(1);
    expect(proficiencyContribution(3, 1)).toBe(3);
    expect(proficiencyContribution(3, 2)).toBe(6);
  });

  it('applique l’épuisement et les ajustements passifs', () => {
    expect(d20Total(12, [4, 3], 2)).toBe(15);
    expect(passiveScore(5, 'avantage')).toBe(20);
    expect(passiveScore(5, 'désavantage')).toBe(10);
  });
});
