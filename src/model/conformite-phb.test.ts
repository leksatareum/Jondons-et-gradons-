import { describe, expect, it } from 'vitest';
import { deriveCharacter } from './derive';
import { longRest, shortRest } from './rest';
import { grantTemporaryHp, heal, takeDamage } from './damage';
import { transform, wildShapeTemporaryHp } from './wild-shape';
import {
  archidruideSurInitiative, convertirEmplacementEnForme, convertirFormeEnEmplacement,
  paiementsCompagnonSauvage, payerCompagnonSauvage, peutConvertirEmplacementEnForme,
  peutConvertirFormeEnEmplacement, RESURGENCE_SLOT_KEY,
} from './druide';
import {
  benedictionDuTenebreux, benedictionDuTenebreuxMontant, depenserLumiereGuerisseuse,
  LUMIERE_GUERISSEUSE_KEY, lumiereGuerisseuseDes, lumiereGuerisseuseMaxParUsage,
  peutUtiliserRuseMagique, resilienceCeleste, resilienceCelestePourAutrui,
  resilienceCelestePourSoi, ruseMagiqueRecuperables, RUSE_MAGIQUE_KEY, utiliserRuseMagique,
} from './occultiste';
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

describe('§6 — Compagnon sauvage : jamais gratuit', () => {
  const druide5 = () => fiche(druide(5));

  it('les deux paiements sont proposés quand les deux sont disponibles', () => {
    const sheet = druide5();
    expect(paiementsCompagnonSauvage(deriveCharacter(sheet)))
      .toEqual({ emplacement: true, formeSauvage: true });
  });

  it('payer par emplacement dépense un emplacement, pas une Forme sauvage', () => {
    const sheet = druide5();
    const apres = payerCompagnonSauvage(sheet, deriveCharacter(sheet), 'emplacement');
    expect(apres.live.spellSlotsSpent[1]).toBe(1);
    expect(apres.live.resourcesSpent['druide:forme-sauvage']).toBeUndefined();
  });

  it('payer par Forme sauvage dépense une utilisation, pas un emplacement', () => {
    const sheet = druide5();
    const apres = payerCompagnonSauvage(sheet, deriveCharacter(sheet), 'forme-sauvage');
    expect(apres.live.resourcesSpent['druide:forme-sauvage']).toBe(1);
    expect(apres.live.spellSlotsSpent).toEqual({});
  });

  it('sans ressource, rien n’est débité — l’écran ne doit pas créer le familier', () => {
    const sec = fiche(druide(5), {
      live: {
        ...fiche(druide(5)).live,
        spellSlotsSpent: { 1: 4, 2: 3, 3: 2 },
        resourcesSpent: { 'druide:forme-sauvage': 2 },
      },
    });
    const derivee = deriveCharacter(sec);
    expect(paiementsCompagnonSauvage(derivee)).toEqual({ emplacement: false, formeSauvage: false });
    expect(payerCompagnonSauvage(sec, derivee, 'forme-sauvage')).toBe(sec);
    expect(payerCompagnonSauvage(sec, derivee, 'emplacement')).toBe(sec);
  });
});

