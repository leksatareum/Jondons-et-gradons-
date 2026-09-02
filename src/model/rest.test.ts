import { describe, expect, it } from 'vitest';
import { longRest, shortRest } from './rest';
import { availableCompanions, bondCompanion } from './companions';
import { deriveCharacter } from './derive';
import { withGrant } from './spell-grants';
import { EMPTY_LIVE_STATE, type CharacterSheet, type LiveState } from './character';

const fiche = (classId: string, level: number, live: Partial<LiveState> = {}): CharacterSheet => ({
  id: 'f', name: 'Fixture', speciesId: 'humain', lineageId: null, ancestryId: null, size: null,
  backgroundId: 'sage',
  abilities: { str: 10, dex: 12, con: 14, int: 10, wis: 16, cha: 16 },
  alignment: null,
  classLevels: [{ classId, level, subclass: null, subclassId: null }],
  classChoices: {}, skillProficiencies: [], expertise: [], toolProficiencies: [],
  languages: [], featIds: [], abilityImprovements: [], cantrips: [], spells: [],
  inventory: [], armorId: null, shield: false, gold: 0,
  live: {
    ...EMPTY_LIVE_STATE,
    hitDiceSpent: {}, spellSlotsSpent: {}, resourcesSpent: {}, conditions: [],
    ...live,
  },
});

describe('repos long — tout revient, sauf ce qui doit peser le lendemain', () => {
  const use = fiche('druide', 6, {
    damageTaken: 17, temporaryHp: 4,
    spellSlotsSpent: { 1: 4, 2: 2 }, pactSlotsSpent: 0,
    resourcesSpent: { 'druide:forme-sauvage': 2 },
    hitDiceSpent: { druide: 5 },
    exhaustion: 2,
    deathSaves: { success: 2, fail: 1 },
    concentration: { spellId: 'brouillard' },
  });

  it('rend les points de vie, les emplacements et les ressources', () => {
    const { sheet } = longRest(use, deriveCharacter(use));
    expect(sheet.live.damageTaken).toBe(0);
    expect(sheet.live.temporaryHp).toBe(0);
    expect(sheet.live.spellSlotsSpent).toEqual({});
    expect(sheet.live.resourcesSpent).toEqual({});
  });

  it('rend TOUS les dés de vie dépensés', () => {
    // PHB 2024 : le repos long rend la totalité des dés de vie. La moitié
    // était la règle de 2014 — ce test l'encodait, et la faisait donc passer
    // pour correcte.
    const { sheet } = longRest(use, deriveCharacter(use));
    expect(sheet.live.hitDiceSpent).toEqual({});
  });

  it('ne descend l’épuisement que d’un cran', () => {
    const { sheet } = longRest(use, deriveCharacter(use));
    expect(sheet.live.exhaustion).toBe(1);
  });

  it('remet les jets de mort à zéro et coupe la concentration', () => {
    const { sheet } = longRest(use, deriveCharacter(use));
    expect(sheet.live.deathSaves).toEqual({ success: 0, fail: 0 });
    expect(sheet.live.concentration).toBeNull();
  });

  it('ne touche à aucune décision de personnage', () => {
    const avecDon = withGrant(use, {
      id: 'g1', spellId: 'boule-feu', source: 'Génie', uses: 1,
      recharge: 'long', grantedAt: '2026-08-20T10:00:00.000Z',
    });
    const { sheet } = longRest(avecDon, deriveCharacter(avecDon));
    expect(sheet.grants).toEqual(avecDon.grants);
    expect(sheet.spells).toEqual(avecDon.spells);
    expect(sheet.classLevels).toEqual(avecDon.classLevels);
  });

  it('dit ce qu’il a rendu plutôt que de le laisser deviner', () => {
    const { recovered } = longRest(use, deriveCharacter(use));
    expect(recovered.join(' | ')).toContain('17 points de vie');
    expect(recovered.join(' | ')).toContain('dé(s) de vie');
    expect(recovered.join(' | ')).toContain('épuisement');
  });

  it('rend les lancements d’un sort accordé par le MJ', () => {
    const base = withGrant(fiche('rodeur', 2), {
      id: 'g1', spellId: 'boule-feu', source: 'Génie', uses: 1,
      recharge: 'long', grantedAt: '2026-08-20T10:00:00.000Z',
    });
    const use2 = { ...base, live: { ...base.live, resourcesSpent: { 'don:g1': 1 } } };
    const { sheet } = longRest(use2, deriveCharacter(use2));
    expect(sheet.live.resourcesSpent['don:g1']).toBeUndefined();
  });
});

