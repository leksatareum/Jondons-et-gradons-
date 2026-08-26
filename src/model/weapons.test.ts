import { describe, expect, it } from 'vitest';
import { ajouterArme, armesPortees, attaquesDuPersonnage, attaquesParAction, retirerArme } from './weapons';
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

describe('armes en main — indépendantes du sac', () => {
  it('vide au départ : rien que le catalogue n’ait déjà résolu', () => {
    expect(armesPortees(fiche())).toEqual([]);
  });

  it('ajoute une arme du catalogue', () => {
    const armee = ajouterArme(fiche(), 'epeelongue');
    expect(armesPortees(armee).map((weapon) => weapon.id)).toEqual(['epeelongue']);
  });

  it('un id inconnu ne s’ajoute pas', () => {
    const sheet = fiche();
    expect(ajouterArme(sheet, 'rien-du-tout')).toBe(sheet);
  });

  it('ne s’ajoute pas deux fois', () => {
    const armee = ajouterArme(ajouterArme(fiche(), 'epeelongue'), 'epeelongue');
    expect(armesPortees(armee)).toHaveLength(1);
  });

  it('se retire proprement', () => {
    const armee = ajouterArme(fiche(), 'epeelongue');
    expect(armesPortees(retirerArme(armee, 'epeelongue'))).toEqual([]);
  });
});

describe('attaques du personnage — toujours au moins les mains nues', () => {
  it('sans arme : seulement l’attaque à mains nues', () => {
    const sheet = fiche();
    const attaques = attaquesDuPersonnage(sheet, deriveCharacter(sheet));
    expect(attaques.map((attaque) => attaque.id)).toEqual(['mains-nues']);
  });

  it('avec une arme en main : elle s’ajoute, les mains nues restent listées', () => {
    const sheet = ajouterArme(fiche(), 'epeelongue');
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
