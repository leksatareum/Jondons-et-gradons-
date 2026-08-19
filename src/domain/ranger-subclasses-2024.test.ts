import { describe, expect, it } from 'vitest';
import {
  beastMasterMarkedTargetForceBonus,
  beastMasterShareSelfSpellRangeMeters,
  beastMasterStrikeCount,
  feyBeguilingTwistRangeMeters,
  feyDreadfulStrikeDie,
  feyOtherworldlyGlamourBonus,
  feyReinforcements,
  gloomDarkvisionRangeMeters,
  gloomDreadfulStrike,
  gloomFirstTurnSpeedBonusMeters,
  gloomInitiativeModifier,
  gloomIronMindOptions,
  gloomStalkersFlurry,
  hunterDefensiveTactics,
  hunterSuperiorDefenseAvailable,
  hunterSuperiorPreyBonus,
  mistyWandererFreeUses,
  shadowyDodgeTeleportMeters,
} from './ranger-subclasses-2024';

const makeRanger = (level: number, subclass: string, wis = 16, extra = {}) => ({
  level,
  classId: 'rodeur',
  subclass,
  abilities: { wis },
  ...extra,
});

const makeMarked = (level: number, subclass: string, wis = 16) => makeRanger(level, subclass, wis, {
  hunterMarkTarget: 'Cible A',
  conditions: [{ label: 'Concentration', detail: 'Marque du chasseur · Cible A' }],
});

describe('Ranger subclasses 2024', () => {
  it('covers Beast Master values', () => {
    expect(beastMasterStrikeCount(makeRanger(3, 'Maître des bêtes'))).toBe(1);
    expect(beastMasterStrikeCount(makeRanger(11, 'Maître des bêtes'))).toBe(2);
    expect(beastMasterMarkedTargetForceBonus(makeMarked(11, 'Maître des bêtes'), 'Cible A')).toBe('1d6');
    expect(beastMasterMarkedTargetForceBonus(makeMarked(20, 'Maître des bêtes'), 'Cible A')).toBe('1d10');
    expect(beastMasterMarkedTargetForceBonus(makeMarked(20, 'Maître des bêtes'), 'Cible B')).toBeNull();
    expect(beastMasterShareSelfSpellRangeMeters(makeRanger(15, 'Maître des bêtes'))).toBe(9);
  });

  it('covers Fey Wanderer values', () => {
    expect(feyDreadfulStrikeDie(makeRanger(3, 'Vagabond féerique'))).toBe('1d4');
    expect(feyDreadfulStrikeDie(makeRanger(11, 'Vagabond féerique'))).toBe('1d6');
    expect(feyOtherworldlyGlamourBonus(makeRanger(3, 'Vagabond féerique', 8))).toBe(1);
    expect(feyBeguilingTwistRangeMeters(makeRanger(7, 'Vagabond féerique'))).toBe(36);
    expect(feyReinforcements(makeRanger(11, 'Vagabond féerique'))?.freeCastsPerLongRest).toBe(1);
    expect(feyReinforcements(makeRanger(11, 'Vagabond féerique'))?.concentrationlessDurationRounds).toBe(10);
    expect(mistyWandererFreeUses(makeRanger(15, 'Vagabond féerique', 18))).toBe(4);
  });

  it('covers Gloom Stalker values', () => {
    expect(gloomInitiativeModifier(makeRanger(3, 'Traqueur des ténèbres', 18))).toBe(4);
    expect(gloomFirstTurnSpeedBonusMeters(makeRanger(3, 'Traqueur des ténèbres'))).toBe(3);
    expect(gloomDreadfulStrike(makeRanger(3, 'Traqueur des ténèbres', 8))).toEqual({ damage: '2d6', maxUses: 1, oncePerTurn: true });
    expect(gloomDreadfulStrike(makeRanger(11, 'Traqueur des ténèbres', 18))?.damage).toBe('2d8');
    expect(gloomDarkvisionRangeMeters(makeRanger(3, 'Traqueur des ténèbres'), 18)).toBe(36);
    expect(gloomIronMindOptions(makeRanger(7, 'Traqueur des ténèbres'), false)).toEqual(['wis']);
    expect(gloomIronMindOptions(makeRanger(7, 'Traqueur des ténèbres'), true)).toEqual(['int', 'cha']);
    expect(gloomStalkersFlurry(makeRanger(11, 'Traqueur des ténèbres'))?.massFearRadiusMeters).toBe(3);
    expect(shadowyDodgeTeleportMeters(makeRanger(15, 'Traqueur des ténèbres'))).toBe(9);
  });

  it('covers Hunter values', () => {
    expect(hunterDefensiveTactics(makeRanger(7, 'Chasseur'))).toEqual(['escape-the-horde', 'multiattack-defense']);
    expect(hunterSuperiorPreyBonus(makeMarked(11, 'Chasseur'), 'Cible A')).toBe('1d6');
    expect(hunterSuperiorPreyBonus({ ...makeMarked(11, 'Chasseur'), turn: { hunterSuperiorPreyUsed: true } }, 'Cible A')).toBeNull();
    expect(hunterSuperiorDefenseAvailable(makeRanger(15, 'Chasseur'))).toBe(true);
  });
});
