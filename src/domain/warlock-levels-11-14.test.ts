import { describe, expect, it } from 'vitest';
import {
  aberrantSpiritProfile, advanceCreateThrallTurn, createThrallCanModifySummon,
  createThrallCompanion, createThrallHexBonusAvailable, createThrallTemporaryHp,
  devouringBladeEligible, isGreatOldOneLevelFourteen,
} from './warlock-levels-11-14';

const warlock = (extra: Record<string, unknown> = {}) => ({
  classId: 'occultiste',
  level: 14,
  subclass: 'Patron Grand Ancien',
  classLevels: [{ classId: 'occultiste', level: 14, subclass: 'Patron Grand Ancien' }],
  abilities: { cha: 18 },
  classSelections: { occultiste: { invocations: ['pact-blade', 'thirsting-blade', 'devouring-blade'] } },
  pactBladeWeaponId: 'epeelongue',
  ...extra,
});

describe('Occultiste PHB 2024 niveaux 11 à 14', () => {
  it('Lame dévorante exige niveau 12, Lame assoiffée et arme de pacte', () => {
    expect(devouringBladeEligible(warlock(), 'epeelongue')).toBe(true);
    expect(devouringBladeEligible(warlock(), 'dague')).toBe(false);
    expect(devouringBladeEligible(warlock({ level: 11, classLevels: [{ classId: 'occultiste', level: 11, subclass: 'Patron Grand Ancien' }] }), 'epeelongue')).toBe(false);
    expect(devouringBladeEligible(warlock({ classSelections: { occultiste: { invocations: ['pact-blade', 'devouring-blade'] } } }), 'epeelongue')).toBe(false);
  });

  it('Créer un serviteur ne s’active que pour un Grand Ancien niveau 14 et Invocation d’une aberration', () => {
    expect(isGreatOldOneLevelFourteen(warlock())).toBe(true);
    expect(createThrallCanModifySummon(warlock(), 'invocation-aberration')).toBe(true);
    expect(createThrallCanModifySummon(warlock(), 'invocation-fee')).toBe(false);
    expect(createThrallCanModifySummon(warlock({ subclass: 'Patron Fiélon', classLevels: [{ classId: 'occultiste', level: 14, subclass: 'Patron Fiélon' }] }), 'invocation-aberration')).toBe(false);
  });

  it('Créer un serviteur accorde niveau d’Occultiste + modificateur de Charisme en PV temporaires', () => {
    expect(createThrallTemporaryHp(warlock())).toBe(18);
    expect(createThrallTemporaryHp(warlock({ abilities: { cha: 20 } }))).toBe(19);
  });

  it('calcule le bloc d’Esprit aberrant avec le niveau réel de l’emplacement', () => {
    const spectator = aberrantSpiritProfile(warlock(), 5, 'beholderkin');
    expect(spectator.ac).toBe(16);
    expect(spectator.hpMax).toBe(50);
    expect(spectator.multiattack).toBe(2);
    expect(spectator.damageFormula).toBe('1d8 + 8');
    expect(spectator.damageType).toBe('Psychique');
  });

  it('crée un serviteur sans concentration pour 10 rounds avec les PV temporaires du Grand Ancien', () => {
    const companion = createThrallCompanion(warlock(), 5, 'mind-flayer', 'thrall-1');
    expect(companion).not.toBeNull();
    expect(companion?.source).toBe('great-old-one-create-thrall');
    expect(companion?.remainingRounds).toBe(10);
    expect(companion?.hp).toBe(50);
    expect(companion?.hpTemp).toBe(18);
    expect(companion?.multiattack).toBe(2);
  });

  it('le bonus de Maléfice ne s’applique qu’à la cible maudite et une fois par tour du serviteur', () => {
    const companion = createThrallCompanion(warlock(), 5, 'slaad', 'thrall-1')!;
    expect(createThrallHexBonusAvailable(companion, 'Le Duc', 'Le Duc')).toBe(true);
    expect(createThrallHexBonusAvailable(companion, 'Le Duc', 'Le Baron')).toBe(false);
    expect(createThrallHexBonusAvailable({ ...companion, turn: { ...companion.turn, createThrallHexBonusUsed: true } }, 'Le Duc', 'Le Duc')).toBe(false);
  });

  it('un nouveau tour décrémente la minute, réinitialise le bonus de Maléfice et régénère le Slaad', () => {
    const companion = createThrallCompanion(warlock(), 5, 'slaad', 'thrall-1')!;
    const next = advanceCreateThrallTurn({ ...companion, hp: 31, turn: { ...companion.turn, action: true, createThrallHexBonusUsed: true } });
    expect(next?.remainingRounds).toBe(9);
    expect(next?.hp).toBe(36);
    expect(next?.turn.action).toBe(false);
    expect(next?.turn.createThrallHexBonusUsed).toBe(false);
  });
});