describe('§7 — Résurgence sauvage (Druide 5)', () => {
  const sansForme = (level = 5) => {
    const base = fiche(druide(level));
    const max = deriveCharacter(base).resources
      .find((r) => r.key === 'druide:forme-sauvage')!.max;
    return { ...base, live: { ...base.live, resourcesSpent: { 'druide:forme-sauvage': max } } };
  };

  it('effet 1 : sans utilisation restante, un emplacement en rend une', () => {
    const avant = sansForme();
    const apres = convertirEmplacementEnForme(avant, deriveCharacter(avant), 'tour-1');
    expect(apres.live.resourcesSpent['druide:forme-sauvage']).toBe(1);
    expect(apres.live.spellSlotsSpent[1]).toBe(1);
  });

  it('effet 1 : INDISPONIBLE s’il reste au moins une utilisation', () => {
    const avant = fiche(druide(5)); // réserve pleine
    expect(peutConvertirEmplacementEnForme(avant, deriveCharacter(avant), 'tour-1')).toBe(false);
    expect(convertirEmplacementEnForme(avant, deriveCharacter(avant), 'tour-1')).toBe(avant);
  });

  it('effet 1 : une fois AU MAXIMUM par tour, mais de nouveau au tour suivant', () => {
    const avant = sansForme();
    const apres = convertirEmplacementEnForme(avant, deriveCharacter(avant), 'tour-1');
    const derivee = deriveCharacter(apres);
    // Même tour : refusé, même si la réserve est de nouveau vide plus tard.
    expect(peutConvertirEmplacementEnForme(
      { ...apres, live: { ...apres.live, resourcesSpent: { 'druide:forme-sauvage': 2 } } },
      derivee, 'tour-1',
    )).toBe(false);
    expect(peutConvertirEmplacementEnForme(
      { ...apres, live: { ...apres.live, resourcesSpent: { 'druide:forme-sauvage': 2 } } },
      deriveCharacter({ ...apres, live: { ...apres.live, resourcesSpent: { 'druide:forme-sauvage': 2 } } }),
      'tour-2',
    )).toBe(true);
  });

  it('effet 1 : rien avant le niveau 5', () => {
    const base = fiche(druide(4));
    const max = deriveCharacter(base).resources.find((r) => r.key === 'druide:forme-sauvage')!.max;
    const avant = { ...base, live: { ...base.live, resourcesSpent: { 'druide:forme-sauvage': max } } };
    expect(peutConvertirEmplacementEnForme(avant, deriveCharacter(avant), 'tour-1')).toBe(false);
  });

  it('effet 2 : une Forme sauvage rend un emplacement de niveau 1', () => {
    const base = fiche(druide(5));
    const avant = { ...base, live: { ...base.live, spellSlotsSpent: { 1: 2 } } };
    const apres = convertirFormeEnEmplacement(avant, deriveCharacter(avant));
    expect(apres.live.spellSlotsSpent[1]).toBe(1);
    expect(apres.live.resourcesSpent['druide:forme-sauvage']).toBe(1);
  });

  it('effet 2 : une seule fois avant un repos long', () => {
    const base = fiche(druide(5));
    const avant = { ...base, live: { ...base.live, spellSlotsSpent: { 1: 2 } } };
    const apres = convertirFormeEnEmplacement(avant, deriveCharacter(avant));
    expect(peutConvertirFormeEnEmplacement(apres, deriveCharacter(apres))).toBe(false);
    const { sheet: repose } = longRest(apres, deriveCharacter(apres));
    expect(repose.live.resourcesSpent[RESURGENCE_SLOT_KEY]).toBeUndefined();
  });
});