describe('repos court — ce qui revient, et ce qui ne revient pas', () => {
  it('rend les emplacements de pacte de l’occultiste', () => {
    const use = fiche('occultiste', 3, { pactSlotsSpent: 2, damageTaken: 6 });
    const { sheet, recovered } = shortRest(use, deriveCharacter(use));
    expect(sheet.live.pactSlotsSpent).toBe(0);
    expect(recovered.join(' ')).toContain('pacte');
  });

  it('ne rend ni points de vie ni emplacements ordinaires', () => {
    const use = fiche('druide', 6, { damageTaken: 10, spellSlotsSpent: { 1: 3 } });
    const { sheet } = shortRest(use, deriveCharacter(use));
    expect(sheet.live.damageTaken).toBe(10);
    expect(sheet.live.spellSlotsSpent).toEqual({ 1: 3 });
  });

  it('rend EXACTEMENT une utilisation de Forme sauvage, pas la réserve', () => {
    // PHB 2024, Druide 2 : un repos court rend une seule utilisation
    // dépensée. Ce test affirmait l'inverse (rien ne revenait), ce qui
    // faisait passer la non-conformité pour un choix.
    const use = fiche('druide', 6, { resourcesSpent: { 'druide:forme-sauvage': 2 } });
    const { sheet } = shortRest(use, deriveCharacter(use));
    expect(sheet.live.resourcesSpent['druide:forme-sauvage']).toBe(1);
  });

  it('une seule utilisation dépensée revient entièrement, sans clé résiduelle', () => {
    const use = fiche('druide', 6, { resourcesSpent: { 'druide:forme-sauvage': 1 } });
    const { sheet } = shortRest(use, deriveCharacter(use));
    expect(sheet.live.resourcesSpent['druide:forme-sauvage']).toBeUndefined();
  });

  it('rend une ressource dite « au repos court »', () => {
    const use = fiche('occultiste', 6, { resourcesSpent: { 'occultiste:combattant-clairvoyant': 1 } });
    const avecPatron = {
      ...use,
      classLevels: [{ classId: 'occultiste', level: 6, subclass: 'Patron Grand Ancien', subclassId: null }],
    };
    const { sheet } = shortRest(avecPatron, deriveCharacter(avecPatron));
    expect(sheet.live.resourcesSpent['occultiste:combattant-clairvoyant']).toBeUndefined();
  });
});

describe('repos long — forme sauvage et créatures liées', () => {
  it('ouvre la fenêtre d’échange de forme, pour un Druide de niveau 2 ou plus', () => {
    const sheet = fiche('druide', 4);
    const { sheet: apres, recovered } = longRest(sheet, deriveCharacter(sheet));
    expect(apres.live.wildShapeSwapOpen).toBe(true);
    expect(recovered.join(' ')).toContain('échangée');
  });

  it('rien pour une classe sans Forme sauvage', () => {
    const sheet = fiche('occultiste', 4);
    const { sheet: apres } = longRest(sheet, deriveCharacter(sheet));
    expect(apres.live.wildShapeSwapOpen).toBeUndefined();
  });

  it('un Compagnon sauvage disparaît, et le repos le dit', () => {
    const sheet = fiche('druide', 2);
    const lie = bondCompanion(sheet, deriveCharacter(sheet), availableCompanions(sheet)[0].id, 'Grisounet', { type: 'forme-sauvage' });
    const { sheet: apres, recovered } = longRest(lie, deriveCharacter(lie));
    expect(apres.companions).toEqual([]);
    expect(recovered.join(' ')).toContain('Grisounet disparaît');
  });
});

