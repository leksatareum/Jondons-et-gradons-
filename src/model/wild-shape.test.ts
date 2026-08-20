import { describe, expect, it } from 'vitest';
import {
  activeWildShapeStatBlock, canCastWhileShaped, eligibleForms, hasRoomToLearn,
  knownForms, learnForm, revert, swapForm, transform, wildShapeAccess,
} from './wild-shape';
import { deriveCharacter } from './derive';
import { EMPTY_LIVE_STATE, type CharacterSheet } from './character';

const druide = (level: number, over: Partial<CharacterSheet> = {}): CharacterSheet => ({
  id: 'f', name: 'Thorin', speciesId: 'nain', lineageId: null, ancestryId: null, size: null,
  backgroundId: 'ermite',
  abilities: { str: 8, dex: 13, con: 15, int: 12, wis: 17, cha: 10 },
  alignment: null,
  classLevels: [{ classId: 'druide', level, subclass: over.classLevels?.[0]?.subclass ?? null, subclassId: null }],
  classChoices: {}, skillProficiencies: [], expertise: [], toolProficiencies: [],
  languages: [], featIds: [], abilityImprovements: [], cantrips: [], spells: [],
  inventory: [], armorId: null, shield: false, gold: 0,
  live: { ...EMPTY_LIVE_STATE, hitDiceSpent: {}, spellSlotsSpent: {}, resourcesSpent: {}, conditions: [] },
  ...over,
});

describe('accès à la Forme sauvage', () => {
  it('rien avant le niveau 2', () => {
    const sheet = druide(1);
    const derived = deriveCharacter(sheet);
    expect(eligibleForms(sheet, derived)).toEqual([]);
    expect(wildShapeAccess(sheet, derived).knownLimit).toBe(0);
  });

  it('quatre formes connaissables au niveau 2, plafonnées au FP 1/4', () => {
    const sheet = druide(2);
    const derived = deriveCharacter(sheet);
    expect(wildShapeAccess(sheet, derived).knownLimit).toBe(4);
    expect(wildShapeAccess(sheet, derived).maxCr).toBe(0.25);
    const crNombre = (cr: string) => { const [a, b] = cr.split('/').map(Number); return b ? a / b : a; };
    expect(eligibleForms(sheet, derived).every((profile) => crNombre(profile.cr) <= 0.25)).toBe(true);
  });

  it('le Cercle de la Lune accède à un FP bien plus élevé, dès le niveau 3', () => {
    const lune = druide(3, { classLevels: [{ classId: 'druide', level: 3, subclass: 'Cercle de la Lune', subclassId: null }] });
    const terre = druide(3, { classLevels: [{ classId: 'druide', level: 3, subclass: 'Cercle de la Terre', subclassId: null }] });
    const dLune = deriveCharacter(lune); const dTerre = deriveCharacter(terre);
    expect(wildShapeAccess(lune, dLune).maxCr).toBeGreaterThan(wildShapeAccess(terre, dTerre).maxCr);
    expect(wildShapeAccess(lune, dLune).moon).toBe(true);
  });
});

describe('apprendre des formes — un choix, plafonné', () => {
  it('démarre avec une sélection par défaut au niveau 2', () => {
    const sheet = druide(2);
    const derived = deriveCharacter(sheet);
    expect(knownForms(sheet, derived).length).toBeGreaterThan(0);
    expect(knownForms(sheet, derived).length).toBeLessThanOrEqual(4);
  });

  it('refuse d’apprendre une forme au-delà du plafond', () => {
    const sheet = druide(2, { wildShapeKnownForms: ['rat', 'crab', 'lizard', 'octopus'] });
    const derived = deriveCharacter(sheet);
    expect(hasRoomToLearn(sheet, derived)).toBe(false);
    const apres = learnForm(sheet, derived, 'weasel');
    expect(apres).toBe(sheet);
  });

  it('refuse une forme hors de portée du niveau', () => {
    const sheet = druide(2);
    const derived = deriveCharacter(sheet);
    const apres = learnForm(sheet, derived, 'brown-bear' /* FP 1, hors de portée niveau 2 */);
    expect(apres.wildShapeKnownForms).toBeUndefined();
  });

  it('un niveau supérieur ouvre de la place, sans effacer ce qui était su', () => {
    const niveau4 = druide(4, { wildShapeKnownForms: ['rat', 'crab'] });
    const derived = deriveCharacter(niveau4);
    expect(hasRoomToLearn(niveau4, derived)).toBe(true);
    const apres = learnForm(niveau4, derived, 'wolf');
    expect(apres.wildShapeKnownForms).toEqual(['rat', 'crab', 'wolf']);
  });
});

