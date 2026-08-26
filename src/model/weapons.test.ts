import { describe, expect, it } from 'vitest';
import { armeEnMain, armesEquipables, attaquesDuPersonnage, attaquesParAction, degainerArme, equiperArme } from './weapons';
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

/** Un sac qui possède réellement une Épée longue et un Arc long, comme un kit de départ le donnerait. */
const avecDeuxArmes = (over: Partial<CharacterSheet> = {}): CharacterSheet =>
  fiche({
    inventory: [
      { id: 'kit0', name: 'Épée longue', qty: 1 },
      { id: 'kit1', name: 'Arc long', qty: 1 },
    ],
    ...over,
  });

describe('une seule arme en main — jamais deux à la fois', () => {
  it('rien au départ', () => {
    expect(armeEnMain(fiche())).toBeNull();
  });

  it('un id qu’on ne possède pas ne s’équipe pas', () => {
    const sheet = fiche(); // sac vide
    expect(equiperArme(sheet, 'epeelongue')).toBe(sheet);
  });

  it('une arme possédée (reconnue dans le sac) s’équipe', () => {
    const armee = equiperArme(avecDeuxArmes(), 'epeelongue');
    expect(armeEnMain(armee)?.id).toBe('epeelongue');
  });

  it('équiper une seconde arme remplace la première, ne s’y ajoute jamais', () => {
    const premiere = equiperArme(avecDeuxArmes(), 'epeelongue');
    const seconde = equiperArme(premiere, 'arclong');
    expect(armeEnMain(seconde)?.id).toBe('arclong');
  });

  it('un id inconnu du catalogue ne s’équipe pas', () => {
    const sheet = avecDeuxArmes();
    expect(equiperArme(sheet, 'rien-du-tout')).toBe(sheet);
  });

  it('se dégaine proprement — ne reste que les mains nues', () => {
    const armee = equiperArme(avecDeuxArmes(), 'epeelongue');
    expect(armeEnMain(degainerArme(armee))).toBeNull();
  });

  it('perdue du sac (vendue, donnée) : disparaît de la main sans qu’on l’ait dégainée soi-même', () => {
    const armee = equiperArme(avecDeuxArmes(), 'epeelongue');
    const sacVide = { ...armee, inventory: [] };
    expect(armeEnMain(sacVide)).toBeNull();
  });

  it('« équipables » exclut l’arme déjà en main, propose l’autre', () => {
    const armee = equiperArme(avecDeuxArmes(), 'epeelongue');
    expect(armesEquipables(armee).map((weapon) => weapon.id)).toEqual(['arclong']);
  });
});

describe('attaques du personnage — toujours au moins les mains nues', () => {
  it('sans arme : seulement l’attaque à mains nues', () => {
    const sheet = fiche();
    const attaques = attaquesDuPersonnage(sheet, deriveCharacter(sheet));
    expect(attaques.map((attaque) => attaque.id)).toEqual(['mains-nues']);
  });

  it('avec une arme possédée et en main : elle s’ajoute, les mains nues restent listées', () => {
    const sheet = equiperArme(avecDeuxArmes(), 'epeelongue');
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
