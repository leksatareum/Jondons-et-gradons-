import { describe, expect, it } from 'vitest';
import { ABILITY_IDS, EPIC_BOONS, GENERAL_FEATS, eligibleAbilityOptions, eligibleFeats, featById, isFeatEligible } from './feats';

const base = {
  level: 4,
  abilities: { str: 12, dex: 14, con: 12, int: 10, wis: 13, cha: 8 },
  spellcasting: false,
  armorTraining: ['Légère'],
  shieldTraining: false,
  saveProficiencies: ['str'] as const,
  existingFeatIds: [] as string[],
};

describe('catalogue de dons 2024', () => {
  it('contient les 42 dons généraux et les 12 faveurs épiques sans doublon', () => {
    expect(GENERAL_FEATS).toHaveLength(42);
    expect(EPIC_BOONS).toHaveLength(12);
    expect(new Set([...GENERAL_FEATS, ...EPIC_BOONS].map((feat) => feat.id)).size).toBe(54);
  });

  it('décrit une augmentation de caractéristique valide pour chaque don', () => {
    for (const feat of [...GENERAL_FEATS, ...EPIC_BOONS]) {
      expect(feat.abilityOptions.length).toBeGreaterThan(0);
      expect(feat.abilityOptions.every((ability) => ABILITY_IDS.includes(ability))).toBe(true);
    }
  });

  it('applique les prérequis de caractéristique, magie et entraînement', () => {
    expect(isFeatEligible(featById('general-actor')!, base)).toBe(false);
    expect(isFeatEligible(featById('general-athlete')!, base)).toBe(true);
    expect(isFeatEligible(featById('general-spell-sniper')!, base)).toBe(false);
    expect(isFeatEligible(featById('general-moderately-armored')!, base)).toBe(true);
    expect(isFeatEligible(featById('general-shield-master')!, base)).toBe(false);
  });

  it('réserve les faveurs épiques au niveau 19 et vérifie Incantation', () => {
    expect(eligibleFeats(base, true).some((feat) => feat.category === 'epic')).toBe(false);
    const level19 = { ...base, level: 19 };
    expect(isFeatEligible(featById('epic-combat-prowess')!, level19)).toBe(true);
    expect(isFeatEligible(featById('epic-spell-recall')!, level19)).toBe(false);
    expect(isFeatEligible(featById('epic-spell-recall')!, { ...level19, spellcasting: true })).toBe(true);
  });

  it('empêche les doublons non répétables et respecte les plafonds', () => {
    const actor = featById('general-actor')!;
    const actorContext = { ...base, abilities: { ...base.abilities, cha: 13 }, existingFeatIds: [actor.id] };
    expect(isFeatEligible(actor, actorContext)).toBe(false);
    const capped = { ...actorContext, existingFeatIds: [], abilities: { ...actorContext.abilities, cha: 20 } };
    expect(eligibleAbilityOptions(actor, capped)).toEqual([]);
  });

  it('Résilient exclut une sauvegarde déjà maîtrisée', () => {
    const resilient = featById('general-resilient')!;
    expect(eligibleAbilityOptions(resilient, base)).not.toContain('str');
    expect(eligibleAbilityOptions(resilient, base)).toContain('dex');
  });
});