describe('échanger une forme — seulement juste après un repos long', () => {
  it('refuse tant que la fenêtre n’est pas ouverte', () => {
    const sheet = druide(2, { wildShapeKnownForms: ['rat'] });
    const derived = deriveCharacter(sheet);
    const apres = swapForm(sheet, derived, 'rat', 'crab');
    expect(apres).toBe(sheet);
  });

  it('accepte l’échange une fois, puis se referme', () => {
    const sheet = druide(2, {
      wildShapeKnownForms: ['rat'],
      live: { ...EMPTY_LIVE_STATE, hitDiceSpent: {}, spellSlotsSpent: {}, resourcesSpent: {}, conditions: [], wildShapeSwapOpen: true },
    });
    const derived = deriveCharacter(sheet);
    const apres = swapForm(sheet, derived, 'rat', 'crab');
    expect(apres.wildShapeKnownForms).toEqual(['crab']);
    expect(apres.live.wildShapeSwapOpen).toBe(false);
  });
});

describe('se transformer — dépense une charge, comme n’importe quelle ressource', () => {
  it('refuse une forme non apprise', () => {
    const sheet = druide(2, { wildShapeKnownForms: ['rat'] });
    const derived = deriveCharacter(sheet);
    expect(transform(sheet, derived, 'wolf')).toBe(sheet);
  });

  it('transforme et dépense une charge de Forme sauvage', () => {
    const sheet = druide(2, { wildShapeKnownForms: ['wolf'] });
    const derived = deriveCharacter(sheet);
    const apres = transform(sheet, derived, 'wolf');
    expect(apres.live.activeWildShape).toEqual({ formId: 'wolf' });
    expect(apres.live.resourcesSpent['druide:forme-sauvage']).toBe(1);
  });

  it('refuse quand il n’y a plus de charge', () => {
    const sheet = druide(2, {
      wildShapeKnownForms: ['wolf'],
      live: { ...EMPTY_LIVE_STATE, hitDiceSpent: {}, spellSlotsSpent: {}, conditions: [], resourcesSpent: { 'druide:forme-sauvage': 2 } },
    });
    const derived = deriveCharacter(sheet);
    expect(transform(sheet, derived, 'wolf')).toBe(sheet);
  });

  it('revenir à sa forme ne rend pas la charge', () => {
    const sheet = druide(2, { wildShapeKnownForms: ['wolf'] });
    const derived = deriveCharacter(sheet);
    const transforme = transform(sheet, derived, 'wolf');
    const revenu = revert(transforme);
    expect(revenu.live.activeWildShape).toBeNull();
    expect(revenu.live.resourcesSpent['druide:forme-sauvage']).toBe(1);
  });

  it('le bloc actif porte la CA et les PV temporaires du profil', () => {
    const sheet = druide(2, { wildShapeKnownForms: ['wolf'] });
    const derived = deriveCharacter(sheet);
    const transforme = transform(sheet, derived, 'wolf');
    const bloc = activeWildShapeStatBlock(transforme, deriveCharacter(transforme));
    expect(bloc?.profile.name).toBe('Loup');
    expect(bloc?.armorClass).toBe(12); // profil de base du Loup, pas de bonus Cercle de la Lune avant niveau 3
    expect(bloc?.temporaryHp).toBe(2); // niveau du Druide, hors Cercle de la Lune
  });

  it('aucun bloc actif tant qu’on n’est pas transformé', () => {
    const sheet = druide(2, { wildShapeKnownForms: ['wolf'] });
    expect(activeWildShapeStatBlock(sheet, deriveCharacter(sheet))).toBeNull();
  });
});

describe('lancer un sort en forme de bête — restreint avant le niveau 18', () => {
  it('rien ne s’applique hors transformation', () => {
    const sheet = druide(5);
    expect(canCastWhileShaped(sheet, deriveCharacter(sheet), 'Boule de feu', null)).toBe(true);
  });

  it('un Druide non-Lune ne lance rien en forme de bête', () => {
    const sheet = druide(5, { wildShapeKnownForms: ['wolf'] });
    const derived = deriveCharacter(sheet);
    const transforme = transform(sheet, derived, 'wolf');
    expect(canCastWhileShaped(transforme, deriveCharacter(transforme), 'Soins', null)).toBe(false);
  });

  it('le Cercle de la Lune, dès niveau 3, lance ses quelques sorts de soin en forme de bête', () => {
    const sheet = druide(5, {
      classLevels: [{ classId: 'druide', level: 5, subclass: 'Cercle de la Lune', subclassId: null }],
      wildShapeKnownForms: ['wolf'],
    });
    const derived = deriveCharacter(sheet);
    const transforme = transform(sheet, derived, 'wolf');
    expect(canCastWhileShaped(transforme, deriveCharacter(transforme), 'Soins', null)).toBe(true);
    expect(canCastWhileShaped(transforme, deriveCharacter(transforme), 'Boule de feu', null)).toBe(false);
  });
});
