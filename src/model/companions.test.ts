import { describe, expect, it } from 'vitest';
import {
  applyCompanionDamage, availableCompanions, bondCompanion, companionsAfterLongRest, dismissCompanion,
  ramenerCompagnon,
} from './companions';
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
    const lie = bondCompanion(sheet, option.id, 'Grisounet');
    expect(lie.companions).toHaveLength(1);
    expect(lie.companions?.[0].name).toBe('Grisounet');
    expect(lie.companions?.[0].hp).toBe(lie.companions?.[0].hpMax);
  });

  it('un second familier remplace le premier, ne s’empile pas', () => {
    const sheet = fiche({ classChoices: { occultiste: { invocations: ['pact-chain'] } } });
    const options = availableCompanions(sheet);
    const premier = bondCompanion(sheet, options[0].id, 'Un');
    const second = bondCompanion(premier, options[1].id, 'Deux');
    expect(second.companions).toHaveLength(1);
    expect(second.companions?.[0].name).toBe('Deux');
  });

  it('un id inconnu ne change rien', () => {
    const sheet = fiche();
    expect(bondCompanion(sheet, 'rien-du-tout')).toBe(sheet);
  });

  it('se détache proprement', () => {
    const sheet = fiche({ classChoices: { occultiste: { invocations: ['pact-chain'] } } });
    const [option] = availableCompanions(sheet);
    const lie = bondCompanion(sheet, option.id);
    const detache = dismissCompanion(lie, lie.companions![0].id);
    expect(detache.companions).toEqual([]);
  });
});

describe('dégâts et soins — plafonnés entre 0 et le maximum', () => {
  it('encaisse des dégâts sans passer sous zéro', () => {
    const sheet = fiche({ classChoices: { occultiste: { invocations: ['pact-chain'] } } });
    const lie = bondCompanion(sheet, availableCompanions(sheet)[0].id);
    const id = lie.companions![0].id;
    const blesse = applyCompanionDamage(lie, id, 999);
    expect(blesse.companions?.[0].hp).toBe(0);
  });

  it('ne dépasse pas son maximum en soignant', () => {
    const sheet = fiche({ classChoices: { occultiste: { invocations: ['pact-chain'] } } });
    const lie = bondCompanion(sheet, availableCompanions(sheet)[0].id);
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
    const lie = bondCompanion(maitreDesBetes, availableCompanions(maitreDesBetes)[0].id);
    const id = lie.companions![0].id;
    const morte = applyCompanionDamage(lie, id, 999);
    expect(morte.companions?.[0].hp).toBe(0);

    const ramenee = ramenerCompagnon(morte, id, 1);
    expect(ramenee.companions?.[0].hp).toBe(ramenee.companions?.[0].hpMax);
    expect(ramenee.live.spellSlotsSpent[1]).toBe(1);
  });

  it('ne fait rien — et ne dépense rien — si le compagnon n’est pas mort', () => {
    const lie = bondCompanion(maitreDesBetes, availableCompanions(maitreDesBetes)[0].id);
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
    const lie = bondCompanion(sheet, availableCompanions(sheet)[0].id);
    expect(lie.companions).toHaveLength(1);
    const apres = companionsAfterLongRest(lie);
    expect(apres.companions).toEqual([]);
  });

  it('un familier de Pacte de la Chaîne survit au repos long', () => {
    const sheet = fiche({ classChoices: { occultiste: { invocations: ['pact-chain'] } } });
    const lie = bondCompanion(sheet, availableCompanions(sheet)[0].id);
    const apres = companionsAfterLongRest(lie);
    expect(apres.companions).toHaveLength(1);
  });

  it('un Maître des bêtes voit son compagnon grandir avec son niveau', () => {
    const niveau3 = fiche({
      classLevels: [{ classId: 'rodeur', level: 3, subclass: 'Maître des bêtes', subclassId: null }],
    });
    const lie = bondCompanion(niveau3, availableCompanions(niveau3)[0].id);
    const hpAvant = lie.companions![0].hpMax;

    const niveau6 = { ...lie, classLevels: [{ classId: 'rodeur', level: 6, subclass: 'Maître des bêtes', subclassId: null }] };
    const apres = companionsAfterLongRest(niveau6);
    expect(apres.companions?.[0].hpMax).toBeGreaterThan(hpAvant);
  });
});
