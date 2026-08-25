import { describe, expect, it } from 'vitest';
import { reposDeGroupe } from './GmRestDialog';
import { EMPTY_LIVE_STATE, type CharacterSheet, type LiveState } from '../model/character';
import type { StoredSheet } from '../sync/campaign-sync';

const fiche = (id: string, name: string, live: Partial<LiveState> = {}): CharacterSheet => ({
  id, name, speciesId: 'humain', lineageId: null, ancestryId: null, size: null,
  backgroundId: 'sage',
  abilities: { str: 10, dex: 12, con: 14, int: 10, wis: 16, cha: 16 },
  alignment: null,
  classLevels: [{ classId: 'guerrier', level: 3, subclass: null, subclassId: null }],
  classChoices: {}, skillProficiencies: [], expertise: [], toolProficiencies: [],
  languages: [], featIds: [], abilityImprovements: [], cantrips: [], spells: [],
  inventory: [], armorId: null, shield: false, gold: 0,
  live: { ...EMPTY_LIVE_STATE, hitDiceSpent: {}, spellSlotsSpent: {}, resourcesSpent: {}, conditions: [], ...live },
});

const stocke = (id: string, name: string, live: Partial<LiveState> = {}): StoredSheet =>
  ({ id, ownerId: `owner-${id}`, version: 1, data: fiche(id, name, live) });

describe('repos de groupe (déclenché par le MJ, plusieurs fiches d’un coup)', () => {
  const dauby = stocke('dauby', 'Dauby', { damageTaken: 10 });
  const veya = stocke('veya', 'Veya', { damageTaken: 5 });
  const sheets = [dauby, veya];

  it('applique le repos uniquement aux fiches sélectionnées', () => {
    const resultats = reposDeGroupe(sheets, 'long', ['dauby']);
    expect(resultats).toHaveLength(1);
    expect(resultats[0].id).toBe('dauby');
    expect(resultats[0].suivante.live.damageTaken).toBe(0);
  });

  it('« tout le monde » applique le même repos à chaque fiche', () => {
    const resultats = reposDeGroupe(sheets, 'long', ['dauby', 'veya']);
    expect(resultats.map((r) => r.id).sort()).toEqual(['dauby', 'veya']);
    expect(resultats.every((r) => r.suivante.live.damageTaken === 0)).toBe(true);
  });

  it('un repos court ne touche pas les points de vie, contrairement au long', () => {
    const [resultat] = reposDeGroupe(sheets, 'court', ['dauby']);
    expect(resultat.suivante.live.damageTaken).toBe(10); // inchangé : un repos court ne soigne pas seul
  });

  it('ignore un identifiant qui ne correspond à aucune fiche, plutôt que planter', () => {
    expect(reposDeGroupe(sheets, 'long', ['fantome'])).toEqual([]);
  });

  it('une sélection vide ne produit aucune écriture', () => {
    expect(reposDeGroupe(sheets, 'long', [])).toEqual([]);
  });
});
