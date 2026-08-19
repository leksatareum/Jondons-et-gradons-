import { describe, expect, it } from 'vitest';
import {
  awakenedMindRules,
  greatOldOneCanConvertDamage,
  greatOldOnePatronSpellIds,
  greatOldOneSuppressesVerbalSomatic,
  isGreatOldOneLevel3,
} from './warlock-great-old-one-level3';

const goo = (level = 3, cha = 18) => ({
  classId: 'occultiste', level, subclass: 'Patron Grand Ancien', abilities: { cha },
});

describe('Patron Grand Ancien PHB 2024 niveaux 3 à 5', () => {
  it('accorde exactement les sorts du patron des niveaux 3 et 5', () => {
    expect(greatOldOnePatronSpellIds(3)).toEqual([
      'detection-pensees', 'murmures-dissonants', 'force-fantasmagorique', 'rire-hideux',
    ]);
    expect(greatOldOnePatronSpellIds(5)).toEqual([
      'detection-pensees', 'murmures-dissonants', 'force-fantasmagorique', 'rire-hideux',
      'clairvoyance', 'faim-hadar',
    ]);
  });

  it('Esprit éveillé coûte une action bonus, cible à 9 m et dure le niveau en minutes', () => {
    expect(isGreatOldOneLevel3(goo())).toBe(true);
    expect(awakenedMindRules(goo(3, 18))).toEqual({
      targetRangeMeters: 9,
      communicationMiles: 4,
      durationMinutes: 3,
      action: 'bonus',
      requiresVisibleTarget: true,
      sharedLanguageRequired: true,
    });
  });

  it('la portée de communication d’Esprit éveillé est au minimum de 1 mile', () => {
    expect(awakenedMindRules(goo(5, 8))?.communicationMiles).toBe(1);
  });

  it('Sorts psychiques retire V/S seulement aux Enchantements et Illusions d’Occultiste', () => {
    expect(greatOldOneSuppressesVerbalSomatic(goo(), 'occultiste', 'Enchantement')).toBe(true);
    expect(greatOldOneSuppressesVerbalSomatic(goo(), 'occultiste', 'Illusion')).toBe(true);
    expect(greatOldOneSuppressesVerbalSomatic(goo(), 'occultiste', 'Évocation')).toBe(false);
    expect(greatOldOneSuppressesVerbalSomatic(goo(), 'magicien', 'Illusion')).toBe(false);
  });

  it('permet de convertir en psychique seulement un sort d’Occultiste qui inflige des dégâts', () => {
    expect(greatOldOneCanConvertDamage(goo(), 'occultiste', 'La cible subit 2d6 dégâts de froid.')).toBe(true);
    expect(greatOldOneCanConvertDamage(goo(), 'occultiste', 'La cible devient Charmée.')).toBe(false);
    expect(greatOldOneCanConvertDamage(goo(), 'magicien', 'La cible subit 2d6 dégâts.')).toBe(false);
  });
});
