import { describe, expect, it } from 'vitest';
import {
  applyCompanionDamage, availableCompanions, bondCompanion, companionsAfterLongRest, dismissCompanion,
  ramenerCompagnon,
} from './companions';
import { deriveCharacter } from './derive';
import { EMPTY_LIVE_STATE, type CharacterSheet } from './character';

const fiche = (over: Partial<CharacterSheet> = {}): CharacterSheet => ({
  id: 'f', name: 'Fixture', speciesId: 'humain', lineageId: null, ancestryId: null, size: null,
  backgroundId: 'sage',
  abilities: { str: 8, dex: 10, con: 14, int: 15, wis: 13, cha: 15 },
  alignment: null,
  classLevels: [{ classId: 'occultiste', level: 2, subclass: null, subclassId: null }],
  classChoices: {}, skillProficiencies: [], expertise: [], toolProficiencies: [],
  languages: [], featIds: [], abilityImprovements: [], cantrips: [], spells: [],
  inventory: [], armorId: null, shield: false, gold: 0,
  live: { ...EMPTY_LIVE_STATE, hitDiceSpent: {}, spellSlotsSpent: {}, resourcesSpent: {}, conditions: [] },
  ...over,
});

const lierPacte = (sheet: CharacterSheet, id?: string, nom?: string) =>
  bondCompanion(sheet, deriveCharacter(sheet), id ?? availableCompanions(sheet)[0].id, nom);

describe('ce qu’on peut lier — dépend de la classe, du sort, du pacte', () => {
  it('rien sans Trouver un familier, sans Pacte de la Chaîne, sans Druide de niveau 2', () => {
    expect(availableCompanions(fiche())).toEqual([]);
  });

  it('le Pacte de la Chaîne ouvre des familiers, spéciaux compris', () => {
    const sheet = fiche({ classChoices: { occultiste: { invocations: ['pact-chain', 'pact-tome'] } } });
    const options = availableCompanions(sheet);
    expect(options.length).toBeGreaterThan(0);
    expect(options.every((option) => option.source === 'pact-chain')).toBe(true);
    expect(options.some((option) => option.templateId === 'imp')).toBe(true);
  });

  it('un Druide de niveau 2 accède au Compagnon sauvage', () => {
    const sheet = fiche({
      classLevels: [{ classId: 'druide', level: 2, subclass: null, subclassId: null }],
    });
    const options = availableCompanions(sheet);
    expect(options.every((option) => option.source === 'wild-companion')).toBe(true);
    expect(options.length).toBeGreaterThan(0);
  });

  it('Trouver un familier sur la fiche ouvre les familiers ordinaires', () => {
    const sheet = fiche({ spells: [{ id: 'familier', sourceClass: 'occultiste' }] });
    const options = availableCompanions(sheet);
    expect(options.some((option) => option.source === 'find-familiar')).toBe(true);
  });
});

describe('lier une créature — remplace, jamais n’empile', () => {
  it('ajoute la créature choisie', () => {
    const sheet = fiche({ classChoices: { occultiste: { invocations: ['pact-chain'] } } });
    const [option] = availableCompanions(sheet);
    const lie = lierPacte(sheet, option.id, 'Grisounet');
    expect(lie.companions).toHaveLength(1);
    expect(lie.companions?.[0].name).toBe('Grisounet');
    expect(lie.companions?.[0].hp).toBe(lie.companions?.[0].hpMax);
  });

  it('un second familier remplace le premier, ne s’empile pas', () => {
    const sheet = fiche({ classChoices: { occultiste: { invocations: ['pact-chain'] } } });
    const options = availableCompanions(sheet);
    const premier = lierPacte(sheet, options[0].id, 'Un');
    const second = lierPacte(premier, options[1].id, 'Deux');
    expect(second.companions).toHaveLength(1);
    expect(second.companions?.[0].name).toBe('Deux');
  });

  it('un id inconnu ne change rien', () => {
    const sheet = fiche();
    expect(lierPacte(sheet, 'rien-du-tout')).toBe(sheet);
  });

  it('se détache proprement', () => {
    const sheet = fiche({ classChoices: { occultiste: { invocations: ['pact-chain'] } } });
    const [option] = availableCompanions(sheet);
    const lie = lierPacte(sheet, option.id);
    const detache = dismissCompanion(lie, lie.companions![0].id);
    expect(detache.companions).toEqual([]);
  });
});

