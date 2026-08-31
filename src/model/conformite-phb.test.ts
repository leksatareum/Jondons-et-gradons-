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
import { weaponCardsFromCharacter } from '../ui/weapon-cards';
import {
  arcanumChoisis, arcanumResourceKey, invocationsChoisies, invocationsDisponibles,
  invocationsDues, peutRetirerInvocation, remplacerArcanum, sortsArcanumPossibles,
} from './invocations';
import { applyLevelUp, levelUpBlockers, levelUpPlan, type LevelUpChoice } from './level-up';
import {
  conversionsMagicienNaturePossibles, dureeFormeSauvageHeures, MAGICIEN_NATURE_KEY,
  magicienDeLaNature, rangMagicienNature,
} from './druide';
import { cantripDeLOrdrePrimordial, choisirDeClasse, decisionsDeClasse, decisionsEnAttente } from './choix-de-classe';
import { cantripBudget, cantripChoices } from './spellbook';
import {
  blocagesRecuperationNaturelle, budgetRecuperationNaturelle, RECUPERATION_NATURELLE_KEY,
  recuperationNaturelle, SORT_DE_CERCLE_GRATUIT_KEY,
} from './druide';
import { sortDuCercleDeLaTerre } from './choix-de-classe';
import { paiementsPourSort } from '../ui/spell-cards';
import { spellById } from '../content/spell-catalogue';
import { eligibleForms, wildShapeAccess } from './wild-shape';
import {
  activerCourrouxDeLaMer, activerFormeStellaire, changerConstellation, courrouxDeLaMerDes,
  finCourrouxDeLaMer, finFormeStellaire, formeStellaireDes,
} from './wild-shape';
import { INFATIGABLE_KEY, infatigablePvTemporaires, utiliserInfatigable } from './rodeur';
import { linkedCreatureOptionsFor } from '../domain/linked-creatures';
import { effectiveAbilities } from './character';
import { ELDRITCH_INVOCATIONS } from '../content/eldritch-invocations';
import { CONDITIONS } from '../domain/conditions';
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

  it('propose une carte « Libre » dès le niveau 3, avec le bon montant', () => {
    const sheet = occ(3, 'fielon');
    const carte = cardsFromCharacter(sheet, deriveCharacter(sheet)).find((c) => c.id === 'occultiste:benediction-tenebreux');
    expect(carte).toBeDefined();
    expect(carte?.economy).toBe('libre');
    expect(carte?.detail).toContain('7 PV temporaires');
  });

  it('aucune carte avant le niveau 3, ni pour un autre patron', () => {
    const sheet2 = occ(2, 'fielon');
    expect(cardsFromCharacter(sheet2, deriveCharacter(sheet2)).some((c) => c.id === 'occultiste:benediction-tenebreux')).toBe(false);
    const celeste = occ(3, 'celeste');
    expect(cardsFromCharacter(celeste, deriveCharacter(celeste)).some((c) => c.id === 'occultiste:benediction-tenebreux')).toBe(false);
  });
});

