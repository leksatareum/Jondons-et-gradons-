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
import {
  avantageContre, deBonusMarque, degatsBonusBeteCompagnon, degatsBonusMarque,
  degatsPeuventBriserLaConcentration, dureeMarqueHeures, finMarque, lancementsGratuitsRestants,
  MARQUE_LIBRE_KEY, marquer, marqueActiveSur, transfererMarque,
} from './rodeur';
import { spendResource } from './cast';
import { hunterMarkFreeCastUses } from '../domain/ranger-resources';
import { cardsFromCharacter, paiementsPourRang } from '../ui/spell-cards';
import {
  arcanumChoisis, arcanumResourceKey, invocationsChoisies, invocationsDisponibles,
  invocationsDues, peutRetirerInvocation, remplacerArcanum, sortsArcanumPossibles,
} from './invocations';
import { applyLevelUp, levelUpBlockers, levelUpPlan, type LevelUpChoice } from './level-up';
import {
  conversionsMagicienNaturePossibles, dureeFormeSauvageHeures, MAGICIEN_NATURE_KEY,
  magicienDeLaNature, rangMagicienNature,
} from './druide';
import { choisirDeClasse, decisionsDeClasse, decisionsEnAttente } from './choix-de-classe';
import { eligibleForms, wildShapeAccess } from './wild-shape';
import { INFATIGABLE_KEY, infatigablePvTemporaires, utiliserInfatigable } from './rodeur';
import { linkedCreatureOptionsFor } from '../domain/linked-creatures';
import { effectiveAbilities } from './character';
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

// ═══════════════════════════════════════════════════════════════════════
// RÔDEUR — §10 à §15
// ═══════════════════════════════════════════════════════════════════════

const rodeur = (level: number, archetype?: 'chasseur' | 'bestial'): ClassLevel[] => [{
  classId: 'rodeur', level, subclass: null, subclassId: archetype ?? null,
}];

const CIBLE = { id: 'gobelin-1', name: 'Gobelin balafré' };
const AUTRE = { id: 'gobelin-2', name: 'Gobelin porte-étendard' };

describe('§10 — Marque du chasseur : un véritable état, raccordé à la concentration', () => {
  it('marquer pose la cible, la concentration, la provenance et la durée', () => {
    const apres = marquer(fiche(rodeur(1)), CIBLE, { key: 'emplacement-1', slotLevel: 1 });
    expect(apres.live.huntersMark).toEqual({
      targetId: 'gobelin-1', targetName: 'Gobelin balafré',
      source: 'emplacement', slotLevel: 1, durationHours: 1,
    });
    expect(apres.live.concentration?.spellId).toBe('marque-chasseur');
  });

  it.each([
    [1, 1], [2, 1], [3, 8], [4, 8], [5, 24], [9, 24],
  ])('un emplacement de rang %i fait durer %i heure(s)', (rang, heures) => {
    expect(dureeMarqueHeures(rang)).toBe(heures);
  });

  it('un lancement d’Ennemi juré dure une heure et se sait gratuit', () => {
    const apres = marquer(fiche(rodeur(1)), CIBLE, { key: MARQUE_LIBRE_KEY, slotLevel: null });
    expect(apres.live.huntersMark?.source).toBe('ennemi-jure');
    expect(apres.live.huntersMark?.durationHours).toBe(1);
    expect(apres.live.huntersMark?.slotLevel).toBeUndefined();
  });

  it('la cible tombe : la marque se déplace sans relancer le sort', () => {
    const marque = marquer(fiche(rodeur(5)), CIBLE, { key: 'emplacement-3', slotLevel: 3 });
    const deplacee = transfererMarque(marque, AUTRE);
    expect(deplacee.live.huntersMark?.targetId).toBe('gobelin-2');
    // La durée engagée continue de courir : 8 heures, pas 8 nouvelles heures
    // à recompter, et surtout pas un emplacement de plus.
    expect(deplacee.live.huntersMark?.durationHours).toBe(8);
    expect(deplacee.live.huntersMark?.slotLevel).toBe(3);
    expect(deplacee.live.spellSlotsSpent).toEqual(marque.live.spellSlotsSpent);
  });

  it('la fin du sort emporte la marque ET la concentration', () => {
    const marque = marquer(fiche(rodeur(1)), CIBLE, { key: 'emplacement-1', slotLevel: 1 });
    const finie = finMarque(marque);
    expect(finie.live.huntersMark).toBeNull();
    expect(finie.live.concentration).toBeNull();
  });

  it('un repos long efface la marque', () => {
    const marque = marquer(fiche(rodeur(5)), CIBLE, { key: 'emplacement-1', slotLevel: 1 });
    const { sheet } = longRest(marque, deriveCharacter(marque));
    expect(sheet.live.huntersMark).toBeNull();
  });

  it('sans concentration, la marque ne compte pas', () => {
    const marque = marquer(fiche(rodeur(1)), CIBLE, { key: 'emplacement-1', slotLevel: 1 });
    const distrait = { ...marque, live: { ...marque.live, concentration: { spellId: 'toile-daraignee' } } };
    expect(marqueActiveSur(distrait, 'gobelin-1')).toBe(false);
  });
});

