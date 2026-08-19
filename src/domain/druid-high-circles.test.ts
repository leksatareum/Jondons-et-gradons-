import { describe, expect, it } from 'vitest';
import { seaStormbornBenefits } from './druid-level3-subclasses';
import {
  activateNatureSanctuary,
  activateOceanicGift,
  consultCosmicOmen,
  cosmicOmenMaxUses,
  cosmicOmenRemaining,
  natureSanctuaryRules,
  oceanicGiftAvailable,
  resetHighCircleLongRest,
  useCosmicOmen,
} from './druid-high-circles';

const druid = (subclass: string, level: number, wis = 18, wildShape = 4) => ({
  classId: 'druide',
  level,
  subclass,
  classLevels: [{ classId: 'druide', level, subclass }],
  abilities: { wis },
  resources: [{ name: 'Forme sauvage', current: wildShape, max: 4 }],
  conditions: [],
  circleLandType: 'arid' as const,
  turn: { action: false, bonus: false, reaction: false },
});

describe('Cercles druidiques · capacités haut niveau PHB 2024', () => {
  it('Sanctuaire de la nature dépense une Forme sauvage et crée le cube pendant 10 rounds', () => {
    expect(natureSanctuaryRules(druid('Cercle de la Terre', 13))).toBeNull();
    expect(natureSanctuaryRules(druid('Cercle de la Terre', 14))).toEqual({
      cubeMeters: 4.5,
      rangeMeters: 36,
      moveMeters: 18,
      durationRounds: 10,
      allyResistance: 'feu',
    });
    const active = activateNatureSanctuary(druid('Cercle de la Terre', 14));
    expect(active.resources?.[0].current).toBe(3);
    expect(active.conditions?.find((condition) => condition.label === 'Sanctuaire de la nature')).toMatchObject({ remainingRounds: 10, endsWhenIncapacitated: true });
  });

  it('Don océanique place Courroux sur un allié pour 1 usage sans donner Né de la tempête au Druide', () => {
    const sea = druid('Cercle de la Mer', 14);
    expect(oceanicGiftAvailable(sea)).toBe(true);
    const gifted = activateOceanicGift(sea, 'ally', 'Mira');
    expect(gifted.resources?.[0].current).toBe(3);
    expect(gifted.wrathOfSea).toMatchObject({ host: 'ally', allyName: 'Mira' });
    expect(seaStormbornBenefits(gifted)).toEqual({ flySpeedEqualsSpeed: false, resistances: [] });
  });

  it('Don océanique peut manifester Courroux sur soi et l’allié pour 2 usages', () => {
    const gifted = activateOceanicGift(druid('Cercle de la Mer', 14), 'both', 'Mira');
    expect(gifted.resources?.[0].current).toBe(2);
    expect(gifted.wrathOfSea).toMatchObject({ host: 'both', allyName: 'Mira' });
    expect(seaStormbornBenefits(gifted).resistances).toEqual(['froid', 'foudre', 'tonnerre']);
  });

  it('Présage cosmique choisit Grâce sur pair, Malheur sur impair et suit SAG utilisations', () => {
    const stars = druid('Cercle des Étoiles', 6, 18);
    expect(cosmicOmenMaxUses(stars)).toBe(4);
    const weal = consultCosmicOmen(stars, 4);
    expect(weal.cosmicOmenMode).toBe('weal');
    const result = useCosmicOmen(weal, 5);
    expect(result?.modifier).toBe(5);
    expect(cosmicOmenRemaining(result!.character)).toBe(3);
    expect(consultCosmicOmen(stars, 3).cosmicOmenMode).toBe('woe');
    expect(useCosmicOmen(consultCosmicOmen(stars, 3), 6)?.modifier).toBe(-6);
  });

  it('le repos long efface le présage précédent et le Sanctuaire', () => {
    const sanctuary = activateNatureSanctuary(druid('Cercle de la Terre', 14));
    const reset = resetHighCircleLongRest({ ...sanctuary, cosmicOmenMode: 'weal', cosmicOmenUsed: 2 });
    expect(reset.cosmicOmenMode).toBeNull();
    expect(reset.cosmicOmenUsed).toBe(0);
    expect(reset.conditions?.some((condition) => condition.label === 'Sanctuaire de la nature')).toBe(false);
  });
});