describe('réserves des neuf autres classes — bout en bout', () => {
  it('un Barbare de niveau 6 voit ses quatre rages', () => {
    const derived = deriveCharacter(fiche('barbare', 6));
    expect(derived.resources.find((r) => r.key === 'barbare:rage')?.max).toBe(4);
  });

  it('le repos court rend UNE rage, pas toutes', () => {
    const sheet = fiche('barbare', 6, { resourcesSpent: { 'barbare:rage': 3 } });
    const { sheet: apres, recovered } = shortRest(sheet, deriveCharacter(sheet));
    expect(apres.live.resourcesSpent['barbare:rage']).toBe(2);
    expect(recovered).toContain('Une utilisation de Rage');
  });

  it('le repos long les rend toutes', () => {
    const sheet = fiche('barbare', 6, { resourcesSpent: { 'barbare:rage': 4 } });
    const { sheet: apres } = longRest(sheet, deriveCharacter(sheet));
    expect(apres.live.resourcesSpent['barbare:rage']).toBeUndefined();
  });

  it('un repos court sur une réserve intacte ne raconte rien', () => {
    const sheet = fiche('barbare', 6);
    expect(shortRest(sheet, deriveCharacter(sheet)).recovered).not.toContain('Une utilisation de Rage');
  });

  it('les points de concentration du Moine reviennent entiers au repos court', () => {
    const sheet = fiche('moine', 8, { resourcesSpent: { 'moine:concentration': 7 } });
    const { sheet: apres, recovered } = shortRest(sheet, deriveCharacter(sheet));
    expect(apres.live.resourcesSpent['moine:concentration']).toBeUndefined();
    expect(recovered).toContain('Points de concentration');
  });

  it('l’Imposition des mains du Paladin ne revient PAS au repos court', () => {
    const sheet = fiche('paladin', 5, { resourcesSpent: { 'paladin:imposition-des-mains': 12 } });
    const { sheet: apres } = shortRest(sheet, deriveCharacter(sheet));
    expect(apres.live.resourcesSpent['paladin:imposition-des-mains']).toBe(12);
  });

  it('… et revient entièrement au repos long', () => {
    const sheet = fiche('paladin', 5, { resourcesSpent: { 'paladin:imposition-des-mains': 12 } });
    const { sheet: apres } = longRest(sheet, deriveCharacter(sheet));
    expect(apres.live.resourcesSpent['paladin:imposition-des-mains']).toBeUndefined();
  });

  it('une réserve dépensée à fond se lit comme épuisée, jamais négative', () => {
    const sheet = fiche('guerrier', 2, { resourcesSpent: { 'guerrier:fougue-guerriere': 5 } });
    const fougue = deriveCharacter(sheet).resources.find((r) => r.key === 'guerrier:fougue-guerriere');
    expect(fougue?.remaining).toBe(0);
    expect(fougue?.spent).toBe(1);
  });

  it('la Forme sauvage garde son comportement d’avant la généralisation', () => {
    // Elle passe désormais par la règle commune (`shortRecovery`) au lieu d'un
    // cas particulier : ce test existe pour que ça reste invisible du joueur.
    const sheet = fiche('druide', 5, { resourcesSpent: { 'druide:forme-sauvage': 2 } });
    const { sheet: apres, recovered } = shortRest(sheet, deriveCharacter(sheet));
    expect(apres.live.resourcesSpent['druide:forme-sauvage']).toBe(1);
    expect(recovered).toContain('Une utilisation de Forme sauvage');
  });
});

describe('Inspiration bardique — le repos court ne l’ouvre qu’au niveau 5', () => {
  it('un barde de niveau 4 ne récupère rien au repos court', () => {
    const sheet = fiche('barde', 4, { resourcesSpent: { 'barde:inspiration': 2 } });
    const { sheet: apres } = shortRest(sheet, deriveCharacter(sheet));
    expect(apres.live.resourcesSpent['barde:inspiration']).toBe(2);
  });

  it('… mais récupère tout au repos long', () => {
    const sheet = fiche('barde', 4, { resourcesSpent: { 'barde:inspiration': 2 } });
    const { sheet: apres } = longRest(sheet, deriveCharacter(sheet));
    expect(apres.live.resourcesSpent['barde:inspiration']).toBeUndefined();
  });

  it('à partir du niveau 5, Source d’inspiration rend tout au repos court', () => {
    const sheet = fiche('barde', 5, { resourcesSpent: { 'barde:inspiration': 2 } });
    const { sheet: apres, recovered } = shortRest(sheet, deriveCharacter(sheet));
    expect(apres.live.resourcesSpent['barde:inspiration']).toBeUndefined();
    expect(recovered).toContain('Inspiration bardique');
  });
});

describe('Conduit divin — une utilisation au repos court, jamais toute la réserve', () => {
  it('le Clerc en récupère une seule', () => {
    const sheet = fiche('clerc', 6, { resourcesSpent: { 'clerc:conduit-divin': 3 } });
    const { sheet: apres } = shortRest(sheet, deriveCharacter(sheet));
    expect(apres.live.resourcesSpent['clerc:conduit-divin']).toBe(2);
  });

  it('le Paladin aussi', () => {
    const sheet = fiche('paladin', 11, { resourcesSpent: { 'paladin:conduit-divin': 3 } });
    const { sheet: apres } = shortRest(sheet, deriveCharacter(sheet));
    expect(apres.live.resourcesSpent['paladin:conduit-divin']).toBe(2);
  });
});
