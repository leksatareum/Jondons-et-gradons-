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

  it('ne rend que la moitié des dés de vie', () => {
    // Druide 6 : six dés au total, trois reviennent, il en reste deux dépensés.
    const { sheet } = longRest(use, deriveCharacter(use));
    expect(sheet.live.hitDiceSpent).toEqual({ druide: 2 });
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

  it('ne rend pas une ressource qui attend le repos long', () => {
    const use = fiche('druide', 6, { resourcesSpent: { 'druide:forme-sauvage': 2 } });
    const { sheet } = shortRest(use, deriveCharacter(use));
    expect(sheet.live.resourcesSpent['druide:forme-sauvage']).toBe(2);
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
    const lie = bondCompanion(sheet, availableCompanions(sheet)[0].id, 'Grisounet');
    const { sheet: apres, recovered } = longRest(lie, deriveCharacter(lie));
    expect(apres.companions).toEqual([]);
    expect(recovered.join(' ')).toContain('Grisounet disparaît');
  });
});
