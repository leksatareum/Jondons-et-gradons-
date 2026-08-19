import { describe, expect, it } from 'vitest';
import { applyEndOfTurn, applyInitiativeRoll, applyStartOfTurn, declineSelfRestoration, declineUncannyMetabolism, martialArtsDie, useSelfRestoration, useUncannyMetabolism } from './initiative';

const resource = (name: string, current: number, max: number) => ({ name, current, max });

describe('déclencheurs d’initiative 2024', () => {
  it('rend jusqu’à deux Inspirations bardiques au niveau 18', () => {
    const next = applyInitiativeRoll({ classId: 'barde', level: 18, hp: 30, hpMax: 30, resources: [resource('Inspiration bardique', 0, 5)] });
    expect(next.resources?.[0].current).toBe(2);
  });

  it('ne rend pas de Forme sauvage à l’initiative avant Archidruide', () => {
    const next = applyInitiativeRoll({ classId: 'druide', level: 19, hp: 30, hpMax: 30,
      resources: [resource('Forme sauvage', 0, 4), resource('Résurgence sauvage', 1, 1)] });
    expect(next.resources?.find((entry) => entry.name === 'Forme sauvage')?.current).toBe(0);
  });

  it('Forme sauvage pérenne rend une utilisation à l’initiative au niveau 20', () => {
    const next = applyInitiativeRoll({ classId: 'druide', level: 20, hp: 30, hpMax: 30,
      resources: [resource('Forme sauvage', 0, 4), resource('Résurgence sauvage', 0, 1)] });
    expect(next.resources?.find((entry) => entry.name === 'Forme sauvage')?.current).toBe(1);
  });

  it('propose le Métabolisme surnaturel puis restaure Focus et PV', () => {
    const rolled = applyInitiativeRoll({ classId: 'moine', level: 11, hp: 20, hpMax: 60,
      resources: [resource('Concentration du moine', 1, 11), resource('Métabolisme surnaturel', 1, 1)] });
    expect(rolled.pendingInitiativeChoice).toBe('uncanny-metabolism');
    const used = useUncannyMetabolism(rolled, 7);
    expect(used.resources?.find((entry) => entry.name === 'Concentration du moine')?.current).toBe(11);
    expect(used.resources?.find((entry) => entry.name === 'Métabolisme surnaturel')?.current).toBe(0);
    expect(used.hp).toBe(38);
  });

  it('applique Focus parfait si le moine refuse le Métabolisme', () => {
    const rolled = applyInitiativeRoll({ classId: 'moine', level: 15, hp: 50, hpMax: 70,
      resources: [resource('Concentration du moine', 2, 15), resource('Métabolisme surnaturel', 1, 1)] });
    const declined = declineUncannyMetabolism(rolled);
    expect(declined.resources?.find((entry) => entry.name === 'Concentration du moine')?.current).toBe(4);
  });

  it('accorde l’Inspiration héroïque au Champion au début de son tour', () => {
    const next = applyStartOfTurn({ classId: 'guerrier', level: 10, subclass: 'Champion', inspiration: false, hp: 80, hpMax: 80 });
    expect(next.inspiration).toBe(true);
  });

  it('suit le dé d’Arts martiaux', () => {
    expect([martialArtsDie(2), martialArtsDie(5), martialArtsDie(11), martialArtsDie(17)]).toEqual([6, 8, 10, 12]);
  });

  it('décompte les effets en rounds au début du tour du porteur', () => {
    const character = { hp: 10, hpMax: 10, conditions: [{ label: 'Sorcellerie innée', remainingRounds: 2 }] };
    const first = applyStartOfTurn(character);
    expect(first.conditions).toEqual([{ label: 'Sorcellerie innée', remainingRounds: 1 }]);
    expect(applyStartOfTurn(first).conditions).toEqual([]);
  });

  it('conserve un effet jusqu’à la fin du prochain tour', () => {
    const character = { hp: 10, hpMax: 10, conditions: [{ label: 'Invisible', expires: 'end-next-turn' as const }] };
    expect(applyEndOfTurn(character).conditions).toHaveLength(1);
    const started = applyStartOfTurn(character);
    expect((started.conditions?.[0] as { armedForExpiry?: boolean }).armedForExpiry).toBe(true);
    expect(applyEndOfTurn(started).conditions).toEqual([]);
  });

  it('propose au moine niveau 10 de retirer un état à la fin de son tour', () => {
    const monk = { classId: 'moine', level: 10, hp: 35, hpMax: 50,
      conditions: [{ label: 'Charmé' }, { label: 'Empoisonné' }] };
    const ended = applyEndOfTurn(monk);
    expect(ended.pendingSelfRestoration).toEqual(['Charmé', 'Empoisonné']);
    expect(useSelfRestoration(ended, 'Charmé').conditions).toEqual([{ label: 'Empoisonné' }]);
    expect(declineSelfRestoration(ended).pendingSelfRestoration).toBeNull();
  });
});
