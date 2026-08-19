import { describe, expect, it } from 'vitest';
import {
  agonizingBlastBonus, attacksWithWeapon, canEldritchSmite, devilSightRangeMeters,
  devouringBladeApplies, eldritchMindConcentrationAdvantage, eldritchSmiteAvailableSlots, eldritchSmiteDamageDice,
  eldritchSpearEffectiveRangeMeters, eldritchSpearRangeBonusMeters, pactBladeAbilityModifier,
  pactBladeGrantsProficiency, repellingBlastCanPushSize, repellingBlastPushMeters,
  spendEldritchSmite, thirstingBladeApplies,
} from './warlock-levels-1-5';

const warlock = (invocations: string[], extra: Record<string, unknown> = {}) => ({
  classId: 'occultiste',
  level: 5,
  classLevels: [{ classId: 'occultiste', level: 5 }],
  abilities: { cha: 18 },
  classSelections: { occultiste: { invocations } },
  turn: { action: false, bonus: false, reaction: false },
  ...extra,
});

describe('Occultiste PHB 2024 niveaux 1 à 5', () => {
  it('Pacte de la Lame utilise le Charisme et accorde la maîtrise seulement à l’arme liée', () => {
    const ch = warlock(['pact-blade'], { pactBladeWeaponId: 'epeelongue' });
    expect(pactBladeAbilityModifier(ch, 'epeelongue')).toBe(4);
    expect(pactBladeAbilityModifier(ch, 'dague')).toBeNull();
    expect(pactBladeGrantsProficiency(ch, 'epeelongue')).toBe(true);
    expect(pactBladeGrantsProficiency(ch, 'dague')).toBe(false);
  });

  it('Lame assoiffée n’accorde l’attaque supplémentaire qu’à l’arme de pacte', () => {
    const ch = warlock(['pact-blade', 'thirsting-blade'], { pactBladeWeaponId: 'epeelongue' });
    expect(thirstingBladeApplies(ch, 'epeelongue')).toBe(true);
    expect(attacksWithWeapon(ch, 'epeelongue', 1)).toBe(2);
    expect(attacksWithWeapon(ch, 'dague', 1)).toBe(1);
  });

  it('Lame dévorante transforme Lame assoiffée en trois attaques avec l’arme de pacte au niveau 12', () => {
    const ch = warlock(['pact-blade', 'thirsting-blade', 'devouring-blade'], {
      level: 12,
      classLevels: [{ classId: 'occultiste', level: 12 }],
      pactBladeWeaponId: 'epeelongue',
    });
    expect(devouringBladeApplies(ch, 'epeelongue')).toBe(true);
    expect(attacksWithWeapon(ch, 'epeelongue', 1)).toBe(3);
    expect(attacksWithWeapon(ch, 'dague', 1)).toBe(1);
    const tooEarly = { ...ch, level: 11, classLevels: [{ classId: 'occultiste', level: 11 }] };
    expect(devouringBladeApplies(tooEarly, 'epeelongue')).toBe(false);
    expect(attacksWithWeapon(tooEarly, 'epeelongue', 1)).toBe(2);
  });

  it('Décharge agonisante cible uniquement le sort mineur choisi', () => {
    const ch = warlock(['agonizing-blast@decharge-occulte']);
    expect(agonizingBlastBonus(ch, 'decharge-occulte')).toBe(4);
    expect(agonizingBlastBonus(ch, 'trait-feu')).toBe(0);
  });

  it('Esprit occulte donne l’avantage aux sauvegardes de concentration', () => {
    expect(eldritchMindConcentrationAdvantage(warlock(['eldritch-mind']))).toBe(true);
    expect(eldritchMindConcentrationAdvantage(warlock([]))).toBe(false);
  });

  it('Lance occulte augmente réellement la portée du cantrip choisi de 9 m par niveau', () => {
    const ch = warlock(['eldritch-spear@decharge-occulte']);
    expect(eldritchSpearRangeBonusMeters(ch, 'decharge-occulte', 5)).toBe(45);
    expect(eldritchSpearEffectiveRangeMeters(ch, 'decharge-occulte', 36)).toBe(81);
    expect(eldritchSpearRangeBonusMeters(ch, 'trait-feu', 5)).toBe(0);
  });

  it('Décharge répulsive ne s’applique qu’au cantrip choisi et seulement jusqu’à taille G', () => {
    const ch = warlock(['repelling-blast@decharge-occulte']);
    expect(repellingBlastPushMeters(ch, 'decharge-occulte')).toBe(3);
    expect(repellingBlastPushMeters(ch, 'trait-feu')).toBe(0);
    expect(repellingBlastCanPushSize('G')).toBe(true);
    expect(repellingBlastCanPushSize('Large')).toBe(true);
    expect(repellingBlastCanPushSize('TG')).toBe(false);
    expect(repellingBlastCanPushSize('Huge')).toBe(false);
  });

  it('Châtiment occulte ne propose que les emplacements de Magie de pacte sur une touche de l’arme liée', () => {
    const ch = warlock(['pact-blade', 'eldritch-smite'], {
      pactBladeWeaponId: 'epeelongue',
      pactSlots: [{ level: 3, current: 2, max: 2 }],
      slots: [{ level: 1, current: 4, max: 4 }],
    });
    expect(canEldritchSmite(ch, 'epeelongue')).toBe(true);
    expect(eldritchSmiteAvailableSlots(ch, 'epeelongue')).toEqual([{ level: 3, current: 2, max: 2 }]);
    expect(canEldritchSmite(ch, 'dague')).toBe(false);
  });

  it('Châtiment occulte dépense un emplacement de pacte, inflige niveau+1 d8 et se verrouille pour le tour', () => {
    const ch = warlock(['pact-blade', 'eldritch-smite'], {
      pactBladeWeaponId: 'epeelongue',
      pactSlots: [{ level: 3, current: 2, max: 2 }],
    });
    expect(eldritchSmiteDamageDice(3)).toBe('4d8');
    const result = spendEldritchSmite(ch, 'epeelongue', 3);
    expect(result).not.toBeNull();
    expect(result?.damageDice).toBe('4d8');
    expect(result?.damageType).toBe('Force');
    expect(result?.proneMaxSize).toBe('TG');
    expect(result?.character.pactSlots?.[0].current).toBe(1);
    expect(result?.character.turn?.eldritchSmiteUsed).toBe(true);
    expect(canEldritchSmite(result!.character, 'epeelongue')).toBe(false);
  });

  it('refuse Châtiment occulte avant le niveau 5 ou sans emplacement de pacte', () => {
    const level4 = warlock(['pact-blade', 'eldritch-smite'], {
      level: 4,
      classLevels: [{ classId: 'occultiste', level: 4 }],
      pactBladeWeaponId: 'epeelongue',
      pactSlots: [{ level: 2, current: 2, max: 2 }],
    });
    expect(canEldritchSmite(level4, 'epeelongue')).toBe(false);
    expect(spendEldritchSmite(level4, 'epeelongue', 2)).toBeNull();

    const empty = warlock(['pact-blade', 'eldritch-smite'], {
      pactBladeWeaponId: 'epeelongue',
      pactSlots: [{ level: 3, current: 0, max: 2 }],
    });
    expect(canEldritchSmite(empty, 'epeelongue')).toBe(false);
  });

  it('Vision du diable porte à 36 m', () => {
    expect(devilSightRangeMeters(warlock(['devils-sight']))).toBe(36);
  });
});
