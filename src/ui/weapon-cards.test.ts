import { describe, expect, it } from 'vitest';
import { weaponCardsFromCharacter } from './weapon-cards';
import { equiperArme } from '../model/weapons';
import { deriveCharacter } from '../model/derive';
import { EMPTY_LIVE_STATE, type CharacterSheet } from '../model/character';

const fiche = (over: Partial<CharacterSheet> = {}): CharacterSheet => ({
  id: 'f', name: 'Fixture', speciesId: 'humain', lineageId: null, ancestryId: null, size: null,
  backgroundId: 'guerrier-de-metier',
  abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
  alignment: null,
  classLevels: [{ classId: 'guerrier', level: 1, subclass: null, subclassId: null }],
  classChoices: {}, skillProficiencies: [], expertise: [], toolProficiencies: [],
  languages: [], featIds: [], abilityImprovements: [], cantrips: [], spells: [],
  inventory: [
    { id: 'kit0', name: 'Épée longue', qty: 1 },
    { id: 'kit1', name: 'Arc long', qty: 1 },
  ],
  armorId: null, shield: false, gold: 0,
  live: { ...EMPTY_LIVE_STATE, hitDiceSpent: {}, spellSlotsSpent: {}, resourcesSpent: {}, conditions: [] },
  ...over,
});

describe('cartes d’arme — attaquer et équiper', () => {
  it('sans arme équipée : seulement les mains nues, aucune carte « Équiper » (rien à switcher sans arme possédée en plus)', () => {
    const sheet = fiche({ inventory: [] });
    const cartes = weaponCardsFromCharacter(sheet, deriveCharacter(sheet));
    expect(cartes.map((carte) => carte.id)).toEqual(['mains-nues']);
  });

  it('une arme équipée, une autre possédée : une carte d’attaque et une carte « Équiper »', () => {
    const sheet = equiperArme(fiche(), 'epeelongue');
    const cartes = weaponCardsFromCharacter(sheet, deriveCharacter(sheet));
    expect(cartes.map((carte) => carte.id)).toEqual(['arme-epeelongue', 'mains-nues', 'equiper-arclong']);
  });

  it('la carte « Équiper » coûte l’Action, ne dépense aucune ressource, et porte l’id de l’arme visée', () => {
    const sheet = equiperArme(fiche(), 'epeelongue');
    const carte = weaponCardsFromCharacter(sheet, deriveCharacter(sheet)).find((c) => c.id === 'equiper-arclong')!;
    expect(carte.economy).toBe('action');
    expect(carte.resources).toBeUndefined();
    expect(carte.equipWeaponId).toBe('arclong');
    expect(carte.toHit).toBeUndefined(); // ce n’est pas une attaque
  });

  it('la carte d’attaque, elle, n’a pas de equipWeaponId', () => {
    const sheet = equiperArme(fiche(), 'epeelongue');
    const carte = weaponCardsFromCharacter(sheet, deriveCharacter(sheet)).find((c) => c.id === 'arme-epeelongue')!;
    expect(carte.equipWeaponId).toBeUndefined();
    expect(carte.toHit).toBeDefined();
  });
});
