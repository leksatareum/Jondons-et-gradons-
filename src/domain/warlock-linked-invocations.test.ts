import { describe, expect, it } from 'vitest';
import {
  advanceGazeOfTwoMindsAtTurnEnd,
  applyInvestmentToFamiliar,
  beginGazeOfTwoMinds,
  grantInvestmentResistance,
  hasGazeOfTwoMinds,
  hasInvestmentOfChainMaster,
  investedFamiliarDamageType,
  maintainGazeOfTwoMinds,
  resolveInvestedFamiliarDamage,
  warlockSpellSaveDc,
} from './warlock-linked-invocations';

const warlock = (invocations: string | string[], extra: Record<string, unknown> = {}) => ({
  classId: 'occultiste',
  level: 5,
  classLevels: [{ classId: 'occultiste', level: 5 }],
  abilities: { cha: 18 },
  classSelections: { occultiste: { invocations } },
  turn: { bonus: false, reaction: false },
  ...extra,
});

const chainFamiliar = { family: 'familiar', source: 'pact-chain', speed: '9 m', name: 'Mouche' };

describe('Invocations liées Occultiste PHB 2024 niveaux 1 à 5', () => {
  it('Regard des deux esprits exige le niveau 5 et l’Invocation', () => {
    expect(hasGazeOfTwoMinds(warlock('gaze-of-two-minds'))).toBe(true);
    expect(hasGazeOfTwoMinds(warlock([]))).toBe(false);
    expect(hasGazeOfTwoMinds(warlock('gaze-of-two-minds', {
      level: 4,
      classLevels: [{ classId: 'occultiste', level: 4 }],
    }))).toBe(false);
  });

  it('Regard des deux esprits dure jusqu’à la fin du tour suivant et son maintien renouvelle cette durée', () => {
    const started = beginGazeOfTwoMinds(warlock('gaze-of-two-minds'), 'Aldric', 'Vision dans le noir 18 m');
    expect(started.gazeTwoMinds).toMatchObject({
      targetName: 'Aldric',
      specialSenses: 'Vision dans le noir 18 m',
      remainingOwnerTurnEnds: 2,
      castingOriginMaxDistanceMeters: 18,
      samePlaneRequired: true,
    });
    const afterCurrentTurn = advanceGazeOfTwoMindsAtTurnEnd(started);
    expect(afterCurrentTurn.gazeTwoMinds?.remainingOwnerTurnEnds).toBe(1);
    const maintained = maintainGazeOfTwoMinds(afterCurrentTurn);
    expect(maintained.gazeTwoMinds?.remainingOwnerTurnEnds).toBe(2);
    const expired = advanceGazeOfTwoMindsAtTurnEnd(advanceGazeOfTwoMindsAtTurnEnd(maintained));
    expect(expired.gazeTwoMinds).toBeNull();
  });

  it('le DD du familier investi utilise le DD de sort de l’Occultiste et le bonus de maîtrise du niveau total', () => {
    const multiclass = warlock(['pact-chain', 'investment-chain-master'], {
      level: 8,
      classLevels: [{ classId: 'occultiste', level: 5 }, { classId: 'guerrier', level: 3 }],
    });
    expect(warlockSpellSaveDc(multiclass)).toBe(15); // 8 + maîtrise 3 + CHA 4
    expect(applyInvestmentToFamiliar(multiclass, chainFamiliar, 'fly')).toMatchObject({
      investmentChainMaster: true,
      investmentMovement: 'fly',
      speed: '9 m · vol 12 m',
      saveDc: 15,
    });
  });

  it('Investissement du maître de la Chaîne exige Pacte de la Chaîne et niveau 5', () => {
    expect(hasInvestmentOfChainMaster(warlock(['pact-chain', 'investment-chain-master']))).toBe(true);
    expect(hasInvestmentOfChainMaster(warlock(['investment-chain-master']))).toBe(false);
    expect(hasInvestmentOfChainMaster(warlock(['pact-chain', 'investment-chain-master'], {
      level: 4,
      classLevels: [{ classId: 'occultiste', level: 4 }],
    }))).toBe(false);
  });

  it('le choix de déplacement ajoute soit vol 12 m soit nage 12 m sans les cumuler', () => {
    const ch = warlock(['pact-chain', 'investment-chain-master']);
    const flying = applyInvestmentToFamiliar(ch, chainFamiliar, 'fly');
    expect(flying.speed).toBe('9 m · vol 12 m');
    const swimming = applyInvestmentToFamiliar(ch, flying, 'swim');
    expect(swimming.speed).toBe('9 m · nage 12 m');
  });

  it('les dégâts physiques du familier peuvent devenir nécrotiques ou radiants', () => {
    const ch = warlock(['pact-chain', 'investment-chain-master']);
    expect(investedFamiliarDamageType(ch, chainFamiliar, 'Nécrotique').investmentDamageType).toBe('Nécrotique');
    expect(investedFamiliarDamageType(ch, chainFamiliar, 'Radiant').investmentDamageType).toBe('Radiant');
  });

  it('la Réaction de Résistance réduit de moitié la prochaine instance de dégâts puis se dissipe', () => {
    const ch = warlock(['pact-chain', 'investment-chain-master']);
    const protectedFamiliar = grantInvestmentResistance(ch, chainFamiliar);
    const first = resolveInvestedFamiliarDamage(protectedFamiliar, 11);
    expect(first.damage).toBe(5);
    expect(first.companion.resistanceToNextDamage).toBe(false);
    expect(resolveInvestedFamiliarDamage(first.companion, 11).damage).toBe(11);
  });
});