describe('§11 — Ennemi juré : les lancements gratuits sont un paiement offert', () => {
  it.each([
    [1, 2], [4, 2], [5, 3], [8, 3], [9, 4], [12, 4], [13, 5], [16, 5], [17, 6], [20, 6],
  ])('Rôdeur %i → %i lancements gratuits', (niveau, attendus) => {
    expect(hunterMarkFreeCastUses(niveau)).toBe(attendus);
  });

  it('la table suit le niveau de RÔDEUR, pas le bonus de maîtrise du personnage', () => {
    const multi = fiche([
      { classId: 'rodeur', level: 1, subclass: null, subclassId: null },
      { classId: 'magicien', level: 10, subclass: null, subclassId: null },
    ]);
    const derivee = deriveCharacter(multi);
    expect(derivee.proficiencyBonus).toBe(4);
    expect(lancementsGratuitsRestants(derivee)).toBe(2);
  });

  it('la carte de Marque du chasseur propose le lancement gratuit EN PREMIER', () => {
    const sheet = fiche(rodeur(5));
    const carte = cardsFromCharacter(sheet, deriveCharacter(sheet))
      .find((c) => c.id === 'marque-chasseur');
    expect(carte?.resources?.[0]).toMatchObject({ key: MARQUE_LIBRE_KEY, max: 3 });
    // …et les emplacements restent proposés juste après : le choix est offert.
    expect(carte?.resources?.length).toBeGreaterThan(1);
  });

  it('les autres sorts n’ont pas de lancement gratuit', () => {
    const sheet = fiche(rodeur(5), { spells: [{ id: 'soins', sourceClass: 'rodeur', prepared: true }] });
    const carte = cardsFromCharacter(sheet, deriveCharacter(sheet)).find((c) => c.id === 'soins');
    expect(carte?.resources?.some((res) => res.key === MARQUE_LIBRE_KEY)).toBe(false);
  });
});

describe('§12 — Chasseur implacable : les dégâts ne brisent plus la concentration', () => {
  const concentre = (level: number, spellId: string) => {
    const base = fiche(rodeur(level));
    return { ...base, live: { ...base.live, concentration: { spellId } } };
  };

  it('Rôdeur 13 concentré sur Marque du chasseur : aucun jet sur dégâts subis', () => {
    expect(degatsPeuventBriserLaConcentration(concentre(13, 'marque-chasseur'))).toBe(false);
  });

  it('Rôdeur 12 : le jet reste dû', () => {
    expect(degatsPeuventBriserLaConcentration(concentre(12, 'marque-chasseur'))).toBe(true);
  });

  it('la protection ne vaut QUE pour Marque du chasseur', () => {
    expect(degatsPeuventBriserLaConcentration(concentre(13, 'toile-daraignee'))).toBe(true);
  });
});

describe('§13 — Chasseur précis : Avantage contre la créature marquée', () => {
  const marqueA = (level: number) =>
    marquer(fiche(rodeur(level)), CIBLE, { key: 'emplacement-1', slotLevel: 1 });

  it('Rôdeur 17 contre sa cible marquée', () => {
    expect(avantageContre(marqueA(17), 'gobelin-1')).toBe(true);
  });

  it('Rôdeur 16 : rien', () => {
    expect(avantageContre(marqueA(16), 'gobelin-1')).toBe(false);
  });

  it('Rôdeur 17 contre une AUTRE créature : rien', () => {
    expect(avantageContre(marqueA(17), 'gobelin-2')).toBe(false);
  });
});

describe('§14 — Tueur d’ennemis : le d6 devient d10 au niveau 20', () => {
  it('Rôdeur 19 → 1d6, Rôdeur 20 → 1d10', () => {
    expect(deBonusMarque(fiche(rodeur(19)))).toBe('1d6');
    expect(deBonusMarque(fiche(rodeur(20)))).toBe('1d10');
  });

  it('les dégâts bonus ne s’appliquent qu’à la créature marquée', () => {
    const marque = marquer(fiche(rodeur(20)), CIBLE, { key: 'emplacement-1', slotLevel: 1 });
    expect(degatsBonusMarque(marque, 'gobelin-1')).toBe('1d10 force');
    expect(degatsBonusMarque(marque, 'gobelin-2')).toBeNull();
  });

  it('la bête du Maître des bêtes 11 hérite du dé, d10 compris', () => {
    const onze = marquer(fiche(rodeur(11, 'bestial')), CIBLE, { key: 'emplacement-1', slotLevel: 1 });
    expect(degatsBonusBeteCompagnon(onze, 'gobelin-1')).toBe('1d6 force');
    const vingt = marquer(fiche(rodeur(20, 'bestial')), CIBLE, { key: 'emplacement-1', slotLevel: 1 });
    expect(degatsBonusBeteCompagnon(vingt, 'gobelin-1')).toBe('1d10 force');
  });

  it('la bête n’en profite qu’une fois par tour, et pas avant le niveau 11', () => {
    const onze = marquer(fiche(rodeur(11, 'bestial')), CIBLE, { key: 'emplacement-1', slotLevel: 1 });
    expect(degatsBonusBeteCompagnon(onze, 'gobelin-1', true)).toBeNull();
    const dix = marquer(fiche(rodeur(10, 'bestial')), CIBLE, { key: 'emplacement-1', slotLevel: 1 });
    expect(degatsBonusBeteCompagnon(dix, 'gobelin-1')).toBeNull();
  });
});

