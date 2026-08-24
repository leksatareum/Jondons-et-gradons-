import { describe, expect, it } from 'vitest';
import { deriveCharacter } from './derive';
import { longRest, shortRest } from './rest';
import { grantTemporaryHp, heal, takeDamage } from './damage';
import { transform, wildShapeTemporaryHp } from './wild-shape';
import { EMPTY_LIVE_STATE, type CharacterSheet, type ClassLevel } from './character';

/**
 * Tests de CONFORMITÉ PHB 2024.
 *
 * Ils partent d'une vraie `CharacterSheet`, appliquent la transition que
 * l'application appelle réellement, et vérifient l'état final. Un test vert
 * sur une fonction de `src/domain` bâtie sur l'ancienne forme ne prouve rien :
 * il ne dit pas que la règle agit sur une fiche jouée.
 *
 * Chaque règle citée ici a été fournie par l'utilisateur depuis son
 * PlayersHandbook2024.pdf — le PDF n'étant pas accessible à cet
 * environnement, aucune n'a été reconstituée de mémoire.
 */

const fiche = (classLevels: ClassLevel[], over: Partial<CharacterSheet> = {}): CharacterSheet => ({
  id: 'f', name: 'Conformité', speciesId: 'humain', lineageId: null, ancestryId: null, size: null,
  backgroundId: 'sage',
  abilities: { str: 10, dex: 12, con: 14, int: 10, wis: 16, cha: 12 },
  alignment: null,
  classLevels,
  classChoices: {}, skillProficiencies: [], expertise: [], toolProficiencies: [],
  languages: [], featIds: [], abilityImprovements: [], cantrips: [], spells: [],
  inventory: [], armorId: null, shield: false, gold: 0,
  live: { ...EMPTY_LIVE_STATE, hitDiceSpent: {}, spellSlotsSpent: {}, resourcesSpent: {}, conditions: [] },
  ...over,
});

const druide = (level: number, cercle?: 'lune' | 'terre'): ClassLevel[] => [{
  classId: 'druide', level,
  subclass: cercle === 'lune' ? 'Cercle de la Lune' : cercle === 'terre' ? 'Cercle de la Terre' : null,
  subclassId: cercle ?? null,
}];

describe('§1 — Repos long : TOUS les dés de vie reviennent', () => {
  it('un Druide 6 qui a dépensé 5 dés les récupère tous', () => {
    const avant = fiche(druide(6), {
      live: { ...fiche(druide(6)).live, hitDiceSpent: { druide: 5 } },
    });
    const { sheet } = longRest(avant, deriveCharacter(avant));
    expect(sheet.live.hitDiceSpent).toEqual({});
  });

  it('un multiclassé récupère les dés de chacune de ses classes', () => {
    const avant = fiche([
      { classId: 'rodeur', level: 5, subclass: null, subclassId: null },
      { classId: 'druide', level: 3, subclass: null, subclassId: null },
    ], { live: { ...fiche(druide(1)).live, hitDiceSpent: { rodeur: 4, druide: 3 } } });
    const { sheet } = longRest(avant, deriveCharacter(avant));
    expect(sheet.live.hitDiceSpent).toEqual({});
  });

  it('l’épuisement, lui, ne descend que d’un cran', () => {
    const avant = fiche(druide(6), { live: { ...fiche(druide(6)).live, exhaustion: 3 } });
    const { sheet } = longRest(avant, deriveCharacter(avant));
    expect(sheet.live.exhaustion).toBe(2);
  });
});

describe('§2 — Multiclassage : arrondi par classe, pas sur la somme', () => {
  it('Rôdeur 9 / Druide 4 donne un niveau de lanceur 9', () => {
    // ceil(9/2) + 4 = 5 + 4 = 9. Sommer puis arrondir donnait 8.
    const sheet = fiche([
      { classId: 'rodeur', level: 9, subclass: null, subclassId: null },
      { classId: 'druide', level: 4, subclass: null, subclassId: null },
    ]);
    const slots = deriveCharacter(sheet).spellcasting.slots.filter((s) => !s.pact);
    // Le niveau de lanceur 9 ouvre le rang 5 ; le niveau 8 s'arrêterait au rang 4.
    expect(slots.some((slot) => slot.level === 5 && slot.max > 0)).toBe(true);
  });

  it('Rôdeur 1 / Druide 1 : ceil(1/2) + 1 = 2, pas 1', () => {
    const sheet = fiche([
      { classId: 'rodeur', level: 1, subclass: null, subclassId: null },
      { classId: 'druide', level: 1, subclass: null, subclassId: null },
    ]);
    const rang1 = deriveCharacter(sheet).spellcasting.slots.find((slot) => slot.level === 1);
    expect(rang1?.max).toBe(3); // niveau de lanceur 2 → 3 emplacements de rang 1
  });
});