/**
 * PHB 2024 : le Compagnon sauvage du Druide n'est pas gratuit — une
 * utilisation de Forme sauvage OU un emplacement de sort le paie, au choix
 * du joueur. Les trois autres sources (Trouver un familier via le Pacte de
 * la Chaîne, compagnon primordial du Maître des bêtes) restent sans coût
 * d'invocation — ce bloc ne concerne qu'elles par contraste.
 */
describe('Compagnon sauvage — l’invocation coûte une Forme sauvage OU un emplacement', () => {
  const druide2 = fiche({
    classLevels: [{ classId: 'druide', level: 2, subclass: null, subclassId: null }],
  });

  it('sans paiement précisé : rien ne se lie', () => {
    const option = availableCompanions(druide2)[0];
    const derived = deriveCharacter(druide2);
    expect(bondCompanion(druide2, derived, option.id)).toBe(druide2);
  });

  it('payé par une utilisation de Forme sauvage : lié, et la charge est dépensée', () => {
    const option = availableCompanions(druide2)[0];
    const derived = deriveCharacter(druide2);
    const lie = bondCompanion(druide2, derived, option.id, 'Grisounet', { type: 'forme-sauvage' });
    expect(lie.companions).toHaveLength(1);
    expect(lie.live.resourcesSpent['druide:forme-sauvage']).toBe(1);
    expect(lie.live.spellSlotsSpent[1] ?? 0).toBe(0);
  });

  it('payé par un emplacement de sort : lié, et l’emplacement est dépensé', () => {
    const option = availableCompanions(druide2)[0];
    const derived = deriveCharacter(druide2);
    const lie = bondCompanion(druide2, derived, option.id, 'Grisounet', { type: 'emplacement', rang: 1 });
    expect(lie.companions).toHaveLength(1);
    expect(lie.live.spellSlotsSpent[1]).toBe(1);
    expect(lie.live.resourcesSpent['druide:forme-sauvage'] ?? 0).toBe(0);
  });

  it('refuse une Forme sauvage épuisée — rien ne se lie, rien ne se dépense en trop', () => {
    const epuise = {
      ...druide2,
      live: { ...druide2.live, resourcesSpent: { 'druide:forme-sauvage': 2 } }, // 2 utilisations au niveau 2, déjà toutes prises
    };
    const option = availableCompanions(epuise)[0];
    const derived = deriveCharacter(epuise);
    const resultat = bondCompanion(epuise, derived, option.id, 'Grisounet', { type: 'forme-sauvage' });
    expect(resultat).toBe(epuise);
  });

  it('refuse un rang d’emplacement épuisé', () => {
    const epuise = {
      ...druide2,
      live: { ...druide2.live, spellSlotsSpent: { 1: 3 } }, // 3 emplacements de rang 1 au niveau 2, déjà tous pris
    };
    const option = availableCompanions(epuise)[0];
    const derived = deriveCharacter(epuise);
    const resultat = bondCompanion(epuise, derived, option.id, 'Grisounet', { type: 'emplacement', rang: 1 });
    expect(resultat).toBe(epuise);
  });

  it('les autres sources restent gratuites : Pacte de la Chaîne n’a pas besoin de payment', () => {
    const sheet = fiche({ classChoices: { occultiste: { invocations: ['pact-chain'] } } });
    const option = availableCompanions(sheet)[0];
    const lie = bondCompanion(sheet, deriveCharacter(sheet), option.id, 'Grisounet');
    expect(lie.companions).toHaveLength(1);
    expect(lie.live.resourcesSpent['druide:forme-sauvage'] ?? 0).toBe(0);
    expect(Object.keys(lie.live.spellSlotsSpent).length).toBe(0);
  });
});