describe('§15 — Magie de pacte et Incantation se paient l’une l’autre', () => {
  const druideOccultiste = fiche([
    { classId: 'druide', level: 3, subclass: null, subclassId: null },
    { classId: 'occultiste', level: 3, subclass: null, subclassId: null },
  ], { spells: [{ id: 'soins', sourceClass: 'druide', prepared: true }] });

  it('un sort de druide de rang 1 accepte l’emplacement de pacte comme les autres', () => {
    const derivee = deriveCharacter(druideOccultiste);
    const cles = paiementsPourRang(1, derivee).map((res) => res.key);
    expect(cles).toContain('pacte');
    expect(cles).toContain('emplacement-1');
  });

  it('la carte du sort porte tous les paiements légaux, pas le moins cher', () => {
    const carte = cardsFromCharacter(druideOccultiste, deriveCharacter(druideOccultiste))
      .find((c) => c.id === 'soins');
    expect(carte?.resources?.length).toBeGreaterThan(1);
    expect(carte?.resources?.some((res) => res.key === 'pacte')).toBe(true);
  });

  it('un emplacement de rang inférieur au sort n’est jamais proposé', () => {
    const derivee = deriveCharacter(druideOccultiste);
    expect(paiementsPourRang(2, derivee).map((res) => res.key)).not.toContain('emplacement-1');
  });

  it('les réserves restent distinctes : payer avec le pacte n’entame pas les autres', () => {
    const apres = spendResource(druideOccultiste, 'pacte');
    expect(apres.live.pactSlotsSpent).toBe(1);
    expect(apres.live.spellSlotsSpent).toEqual({});
  });
});

// ═══════════════════════════════════════════════════════════════════════
// MONTÉE DE NIVEAU DE L'OCCULTISTE — §21 et §22
// ═══════════════════════════════════════════════════════════════════════

/**
 * Une fiche d'Occultiste qui porte déjà ses choix de classe. Le patron est
 * nommé ET identifié : la montée de niveau lit le nom, le reste lit l'id.
 */
const occAvec = (level: number, invocations: string[] = [], arcanum: string[] = []): CharacterSheet => ({
  ...occ(level, 'fielon'),
  classLevels: [{ classId: 'occultiste', level, subclass: 'Patron Fiélon', subclassId: 'fielon' }],
  classChoices: { occultiste: { invocations, arcanum } },
});

/** Les Arcanum qu'un Occultiste de ce niveau devrait déjà avoir choisis. */
const arcanumDeja = (niveau: number): string[] => {
  const vierge = occAvec(20);
  const pris: string[] = [];
  for (const [palier, rang] of [[11, 6], [13, 7], [15, 8], [17, 9]] as const) {
    if (niveau >= palier) pris.push(`${rang}:${sortsArcanumPossibles(vierge, rang)[0].id}`);
  }
  return pris;
};

const monter = (sheet: CharacterSheet, choix: Partial<LevelUpChoice> = {}) => {
  const plan = levelUpPlan(sheet, 'occultiste')!;
  return { plan, appliquer: (c: Partial<LevelUpChoice> = choix) =>
    applyLevelUp(sheet, plan, { classId: 'occultiste', hitPointRoll: 5, ...c }) };
};

describe('§21 — Invocations occultes : la table, le complément et l’échange', () => {
  it.each([
    [1, 1], [2, 3], [4, 3], [5, 5], [6, 5], [7, 6], [9, 7], [11, 7], [12, 8], [15, 9], [17, 9], [18, 10], [20, 10],
  ])('Occultiste %i → %i invocations', (niveau, attendues) => {
    expect(invocationsDues(occ(niveau))).toBe(attendues);
  });

  it('passer au niveau 5 réclame deux invocations de plus', () => {
    const avant = occAvec(4, ['armor-of-shadows', 'devils-sight', 'mask-many-faces']);
    const { plan } = monter(avant);
    expect(plan.warlock?.invocationsToChoose).toBe(2);
  });

  it('tant qu’elles ne sont pas choisies, la montée est bloquée', () => {
    const avant = occAvec(4, ['armor-of-shadows', 'devils-sight', 'mask-many-faces']);
    const { plan } = monter(avant);
    const blocages = levelUpBlockers(plan, { classId: 'occultiste', hitPointRoll: 5 });
    expect(blocages.some((texte) => /invocation/i.test(texte))).toBe(true);
    expect(levelUpBlockers(plan, {
      classId: 'occultiste', hitPointRoll: 5,
      invocations: ['eldritch-mind', 'ascendant-step'],
    })).toEqual([]);
  });

  it('un niveau qui n’augmente pas le total n’en réclame aucune', () => {
    const avant = occAvec(2, ['armor-of-shadows', 'devils-sight', 'mask-many-faces']);
    expect(monter(avant).plan.warlock?.invocationsToChoose).toBe(0);
  });

  it('l’échange est offert à CHAQUE niveau, même sans nouvelle invocation', () => {
    const avant = occAvec(3, ['armor-of-shadows', 'devils-sight', 'mask-many-faces']);
    const { plan, appliquer } = monter(avant);
    expect(plan.warlock?.mayReplaceInvocation).toBe(true);
    const apres = appliquer({ invocationSwap: { out: 'devils-sight', in: 'eldritch-mind' } });
    expect(invocationsChoisies(apres)).toEqual(['armor-of-shadows', 'eldritch-mind', 'mask-many-faces']);
  });

  it('on ne retire pas une invocation qui sert de prérequis à une autre', () => {
    const avant = occAvec(5, ['pact-blade', 'thirsting-blade', 'armor-of-shadows', 'devils-sight', 'eldritch-mind']);
    expect(peutRetirerInvocation(avant, 'pact-blade')).toBe(false);
    expect(peutRetirerInvocation(avant, 'thirsting-blade')).toBe(true);
    // …et la tentative ne passe pas non plus par la montée de niveau.
    const { appliquer } = monter(avant);
    const apres = appliquer({ invocationSwap: { out: 'pact-blade', in: 'eldritch-spear' } });
    expect(invocationsChoisies(apres)).toContain('pact-blade');
  });

  it('une invocation dont le prérequis manque n’est pas proposée', () => {
    const sans = occAvec(5, ['armor-of-shadows']);
    const ids = invocationsDisponibles(sans).map((option) => option.id);
    expect(ids).not.toContain('thirsting-blade');
    const avec = occAvec(5, ['pact-blade']);
    expect(invocationsDisponibles(avec).map((o) => o.id)).toContain('thirsting-blade');
  });

  it('une invocation trop haut niveau n’est pas proposée', () => {
    expect(invocationsDisponibles(occAvec(2)).map((o) => o.id)).not.toContain('visions-distant-realms');
    expect(invocationsDisponibles(occAvec(9)).map((o) => o.id)).toContain('visions-distant-realms');
  });
});

