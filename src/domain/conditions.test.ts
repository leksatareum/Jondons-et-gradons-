import { describe, expect, it } from 'vitest';
import { CONDITIONS } from './conditions';

describe('les 14 états officiels du PHB 2024', () => {
  it('couvre exactement les 14 états (Épuisement excepté, compteur à part)', () => {
    expect(Object.keys(CONDITIONS)).toHaveLength(14);
  });

  it('Aveuglé désavantage tes attaques et avantage celles contre toi', () => {
    expect(CONDITIONS.aveugle.attack).toBe('dis');
    expect(CONDITIONS.aveugle.incoming).toBe('adv');
  });

  it('Inconscient et Paralysé rendent les coups au contact critiques (autoFail Force/Dex)', () => {
    expect(CONDITIONS.inconscient.autoFail).toEqual(['str', 'dex']);
    expect(CONDITIONS.paralyse.autoFail).toEqual(['str', 'dex']);
  });

  it('Invisible avantage tes attaques et désavantage celles contre toi', () => {
    expect(CONDITIONS.invisible.attack).toBe('adv');
    expect(CONDITIONS.invisible.incoming).toBe('dis');
  });

  it('Pétrifié résiste à tous les dégâts', () => {
    expect(CONDITIONS.petrifie.resistAll).toBe(true);
  });
});
