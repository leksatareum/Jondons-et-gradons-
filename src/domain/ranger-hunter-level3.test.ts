import { describe, expect, it } from 'vitest';
import {
  applyColossusSlayer,
  applyHordeBreaker,
  colossusSlayerAvailable,
  favoredEnemyFreeCasts,
  hordeBreakerAvailable,
  hunterLoreAvailable,
  hunterPreyChoice,
  isHunterLevelThree,
} from './ranger-hunter-level3';

const hunter = (choice: 'colossus-slayer' | 'horde-breaker', extra: Record<string, unknown> = {}) => ({
  classId: 'rodeur',
  level: 3,
  subclass: 'Chasseur',
  classLevels: [{ classId: 'rodeur', level: 3, subclass: 'Chasseur' }],
  classSelections: { rodeur: { hunterPrey: choice } },
  turn: {},
  ...extra,
});

describe('Rôdeur / Chasseur PHB 2024 niveau 3', () => {
  it('suit les lancements gratuits d’Ennemi juré selon les paliers officiels', () => {
    expect(favoredEnemyFreeCasts(1)).toBe(2);
    expect(favoredEnemyFreeCasts(4)).toBe(2);
    expect(favoredEnemyFreeCasts(5)).toBe(3);
    expect(favoredEnemyFreeCasts(9)).toBe(4);
    expect(favoredEnemyFreeCasts(13)).toBe(5);
    expect(favoredEnemyFreeCasts(17)).toBe(6);
  });

  it('reconnaît le Chasseur niveau 3 et sa Proie du chasseur', () => {
    expect(isHunterLevelThree(hunter('colossus-slayer'))).toBe(true);
    expect(hunterPreyChoice(hunter('colossus-slayer'))).toBe('colossus-slayer');
    expect(hunterPreyChoice(hunter('horde-breaker'))).toBe('horde-breaker');
    expect(isHunterLevelThree({ ...hunter('colossus-slayer'), level: 2, classLevels: [{ classId: 'rodeur', level: 2, subclass: 'Chasseur' }] })).toBe(false);
  });

  it('Tueur de colosses exige une touche d’arme sur une cible blessée et ne s’applique qu’une fois par tour', () => {
    const ch = hunter('colossus-slayer');
    expect(colossusSlayerAvailable(ch, { weaponHit: true, targetMissingHp: true })).toBe(true);
    expect(colossusSlayerAvailable(ch, { weaponHit: false, targetMissingHp: true })).toBe(false);
    expect(colossusSlayerAvailable(ch, { weaponHit: true, targetMissingHp: false })).toBe(false);
    const used = applyColossusSlayer(ch)!;
    expect(used.turn?.hunterColossusSlayerUsed).toBe(true);
    expect(colossusSlayerAvailable(used, { weaponHit: true, targetMissingHp: true })).toBe(false);
  });

  it('Briseur de horde ne s’utilise qu’une fois par tour', () => {
    const ch = hunter('horde-breaker');
    expect(hordeBreakerAvailable(ch)).toBe(true);
    const used = applyHordeBreaker(ch)!;
    expect(used.turn?.hunterHordeBreakerUsed).toBe(true);
    expect(hordeBreakerAvailable(used)).toBe(false);
  });

  it('Savoir du chasseur devient pertinent pendant la concentration sur Marque du chasseur', () => {
    const ch = hunter('colossus-slayer');
    expect(hunterLoreAvailable(ch, 'Marque du chasseur')).toBe(true);
    expect(hunterLoreAvailable(ch, 'Enchevêtrement')).toBe(false);
  });
});