describe('§22 — Arcanum mystique : 11/13/15/17, et l’échange à rang égal', () => {
  it.each([[11, 6], [13, 7], [15, 8], [17, 9]])(
    'le niveau %i ouvre un sort de rang %i', (niveau, rang) => {
      const avant = occAvec(niveau - 1, ['armor-of-shadows'], arcanumDeja(niveau - 1));
      const { plan } = monter(avant);
      expect(plan.warlock?.arcanumRanks).toEqual([rang]);
    },
  );

  it('un niveau sans palier n’en ouvre aucun', () => {
    expect(monter(occAvec(11, ['armor-of-shadows'], arcanumDeja(11))).plan.warlock?.arcanumRanks).toEqual([]);
  });

  it('la montée est bloquée tant que l’Arcanum n’est pas choisi', () => {
    const avant = occAvec(10, ['armor-of-shadows']);
    const { plan } = monter(avant);
    expect(levelUpBlockers(plan, { classId: 'occultiste', hitPointRoll: 5 })
      .some((texte) => /Arcanum/i.test(texte))).toBe(true);
  });

  it('le sort choisi devient une carte payée par sa propre réserve', () => {
    const avant = occAvec(10, ['armor-of-shadows']);
    const sixieme = sortsArcanumPossibles(avant, 6)[0];
    const { appliquer } = monter(avant);
    const apres = appliquer({ arcanum: [{ rank: 6, spellId: sixieme.id }] });
    expect(arcanumChoisis(apres)).toEqual([{ rank: 6, spellId: sixieme.id }]);

    const derivee = deriveCharacter(apres);
    const reserve = derivee.resources.find((r) => r.key === arcanumResourceKey(6));
    expect(reserve).toMatchObject({ max: 1, remaining: 1, recharge: 'long' });

    const carte = cardsFromCharacter(apres, derivee).find((c) => c.id === 'arcanum-6');
    expect(carte?.name).toBe(sixieme.name);
    expect(carte?.resources?.[0]?.key).toBe(arcanumResourceKey(6));
  });

  it('la réserve revient au repos long', () => {
    const avant = occAvec(11, ['armor-of-shadows'], arcanumDeja(11));
    const depense = { ...avant, live: { ...avant.live, resourcesSpent: { [arcanumResourceKey(6)]: 1 } } };
    const { sheet } = longRest(depense, deriveCharacter(depense));
    expect(sheet.live.resourcesSpent[arcanumResourceKey(6)]).toBeUndefined();
  });

  it('un Arcanum ne se remplace que par un sort du MÊME rang', () => {
    const rang6 = sortsArcanumPossibles(occAvec(11), 6);
    const rang7 = sortsArcanumPossibles(occAvec(13), 7);
    const avant = occAvec(11, ['armor-of-shadows'], [`6:${rang6[0].id}`]);

    const memeRang = remplacerArcanum(avant, rang6[0].id, rang6[1].id);
    expect(arcanumChoisis(memeRang)).toEqual([{ rank: 6, spellId: rang6[1].id }]);

    const autreRang = remplacerArcanum(avant, rang6[0].id, rang7[0].id);
    expect(arcanumChoisis(autreRang)).toEqual([{ rank: 6, spellId: rang6[0].id }]);
  });

  it('l’échange est proposé dès qu’un Arcanum existe', () => {
    const avant = occAvec(11, ['armor-of-shadows'], arcanumDeja(11));
    expect(monter(avant).plan.warlock?.mayReplaceArcanum).toBe(true);
    expect(monter(occAvec(10, ['armor-of-shadows'])).plan.warlock?.mayReplaceArcanum).toBe(false);
  });

  it('les autres classes n’ont aucune de ces décisions', () => {
    expect(levelUpPlan(fiche(druide(4)), 'druide')?.warlock).toBeNull();
  });
});