describe('§3 — Forme sauvage : le repos court rend EXACTEMENT une utilisation', () => {
  it('deux dépensées, une revient', () => {
    const avant = fiche(druide(6), {
      live: { ...fiche(druide(6)).live, resourcesSpent: { 'druide:forme-sauvage': 2 } },
    });
    const { sheet } = shortRest(avant, deriveCharacter(avant));
    expect(sheet.live.resourcesSpent['druide:forme-sauvage']).toBe(1);
  });

  it('le repos long les rend toutes', () => {
    const avant = fiche(druide(6), {
      live: { ...fiche(druide(6)).live, resourcesSpent: { 'druide:forme-sauvage': 3 } },
    });
    const { sheet } = longRest(avant, deriveCharacter(avant));
    expect(sheet.live.resourcesSpent['druide:forme-sauvage']).toBeUndefined();
  });

  it('rien de dépensé : le repos court ne crée pas d’utilisation en trop', () => {
    const avant = fiche(druide(6));
    const { sheet } = shortRest(avant, deriveCharacter(avant));
    expect(sheet.live.resourcesSpent['druide:forme-sauvage']).toBeUndefined();
  });
});

describe('§4 — Forme sauvage : de vrais PV temporaires sur la fiche', () => {
  it('Druide 5 ordinaire : 5 PV temporaires', () => {
    expect(wildShapeTemporaryHp(fiche(druide(5)))).toBe(5);
  });

  it('Druide de la Lune 5 : 15 PV temporaires', () => {
    expect(wildShapeTemporaryHp(fiche(druide(5, 'lune')))).toBe(15);
  });

  it('la transformation les écrit dans live.temporaryHp, pas seulement à l’écran', () => {
    const avant = fiche(druide(5, 'lune'));
    const derivee = deriveCharacter(avant);
    const forme = derivee.resources.find((r) => r.key === 'druide:forme-sauvage');
    expect(forme && forme.remaining > 0).toBe(true);
    const apres = transform(avant, derivee, 'wolf');
    expect(apres.live.temporaryHp).toBe(15);
    expect(apres.live.resourcesSpent['druide:forme-sauvage']).toBe(1);
  });
});

describe('§5 — Dégâts : les PV temporaires absorbent d’abord', () => {
  const blesse = (temporaryHp: number) =>
    fiche(druide(6), { live: { ...fiche(druide(6)).live, temporaryHp } });

  it('10 PV temporaires, 14 dégâts : 4 seulement atteignent les vrais PV', () => {
    const avant = blesse(10);
    const { sheet, absorbedByTemporary, appliedToHp } = takeDamage(avant, deriveCharacter(avant), 14);
    expect(absorbedByTemporary).toBe(10);
    expect(appliedToHp).toBe(4);
    expect(sheet.live.temporaryHp).toBe(0);
    expect(sheet.live.damageTaken).toBe(4);
  });

  it('des dégâts inférieurs aux PV temporaires n’entament jamais les vrais PV', () => {
    const avant = blesse(10);
    const { sheet } = takeDamage(avant, deriveCharacter(avant), 6);
    expect(sheet.live.temporaryHp).toBe(4);
    expect(sheet.live.damageTaken).toBe(0);
  });

  it('les PV temporaires NE SE CUMULENT PAS — on garde une valeur, pas la somme', () => {
    const avant = blesse(8);
    expect(grantTemporaryHp(avant, 5).live.temporaryHp).toBe(8);   // les anciens
    expect(grantTemporaryHp(avant, 12).live.temporaryHp).toBe(12); // les nouveaux
    expect(grantTemporaryHp(avant, 12, { remplacer: false }).live.temporaryHp).toBe(8);
  });

  it('les soins ne rendent jamais de PV temporaires', () => {
    const avant = fiche(druide(6), {
      live: { ...fiche(druide(6)).live, damageTaken: 9, temporaryHp: 0 },
    });
    const apres = heal(avant, 5);
    expect(apres.live.damageTaken).toBe(4);
    expect(apres.live.temporaryHp).toBe(0);
  });
});

describe('§9 — Infatigable : le repos court réduit l’Épuisement au Rôdeur 10+', () => {
  const rodeur = (level: number, exhaustion: number) => {
    const base = fiche([{ classId: 'rodeur', level, subclass: null, subclassId: null }]);
    return { ...base, live: { ...base.live, exhaustion } };
  };

  it('Rôdeur 10, épuisement 3 → 2 après un repos court', () => {
    const avant = rodeur(10, 3);
    const { sheet } = shortRest(avant, deriveCharacter(avant));
    expect(sheet.live.exhaustion).toBe(2);
  });

  it('Rôdeur 10, épuisement 0 → reste 0', () => {
    const avant = rodeur(10, 0);
    const { sheet } = shortRest(avant, deriveCharacter(avant));
    expect(sheet.live.exhaustion).toBe(0);
  });

  it('Rôdeur 9 : le repos court ne touche pas à l’Épuisement', () => {
    const avant = rodeur(9, 3);
    const { sheet } = shortRest(avant, deriveCharacter(avant));
    expect(sheet.live.exhaustion).toBe(3);
  });
});
