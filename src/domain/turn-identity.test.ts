import { describe, expect, it } from 'vitest';
import { turnIdentity } from './turn-identity';
import { beginEncounter, nextTurn, type Combatant, type EncounterState } from './encounter';

const combattant = (id: string, initiative: number): Combatant => ({
  id, name: id, side: 'creature', initiative, dexterity: 0,
  maxHp: 10, damageTaken: 0, temporaryHp: 0, armorClass: 12, conditions: [],
});

const rencontre: EncounterState = {
  combatants: [combattant('a', 20), combattant('b', 15)], turnIndex: -1, round: 0,
};

describe('§23 — identité de tour', () => {
  it('hors combat, une identité stable et unique', () => {
    expect(turnIdentity('e1', rencontre)).toBe('libre');
    expect(turnIdentity('e1', null)).toBe('libre');
  });

  it('ne change pas tant qu’on reste dans le même tour', () => {
    const lance = beginEncounter(rencontre);
    expect(turnIdentity('e1', lance)).toBe(turnIdentity('e1', lance));
  });

  it('change quand le tour passe au combattant suivant', () => {
    const lance = beginEncounter(rencontre);
    expect(turnIdentity('e1', nextTurn(lance))).not.toBe(turnIdentity('e1', lance));
  });

  it('change quand le même combattant rejoue au round suivant', () => {
    // C'est le cas que « round » seul ou « combattant » seul manquerait.
    const lance = beginEncounter(rencontre);
    const tourSuivantDeA = nextTurn(nextTurn(lance));
    expect(tourSuivantDeA.round).toBe(2);
    expect(turnIdentity('e1', tourSuivantDeA)).not.toBe(turnIdentity('e1', lance));
  });

  it('deux rencontres différentes n’ont jamais la même identité de tour', () => {
    const lance = beginEncounter(rencontre);
    expect(turnIdentity('e1', lance)).not.toBe(turnIdentity('e2', lance));
  });
});