describe('dégâts et soins — plafonnés entre 0 et le maximum', () => {
  it('encaisse des dégâts sans passer sous zéro', () => {
    const sheet = fiche({ classChoices: { occultiste: { invocations: ['pact-chain'] } } });
    const lie = lierPacte(sheet);
    const id = lie.companions![0].id;
    const blesse = applyCompanionDamage(lie, id, 999);
    expect(blesse.companions?.[0].hp).toBe(0);
  });

  it('ne dépasse pas son maximum en soignant', () => {
    const sheet = fiche({ classChoices: { occultiste: { invocations: ['pact-chain'] } } });
    const lie = lierPacte(sheet);
    const id = lie.companions![0].id;
    const soigne = applyCompanionDamage(lie, id, -999);
    expect(soigne.companions?.[0].hp).toBe(soigne.companions?.[0].hpMax);
  });
});

describe('ramener un compagnon primordial mort — dépense un vrai emplacement', () => {
  const maitreDesBetes = fiche({
    classLevels: [
      { classId: 'rodeur', level: 3, subclass: 'Maître des bêtes', subclassId: null },
    ],
    live: { ...EMPTY_LIVE_STATE, hitDiceSpent: {}, spellSlotsSpent: {}, resourcesSpent: {}, conditions: [] },
  });

  it('rend tous ses PV et dépense l’emplacement du rang choisi', () => {
    const lie = lierPacte(maitreDesBetes);
    const id = lie.companions![0].id;
    const morte = applyCompanionDamage(lie, id, 999);
    expect(morte.companions?.[0].hp).toBe(0);

    const ramenee = ramenerCompagnon(morte, id, 1);
    expect(ramenee.companions?.[0].hp).toBe(ramenee.companions?.[0].hpMax);
    expect(ramenee.live.spellSlotsSpent[1]).toBe(1);
  });

  it('ne fait rien — et ne dépense rien — si le compagnon n’est pas mort', () => {
    const lie = lierPacte(maitreDesBetes);
    const id = lie.companions![0].id;
    const resultat = ramenerCompagnon(lie, id, 1);
    expect(resultat).toBe(lie);
    expect(resultat.live.spellSlotsSpent[1] ?? 0).toBe(0);
  });

  it('un identifiant inconnu ne change rien', () => {
    expect(ramenerCompagnon(maitreDesBetes, 'rien-du-tout', 1)).toBe(maitreDesBetes);
  });
});

describe('repos long — expire, ouvre le changement, recalcule', () => {
  it('un Compagnon sauvage disparaît au repos long', () => {
    const sheet = fiche({
      classLevels: [{ classId: 'druide', level: 2, subclass: null, subclassId: null }],
    });
    const option = availableCompanions(sheet)[0];
    const lie = bondCompanion(sheet, deriveCharacter(sheet), option.id, undefined, { type: 'forme-sauvage' });
    expect(lie.companions).toHaveLength(1);
    const apres = companionsAfterLongRest(lie);
    expect(apres.companions).toEqual([]);
  });

  it('un familier de Pacte de la Chaîne survit au repos long', () => {
    const sheet = fiche({ classChoices: { occultiste: { invocations: ['pact-chain'] } } });
    const lie = lierPacte(sheet);
    const apres = companionsAfterLongRest(lie);
    expect(apres.companions).toHaveLength(1);
  });

  it('un Maître des bêtes voit son compagnon grandir avec son niveau', () => {
    const niveau3 = fiche({
      classLevels: [{ classId: 'rodeur', level: 3, subclass: 'Maître des bêtes', subclassId: null }],
    });
    const lie = lierPacte(niveau3);
    const hpAvant = lie.companions![0].hpMax;

    const niveau6 = { ...lie, classLevels: [{ classId: 'rodeur', level: 6, subclass: 'Maître des bêtes', subclassId: null }] };
    const apres = companionsAfterLongRest(niveau6);
    expect(apres.companions?.[0].hpMax).toBeGreaterThan(hpAvant);
  });
});
