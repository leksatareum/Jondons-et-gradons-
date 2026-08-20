import { describe, expect, it } from 'vitest';
import { addItem, removeItem, setGold, setItemQty } from './inventory';
import { EMPTY_LIVE_STATE, type CharacterSheet } from './character';

const fiche = (over: Partial<CharacterSheet> = {}): CharacterSheet => ({
  id: 'f', name: 'Fixture', speciesId: 'humain', lineageId: null, ancestryId: null, size: null,
  backgroundId: 'sage',
  abilities: { str: 10, dex: 10, con: 14, int: 10, wis: 16, cha: 16 },
  alignment: null,
  classLevels: [{ classId: 'magicien', level: 1, subclass: null, subclassId: null }],
  classChoices: {}, skillProficiencies: [], expertise: [], toolProficiencies: [],
  languages: [], featIds: [], abilityImprovements: [], cantrips: [], spells: [],
  inventory: [], armorId: null, shield: false, gold: 10,
  live: { ...EMPTY_LIVE_STATE, hitDiceSpent: {}, spellSlotsSpent: {}, resourcesSpent: {}, conditions: [] },
  ...over,
});

describe('ajouter un objet', () => {
  it('l’ajoute avec un identifiant propre, sans toucher au reste du sac', () => {
    const depart = fiche({ inventory: [{ id: 'x', name: 'Corde', qty: 1 }] });
    const suivante = addItem(depart, { name: 'Torche', qty: 3 });
    expect(suivante.inventory).toHaveLength(2);
    expect(suivante.inventory[1]).toMatchObject({ name: 'Torche', qty: 3 });
    expect(suivante.inventory[0]).toEqual(depart.inventory[0]);
  });

  it('une quantité nulle ou négative devient 1 — un objet ajouté existe', () => {
    expect(addItem(fiche(), { name: 'Dague', qty: 0 }).inventory[0]?.qty).toBe(1);
    expect(addItem(fiche(), { name: 'Dague', qty: -3 }).inventory[0]?.qty).toBe(1);
  });
});

describe('changer une quantité', () => {
  it('met à jour la quantité de l’objet visé, sans toucher aux autres', () => {
    const depart = fiche({ inventory: [{ id: 'a', name: 'Flèche', qty: 20 }, { id: 'b', name: 'Corde', qty: 1 }] });
    const suivante = setItemQty(depart, 'a', 15);
    expect(suivante.inventory).toEqual([{ id: 'a', name: 'Flèche', qty: 15 }, { id: 'b', name: 'Corde', qty: 1 }]);
  });

  it('une quantité à 0 ou en dessous retire l’objet — un « 0 » n’a rien à faire dans un sac', () => {
    const depart = fiche({ inventory: [{ id: 'a', name: 'Flèche', qty: 3 }] });
    expect(setItemQty(depart, 'a', 0).inventory).toEqual([]);
    expect(setItemQty(depart, 'a', -1).inventory).toEqual([]);
  });
});

describe('retirer un objet', () => {
  it('retire uniquement l’objet visé', () => {
    const depart = fiche({ inventory: [{ id: 'a', name: 'Flèche', qty: 3 }, { id: 'b', name: 'Corde', qty: 1 }] });
    expect(removeItem(depart, 'a').inventory).toEqual([{ id: 'b', name: 'Corde', qty: 1 }]);
  });
});

describe('la bourse', () => {
  it('fixe l’or, jamais sous zéro', () => {
    expect(setGold(fiche(), 42).gold).toBe(42);
    expect(setGold(fiche(), -5).gold).toBe(0);
  });
});