describe('Pas des fées (Archifée 3+) : Pas brumeux sans emplacement', () => {
  const avecPasBrumeux = (level: number, patron: 'celeste' | 'fielon' | 'archifee' | 'grand-ancien') => ({
    ...occPatron(level, patron),
    spells: [{ id: 'pas-brumeux', sourceClass: 'occultiste', prepared: true }],
  });

  it('se propose comme paiement, en tête, avec le bon nombre d’utilisations', () => {
    const sheet = avecPasBrumeux(3, 'archifee');
    const spell = spellById('pas-brumeux')!;
    const paiements = paiementsPourSort(spell, deriveCharacter(sheet), sheet);
    expect(paiements[0]).toMatchObject({ key: 'occultiste:pas-des-fees', max: 4, label: 'Pas des fées · sans emplacement' });
  });

  it('un autre patron ne le voit pas — Pas brumeux ne coûte alors qu’un emplacement', () => {
    const sheet = avecPasBrumeux(3, 'fielon');
    const spell = spellById('pas-brumeux')!;
    const paiements = paiementsPourSort(spell, deriveCharacter(sheet), sheet);
    expect(paiements.some((p) => p.key === 'occultiste:pas-des-fees')).toBe(false);
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

  it('Trait de lumière se propose sans emplacement, en tête des paiements', () => {
    const sheet = { ...druideAvec(3, 'etoiles'), spells: [{ id: 'trait-lumiere', sourceClass: 'druide', prepared: true }] };
    const paiements = paiementsPourSort(spellById('trait-lumiere')!, deriveCharacter(sheet), sheet);
    expect(paiements[0]).toMatchObject({ key: 'druide:carte-etoiles', max: 3, label: 'Carte stellaire · sans emplacement' });
  });

  it('un autre cercle ne le voit pas', () => {
    const sheet = { ...druideAvec(3, 'lune'), spells: [{ id: 'trait-lumiere', sourceClass: 'druide', prepared: true }] };
    const paiements = paiementsPourSort(spellById('trait-lumiere')!, deriveCharacter(sheet), sheet);
    expect(paiements.some((p) => p.key === 'druide:carte-etoiles')).toBe(false);
  });
});

describe('p. 87 — Cercle de la Mer : Courroux de la mer', () => {
  it('dépense une utilisation de Forme sauvage, exclusif avec une forme de bête', () => {
    let sheet = druideAvec(3, 'mer');
    sheet = transform(sheet, deriveCharacter(sheet), eligibleForms(sheet, deriveCharacter(sheet))[0]!.id);
    expect(sheet.live.activeWildShape).not.toBeNull();
    const avant = deriveCharacter(sheet).resources.find((r) => r.key === 'druide:forme-sauvage')!.remaining;

    sheet = activerCourrouxDeLaMer(sheet, deriveCharacter(sheet));
    expect(sheet.live.courrouxDeLaMer).toBe(true);
    expect(sheet.live.activeWildShape).toBeNull();
    const apres = deriveCharacter(sheet).resources.find((r) => r.key === 'druide:forme-sauvage')!.remaining;
    expect(apres).toBe(avant - 1);
  });

  it('refuse hors du cercle, ou sans charge restante', () => {
    const autreCercle = druideAvec(3, 'lune');
    expect(activerCourrouxDeLaMer(autreCercle, deriveCharacter(autreCercle))).toBe(autreCercle);

    let epuise = druideAvec(3, 'mer');
    const max = deriveCharacter(epuise).resources.find((r) => r.key === 'druide:forme-sauvage')!.max;
    for (let i = 0; i < max; i += 1) epuise = activerCourrouxDeLaMer(epuise, deriveCharacter(epuise));
    epuise = finCourrouxDeLaMer(epuise); // relâcher ne rend pas la charge
    expect(activerCourrouxDeLaMer(epuise, deriveCharacter(epuise))).toBe(epuise);
  });

  it('terminer est gratuit — la charge ne revient pas, mais l’état s’efface', () => {
    let sheet = activerCourrouxDeLaMer(druideAvec(3, 'mer'), deriveCharacter(druideAvec(3, 'mer')));
    const chargeAvant = deriveCharacter(sheet).resources.find((r) => r.key === 'druide:forme-sauvage')!.remaining;
    sheet = finCourrouxDeLaMer(sheet);
    expect(sheet.live.courrouxDeLaMer).toBe(false);
    expect(deriveCharacter(sheet).resources.find((r) => r.key === 'druide:forme-sauvage')!.remaining).toBe(chargeAvant);
  });

  it('le nombre de d6 de froid suit la Sagesse, minimum 1', () => {
    expect(courrouxDeLaMerDes(3)).toBe(3);
    expect(courrouxDeLaMerDes(-1)).toBe(1);
  });
});

describe('p. 88-89 — Cercle des Étoiles : Forme stellaire', () => {
  it('dépense une utilisation de Forme sauvage, garde la constellation choisie', () => {
    let sheet = druideAvec(3, 'etoiles');
    const avant = deriveCharacter(sheet).resources.find((r) => r.key === 'druide:forme-sauvage')!.remaining;
    sheet = activerFormeStellaire(sheet, deriveCharacter(sheet), 'archer');
    expect(sheet.live.formeStellaire).toEqual({ constellation: 'archer' });
    expect(deriveCharacter(sheet).resources.find((r) => r.key === 'druide:forme-sauvage')!.remaining).toBe(avant - 1);
  });

  it('exclusive avec Courroux de la mer et une forme de bête', () => {
    let sheet = druideAvec(3, 'etoiles');
    sheet = activerFormeStellaire(sheet, deriveCharacter(sheet), 'calice');
    expect(sheet.live.formeStellaire).not.toBeNull();
    // Rien à activer d'autre à sa place ici (mauvais cercle pour Courroux de
    // la mer) — le test porte sur le nettoyage réciproque des trois champs.
    expect(sheet.live.activeWildShape).toBeFalsy();
    expect(sheet.live.courrouxDeLaMer).toBeFalsy();
  });

  it('refuse hors du cercle', () => {
    const autreCercle = druideAvec(3, 'terre');
    expect(activerFormeStellaire(autreCercle, deriveCharacter(autreCercle), 'dragon')).toBe(autreCercle);
  });

  it('changer de constellation sans dépenser de charge : réservé au niveau 10+', () => {
    let sheet = activerFormeStellaire(druideAvec(9, 'etoiles'), deriveCharacter(druideAvec(9, 'etoiles')), 'archer');
    expect(changerConstellation(sheet, 'dragon')).toBe(sheet); // niveau 9 : refusé

    sheet = activerFormeStellaire(druideAvec(10, 'etoiles'), deriveCharacter(druideAvec(10, 'etoiles')), 'archer');
    const charge = deriveCharacter(sheet).resources.find((r) => r.key === 'druide:forme-sauvage')!.remaining;
    sheet = changerConstellation(sheet, 'dragon');
    expect(sheet.live.formeStellaire).toEqual({ constellation: 'dragon' });
    expect(deriveCharacter(sheet).resources.find((r) => r.key === 'druide:forme-sauvage')!.remaining).toBe(charge);
  });

  it('l’Archer et le Calice passent de d8 à 2d8 au niveau 10', () => {
    expect(formeStellaireDes(druideAvec(9, 'etoiles'))).toBe(1);
    expect(formeStellaireDes(druideAvec(10, 'etoiles'))).toBe(2);
  });

  it('terminer est gratuit', () => {
    let sheet = activerFormeStellaire(druideAvec(3, 'etoiles'), deriveCharacter(druideAvec(3, 'etoiles')), 'archer');
    sheet = finFormeStellaire(sheet);
    expect(sheet.live.formeStellaire).toBeNull();
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
    const duChasseur = decisionsDeClasse(rodeurAvec(7, 'chasseur'))
      .filter((d) => d.key === 'hunterPrey' || d.key === 'hunterDefense');
    expect(duChasseur).toHaveLength(2);
    for (const decision of duChasseur) {
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

  it('un autre archétype n’a aucune de ces décisions propres au Chasseur', () => {
    const clefs = decisionsDeClasse(rodeurAvec(7, 'bestial')).map((d) => d.key);
    expect(clefs).not.toContain('hunterPrey');
    expect(clefs).not.toContain('hunterDefense');
  });
});

describe('p. 123 — Charme d’outre-monde (Vagabond féerique 3) : une maîtrise de compétence liée au Charisme', () => {
  it('propose seulement les compétences de Charisme', () => {
    const decision = decisionsDeClasse(rodeurAvec(3, 'feerique')).find((d) => d.key === 'otherworldlyGlamourSkill')!;
    expect(decision).toBeDefined();
    expect(decision.options.map((o) => o.id).sort()).toEqual(['intimidation', 'persuasion', 'representation', 'tromperie']);
  });

  it('absente avant le niveau 3, et pour un autre archétype', () => {
    expect(decisionsDeClasse(rodeurAvec(2, 'feerique')).some((d) => d.key === 'otherworldlyGlamourSkill')).toBe(false);
    expect(decisionsDeClasse(rodeurAvec(3, 'chasseur')).some((d) => d.key === 'otherworldlyGlamourSkill')).toBe(false);
  });

  it('le choix ACCORDE vraiment la maîtrise — pas seulement enregistré dans les choix de classe', () => {
    const avant = rodeurAvec(3, 'feerique');
    expect(avant.skillProficiencies).not.toContain('persuasion');
    const apres = choisirDeClasse(avant, 'rodeur', 'otherworldlyGlamourSkill', 'persuasion');
    expect(apres.skillProficiencies).toContain('persuasion');
    expect(decisionsDeClasse(apres).find((d) => d.key === 'otherworldlyGlamourSkill')?.choisi).toBe('persuasion');
  });
});

describe('p. 120 — Maîtrise d’armes : deux armes possédées, rechoisies au repos long', () => {
  const arme = (id: string, name: string) => ({ id, name, qty: 1, catalogId: id });
  const rodeurArme = (armes: { id: string; name: string; qty: number; catalogId: string }[]) =>
    fiche(rodeur(3), { inventory: armes });

  it('propose seulement les armes possédées, jamais tout le catalogue', () => {
    const sheet = rodeurArme([arme('arccourt', 'Arc court'), arme('epeecourte', 'Épée courte')]);
    const decision = decisionsDeClasse(sheet).find((d) => d.key === 'weaponMasteries')!;
    expect(decision).toBeDefined();
    expect(decision.max).toBe(2);
    expect(decision.options.map((o) => o.id).sort()).toEqual(['arccourt', 'epeecourte']);
    expect(decision.rechoisissable).toBe('repos-long');
  });

  it('aucune arme possédée : pas de décision du tout', () => {
    const sheet = rodeurArme([]);
    expect(decisionsDeClasse(sheet).some((d) => d.key === 'weaponMasteries')).toBe(false);
  });

  it('le choix se pose, se relit, et se limite au nombre autorisé', () => {
    let sheet = rodeurArme([arme('arccourt', 'Arc court'), arme('epeecourte', 'Épée courte'), arme('dague', 'Dague')]);
    sheet = choisirDeClasse(sheet, 'rodeur', 'weaponMasteries', 'arccourt');
    sheet = choisirDeClasse(sheet, 'rodeur', 'weaponMasteries', 'epeecourte');
    expect(decisionsDeClasse(sheet).find((d) => d.key === 'weaponMasteries')?.choisis).toEqual(['arccourt', 'epeecourte']);

    // Une troisième arme, au-delà du plafond, est refusée sans écraser les deux déjà prises.
    const troisieme = choisirDeClasse(sheet, 'rodeur', 'weaponMasteries', 'dague');
    expect(decisionsDeClasse(troisieme).find((d) => d.key === 'weaponMasteries')?.choisis).toEqual(['arccourt', 'epeecourte']);

    // Reprendre une arme déjà choisie la retire — c'est un choix rechoisissable, pas verrouillé.
    const retiree = choisirDeClasse(sheet, 'rodeur', 'weaponMasteries', 'arccourt');
    expect(decisionsDeClasse(retiree).find((d) => d.key === 'weaponMasteries')?.choisis).toEqual(['epeecourte']);
  });

  it('seule l’arme choisie applique sa maîtrise en combat — pas les autres armes possédées', () => {
    let sheet = rodeurArme([arme('arccourt', 'Arc court'), arme('epeecourte', 'Épée courte')]);
    sheet = choisirDeClasse(sheet, 'rodeur', 'weaponMasteries', 'epeecourte');
    sheet = { ...sheet, equippedWeaponId: 'epeecourte' };
    const derived = deriveCharacter(sheet);
    const attaques = weaponCardsFromCharacter(sheet, derived);
    const epee = attaques.find((c) => c.id === 'arme-epeecourte');
    expect(epee?.detail).toContain('maîtrise');

    sheet = { ...sheet, equippedWeaponId: 'arccourt' };
    const derived2 = deriveCharacter(sheet);
    const arc = weaponCardsFromCharacter(sheet, derived2).find((c) => c.id === 'arme-arccourt');
    expect(arc?.detail).not.toContain('maîtrise');
  });

  it('un repos long ouvre le choix, un repos court le reverrouille jusqu’au suivant', () => {
    let sheet = rodeurArme([arme('arccourt', 'Arc court'), arme('epeecourte', 'Épée courte')]);
    sheet = choisirDeClasse(sheet, 'rodeur', 'weaponMasteries', 'arccourt');

    // Fraîchement choisi, sans avoir reposé : encore ouvert.
    expect(decisionsDeClasse(sheet).find((d) => d.key === 'weaponMasteries')?.verrouillee).toBeFalsy();

    const { sheet: apresReposCourt } = shortRest(sheet, deriveCharacter(sheet));
    expect(decisionsDeClasse(apresReposCourt).find((d) => d.key === 'weaponMasteries')?.verrouillee).toBe(true);

    // Verrouillé : le joueur ne peut plus changer son choix.
    const tentative = choisirDeClasse(apresReposCourt, 'rodeur', 'weaponMasteries', 'epeecourte');
    expect(decisionsDeClasse(tentative).find((d) => d.key === 'weaponMasteries')?.choisis).toEqual(['arccourt']);

    // Le MJ, lui, peut corriger.
    const correction = choisirDeClasse(apresReposCourt, 'rodeur', 'weaponMasteries', 'epeecourte', { parLeMj: true });
    expect(decisionsDeClasse(correction).find((d) => d.key === 'weaponMasteries')?.choisis).toEqual(['arccourt', 'epeecourte']);

    // Le prochain repos long rouvre le choix.
    const { sheet: apresReposLong } = longRest(apresReposCourt, deriveCharacter(apresReposCourt));
    expect(decisionsDeClasse(apresReposLong).find((d) => d.key === 'weaponMasteries')?.verrouillee).toBeFalsy();
    const rechoisi = choisirDeClasse(apresReposLong, 'rodeur', 'weaponMasteries', 'epeecourte');
    expect(decisionsDeClasse(rechoisi).find((d) => d.key === 'weaponMasteries')?.choisis).toEqual(['arccourt', 'epeecourte']);
  });

  it('un repos long signale la Maîtrise d’armes à choisir — jamais pour une classe qui n’y a pas droit', () => {
    const sheet = rodeurArme([arme('arccourt', 'Arc court')]);
    const { recovered } = longRest(sheet, deriveCharacter(sheet));
    expect(recovered).toContain('Maîtrise d’armes à choisir');

    const mage = fiche([{ classId: 'magicien', level: 3, subclass: null, subclassId: null }]);
    const { recovered: recoveredMage } = longRest(mage, deriveCharacter(mage));
    expect(recoveredMage).not.toContain('Maîtrise d’armes à choisir');
  });
});

describe('p. 121 — Explorateur agile : expertise sur une compétence déjà maîtrisée', () => {
  const rodeurMaitrise = (level: number, skills: string[]): CharacterSheet =>
    fiche([{ classId: 'rodeur', level, subclass: 'Chasseur', subclassId: 'chasseur' }], { skillProficiencies: skills });

  it('absente avant le niveau 2', () => {
    const clefs = decisionsDeClasse(rodeurMaitrise(1, ['survie'])).map((d) => d.key);
    expect(clefs).not.toContain('deftExplorerSkill');
  });

  it('ne propose que des compétences déjà maîtrisées — fond de personnage compris', () => {
    // Le fond « Sage » de la fixture ajoute Arcanes et Histoire à ce que le
    // joueur a choisi : l'expertise porte sur toute compétence maîtrisée,
    // pas seulement celles cochées à la classe.
    const decision = decisionsDeClasse(rodeurMaitrise(2, ['survie', 'discretion']))
      .find((d) => d.key === 'deftExplorerSkill')!;
    expect(decision.options.map((o) => o.id).sort()).toEqual(['arcanes', 'discretion', 'histoire', 'survie']);
  });

  it('le choix double le bonus de maîtrise sur cette compétence', () => {
    const sheet = choisirDeClasse(rodeurMaitrise(2, ['survie']), 'rodeur', 'deftExplorerSkill', 'survie');
    const derived = deriveCharacter(sheet);
    const survie = derived.skills.find((s) => s.id === 'survie')!;
    expect(survie.expertise).toBe(true);
    expect(survie.bonus).toBe(derived.modifiers.wis + derived.proficiencyBonus * 2);
  });

  it('verrouillée une fois prise, comme l’Ordre primordial', () => {
    const sheet = choisirDeClasse(rodeurMaitrise(2, ['survie']), 'rodeur', 'deftExplorerSkill', 'survie');
    const decision = decisionsDeClasse(sheet).find((d) => d.key === 'deftExplorerSkill')!;
    expect(decision.verrouillee).toBe(true);
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

// ═══════════════════════════════════════════════════════════════════════
// OCCULTISTE — CHAPITRE COMPLET (PHB 2024, p. 152 à 163)
// ═══════════════════════════════════════════════════════════════════════

const occPatron = (level: number, patron: 'archifee' | 'celeste' | 'fielon' | 'grand-ancien'): CharacterSheet => {
  const nom = {
    archifee: 'Patron Archifée', celeste: 'Patron Céleste',
    fielon: 'Patron Fiélon', 'grand-ancien': 'Patron Grand Ancien',
  }[patron];
  return {
    ...occ(level),
    classLevels: [{ classId: 'occultiste', level, subclass: nom, subclassId: patron }],
  };
};

describe('p. 154 — table de l’Occultiste', () => {
  it.each([[1, 1], [2, 3], [5, 5], [7, 6], [9, 7], [12, 8], [15, 9], [18, 10], [20, 10]])(
    'Occultiste %i → %i invocations', (niveau, attendues) => {
      expect(invocationsDues(occ(niveau))).toBe(attendues);
    },
  );

  it.each([[1, 1], [2, 2], [10, 2], [11, 3], [16, 3], [17, 4], [20, 4]])(
    'Occultiste %i → %i emplacements de pacte', (niveau, attendus) => {
      expect(pacteMax(occ(niveau))).toBe(attendus);
    },
  );

  it.each([[1, 1], [3, 2], [5, 3], [7, 4], [9, 5], [20, 5]])(
    'Occultiste %i → emplacements de rang %i', (niveau, rang) => {
      expect(deriveCharacter(occ(niveau)).spellcasting.slots.find((s) => s.pact)?.level).toBe(rang);
    },
  );

  it.each([[1, 2], [2, 3], [9, 10], [10, 10], [11, 11], [19, 15], [20, 15]])(
    'Occultiste %i → %i sorts préparés', (niveau, attendus) => {
      expect(deriveCharacter(occ(niveau)).spellcasting.preparedMax.occultiste).toBe(attendus);
    },
  );
});

describe('p. 155 — Contact du patron : le lancement gratuit se compte', () => {
  it('le sort est toujours préparé au niveau 9, avec un lancement par repos long', () => {
    expect(deriveCharacter(occ(8)).resources.some((r) => r.key === 'occultiste:contact-patron')).toBe(false);
    const neuf = deriveCharacter(occ(9));
    expect(neuf.spellcasting.alwaysPrepared).toContain('contact-autre-plan');
    expect(neuf.resources.find((r) => r.key === 'occultiste:contact-patron'))
      .toMatchObject({ max: 1, recharge: 'long' });
  });
});

describe('p. 155-157 — les 28 invocations et leurs prérequis', () => {
  it('le catalogue en compte exactement 28', () => {
    expect(ELDRITCH_INVOCATIONS).toHaveLength(28);
  });

  it.each([
    ['agonizing-blast', 2], ['armor-of-shadows', 1], ['ascendant-step', 5], ['devils-sight', 2],
    ['devouring-blade', 12], ['eldritch-mind', 1], ['eldritch-smite', 5], ['eldritch-spear', 2],
    ['fiendish-vigor', 2], ['gaze-of-two-minds', 5], ['gift-of-the-depths', 5],
    ['gift-of-the-protectors', 9], ['investment-chain-master', 5], ['lessons-first-ones', 2],
    ['lifedrinker', 9], ['mask-many-faces', 2], ['master-myriad-forms', 5], ['misty-visions', 2],
    ['one-with-shadows', 5], ['otherworldly-leap', 2], ['pact-blade', 1], ['pact-chain', 1],
    ['pact-tome', 1], ['repelling-blast', 2], ['thirsting-blade', 5], ['visions-distant-realms', 9],
    ['whispers-grave', 7], ['witch-sight', 15],
  ])('%s exige le niveau %i', (id, niveau) => {
    expect(ELDRITCH_INVOCATIONS.find((i) => i.id === id)?.minLevel).toBe(niveau);
  });

  it.each([
    ['devouring-blade', 'thirsting-blade'], ['eldritch-smite', 'pact-blade'],
    ['gift-of-the-protectors', 'pact-tome'], ['investment-chain-master', 'pact-chain'],
    ['lifedrinker', 'pact-blade'], ['thirsting-blade', 'pact-blade'],
  ])('%s exige %s', (id, prerequis) => {
    expect(ELDRITCH_INVOCATIONS.find((i) => i.id === id)?.requires).toBe(prerequis);
  });

  it('les autres n’ont aucun prérequis d’invocation', () => {
    const avecPrerequis = ELDRITCH_INVOCATIONS.filter((i) => i.requires).map((i) => i.id);
    expect(avecPrerequis).toEqual([
      'devouring-blade', 'eldritch-smite', 'gift-of-the-protectors',
      'investment-chain-master', 'lifedrinker', 'thirsting-blade',
    ]);
  });
});

describe('p. 159-163 — sorts de patron et réserves', () => {
  it.each([
    ['archifee', 3, ['apaisement', 'lueurs-feeriques', 'pas-brumeux', 'force-fantasmagorique', 'sommeil']],
    ['celeste', 3, ['aide', 'soins', 'trait-lumiere', 'restauration-partielle', 'lumiere', 'flamme-sacree']],
    ['fielon', 3, ['mains-brulantes', 'injonction', 'rayon-ardent', 'suggestion']],
    ['grand-ancien', 3, ['detection-pensees', 'murmures-dissonants', 'force-fantasmagorique', 'rire-hideux']],
  ] as const)('%s au niveau %i a ses sorts de patron préparés', (patron, niveau, attendus) => {
    const accordes = deriveCharacter(occPatron(niveau, patron)).spellcasting.alwaysPrepared;
    for (const id of attendus) expect(accordes).toContain(id);
  });

  it('Maléfice est toujours préparé pour le Grand Ancien au niveau 10', () => {
    expect(deriveCharacter(occPatron(9, 'grand-ancien')).spellcasting.alwaysPrepared).not.toContain('malefice');
    expect(deriveCharacter(occPatron(10, 'grand-ancien')).spellcasting.alwaysPrepared).toContain('malefice');
  });

  it('Défenses enjôleuses : Archifée 10, une fois par repos long', () => {
    expect(deriveCharacter(occPatron(9, 'archifee')).resources.some((r) => r.key === 'occultiste:defenses-enjoleuses')).toBe(false);
    expect(deriveCharacter(occPatron(10, 'archifee')).resources.find((r) => r.key === 'occultiste:defenses-enjoleuses'))
      .toMatchObject({ max: 1, recharge: 'long' });
  });

  it('Vengeance brûlante : Céleste 14 ; Précipiter dans les Enfers : Fiélon 14', () => {
    expect(deriveCharacter(occPatron(14, 'celeste')).resources.find((r) => r.key === 'occultiste:vengeance-brulante'))
      .toMatchObject({ max: 1, recharge: 'long' });
    expect(deriveCharacter(occPatron(14, 'fielon')).resources.find((r) => r.key === 'occultiste:precipiter-enfers'))
      .toMatchObject({ max: 1, recharge: 'long' });
    expect(deriveCharacter(occPatron(13, 'fielon')).resources.some((r) => r.key === 'occultiste:precipiter-enfers')).toBe(false);
  });

  it('Combattant clairvoyant revient au repos COURT, contrairement aux autres', () => {
    expect(deriveCharacter(occPatron(6, 'grand-ancien')).resources.find((r) => r.key === 'occultiste:combattant-clairvoyant'))
      .toMatchObject({ recharge: 'court' });
  });

  it('Chance du Ténébreux : Fiélon 6, Charisme fois, repos long', () => {
    // La fiche `occ` a 18 en Charisme, soit +4.
    expect(deriveCharacter(occPatron(6, 'fielon')).resources.find((r) => r.key === 'occultiste:chance-tenebreux'))
      .toMatchObject({ max: 4, recharge: 'long' });
  });

  it('Pas des fées : Archifée 3, Charisme fois, repos long', () => {
    expect(deriveCharacter(occPatron(3, 'archifee')).resources.find((r) => r.key === 'occultiste:pas-des-fees'))
      .toMatchObject({ max: 4, recharge: 'long' });
  });
});

describe('p. 161 — Résilience fiélonne : un type de dégâts rechoisi à chaque repos', () => {
  it('la décision apparaît au niveau 10 du Fiélon seulement', () => {
    expect(decisionsDeClasse(occPatron(9, 'fielon')).some((d) => d.key === 'fiendishResilience')).toBe(false);
    expect(decisionsDeClasse(occPatron(10, 'celeste')).some((d) => d.key === 'fiendishResilience')).toBe(false);
    const decision = decisionsDeClasse(occPatron(10, 'fielon')).find((d) => d.key === 'fiendishResilience');
    expect(decision?.rechoisissable).toBe('repos');
  });

  it('la force n’est pas proposée', () => {
    const decision = decisionsDeClasse(occPatron(10, 'fielon')).find((d) => d.key === 'fiendishResilience')!;
    expect(decision.options).toHaveLength(12);
    expect(decision.options.map((o) => o.id)).not.toContain('force');
  });

  it('le choix s’enregistre', () => {
    const apres = choisirDeClasse(occPatron(10, 'fielon'), 'occultiste', 'fiendishResilience', 'feu');
    expect(decisionsDeClasse(apres).find((d) => d.key === 'fiendishResilience')?.choisi).toBe('feu');
  });
});

describe('p. 80 — l’Ordre primordial se choisit une fois, et son effet se voit', () => {
  const druide1 = fiche(druide(1));

  it('tant qu’il n’est pas pris, il n’est pas verrouillé', () => {
    const decision = decisionsDeClasse(druide1).find((d) => d.key === 'primalOrder')!;
    expect(decision.verrouillee).toBeUndefined();
    expect(decision.options).toHaveLength(2);
  });

  it('une fois pris, il se verrouille et ne rebascule plus', () => {
    const mage = choisirDeClasse(druide1, 'druide', 'primalOrder', 'mage');
    expect(decisionsDeClasse(mage).find((d) => d.key === 'primalOrder')?.verrouillee).toBe(true);
    // Le joueur ne peut plus passer Gardien.
    expect(choisirDeClasse(mage, 'druide', 'primalOrder', 'gardien')).toBe(mage);
    // Le MJ, lui, corrige.
    const corrige = choisirDeClasse(mage, 'druide', 'primalOrder', 'gardien', { parLeMj: true });
    expect(decisionsDeClasse(corrige).find((d) => d.key === 'primalOrder')?.choisi).toBe('gardien');
  });

  it('le basculement libre laissait la fiche hors quota', () => {
    // Un Druide 1 Mage connaît 3 sorts mineurs ; Gardien n'en autorise que 2.
    const mage = choisirDeClasse(druide1, 'druide', 'primalOrder', 'mage');
    const avecTrois: CharacterSheet = {
      ...mage,
      cantrips: [
        { id: 'gourdin-magique', sourceClass: 'druide' },
        { id: 'flamme-eternelle', sourceClass: 'druide' },
        { id: 'assistance', sourceClass: 'druide' },
      ],
    };
    expect(deriveCharacter(avecTrois).spellcasting.cantripsKnown.druide).toBe(3);
    expect(choisirDeClasse(avecTrois, 'druide', 'primalOrder', 'gardien')).toBe(avecTrois);
  });

  it('une décision rechoisissable, elle, ne se verrouille jamais', () => {
    const terre = choisirDeClasse(druideAvec(5, 'terre'), 'druide', 'terrain', 'aride');
    expect(decisionsDeClasse(terre).find((d) => d.key === 'terrain')?.verrouillee).toBeUndefined();
    const change = choisirDeClasse(terre, 'druide', 'terrain', 'polaire');
    expect(decisionsDeClasse(change).find((d) => d.key === 'terrain')?.choisi).toBe('polaire');
  });

  it('l’effet dit où en est le quota de sorts mineurs', () => {
    const mage = choisirDeClasse(druide1, 'druide', 'primalOrder', 'mage');
    const effetSansSort = decisionsDeClasse(mage, deriveCharacter(mage))
      .find((d) => d.key === 'primalOrder')?.effet;
    expect(effetSansSort).toMatch(/0\/3/);
    expect(effetSansSort).toMatch(/reste 3/);

    const complet: CharacterSheet = {
      ...mage,
      cantrips: [
        { id: 'gourdin-magique', sourceClass: 'druide' },
        { id: 'flamme-eternelle', sourceClass: 'druide' },
        { id: 'assistance', sourceClass: 'druide' },
      ],
    };
    const effetPlein = decisionsDeClasse(complet, deriveCharacter(complet))
      .find((d) => d.key === 'primalOrder')?.effet;
    expect(effetPlein).toMatch(/3\/3/);
    expect(effetPlein).toMatch(/déjà choisi/);
  });

  it('le Gardien dit ce qu’il donne, lui aussi', () => {
    const gardien = choisirDeClasse(druide1, 'druide', 'primalOrder', 'gardien');
    expect(decisionsDeClasse(gardien, deriveCharacter(gardien)).find((d) => d.key === 'primalOrder')?.effet)
      .toMatch(/armures intermédiaires/i);
  });
});

describe('p. 80 — le Grimoire nomme le sort mineur que l’Ordre primordial paie', () => {
  const troisMineurs = [
    { id: 'epargner-mourants', sourceClass: 'druide' },
    { id: 'assistance', sourceClass: 'druide' },
    { id: 'coup-tonnerre', sourceClass: 'druide' },
  ];

  /** Un Druide 2 · Mage, dans l’état d’une fiche importée de l’ancienne app. */
  const importe = (choix: Record<string, string>): CharacterSheet => ({
    ...fiche(druide(2)),
    classChoices: { druide: choix },
    cantrips: troisMineurs,
  });

  it('la clé de l’ancienne application désigne le sort, et elle est relue', () => {
    const sheet = importe({ primalOrder: 'mage', primalOrderCantrip: 'assistance' });
    expect(cantripDeLOrdrePrimordial(sheet)).toBe('assistance');
    const ligne = cantripChoices(sheet, deriveCharacter(sheet), 'druide')
      .find((entry) => entry.spell.id === 'assistance');
    expect(ligne?.origine).toBe('Ordre primordial · Mage');
    expect(ligne?.state.kind).toBe('prepare');
  });

  it('les deux autres sorts mineurs ne portent aucune origine', () => {
    const sheet = importe({ primalOrder: 'mage', primalOrderCantrip: 'assistance' });
    const choix = cantripChoices(sheet, deriveCharacter(sheet), 'druide');
    for (const id of ['epargner-mourants', 'coup-tonnerre']) {
      expect(choix.find((entry) => entry.spell.id === id)?.origine).toBeUndefined();
    }
  });

  it('sans la clé, c’est le premier sort appris au-delà du quota de la table', () => {
    // Un Druide 2 a droit à 2 sorts mineurs ; le troisième vient du Mage.
    const sheet = importe({ primalOrder: 'mage' });
    expect(cantripDeLOrdrePrimordial(sheet)).toBe('coup-tonnerre');
  });

  it('un Gardien n’a aucun sort à désigner', () => {
    expect(cantripDeLOrdrePrimordial(importe({ primalOrder: 'gardien' }))).toBeNull();
  });

  it('un Mage qui n’a pas rempli son quota de base non plus', () => {
    const deuxSeulement: CharacterSheet = {
      ...fiche(druide(2)),
      classChoices: { druide: { primalOrder: 'mage' } },
      cantrips: troisMineurs.slice(0, 2),
    };
    expect(cantripDeLOrdrePrimordial(deuxSeulement)).toBeNull();
  });

  it('le compteur annonce la composition du quota', () => {
    const mage = importe({ primalOrder: 'mage' });
    expect(cantripBudget(mage, deriveCharacter(mage))[0])
      .toMatchObject({ known: 3, max: 3, bonus: { de: 'Ordre primordial', nombre: 1 } });

    const gardien = importe({ primalOrder: 'gardien' });
    expect(cantripBudget(gardien, deriveCharacter(gardien))[0].bonus).toBeUndefined();
  });

  it('ce sort reste dans le quota et reste retirable — ce n’est pas un sort accordé', () => {
    const sheet = importe({ primalOrder: 'mage', primalOrderCantrip: 'assistance' });
    const ligne = cantripChoices(sheet, deriveCharacter(sheet), 'druide')
      .find((entry) => entry.spell.id === 'assistance')!;
    // `accorde` voudrait dire hors budget et non retirable : ce n'est pas le cas.
    expect(ligne.state.kind).not.toBe('accorde');
    expect(cantripBudget(sheet, deriveCharacter(sheet))[0].free).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// GLOSSAIRE DES RÈGLES (PHB 2024, appendice C, p. 359 à 376)
// ═══════════════════════════════════════════════════════════════════════

describe('p. 365 — Épuisement : la pénalité s’applique enfin', () => {
  const avecEpuisement = (crans: number): CharacterSheet => {
    const base = fiche(druide(5));
    return { ...base, live: { ...base.live, exhaustion: crans } };
  };

  it.each([[0, 0], [1, 2], [3, 6], [5, 10]])(
    '%i cran(s) → −%i à tous les tests d20', (crans, malus) => {
      expect(deriveCharacter(avecEpuisement(crans)).exhaustion.d20Penalty).toBe(malus);
    },
  );

  it('les compétences portent la pénalité', () => {
    const sain = deriveCharacter(avecEpuisement(0));
    const epuise = deriveCharacter(avecEpuisement(2));
    for (const competence of sain.skills) {
      const meme = epuise.skills.find((s) => s.id === competence.id)!;
      expect(meme.bonus).toBe(competence.bonus - 4);
    }
  });

  it('la vitesse perd 1,50 m par cran', () => {
    expect(deriveCharacter(avecEpuisement(2)).exhaustion.speedPenaltyMeters).toBe(3);
    expect(deriveCharacter(avecEpuisement(4)).exhaustion.speedPenaltyMeters).toBe(6);
  });

  it('le sixième cran est mortel, le cinquième non', () => {
    expect(deriveCharacter(avecEpuisement(5)).exhaustion.fatal).toBe(false);
    expect(deriveCharacter(avecEpuisement(6)).exhaustion.fatal).toBe(true);
  });

  it('la pénalité ne touche PAS les modificateurs de caractéristique', () => {
    // Elle frappe les tests d20, pas les dégâts ni le DD des sorts.
    const sain = deriveCharacter(avecEpuisement(0));
    const epuise = deriveCharacter(avecEpuisement(3));
    expect(epuise.modifiers).toEqual(sain.modifiers);
    expect(epuise.spellcasting.numbers).toEqual(sain.spellcasting.numbers);
    expect(epuise.armorClass).toBe(sain.armorClass);
  });

  it('un repos long en retire un cran, et la pénalité suit', () => {
    const avant = avecEpuisement(3);
    expect(deriveCharacter(avant).exhaustion.d20Penalty).toBe(6);
    const { sheet } = longRest(avant, deriveCharacter(avant));
    expect(deriveCharacter(sheet).exhaustion.d20Penalty).toBe(4);
  });
});

describe('p. 360-376 — les 14 états, vérifiés un par un', () => {
  it('le catalogue en compte exactement 14, l’Épuisement étant compté à part', () => {
    expect(Object.keys(CONDITIONS)).toHaveLength(14);
  });

  it.each([
    ['aveugle', { attack: 'dis', incoming: 'adv' }],
    ['empoisonne', { attack: 'dis', check: 'dis' }],
    ['entrave', { attack: 'dis', incoming: 'adv', speed0: true }],
    ['agrippe', { speed0: true }],
    ['paralyse', { incoming: 'adv', incapacitated: true, speed0: true }],
    ['etourdi', { incoming: 'adv', incapacitated: true }],
    ['inconscient', { incoming: 'adv', incapacitated: true, speed0: true, prone: true }],
    ['petrifie', { incoming: 'adv', incapacitated: true, speed0: true, resistAll: true }],
  ] as const)('%s porte les effets du glossaire', (id, attendu) => {
    expect(CONDITIONS[id]).toMatchObject(attendu);
  });

  it('Étourdi ne réduit PAS la vitesse à 0 — c’était la règle de 2014', () => {
    expect(CONDITIONS.etourdi.speed0).toBeUndefined();
  });

  it('Entravé et Agrippé mettent tous deux la vitesse à 0', () => {
    // `speed0` manquait sur Entravé : le champ structuré disait le contraire
    // de la note juste à côté.
    expect(CONDITIONS.entrave.speed0).toBe(true);
    expect(CONDITIONS.agrippe.speed0).toBe(true);
  });

  it('les quatre états qui ratent d’office les sauvegardes de Force et Dextérité', () => {
    const auto = Object.entries(CONDITIONS)
      .filter(([, effet]) => effet.autoFail?.includes('str') && effet.autoFail?.includes('dex'))
      .map(([id]) => id)
      .sort();
    expect(auto).toEqual(['etourdi', 'inconscient', 'paralyse', 'petrifie']);
  });

  it('Effrayé et Agrippé gardent leur effet conditionnel hors des champs structurés', () => {
    // Le désavantage d'Effrayé ne vaut que si la source est en vue ; celui
    // d'Agrippé, que contre une autre cible que l'agrippeur. Les poser dans
    // `attack` les appliquerait à tort.
    expect(CONDITIONS.effraye.attack).toBeUndefined();
    expect(CONDITIONS.agrippe.attack).toBeUndefined();
    expect(CONDITIONS.effraye.note).toMatch(/en vue/i);
    expect(CONDITIONS.agrippe.note).toMatch(/autre cible/i);
  });
});

describe('p. 85 — Récupération naturelle : deux effets, une fois chacun par repos long', () => {
  const terre = (level: number, depenses: Record<number, number> = {}) => {
    const base = druideAvec(level, 'terre', { terrain: 'temperee' });
    return { ...base, live: { ...base.live, spellSlotsSpent: depenses } };
  };

  it('le budget vaut la moitié du niveau, arrondie au supérieur', () => {
    expect(budgetRecuperationNaturelle(terre(6))).toBe(3);
    expect(budgetRecuperationNaturelle(terre(9))).toBe(5);
    expect(budgetRecuperationNaturelle(terre(20))).toBe(10);
  });

  it('rien avant le niveau 6, ni pour un autre cercle', () => {
    expect(budgetRecuperationNaturelle(terre(5))).toBe(0);
    expect(budgetRecuperationNaturelle(druideAvec(6, 'lune'))).toBe(0);
  });

  it('les trois répartitions de l’exemple du livre sont toutes légales', () => {
    // « Si tu es un Druide de niveau 6, tu peux récupérer jusqu'à trois
    // niveaux : un rang 3, ou un rang 2 et un rang 1, ou trois rangs 1. »
    const sheet = terre(6, { 1: 3, 2: 1, 3: 1 });
    const derivee = deriveCharacter(sheet);
    for (const choix of [{ 3: 1 }, { 2: 1, 1: 1 }, { 1: 3 }]) {
      expect(blocagesRecuperationNaturelle(sheet, derivee, choix)).toEqual([]);
    }
  });

  it('quatre niveaux dépassent le budget d’un Druide 6', () => {
    const sheet = terre(6, { 1: 4, 2: 2 });
    const blocages = blocagesRecuperationNaturelle(sheet, deriveCharacter(sheet), { 2: 2 });
    expect(blocages[0]).toMatch(/4 niveaux choisis pour un budget de 3/);
  });

  it('le rang 6 et au-delà sont exclus', () => {
    const sheet = terre(20, { 6: 1 });
    expect(blocagesRecuperationNaturelle(sheet, deriveCharacter(sheet), { 6: 1 })[0])
      .toMatch(/rang 6 ne peut pas être récupéré/i);
  });

  it('on ne récupère pas plus que ce qui a été dépensé', () => {
    const sheet = terre(9, { 1: 1 });
    expect(blocagesRecuperationNaturelle(sheet, deriveCharacter(sheet), { 1: 2 })[0])
      .toMatch(/2 demandé\(s\) pour 1 dépensé\(s\)/);
  });

  it('la récupération rend bien les emplacements et se marque comme utilisée', () => {
    const sheet = terre(6, { 1: 2, 2: 1 });
    const apres = recuperationNaturelle(sheet, deriveCharacter(sheet), { 1: 1, 2: 1 });
    expect(apres.live.spellSlotsSpent).toEqual({ 1: 1 });
    expect(apres.live.resourcesSpent[RECUPERATION_NATURELLE_KEY]).toBe(1);
  });

  it('une seule fois avant un repos long', () => {
    const sheet = terre(9, { 1: 3 });
    const apres = recuperationNaturelle(sheet, deriveCharacter(sheet), { 1: 1 });
    expect(blocagesRecuperationNaturelle(apres, deriveCharacter(apres), { 1: 1 })[0])
      .toMatch(/Déjà utilisée/i);
    // …et le repos long la rend.
    const { sheet: repose } = longRest(apres, deriveCharacter(apres));
    expect(repose.live.resourcesSpent[RECUPERATION_NATURELLE_KEY]).toBeUndefined();
  });

  it('les deux réserves sont déclarées au niveau 6', () => {
    const cinq = deriveCharacter(druideAvec(5, 'terre'));
    expect(cinq.resources.some((r) => r.key === RECUPERATION_NATURELLE_KEY)).toBe(false);
    const six = deriveCharacter(druideAvec(6, 'terre'));
    expect(six.resources.find((r) => r.key === RECUPERATION_NATURELLE_KEY))
      .toMatchObject({ max: 1, recharge: 'long' });
    expect(six.resources.find((r) => r.key === SORT_DE_CERCLE_GRATUIT_KEY))
      .toMatchObject({ max: 1, recharge: 'long' });
  });

  it('un sort de cercle se lance sans emplacement — mais pas les autres sorts accordés', () => {
    const sheet = druideAvec(6, 'terre', { terrain: 'temperee' });
    const derivee = deriveCharacter(sheet);

    // Éclair est un sort du terrain tempéré au niveau 5.
    const cercle = paiementsPourSort(spellById('eclair')!, derivee, sheet);
    expect(cercle[0]).toMatchObject({ key: SORT_DE_CERCLE_GRATUIT_KEY, max: 1 });

    // Parler aux animaux est toujours préparé, mais par Druidique — pas par
    // la capacité Sorts du cercle. Il ne bénéficie pas du lancement gratuit.
    const autre = paiementsPourSort(spellById('parler-animaux')!, derivee, sheet);
    expect(autre.some((p) => p.key === SORT_DE_CERCLE_GRATUIT_KEY)).toBe(false);
  });

  it('sans terrain choisi, aucun sort n’est un sort de cercle', () => {
    const sansTerrain = druideAvec(6, 'terre');
    expect(sortDuCercleDeLaTerre(sansTerrain, 'eclair')).toBe(false);
  });
});