describe('§21 — les invocations proposées sont celles du niveau ATTEINT', () => {
  it('Occultiste 4 → 5 avec le Pacte de la Lame se voit proposer Lame assoiffée', () => {
    const avant = occAvec(4, ['pact-blade', 'armor-of-shadows', 'devils-sight']);
    const plan = levelUpPlan(avant, 'occultiste')!;
    const ids = plan.warlock!.invocationOptions.map((option) => option.id);
    expect(ids).toContain('thirsting-blade');
    // …alors qu'elle n'est pas encore prenable au niveau où il se trouve.
    expect(invocationsDisponibles(avant).map((o) => o.id)).not.toContain('thirsting-blade');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// DRUIDE — CHAPITRE COMPLET (PHB 2024, p. 79 à 89)
//
// À partir d'ici, les règles ne viennent plus d'un message : elles sont
// lues dans le PDF fourni par l'utilisateur. Chaque test cite sa page.
// ═══════════════════════════════════════════════════════════════════════

const druideAvec = (level: number, cercle: 'terre' | 'lune' | 'mer' | 'etoiles', choix: Record<string, string> = {}): CharacterSheet => {
  const nom = {
    terre: 'Cercle de la Terre', lune: 'Cercle de la Lune',
    mer: 'Cercle de la Mer', etoiles: 'Cercle des Étoiles',
  }[cercle];
  return {
    ...fiche([{ classId: 'druide', level, subclass: nom, subclassId: cercle }]),
    classChoices: { druide: choix },
  };
};

describe('p. 80 — table du Druide : Forme sauvage, sorts mineurs, emplacements', () => {
  it.each([[2, 2], [5, 2], [6, 3], [16, 3], [17, 4], [20, 4]])(
    'Druide %i → %i utilisations de Forme sauvage', (niveau, attendues) => {
      const sheet = fiche(druide(niveau));
      expect(deriveCharacter(sheet).resources.find((r) => r.key === 'druide:forme-sauvage')?.max)
        .toBe(attendues);
    },
  );

  it.each([[1, 4], [2, 5], [3, 6], [5, 9], [9, 14], [12, 16], [17, 19], [20, 22]])(
    'Druide %i → %i sorts préparés', (niveau, attendus) => {
      const sheet = fiche(druide(niveau));
      expect(deriveCharacter(sheet).spellcasting.preparedMax.druide).toBe(attendus);
    },
  );

  it('la durée d’une Forme sauvage est la moitié du niveau, en heures', () => {
    expect(dureeFormeSauvageHeures(fiche(druide(2)))).toBe(1);
    expect(dureeFormeSauvageHeures(fiche(druide(8)))).toBe(4);
    expect(dureeFormeSauvageHeures(fiche(druide(20)))).toBe(10);
    expect(dureeFormeSauvageHeures(fiche(druide(1)))).toBe(0);
  });
});

describe('p. 80 — Druidique : Parler aux animaux est toujours préparé', () => {
  it('dès le niveau 1, sans consommer le budget de sorts préparés', () => {
    const derivee = deriveCharacter(fiche(druide(1)));
    expect(derivee.spellcasting.alwaysPrepared).toContain('parler-animaux');
    expect(derivee.spellcasting.preparedMax.druide).toBe(4);
  });
});

describe('p. 80 — Ordre primordial : le Mage connaît un sort mineur de plus', () => {
  it('Druide 1 sans ordre : 2 sorts mineurs ; Mage : 3', () => {
    expect(deriveCharacter(fiche(druide(1))).spellcasting.cantripsKnown.druide).toBe(2);
    const mage = { ...fiche(druide(1)), classChoices: { druide: { primalOrder: 'mage' } } };
    expect(deriveCharacter(mage).spellcasting.cantripsKnown.druide).toBe(3);
  });

  it('le Gardien n’en gagne pas', () => {
    const gardien = { ...fiche(druide(1)), classChoices: { druide: { primalOrder: 'gardien' } } };
    expect(deriveCharacter(gardien).spellcasting.cantripsKnown.druide).toBe(2);
  });

  it('la décision est proposée dès le niveau 1 et retenue une fois prise', () => {
    const vierge = fiche(druide(1));
    const ordre = decisionsDeClasse(vierge).find((d) => d.key === 'primalOrder');
    expect(ordre?.choisi).toBeNull();
    expect(ordre?.options.map((o) => o.id)).toEqual(['mage', 'gardien']);
    const apres = choisirDeClasse(vierge, 'druide', 'primalOrder', 'mage');
    expect(decisionsDeClasse(apres).find((d) => d.key === 'primalOrder')?.choisi).toBe('mage');
    expect(decisionsEnAttente(apres).some((d) => d.key === 'primalOrder')).toBe(false);
  });

  it('une option inventée n’est pas enregistrée', () => {
    const vierge = fiche(druide(1));
    expect(choisirDeClasse(vierge, 'druide', 'primalOrder', 'archimage')).toBe(vierge);
  });
});

describe('p. 81 — Formes de bête : formes connues, FP maximale, vol', () => {
  it.each([
    [2, 4, 0.25, false], [3, 4, 0.25, false],
    [4, 6, 0.5, false], [7, 6, 0.5, false],
    [8, 8, 1, true], [20, 8, 1, true],
  ])('Druide %i → %i formes, FP %s, vol %s', (niveau, formes, fp, vol) => {
    const sheet = fiche(druide(niveau));
    const acces = wildShapeAccess(sheet, deriveCharacter(sheet));
    expect(acces.knownLimit).toBe(formes);
    expect(acces.maxCr).toBe(fp);
    expect(eligibleForms(sheet, deriveCharacter(sheet)).some((f) => /vol/i.test(f.speed))).toBe(vol);
  });
});

describe('p. 86 — Cercle de la Lune : Formes du cercle', () => {
  it('la FP maximale devient le niveau divisé par 3', () => {
    const lune = (niveau: number) => druideAvec(niveau, 'lune');
    expect(wildShapeAccess(lune(3), deriveCharacter(lune(3))).maxCr).toBe(1);
    expect(wildShapeAccess(lune(9), deriveCharacter(lune(9))).maxCr).toBe(3);
    expect(wildShapeAccess(lune(20), deriveCharacter(lune(20))).maxCr).toBe(6);
  });

  it('les PV temporaires valent trois fois le niveau, contre une fois ailleurs', () => {
    expect(wildShapeTemporaryHp(druideAvec(6, 'lune'))).toBe(18);
    expect(wildShapeTemporaryHp(druideAvec(6, 'mer'))).toBe(6);
    // Avant le niveau 3, le Cercle n'est pas encore choisi : la règle de base.
    expect(wildShapeTemporaryHp(fiche(druide(2)))).toBe(2);
  });

  it('Pas de clair de lune : Sagesse utilisations, au repos long, à partir du niveau 10', () => {
    const neuf = druideAvec(9, 'lune');
    expect(deriveCharacter(neuf).resources.some((r) => r.key === 'druide:pas-clair-lune')).toBe(false);
    const dix = druideAvec(10, 'lune');
    // La fiche de conformité a 16 en Sagesse, soit +3.
    expect(deriveCharacter(dix).resources.find((r) => r.key === 'druide:pas-clair-lune'))
      .toMatchObject({ max: 3, recharge: 'long' });
  });
});

describe('p. 84 — Cercle de la Terre : le terrain décide des sorts du cercle', () => {
  it('sans terrain choisi, aucun sort de cercle — et la décision est signalée', () => {
    const sansTerrain = druideAvec(5, 'terre');
    expect(deriveCharacter(sansTerrain).spellcasting.alwaysPrepared).not.toContain('eclair');
    expect(decisionsEnAttente(sansTerrain).some((d) => d.key === 'terrain')).toBe(true);
  });

  it.each([
    ['aride', 5, ['flou', 'mains-brulantes', 'trait-feu', 'boule-feu']],
    ['polaire', 5, ['brouillard', 'immobilisation-personne', 'rayon-givre', 'tempete-neige']],
    ['temperee', 5, ['pas-brumeux', 'toucher-choc', 'sommeil', 'eclair']],
    ['tropicale', 5, ['aspersion-acide', 'rayon-maladie', 'toile-araignee', 'nuage-poison']],
  ])('terrain %s au niveau %i → %j', (terrain, niveau, attendus) => {
    const sheet = choisirDeClasse(druideAvec(niveau, 'terre'), 'druide', 'terrain', terrain);
    const accordes = deriveCharacter(sheet).spellcasting.alwaysPrepared;
    for (const id of attendus) expect(accordes).toContain(id);
  });

  it('les paliers 7 et 9 n’arrivent qu’à leur niveau', () => {
    const sept = choisirDeClasse(druideAvec(7, 'terre'), 'druide', 'terrain', 'temperee');
    expect(deriveCharacter(sept).spellcasting.alwaysPrepared).toContain('liberte-mouvement');
    expect(deriveCharacter(sept).spellcasting.alwaysPrepared).not.toContain('foulee-arbres');
    const neuf = choisirDeClasse(druideAvec(9, 'terre'), 'druide', 'terrain', 'temperee');
    expect(deriveCharacter(neuf).spellcasting.alwaysPrepared).toContain('foulee-arbres');
  });

  it('le terrain se rechoisit à chaque repos long : la décision le dit', () => {
    const sheet = choisirDeClasse(druideAvec(5, 'terre'), 'druide', 'terrain', 'aride');
    expect(decisionsDeClasse(sheet).find((d) => d.key === 'terrain')?.rechoisissable).toBe('repos-long');
  });

  it('un autre cercle n’a pas de terrain à choisir', () => {
    expect(decisionsDeClasse(druideAvec(5, 'lune')).some((d) => d.key === 'terrain')).toBe(false);
  });
});

describe('p. 88 — Cercle des Étoiles : Carte stellaire et Présage cosmique', () => {
  it('Trait guidé : Sagesse lancements, rendus au repos long, dès le niveau 3', () => {
    const trois = druideAvec(3, 'etoiles');
    expect(deriveCharacter(trois).resources.find((r) => r.key === 'druide:carte-etoiles'))
      .toMatchObject({ max: 3, recharge: 'long' });
  });

  it('Présage cosmique n’arrive qu’au niveau 6', () => {
    expect(deriveCharacter(druideAvec(5, 'etoiles')).resources
      .some((r) => r.key === 'druide:presage-cosmique')).toBe(false);
    expect(deriveCharacter(druideAvec(6, 'etoiles')).resources
      .find((r) => r.key === 'druide:presage-cosmique')).toMatchObject({ max: 3, recharge: 'long' });
  });

  it('les sorts de la Carte stellaire sont toujours préparés', () => {
    const accordes = deriveCharacter(druideAvec(3, 'etoiles')).spellcasting.alwaysPrepared;
    expect(accordes).toContain('assistance');
    expect(accordes).toContain('trait-lumiere');
  });
});

describe('p. 82 — Archidruide : Magicien de la nature', () => {
  const aSecPartiel = (level: number, dejaDepensees: number) => {
    const base = fiche(druide(level));
    return { ...base, live: { ...base.live, resourcesSpent: { 'druide:forme-sauvage': dejaDepensees } } };
  };

  it('deux utilisations donnent UN emplacement de rang 4', () => {
    expect(rangMagicienNature(1)).toBe(2);
    expect(rangMagicienNature(2)).toBe(4);
    const avant = { ...fiche(druide(20)), live: { ...fiche(druide(20)).live, spellSlotsSpent: { 4: 1 } } };
    const apres = magicienDeLaNature(avant, deriveCharacter(avant), 2);
    expect(apres.live.spellSlotsSpent[4]).toBe(0);
    expect(apres.live.resourcesSpent['druide:forme-sauvage']).toBe(2);
  });

  it('rien avant le niveau 20', () => {
    const dixneuf = fiche(druide(19));
    expect(conversionsMagicienNaturePossibles(dixneuf, deriveCharacter(dixneuf))).toEqual([]);
  });

  it('une seule fois avant un repos long', () => {
    const avant = fiche(druide(20));
    const apres = magicienDeLaNature(avant, deriveCharacter(avant), 1);
    expect(conversionsMagicienNaturePossibles(apres, deriveCharacter(apres))).toEqual([]);
    const { sheet } = longRest(apres, deriveCharacter(apres));
    expect(sheet.live.resourcesSpent[MAGICIEN_NATURE_KEY]).toBeUndefined();
  });

  it('on ne convertit que ce qui reste, et jamais au-delà du rang 9', () => {
    // Druide 20 : 4 utilisations, dont 2 déjà dépensées → 2 restantes.
    const partiel = aSecPartiel(20, 2);
    expect(conversionsMagicienNaturePossibles(partiel, deriveCharacter(partiel))).toEqual([1, 2]);
    // 5 utilisations donneraient un rang 10 : hors de portée, donc jamais proposé.
    const plein = fiche(druide(20));
    expect(conversionsMagicienNaturePossibles(plein, deriveCharacter(plein))).toEqual([1, 2, 3, 4]);
    expect(magicienDeLaNature(plein, deriveCharacter(plein), 5)).toBe(plein);
  });
});

describe('Appendice B (p. 346-359) — les formes que la règle autorise existent vraiment', () => {
  const formes = (sheet: CharacterSheet) =>
    eligibleForms(sheet, deriveCharacter(sheet)).map((profile) => profile.id);

  it('un Druide 8 a enfin des formes volantes à choisir', () => {
    const huit = formes(fiche(druide(8)));
    for (const id of ['bat', 'hawk', 'owl', 'raven']) expect(huit).toContain(id);
  });

  it('…et aucune avant le niveau 8', () => {
    expect(formes(fiche(druide(7))).some((id) => ['bat', 'hawk', 'owl', 'raven'].includes(id))).toBe(false);
  });

  it('un Druide 8 a des formes de FP 1', () => {
    const huit = formes(fiche(druide(8)));
    for (const id of ['brown-bear', 'dire-wolf', 'giant-spider', 'lion', 'tiger']) {
      expect(huit).toContain(id);
    }
    expect(formes(fiche(druide(7)))).not.toContain('lion');
  });

  it('un Druide de la Lune atteint l’Éléphant (FP 4) au niveau 12', () => {
    const onze = druideAvec(11, 'lune');
    const douze = druideAvec(12, 'lune');
    expect(wildShapeAccess(onze, deriveCharacter(onze)).maxCr).toBe(3);
    expect(formes(onze)).not.toContain('elephant');
    expect(wildShapeAccess(douze, deriveCharacter(douze)).maxCr).toBe(4);
    expect(formes(douze)).toContain('elephant');
  });

  it('l’Ours brun frappe deux fois, le Loup sanguinaire une seule', () => {
    const huit = eligibleForms(fiche(druide(8)), deriveCharacter(fiche(druide(8))));
    expect(huit.find((f) => f.id === 'brown-bear')?.attacksPerAction).toBe(2);
    expect(huit.find((f) => f.id === 'dire-wolf')?.attacksPerAction ?? 1).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// RÔDEUR — CHAPITRE COMPLET (PHB 2024, p. 119 à 127)
// ═══════════════════════════════════════════════════════════════════════

const rodeurAvec = (level: number, archetype: 'chasseur' | 'bestial' | 'feerique' | 'tenebres'): CharacterSheet => {
  const nom = {
    chasseur: 'Chasseur', bestial: 'Maître des bêtes',
    feerique: 'Vagabond féerique', tenebres: 'Traqueur des ténèbres',
  }[archetype];
  return fiche([{ classId: 'rodeur', level, subclass: nom, subclassId: archetype }]);
};

describe('p. 120 — table du Rôdeur : Ennemi juré et sorts préparés', () => {
  it.each([[1, 2], [4, 2], [5, 3], [8, 3], [9, 4], [12, 4], [13, 5], [16, 5], [17, 6], [20, 6]])(
    'Rôdeur %i → %i lancements gratuits', (niveau, attendus) => {
      const sheet = fiche(rodeur(niveau));
      expect(deriveCharacter(sheet).resources.find((r) => r.key === MARQUE_LIBRE_KEY)?.max).toBe(attendus);
    },
  );

  it.each([[1, 2], [2, 3], [3, 4], [5, 6], [9, 9], [13, 11], [17, 14], [20, 15]])(
    'Rôdeur %i → %i sorts préparés', (niveau, attendus) => {
      expect(deriveCharacter(fiche(rodeur(niveau))).spellcasting.preparedMax.rodeur).toBe(attendus);
    },
  );
});

describe('p. 121 — Infatigable : deux effets distincts au niveau 10', () => {
  it('la réserve de PV temporaires vaut le modificateur de Sagesse', () => {
    // La fiche de conformité a 16 en Sagesse, soit +3.
    expect(deriveCharacter(fiche(rodeur(9))).resources.some((r) => r.key === INFATIGABLE_KEY)).toBe(false);
    expect(deriveCharacter(fiche(rodeur(10))).resources.find((r) => r.key === INFATIGABLE_KEY))
      .toMatchObject({ max: 3, recharge: 'long' });
  });

  it('une utilisation donne 1d8 + Sagesse en PV temporaires', () => {
    const avant = fiche(rodeur(10));
    expect(infatigablePvTemporaires(avant, 5)).toBe(8);
    const apres = utiliserInfatigable(avant, deriveCharacter(avant), 5);
    expect(apres.live.temporaryHp).toBe(8);
    expect(apres.live.resourcesSpent[INFATIGABLE_KEY]).toBe(1);
  });

  it('la réserve s’épuise', () => {
    let sheet = fiche(rodeur(10));
    for (let i = 0; i < 3; i += 1) sheet = utiliserInfatigable(sheet, deriveCharacter(sheet), 1);
    expect(sheet.live.resourcesSpent[INFATIGABLE_KEY]).toBe(3);
    const apres = utiliserInfatigable(sheet, deriveCharacter(sheet), 8);
    expect(apres).toBe(sheet);
  });

  it('le cran d’épuisement du repos court reste un effet séparé', () => {
    const base = fiche(rodeur(10));
    const epuise = { ...base, live: { ...base.live, exhaustion: 2 } };
    const { sheet } = shortRest(epuise, deriveCharacter(epuise));
    expect(sheet.live.exhaustion).toBe(1);
    // …et il ne consomme aucune utilisation de la réserve.
    expect(sheet.live.resourcesSpent[INFATIGABLE_KEY]).toBeUndefined();
  });
});

describe('p. 124-126 — réserves des archétypes', () => {
  it('Traqueur des ténèbres 3 : Frappe redoutable, Sagesse fois, repos long', () => {
    expect(deriveCharacter(rodeurAvec(3, 'tenebres')).resources.find((r) => r.key === 'rodeur:frappe-redoutable'))
      .toMatchObject({ max: 3, recharge: 'long' });
    expect(deriveCharacter(rodeurAvec(3, 'chasseur')).resources.some((r) => r.key === 'rodeur:frappe-redoutable')).toBe(false);
  });

  it('Vagabond féerique : Renforts féeriques au 11, Vagabond brumeux au 15', () => {
    const onze = deriveCharacter(rodeurAvec(11, 'feerique')).resources;
    expect(onze.find((r) => r.key === 'rodeur:renforts-feeriques')).toMatchObject({ max: 1, recharge: 'long' });
    expect(onze.some((r) => r.key === 'rodeur:vagabond-brumeux')).toBe(false);
    const quinze = deriveCharacter(rodeurAvec(15, 'feerique')).resources;
    expect(quinze.find((r) => r.key === 'rodeur:vagabond-brumeux')).toMatchObject({ max: 3, recharge: 'long' });
  });

  it('Voile de la nature n’arrive qu’au niveau 14', () => {
    expect(deriveCharacter(fiche(rodeur(13))).resources.some((r) => r.key === 'rodeur:voile-nature')).toBe(false);
    expect(deriveCharacter(fiche(rodeur(14))).resources.find((r) => r.key === 'rodeur:voile-nature'))
      .toMatchObject({ max: 3, recharge: 'long' });
  });
});

describe('p. 127 — Chasseur : deux décisions, rechoisies à chaque repos', () => {
  it('Proie du chasseur au niveau 3, Tactique défensive au niveau 7', () => {
    const trois = decisionsDeClasse(rodeurAvec(3, 'chasseur')).map((d) => d.key);
    expect(trois).toContain('hunterPrey');
    expect(trois).not.toContain('hunterDefense');
    expect(decisionsDeClasse(rodeurAvec(7, 'chasseur')).map((d) => d.key)).toContain('hunterDefense');
  });

  it('les deux se rechoisissent à chaque repos, court ou long', () => {
    for (const decision of decisionsDeClasse(rodeurAvec(7, 'chasseur'))) {
      expect(decision.rechoisissable).toBe('repos');
    }
  });

  it('Tactique défensive ne propose que deux options, sans « Bond du chasseur »', () => {
    const decision = decisionsDeClasse(rodeurAvec(7, 'chasseur')).find((d) => d.key === 'hunterDefense')!;
    expect(decision.options.map((o) => o.id)).toEqual(['escape-horde', 'multiattack-defense']);
  });

  it('le choix s’enregistre et se relit', () => {
    const avant = rodeurAvec(7, 'chasseur');
    const apres = choisirDeClasse(avant, 'rodeur', 'hunterPrey', 'horde-breaker');
    expect(decisionsDeClasse(apres).find((d) => d.key === 'hunterPrey')?.choisi).toBe('horde-breaker');
  });

  it('un autre archétype n’a aucune de ces décisions', () => {
    expect(decisionsDeClasse(rodeurAvec(7, 'bestial')).length).toBe(0);
  });
});

describe('p. 122-123 — Compagnon primordial : les trois blocs suivent le niveau', () => {
  const bete = (level: number, kind: 'land' | 'sea' | 'sky') => {
    const sheet = rodeurAvec(level, 'bestial');
    return linkedCreatureOptionsFor({
      classLevels: sheet.classLevels.map((e) => ({ classId: e.classId, level: e.level, subclass: e.subclass })),
      abilities: effectiveAbilities(sheet),
      classSelections: sheet.classChoices,
    } as never).find((option) => option.id === `primal-companion:${kind}`)!;
  };

  it('Bête terrestre : 5 + 5 × niveau PV, CA 13 + Sagesse, 1d8 + 2 + Sagesse', () => {
    const terrestre = bete(5, 'land');
    expect(terrestre.hp).toBe(30);
    expect(terrestre.ac).toBe(16);
    expect(terrestre.damageFormula).toBe('1d8+5');
  });

  it('Bête volante : 4 + 4 × niveau PV, 1d4 + 3 + Sagesse', () => {
    const volante = bete(5, 'sky');
    expect(volante.hp).toBe(24);
    expect(volante.damageFormula).toBe('1d4+6');
  });

  it('Bête marine : 5 + 5 × niveau PV, 1d6 + 2 + Sagesse', () => {
    const marine = bete(5, 'sea');
    expect(marine.hp).toBe(30);
    expect(marine.damageFormula).toBe('1d6+5');
  });
});
