import { describe, expect, it } from 'vitest';
import { itemCardsFromCharacter } from './item-cards';
import { EMPTY_LIVE_STATE, type CharacterSheet } from '../model/character';

const fiche = (over: Partial<CharacterSheet> = {}): CharacterSheet => ({
  id: 'f', name: 'Fixture', speciesId: 'humain', lineageId: null, ancestryId: null, size: null,
  backgroundId: 'sage',
  abilities: { str: 10, dex: 10, con: 14, int: 10, wis: 16, cha: 16 },
  alignment: null,
  classLevels: [{ classId: 'guerrier', level: 1, subclass: null, subclassId: null }],
  classChoices: {}, skillProficiencies: [], expertise: [], toolProficiencies: [],
  languages: [], featIds: [], abilityImprovements: [], cantrips: [], spells: [],
  inventory: [], armorId: null, shield: false, gold: 0,
  live: { ...EMPTY_LIVE_STATE, hitDiceSpent: {}, spellSlotsSpent: {}, resourcesSpent: {}, conditions: [] },
  ...over,
});

describe('cartes d’objet — le raccourci de l’écran de Combat', () => {
  it('une potion de soins devient une carte « objets », économie bonus', () => {
    const sheet = fiche({ inventory: [{ id: 'p', name: 'Potion de soins', qty: 1 }] });
    const cartes = itemCardsFromCharacter(sheet);
    expect(cartes).toEqual([{
      id: 'objet-p', name: 'Potion de soins', economy: 'bonus', category: 'objets',
      detail: 'Action bonus : une créature adjacente récupère 2d4 + 2 PV.',
      useItemId: 'p',
    }]);
  });

  it('une fiole d’acide devient une carte « objets », économie action', () => {
    const sheet = fiche({ inventory: [{ id: 'a', name: 'Acide', qty: 1 }] });
    const cartes = itemCardsFromCharacter(sheet);
    expect(cartes[0]).toMatchObject({ economy: 'action', useItemId: 'a' });
  });

  it('la quantité apparaît dans le nom quand il y en a plus d’un', () => {
    const sheet = fiche({ inventory: [{ id: 'p', name: 'Potion de soins', qty: 3 }] });
    const cartes = itemCardsFromCharacter(sheet);
    expect(cartes[0].name).toBe('Potion de soins (3)');
  });

  it('jamais de dégâts ni de jet affichés d’avance — pas de champ damage/toHit sur une carte d’objet', () => {
    const sheet = fiche({ inventory: [{ id: 'p', name: 'Potion de soins', qty: 1 }] });
    const cartes = itemCardsFromCharacter(sheet);
    expect(cartes[0].damage).toBeUndefined();
    expect(cartes[0].toHit).toBeUndefined();
  });

  it('un objet sans action de combat (corde, rations…) ne produit aucune carte', () => {
    const sheet = fiche({ inventory: [
      { id: 'c', name: 'Corde', qty: 1 },
      { id: 'r', name: 'Rations (1 jour)', qty: 2 },
    ] });
    expect(itemCardsFromCharacter(sheet)).toEqual([]);
  });

  it('un objet à 0 (jamais nettoyé) ne produit aucune carte', () => {
    const sheet = fiche({ inventory: [{ id: 'p', name: 'Potion de soins', qty: 0 }] });
    expect(itemCardsFromCharacter(sheet)).toEqual([]);
  });

  it('deux lignes distinctes du même objet donnent deux cartes distinctes', () => {
    const sheet = fiche({ inventory: [
      { id: 'p1', name: 'Potion de soins', qty: 1 },
      { id: 'p2', name: 'Potion de soins', qty: 1 },
    ] });
    const cartes = itemCardsFromCharacter(sheet);
    expect(cartes.map((c) => c.id)).toEqual(['objet-p1', 'objet-p2']);
  });
});
