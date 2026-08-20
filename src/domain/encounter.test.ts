import { describe, expect, it } from 'vitest';
import {
  activeCombatant, addCombatant, applyDamage, applyHealing, beginEncounter, endEncounter, isDown,
  isRunning, nextTurn, orderedCombatants, previousTurn, remainingHp, replaceCombatant,
  withDistinctNames, type Combatant, type EncounterState,
} from './encounter';

const combattant = (id: string, initiative: number, extra: Partial<Combatant> = {}): Combatant => ({
  id, name: id, side: 'creature', initiative, dexterity: 0,
  maxHp: 10, damageTaken: 0, temporaryHp: 0, armorClass: 12, conditions: [], ...extra,
});

const rencontre = (combatants: Combatant[]): EncounterState => ({ combatants, turnIndex: -1, round: 0 });

describe('ordre d’initiative', () => {
  it('trie par initiative décroissante', () => {
    const state = rencontre([combattant('a', 12), combattant('b', 18), combattant('c', 15)]);
    expect(orderedCombatants(state).map((c) => c.id)).toEqual(['b', 'c', 'a']);
  });

  it('départage à égalité par la Dextérité', () => {
    const state = rencontre([
      combattant('lent', 15, { dexterity: 1 }),
      combattant('rapide', 15, { dexterity: 4 }),
    ]);
    expect(orderedCombatants(state).map((c) => c.id)).toEqual(['rapide', 'lent']);
  });

  it('à Dextérité égale, l’ordre reste stable et donc reproductible', () => {
    const state = rencontre([combattant('premier', 15), combattant('second', 15)]);
    expect(orderedCombatants(state).map((c) => c.id)).toEqual(['premier', 'second']);
    expect(orderedCombatants(state).map((c) => c.id)).toEqual(['premier', 'second']);
  });
});

describe('tours et rounds', () => {
  const state = rencontre([combattant('a', 20), combattant('b', 15), combattant('c', 10)]);

  it('le combat démarre sur le premier de l’ordre, au round 1', () => {
    const started = beginEncounter(state);
    expect(started.round).toBe(1);
    expect(activeCombatant(started)?.id).toBe('a');
  });

  it('boucler en tête incrémente le round', () => {
    let current = beginEncounter(state);
    current = nextTurn(current); // b
    current = nextTurn(current); // c
    expect(current.round).toBe(1);
    current = nextTurn(current); // retour à a
    expect(current.round).toBe(2);
    expect(activeCombatant(current)?.id).toBe('a');
  });

  it('revenir en arrière décrémente le round, sans jamais passer sous 1', () => {
    let current = beginEncounter(state);
    current = previousTurn(current);
    expect(current.round).toBe(1);
    expect(activeCombatant(current)?.id).toBe('a');

    current = nextTurn(nextTurn(nextTurn(beginEncounter(state)))); // round 2, a
    current = previousTurn(current);
    expect(current.round).toBe(1);
    expect(activeCombatant(current)?.id).toBe('c');
  });

  it('aucun combattant actif tant que le combat n’a pas commencé', () => {
    expect(activeCombatant(state)).toBeNull();
  });
});

describe('dégâts', () => {
  it('les points de vie temporaires absorbent en premier', () => {
    const cible = combattant('cible', 10, { maxHp: 20, temporaryHp: 5 });
    const { combatant, absorbedByTemporary } = applyDamage(cible, 8);
    expect(absorbedByTemporary).toBe(5);
    expect(combatant.temporaryHp).toBe(0);
    expect(remainingHp(combatant)).toBe(17);
  });

  it('la résistance s’applique AVANT les points de vie temporaires', () => {
    const cible = combattant('cible', 10, { maxHp: 20, temporaryHp: 5 });
    const { applied, absorbedByTemporary, combatant } = applyDamage(cible, 8, 'feu', { resistances: ['feu'] });
    // 8 → 4 après résistance, absorbés entièrement par les 5 PV temporaires.
    expect(applied).toBe(4);
    expect(absorbedByTemporary).toBe(4);
    expect(remainingHp(combatant)).toBe(20);
  });

  it('signale le passage à 0, une seule fois', () => {
    const cible = combattant('cible', 10, { maxHp: 6 });
    const premier = applyDamage(cible, 10);
    expect(premier.droppedToZero).toBe(true);
    expect(isDown(premier.combatant)).toBe(true);
    expect(applyDamage(premier.combatant, 3).droppedToZero).toBe(false);
  });

  it('les dégâts ne dépassent jamais le maximum de points de vie', () => {
    const { combatant } = applyDamage(combattant('cible', 10, { maxHp: 8 }), 100);
    expect(combatant.damageTaken).toBe(8);
    expect(remainingHp(combatant)).toBe(0);
  });

  it('une immunité annule tout et le signale', () => {
    const { applied, note } = applyDamage(combattant('cible', 10), 12, 'poison', { immunities: ['poison'] });
    expect(applied).toBe(0);
    expect(note).toMatch(/immunisé/);
  });
});

