import { describe, expect, it } from 'vitest';
import {
  applyRangerTirelessShortRest,
  feralSensesRangeMeters,
  hunterMarkActiveOnTarget,
  hunterMarkDamageDie,
  hunterMarkDamageFormula,
  preciseHunterApplies,
  relentlessHunterProtectsConcentration,
  tirelessMaxUses,
} from './ranger-core-2024';

const ranger = (level: number, wis = 16, extra = {}) => ({
  level,
  classId: 'rodeur',
  classLevels: [{ classId: 'rodeur', level }],
  abilities: { wis },
  exhaustion: 2,
  conditions: [{ label: 'Concentration', detail: 'Marque du chasseur' }],
  hunterMarkTarget: 'Ogre des marais',
  ...extra,
});

describe('Rôdeur · tronc commun PHB 2024', () => {
  it('Infatigable utilise le modificateur de Sagesse, minimum 1', () => {
    expect(tirelessMaxUses(ranger(10, 16))).toBe(3);
    expect(tirelessMaxUses(ranger(10, 8))).toBe(1);
    expect(tirelessMaxUses(ranger(9, 20))).toBe(0);
  });

  it('Infatigable retire un niveau d’Épuisement après un repos court au niveau 10+', () => {
    expect(applyRangerTirelessShortRest(ranger(10)).exhaustion).toBe(1);
    expect(applyRangerTirelessShortRest(ranger(9)).exhaustion).toBe(2);
    expect(applyRangerTirelessShortRest(ranger(10, 16, { exhaustion: 0 })).exhaustion).toBe(0);
  });

  it('Chasseur implacable protège seulement la concentration sur Marque du chasseur', () => {
    expect(relentlessHunterProtectsConcentration(ranger(13))).toBe(true);
    expect(relentlessHunterProtectsConcentration(ranger(12))).toBe(false);
    expect(relentlessHunterProtectsConcentration(ranger(13), 'Enchevêtrement')).toBe(false);
  });

  it('suit la cible réellement marquée sans confondre les noms', () => {
    expect(hunterMarkActiveOnTarget(ranger(5), 'ogre des marais')).toBe(true);
    expect(hunterMarkActiveOnTarget(ranger(5), 'Gobelin')).toBe(false);
    expect(hunterMarkActiveOnTarget(ranger(5, 16, { conditions: [] }), 'Ogre des marais')).toBe(false);
  });

  it('Chasseur précis donne l’avantage à partir du niveau 17 sur la cible marquée', () => {
    expect(preciseHunterApplies(ranger(17), 'Ogre des marais')).toBe(true);
    expect(preciseHunterApplies(ranger(16), 'Ogre des marais')).toBe(false);
    expect(preciseHunterApplies(ranger(17), 'Gobelin')).toBe(false);
  });

  it('Tueur d’ennemis fait passer le dé de Marque du chasseur à d10 au niveau 20', () => {
    expect(hunterMarkDamageDie(ranger(19))).toBe('1d6');
    expect(hunterMarkDamageDie(ranger(20))).toBe('1d10');
    expect(hunterMarkDamageFormula(ranger(20), 'Ogre des marais', '1d8+4')).toBe('1d8+4+1d10');
    expect(hunterMarkDamageFormula(ranger(20), 'Gobelin', '1d8+4')).toBe('1d8+4');
  });

  it('Sens farouches donne 9 m de perception aveugle au niveau 18', () => {
    expect(feralSensesRangeMeters(ranger(17))).toBe(0);
    expect(feralSensesRangeMeters(ranger(18))).toBe(9);
  });
});
