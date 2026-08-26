import { describe, expect, it } from 'vitest';
import { ajouterArme, armesAAjouter, armesPortees, attaquesDuPersonnage, attaquesParAction, retirerArme } from './weapons';
import { deriveCharacter } from './derive';
import { EMPTY_LIVE_STATE, type CharacterSheet } from './character';

const fiche = (over: Partial<CharacterSheet> = {}): CharacterSheet => ({
  id: 'f', name: 'Fixture', speciesId: 'humain', lineageId: null, ancestryId: null, size: null,
  backgroundId: 'guerrier-de-metier',
  abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
  alignment: null,
  classLevels: [{ classId: 'guerrier', level: 1, subclass: null, subclassId: null }],
  classChoices: {}, skillProficiencies: [], expertise: [], toolProficiencies: [],
  languages: [], featIds: [], abilityImprovements: [], cantrips: [], spells: [],
  inventory: [], armorId: null, shield: false, gold: 0,
  live: { ...EMPTY_LIVE_STATE, hitDiceSpent: {}, spellSlotsSpent: {}, resourcesSpent: {}, conditions: [] },
  ...over,
});

/** Un sac qui possède réellement une Épée longue, comme un kit de départ le donnerait. */
const avecEpeeLongue = (over: Partial<CharacterSheet> = {}): CharacterSheet =>
  fiche({ inventory: [{ id: 'kit0', name: 'Épée longue', qty: 1 }], ...over });

describe('armes en main — seulement ce qu’on possède', () => {
  it('vide au départ', () => {
    expect(armesPortees(fiche())).toEqual([]);
  });

  it('un id qu’on ne possède pas ne s’ajoute pas', () => {
    const sheet = fiche(); // sac vide
    expect(ajouterArme(sheet, 'epeelongue')).toBe(sheet);
  });

  it('une arme possédée (reconnue dans le sac) s’ajoute', () => {
    const armee = ajouterArme(avecEpeeLongue(), 'epeelongue');
    expect(armesPortees(armee).map((weapon) => weapon.id)).toEqual(['epeelongue']);
  });

  it('un id inconnu du catalogue ne s’ajoute pas', () => {
    const sheet = avecEpeeLongue();
    expect(ajouterArme(sheet, 'rien-du-tout')).toBe(sheet);
  });

  it('ne s’ajoute pas deux fois', () => {
    const armee = ajouterArme(ajouterArme(avecEpeeLongue(), 'epeelongue'), 'epeelongue');
    expect(armesPortees(armee)).toHaveLength(1);
  });

  it('se retire proprement', () => {
    const armee = ajouterArme(avecEpeeLongue(), 'epeelongue');
    expect(armesPortees(retirerArme(armee, 'epeelongue'))).toEqual([]);
  });

  it('perdue du sac (vendue, donnée) : disparaît de la main sans qu’on l’ait retirée soi-même', () => {
    const armee = ajouterArme(avecEpeeLongue(), 'epeelongue');
    const sacVide = { ...armee, inventory: [] };
    expect(armesPortees(sacVide)).toEqual([]);
  });

  it('« à ajouter » exclut ce qui est déjà en main', () => {
    const armee = ajouterArme(avecEpeeLongue(), 'epeelongue');
    expect(armesAAjouter(armee)).toEqual([]);
  });
});

describe('attaques du personnage — toujours au moins les mains nues', () => {
  it('sans arme : seulement l’attaque à mains nues', () => {
    const sheet = fiche();
    const attaques = attaquesDuPersonnage(sheet, deriveCharacter(sheet));
    expect(attaques.map((attaque) => attaque.id)).toEqual(['mains-nues']);
  });

  it('avec une arme possédée et en main : elle s’ajoute, les mains nues restent listées', () => {
    const sheet = ajouterArme(avecEpeeLongue(), 'epeelongue');
    const attaques = attaquesDuPersonnage(sheet, deriveCharacter(sheet));
    expect(attaques.map((attaque) => attaque.id)).toEqual(['arme-epeelongue', 'mains-nues']);
    expect(attaques[0].proficient).toBe(true); // Guerrier : maîtrisé avec toute arme
  });
});

describe('attaques par Action', () => {
  it('1 au niveau 1', () => {
    expect(attaquesParAction(fiche())).toBe(1);
  });

  it('2 pour un Guerrier niveau 5 — Attaque supplémentaire', () => {
    const sheet = fiche({ classLevels: [{ classId: 'guerrier', level: 5, subclass: null, subclassId: null }] });
    expect(attaquesParAction(sheet)).toBe(2);
  });
});