describe('§8 — Archidruide : récupération à l’Initiative, niveau 20 SEULEMENT', () => {
  const aSec = (level: number) => {
    const base = fiche(druide(level));
    const max = deriveCharacter(base).resources.find((r) => r.key === 'druide:forme-sauvage')!.max;
    return { ...base, live: { ...base.live, resourcesSpent: { 'druide:forme-sauvage': max } } };
  };

  it('Druide 19, 0 Forme sauvage, Initiative → reste à 0', () => {
    const avant = aSec(19);
    const apres = archidruideSurInitiative(avant, deriveCharacter(avant));
    expect(apres).toBe(avant);
  });

  it('Druide 20, 0 Forme sauvage, Initiative → passe à 1', () => {
    const avant = aSec(20);
    const max = deriveCharacter(avant).resources.find((r) => r.key === 'druide:forme-sauvage')!.max;
    const apres = archidruideSurInitiative(avant, deriveCharacter(avant));
    expect(apres.live.resourcesSpent['druide:forme-sauvage']).toBe(max - 1);
  });

  it('Druide 20 qui a encore des utilisations : rien ne change', () => {
    const avant = fiche(druide(20));
    expect(archidruideSurInitiative(avant, deriveCharacter(avant))).toBe(avant);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// OCCULTISTE — §16 à §20
// ═══════════════════════════════════════════════════════════════════════

const occultiste = (level: number, patron?: 'celeste' | 'fielon' | 'archifee'): ClassLevel[] => [{
  classId: 'occultiste', level, subclass: null, subclassId: patron ?? null,
}];

/** Un Occultiste au Charisme de 18 : le modificateur +4 rend les seuils lisibles. */
const occ = (level: number, patron?: 'celeste' | 'fielon' | 'archifee') =>
  fiche(occultiste(level, patron), {
    abilities: { str: 10, dex: 12, con: 14, int: 10, wis: 10, cha: 18 },
  });

const pacteMax = (sheet: CharacterSheet) =>
  deriveCharacter(sheet).spellcasting.slots.find((slot) => slot.pact)!.max;

describe('§16 — Ruse magique : la moitié du maximum d’emplacements de pacte, arrondie au supérieur', () => {
  const aSec = (sheet: CharacterSheet) =>
    ({ ...sheet, live: { ...sheet.live, pactSlotsSpent: pacteMax(sheet) } });

  it('Occultiste 2 (max 2) → rend 1 emplacement', () => {
    const avant = aSec(occ(2));
    expect(pacteMax(avant)).toBe(2);
    const { sheet, recuperes } = utiliserRuseMagique(avant, deriveCharacter(avant));
    expect(recuperes).toBe(1);
    expect(sheet.live.pactSlotsSpent).toBe(1);
  });

  it('Occultiste 11 (max 3) → rend 2 emplacements', () => {
    const avant = aSec(occ(11));
    expect(pacteMax(avant)).toBe(3);
    const { sheet, recuperes } = utiliserRuseMagique(avant, deriveCharacter(avant));
    expect(recuperes).toBe(2);
    expect(sheet.live.pactSlotsSpent).toBe(1);
  });

  it('Occultiste 17 (max 4) → rend 2 emplacements', () => {
    const avant = aSec(occ(17));
    expect(pacteMax(avant)).toBe(4);
    expect(ruseMagiqueRecuperables(avant, deriveCharacter(avant))).toBe(2);
  });

  it('ne rend jamais plus que ce qui a été dépensé', () => {
    const base = occ(11);
    const avant = { ...base, live: { ...base.live, pactSlotsSpent: 1 } };
    const { sheet, recuperes } = utiliserRuseMagique(avant, deriveCharacter(avant));
    expect(recuperes).toBe(1);
    expect(sheet.live.pactSlotsSpent).toBe(0);
  });

  it('une seule fois avant un repos long, et le repos long la rearme', () => {
    const avant = aSec(occ(11));
    const { sheet: apres } = utiliserRuseMagique(avant, deriveCharacter(avant));
    expect(peutUtiliserRuseMagique(apres, deriveCharacter(apres))).toBe(false);
    const { sheet: reposeCourt } = shortRest(apres, deriveCharacter(apres));
    expect(peutUtiliserRuseMagique(reposeCourt, deriveCharacter(reposeCourt))).toBe(false);
    const { sheet: repose } = longRest(apres, deriveCharacter(apres));
    expect(repose.live.resourcesSpent[RUSE_MAGIQUE_KEY]).toBeUndefined();
  });

  it('rien avant le niveau 2', () => {
    const avant = aSec(occ(1));
    expect(peutUtiliserRuseMagique(avant, deriveCharacter(avant))).toBe(false);
  });
});

describe('§17 — Maître occulte : au niveau 20, Ruse magique rend TOUT', () => {
  it('Occultiste 20 (max 4), 4 dépensés → les 4 reviennent', () => {
    const base = occ(20);
    const avant = { ...base, live: { ...base.live, pactSlotsSpent: pacteMax(base) } };
    const { sheet, recuperes } = utiliserRuseMagique(avant, deriveCharacter(avant));
    expect(recuperes).toBe(4);
    expect(sheet.live.pactSlotsSpent).toBe(0);
  });

  it('au niveau 19, la moitié seulement', () => {
    const base = occ(19);
    const avant = { ...base, live: { ...base.live, pactSlotsSpent: pacteMax(base) } };
    const { recuperes } = utiliserRuseMagique(avant, deriveCharacter(avant));
    expect(recuperes).toBe(2);
  });
});

describe('§18 — Lumière guérisseuse : 1 + niveau d’Occultiste dés, mod. CHA par usage', () => {
  it('Céleste 3 → 4 dés ; Céleste 8 → 9 dés', () => {
    expect(lumiereGuerisseuseDes(occ(3, 'celeste'))).toBe(4);
    expect(lumiereGuerisseuseDes(occ(8, 'celeste'))).toBe(9);
  });

  it('un autre patron n’a pas la réserve', () => {
    expect(lumiereGuerisseuseDes(occ(8, 'fielon'))).toBe(0);
  });

  it('une utilisation plafonne au modificateur de Charisme', () => {
    const avant = occ(8, 'celeste');
    expect(lumiereGuerisseuseMaxParUsage(avant)).toBe(4);
    const { sheet, depenses } = depenserLumiereGuerisseuse(avant, 9);
    expect(depenses).toBe(4);
    expect(sheet.live.resourcesSpent[LUMIERE_GUERISSEUSE_KEY]).toBe(4);
  });

  it('la réserve s’épuise et ne passe pas sous zéro', () => {
    const base = occ(3, 'celeste'); // 4 dés
    const { sheet: un } = depenserLumiereGuerisseuse(base, 4);
    const { sheet: deux, depenses } = depenserLumiereGuerisseuse(un, 4);
    expect(depenses).toBe(0);
    expect(deux.live.resourcesSpent[LUMIERE_GUERISSEUSE_KEY]).toBe(4);
  });

  it('un Charisme négatif laisse tout de même un dé', () => {
    const faible = fiche(occultiste(3, 'celeste'), {
      abilities: { str: 10, dex: 12, con: 14, int: 10, wis: 10, cha: 8 },
    });
    expect(lumiereGuerisseuseMaxParUsage(faible)).toBe(1);
  });
});

describe('§19 — Résilience céleste : PV temporaires sur Ruse magique et sur les repos', () => {
  it('Occultiste 10 Céleste, CHA +4 → 14 PV temporaires sur Ruse magique', () => {
    const base = occ(10, 'celeste');
    const avant = { ...base, live: { ...base.live, pactSlotsSpent: pacteMax(base) } };
    const { sheet } = utiliserRuseMagique(avant, deriveCharacter(avant));
    expect(resilienceCelestePourSoi(base)).toBe(14);
    expect(sheet.live.temporaryHp).toBe(14);
  });

  it('chaque créature choisie reçoit la moitié du niveau + CHA', () => {
    expect(resilienceCelestePourAutrui(occ(10, 'celeste'))).toBe(9);
    expect(resilienceCelestePourAutrui(occ(11, 'celeste'))).toBe(9);
  });

  it('rien avant le niveau 10, ni pour un autre patron', () => {
    expect(resilienceCeleste(occ(9, 'celeste')).live.temporaryHp).toBe(0);
    expect(resilienceCeleste(occ(10, 'fielon')).live.temporaryHp).toBe(0);
  });

  it('le repos court et le repos long l’accordent aussi', () => {
    const base = occ(10, 'celeste');
    const { sheet: court } = shortRest(base, deriveCharacter(base));
    expect(court.live.temporaryHp).toBe(14);
    const { sheet: long } = longRest(base, deriveCharacter(base));
    expect(long.live.temporaryHp).toBe(14);
  });

  it('les PV temporaires ne se cumulent pas : on garde le plus élevé', () => {
    const base = grantTemporaryHp(occ(10, 'celeste'), 20);
    const { sheet } = shortRest(base, deriveCharacter(base));
    expect(sheet.live.temporaryHp).toBe(20);
  });
});

describe('§20 — Bénédiction du Ténébreux : PV temporaires quand un ennemi tombe à 0', () => {
  it('Fiélon 3, CHA +4 → 7 PV temporaires quand il réduit l’ennemi à 0', () => {
    const apres = benedictionDuTenebreux(occ(3, 'fielon'), { reduitParLOccultiste: true, aPortee: false });
    expect(apres.live.temporaryHp).toBe(7);
  });

  it('ou quand l’ennemi tombe à 3 m ou moins de lui', () => {
    const apres = benedictionDuTenebreux(occ(3, 'fielon'), { reduitParLOccultiste: false, aPortee: true });
    expect(apres.live.temporaryHp).toBe(7);
  });

  it('ni l’un ni l’autre : rien', () => {
    const avant = occ(3, 'fielon');
    expect(benedictionDuTenebreux(avant, { reduitParLOccultiste: false, aPortee: false })).toBe(avant);
  });

  it('un Charisme calamiteux laisse tout de même 1 PV temporaire', () => {
    const faible = fiche(occultiste(1, 'fielon'), {
      abilities: { str: 10, dex: 12, con: 14, int: 10, wis: 10, cha: 6 },
    });
    // Niveau 1 + (-2) = -1 : la règle plancher à 1.
    expect(benedictionDuTenebreuxMontant(faible)).toBe(1);
  });

  it('un autre patron ne gagne rien', () => {
    const avant = occ(3, 'celeste');
    expect(benedictionDuTenebreux(avant, { reduitParLOccultiste: true, aPortee: true })).toBe(avant);
  });
});