describe('soins', () => {
  it('ne dépassent pas le maximum', () => {
    const blesse = combattant('cible', 10, { maxHp: 20, damageTaken: 5 });
    expect(remainingHp(applyHealing(blesse, 50))).toBe(20);
  });
});

describe('créatures homonymes', () => {
  it('numérote les doublons et laisse les noms uniques tranquilles', () => {
    const noms = withDistinctNames([
      combattant('g1', 12, { name: 'Gobelin' }),
      combattant('g2', 12, { name: 'Gobelin' }),
      combattant('chef', 14, { name: 'Chef gobelin' }),
      combattant('g3', 12, { name: 'Gobelin' }),
    ]).map((c) => c.name);
    expect(noms).toEqual(['Gobelin 1', 'Gobelin 2', 'Chef gobelin', 'Gobelin 3']);
  });
});

describe('mise à jour', () => {
  it('remplace un combattant sans changer l’ordre', () => {
    const state = rencontre([combattant('a', 20), combattant('b', 15)]);
    const blesse = { ...state.combatants[1], damageTaken: 4 };
    const suivant = replaceCombatant(state, blesse);
    expect(suivant.combatants.map((c) => c.id)).toEqual(['a', 'b']);
    expect(remainingHp(suivant.combatants[1])).toBe(6);
  });
});

describe('le tour par tour n’existe que si le MJ le lance', () => {
  const state = rencontre([combattant('a', 20), combattant('b', 15)]);

  it('une rencontre non lancée ne tourne pas', () => {
    expect(isRunning(state)).toBe(false);
    expect(activeCombatant(state)).toBeNull();
  });

  it('le MJ lance, et seulement alors il y a un tour actif et un round', () => {
    const lance = beginEncounter(state);
    expect(isRunning(lance)).toBe(true);
    expect(lance.round).toBe(1);
    expect(activeCombatant(lance)?.id).toBe('a');
  });

  it('arrêter le combat conserve les combattants et leurs blessures', () => {
    let current = beginEncounter(state);
    current = replaceCombatant(current, { ...current.combatants[0], damageTaken: 6 });
    const arrete = endEncounter(current);
    expect(isRunning(arrete)).toBe(false);
    expect(activeCombatant(arrete)).toBeNull();
    expect(arrete.combatants).toHaveLength(2);
    expect(remainingHp(arrete.combatants[0])).toBe(4);
  });

  it('un combat arrêté par erreur se relance sans rien ressaisir', () => {
    const relance = beginEncounter(endEncounter(beginEncounter(state)));
    expect(isRunning(relance)).toBe(true);
    expect(relance.combatants).toHaveLength(2);
  });
});

describe('ajouter un combattant', () => {
  const base = (over: Partial<Combatant> = {}): Combatant => ({
    id: 'x', name: 'Gobelin', side: 'creature', initiative: 10, dexterity: 2,
    maxHp: 7, damageTaken: 0, temporaryHp: 0, armorClass: 15, conditions: [],
    ...over,
  });

  it('ajoute sans toucher aux autres', () => {
    const etat: EncounterState = { combatants: [base({ id: 'a' })], turnIndex: -1, round: 0 };
    const apres = addCombatant(etat, base({ id: 'b', name: 'Loup' }));
    expect(apres.combatants.map((c) => c.name)).toEqual(['Gobelin', 'Loup']);
  });

  it('renomme deux combattants qui portent le même nom', () => {
    const etat: EncounterState = { combatants: [base({ id: 'a' })], turnIndex: -1, round: 0 };
    const apres = addCombatant(etat, base({ id: 'b' }));
    expect(apres.combatants.map((c) => c.name)).toEqual(['Gobelin 1', 'Gobelin 2']);
  });

  it('un combattant qui rejoint en cours de round trouve sa place au tour suivant', () => {
    const etat: EncounterState = {
      combatants: [base({ id: 'a', initiative: 5 })], turnIndex: 0, round: 2,
    };
    const apres = addCombatant(etat, base({ id: 'b', name: 'Loup', initiative: 20 }));
    expect(orderedCombatants(apres)[0].name).toBe('Loup');
    expect(apres.turnIndex).toBe(0); // le tour en cours n'est pas perturbé
  });
});
