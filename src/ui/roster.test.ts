import { describe, expect, it } from 'vitest';
import { combatantFromSheet, withParty } from './roster';
import type { EncounterState } from '../domain/encounter';
import type { StoredSheet } from '../sync/campaign-sync';
import { EMPTY_LIVE_STATE, type CharacterSheet } from '../model/character';

const fiche = (name: string, over: Partial<CharacterSheet> = {}): CharacterSheet => ({
  id: name, name, speciesId: 'humain', lineageId: null, ancestryId: null, size: null,
  backgroundId: 'sage',
  abilities: { str: 10, dex: 16, con: 14, int: 10, wis: 10, cha: 10 },
  alignment: null,
  classLevels: [{ classId: 'rodeur', level: 2, subclass: null, subclassId: null }],
  classChoices: {}, skillProficiencies: [], expertise: [], toolProficiencies: [],
  languages: [], featIds: [], abilityImprovements: [], cantrips: [], spells: [],
  inventory: [], armorId: null, shield: false, gold: 0,
  live: { ...EMPTY_LIVE_STATE, hitDiceSpent: {}, spellSlotsSpent: {}, resourcesSpent: {}, conditions: [] },
  ...over,
});

const stored = (id: string, sheet: CharacterSheet): StoredSheet => ({ id, ownerId: 'u-' + id, version: 1, data: sheet });
const vide: EncounterState = { combatants: [], turnIndex: -1, round: 0 };

describe('le groupe en combattants', () => {
  it('dérive les points de vie, la CA et la Dextérité au lieu de les recopier', () => {
    const combattant = combatantFromSheet(fiche('Veya'), 'f1');
    expect(combattant.side).toBe('joueur');
    expect(combattant.dexterity).toBe(3);
    expect(combattant.maxHp).toBeGreaterThan(0);
    expect(combattant.armorClass).toBeGreaterThan(0);
    expect(combattant.initiative).toBe(0);
  });

  it('reprend les dégâts déjà encaissés sur la fiche', () => {
    const blesse = fiche('Thorin');
    blesse.live.damageTaken = 4;
    blesse.live.temporaryHp = 2;
    const combattant = combatantFromSheet(blesse, 'f2');
    expect(combattant.damageTaken).toBe(4);
    expect(combattant.temporaryHp).toBe(2);
  });
});

describe('withParty', () => {
  it('montre le groupe avant même qu’une rencontre existe', () => {
    const state = withParty(vide, [stored('f1', fiche('Veya')), stored('f2', fiche('Thorin'))]);
    expect(state.combatants.map((c) => c.name)).toEqual(['Veya', 'Thorin']);
    expect(state.turnIndex).toBe(-1);
  });

  it('n’écrase pas les dégâts donnés pendant le combat', () => {
    const depart = withParty(vide, [stored('f1', fiche('Veya'))]);
    const frappe = {
      ...depart,
      combatants: [{ ...depart.combatants[0], damageTaken: 7 }],
    };
    const apres = withParty(frappe, [stored('f1', fiche('Veya'))]);
    expect(apres.combatants[0].damageTaken).toBe(7);
    expect(apres).toBe(frappe);
  });

  it('ajoute un joueur arrivé en cours de route sans toucher aux autres', () => {
    const depart = withParty(vide, [stored('f1', fiche('Veya'))]);
    const apres = withParty(depart, [stored('f1', fiche('Veya')), stored('f2', fiche('Thorin'))]);
    expect(apres.combatants.map((c) => c.id)).toEqual(['f1', 'f2']);
  });
});
