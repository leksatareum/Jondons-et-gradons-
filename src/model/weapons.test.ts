import { describe, expect, it } from 'vitest';
import {
  armeEnMain, armesEquipables, attaquesDuPersonnage, attaquesParAction, boucleirEquipe,
  degainerArme, equiperArme, equiperBouclier, retirerBouclier,
} from './weapons';
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

describe('bouclier — le bonus de CA suit vraiment s’il est équipé, pas juste possédé', () => {
  const avecBouclier = (over: Partial<CharacterSheet> = {}): CharacterSheet =>
    fiche({ inventory: [{ id: 'kit0', name: 'Bouclier', qty: 1 }], ...over });

  it('possédé mais pas équipé (`shield: false`) : pas de bonus', () => {
    const sheet = avecBouclier({ shield: false });
    expect(boucleirEquipe(sheet)).toBe(false);
    expect(deriveCharacter(sheet).armorClass).toBe(10 + deriveCharacter(sheet).modifiers.dex);
  });

  it('équipé ET possédé : le bonus s’applique', () => {
    const sheet = avecBouclier({ shield: true });
    expect(boucleirEquipe(sheet)).toBe(true);
    expect(deriveCharacter(sheet).armorClass).toBe(10 + deriveCharacter(sheet).modifiers.dex + 2);
  });

  it('marqué équipé mais VENDU du sac depuis : le bonus disparaît, comme une arme perdue', () => {
    const sheet = fiche({ shield: true, inventory: [] });
    expect(boucleirEquipe(sheet)).toBe(false);
    expect(deriveCharacter(sheet).armorClass).toBe(10 + deriveCharacter(sheet).modifiers.dex);
  });

  it('équiperBouclier refuse s’il n’y en a pas dans le sac', () => {
    const sheet = fiche({ shield: false, inventory: [] });
    expect(equiperBouclier(sheet)).toBe(sheet);
  });

  it('équiperBouclier l’active, retirerBouclier le repose — le sac ne change pas', () => {
    const sheet = avecBouclier({ shield: false });
    const equipe = equiperBouclier(sheet);
    expect(boucleirEquipe(equipe)).toBe(true);
    expect(equipe.inventory).toHaveLength(1); // toujours dans le sac

    const repose = retirerBouclier(equipe);
    expect(boucleirEquipe(repose)).toBe(false);
    expect(repose.inventory).toHaveLength(1); // pas jeté, juste plus au bras
  });

  it('un bouclier magique (+1) trouvé en jeu donne SON bonus, pas le +2 générique', () => {
    const sheet = fiche({ shield: true, inventory: [{ id: 'trouve', name: 'Bouclier +1', qty: 1 }] });
    expect(boucleirEquipe(sheet)).toBe(true);
    expect(deriveCharacter(sheet).armorClass).toBe(10 + deriveCharacter(sheet).modifiers.dex + 3);
  });

  it('un bouclier reconnu sous un autre nom que le catalogue vaut quand même le bonus de base', () => {
    const sheet = fiche({ shield: true, inventory: [{ id: 'trouve', name: 'Petit bouclier', qty: 1 }] });
    expect(boucleirEquipe(sheet)).toBe(true);
    expect(deriveCharacter(sheet).armorClass).toBe(10 + deriveCharacter(sheet).modifiers.dex + 2);
  });

  it('deux boucliers différents dans le sac : le meilleur des deux compte, pas le premier trouvé', () => {
    const sheet = fiche({
      shield: true,
      inventory: [{ id: 'a', name: 'Bouclier', qty: 1 }, { id: 'b', name: 'Bouclier +2', qty: 1 }],
    });
    expect(deriveCharacter(sheet).armorClass).toBe(10 + deriveCharacter(sheet).modifiers.dex + 4);
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
