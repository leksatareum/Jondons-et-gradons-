import { describe, expect, it } from 'vitest';
import { HUNTER_DEFENSE, HUNTER_PREY } from './ranger-hunter-options';

describe('sous-classe Chasseur — options repêchées (confiance modérée, cf. commentaire du fichier)', () => {
  it('Proie du chasseur propose deux options', () => {
    expect(HUNTER_PREY.map((option) => option.id)).toEqual(['colossus-slayer', 'horde-breaker']);
  });
  it('Tactiques défensives propose trois options', () => {
    expect(HUNTER_DEFENSE.map((option) => option.id)).toEqual(['escape-horde', 'multiattack-defense', 'hunter-leap']);
  });
});
