import { levelInClass, type CharacterSheet } from './character';
import { druidLevel, WILD_SHAPE_RESOURCE_KEY } from './wild-shape';
import type { DerivedCharacter } from './derive';

/**
 * Les capacités du Druide qui déplacent des ressources.
 *
 * Elles vivent ici, et non dans `src/domain`, parce qu'elles doivent agir sur
 * une VRAIE `CharacterSheet` : les fonctions du domaine bâties sur l'ancienne
 * forme (`resources[].current`, `hpTemp`) ne touchent jamais la fiche jouée.
 *
 * Règles PHB 2024 fournies par l'utilisateur — seule source autorisée, le PDF
 * n'étant pas accessible à cet environnement.
 */

/** Utilisations de Forme sauvage restantes, lues sur la fiche réelle. */
const formesRestantes = (derived: DerivedCharacter): number =>
  derived.resources.find((entry) => entry.key === WILD_SHAPE_RESOURCE_KEY)?.remaining ?? 0;

/** Le plus bas emplacement encore disponible, hors pacte — celui qu'on dépense en premier. */
const emplacementDisponible = (derived: DerivedCharacter): number | null =>
  derived.spellcasting.slots.find((slot) => !slot.pact && slot.remaining > 0)?.level ?? null;

const depenserEmplacement = (sheet: CharacterSheet, rang: number): CharacterSheet => ({
  ...sheet,
  live: {
    ...sheet.live,
    spellSlotsSpent: {
      ...sheet.live.spellSlotsSpent,
      [rang]: (sheet.live.spellSlotsSpent[rang] ?? 0) + 1,
    },
  },
});

const depenserFormeSauvage = (sheet: CharacterSheet): CharacterSheet => ({
  ...sheet,
  live: {
    ...sheet.live,
    resourcesSpent: {
      ...sheet.live.resourcesSpent,
      [WILD_SHAPE_RESOURCE_KEY]: (sheet.live.resourcesSpent[WILD_SHAPE_RESOURCE_KEY] ?? 0) + 1,
    },
  },
});

const rendreFormeSauvage = (sheet: CharacterSheet): CharacterSheet => {
  const dues = sheet.live.resourcesSpent[WILD_SHAPE_RESOURCE_KEY] ?? 0;
  if (dues <= 0) return sheet;
  const resourcesSpent = { ...sheet.live.resourcesSpent };
  if (dues === 1) delete resourcesSpent[WILD_SHAPE_RESOURCE_KEY];
  else resourcesSpent[WILD_SHAPE_RESOURCE_KEY] = dues - 1;
  return { ...sheet, live: { ...sheet.live, resourcesSpent } };
};

// ═══════════════════════════════════════════════════════════════════════
// §6 — COMPAGNON SAUVAGE (Druide 2)
// ═══════════════════════════════════════════════════════════════════════

/** Ce qui peut payer un Compagnon sauvage : au choix du Druide, jamais gratuit. */
export type PaiementCompagnon = 'emplacement' | 'forme-sauvage';

export interface PaiementsPossibles {
  emplacement: boolean;
  formeSauvage: boolean;
}

/**
 * Compagnon sauvage, Action Magie : le Druide dépense AU CHOIX un emplacement
 * de sort OU une utilisation de Forme sauvage, puis lance Trouver un familier
 * sans composante matérielle. Le familier est de type Fée et disparaît quand
 * le Druide termine un repos long.
 *
 * Rien ici ne doit pouvoir être obtenu gratuitement : c'est précisément ce que
 * le système de compagnons permettait.
 */
export function paiementsCompagnonSauvage(derived: DerivedCharacter): PaiementsPossibles {
  return {
    emplacement: emplacementDisponible(derived) !== null,
    formeSauvage: formesRestantes(derived) > 0,
  };
}

/**
 * Débite le coût choisi. Renvoie la fiche inchangée si le paiement demandé
 * n'est pas disponible — l'écran ne doit alors pas créer le familier.
 */
export function payerCompagnonSauvage(
  sheet: CharacterSheet,
  derived: DerivedCharacter,
  paiement: PaiementCompagnon,
): CharacterSheet {
  if (paiement === 'forme-sauvage') {
    return formesRestantes(derived) > 0 ? depenserFormeSauvage(sheet) : sheet;
  }
  const rang = emplacementDisponible(derived);
  return rang === null ? sheet : depenserEmplacement(sheet, rang);
}

// ═══════════════════════════════════════════════════════════════════════
// §7 — RÉSURGENCE SAUVAGE (Druide 5)
// ═══════════════════════════════════════════════════════════════════════

/** Clé de la conversion Forme sauvage → emplacement, limitée à une fois par repos long. */
export const RESURGENCE_SLOT_KEY = 'druide:resurgence-emplacement';

/**
 * Effet 1 : lorsqu'il ne reste AUCUNE utilisation de Forme sauvage, le Druide
 * peut dépenser un emplacement de sort, sans action, pour en récupérer une.
 * Une fois au maximum pendant chacun de ses tours.
 *
 * S'il lui reste au moins une utilisation, la conversion n'est pas disponible
 * — c'est la condition que le code historique ignorait.
 *
 * `turnId` vient de `turnIdentity` : c'est ce qui distingue « déjà servi ce
 * tour-ci » de « déjà servi une fois ».
 */
export function peutConvertirEmplacementEnForme(
  sheet: CharacterSheet,
  derived: DerivedCharacter,
  turnId: string,
): boolean {
  if (levelInClass(sheet, 'druide') < 5) return false;
  if (formesRestantes(derived) > 0) return false;
  if (emplacementDisponible(derived) === null) return false;
  return sheet.live.wildResurgenceTurn !== turnId;
}

export function convertirEmplacementEnForme(
  sheet: CharacterSheet,
  derived: DerivedCharacter,
  turnId: string,
): CharacterSheet {
  if (!peutConvertirEmplacementEnForme(sheet, derived, turnId)) return sheet;
  const rang = emplacementDisponible(derived)!;
  const paye = depenserEmplacement(sheet, rang);
  const rendu = rendreFormeSauvage(paye);
  return { ...rendu, live: { ...rendu.live, wildResurgenceTurn: turnId } };
}

/**
 * Effet 2 : le Druide peut dépenser UNE utilisation de Forme sauvage, sans
 * action, pour récupérer un emplacement de sort de niveau 1. Après cet usage,
 * il doit terminer un repos long avant de recommencer.
 */
export function peutConvertirFormeEnEmplacement(
  sheet: CharacterSheet,
  derived: DerivedCharacter,
): boolean {
  if (levelInClass(sheet, 'druide') < 5) return false;
  if (formesRestantes(derived) <= 0) return false;
  if ((sheet.live.resourcesSpent[RESURGENCE_SLOT_KEY] ?? 0) > 0) return false;
  // Il faut un emplacement de rang 1 réellement dépensé à rendre.
  return (sheet.live.spellSlotsSpent[1] ?? 0) > 0;
}

export function convertirFormeEnEmplacement(
  sheet: CharacterSheet,
  derived: DerivedCharacter,
): CharacterSheet {
  if (!peutConvertirFormeEnEmplacement(sheet, derived)) return sheet;
  const paye = depenserFormeSauvage(sheet);
  const spellSlotsSpent = { ...paye.live.spellSlotsSpent };
  const dus = spellSlotsSpent[1] ?? 0;
  if (dus <= 1) delete spellSlotsSpent[1];
  else spellSlotsSpent[1] = dus - 1;
  return {
    ...paye,
    live: {
      ...paye.live,
      spellSlotsSpent,
      resourcesSpent: { ...paye.live.resourcesSpent, [RESURGENCE_SLOT_KEY]: 1 },
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════
// §8 — ARCHIDRUIDE (Druide 20)
// ═══════════════════════════════════════════════════════════════════════

/**
 * À chaque jet d'Initiative, un Druide de niveau 20 qui n'a plus aucune
 * utilisation de Forme sauvage en récupère une.
 *
 * Cette récupération appartient au NIVEAU 20, et à lui seul : l'attribuer à
 * Résurgence sauvage (niveau 5) donnait au Druide une réserve qui se
 * remplissait à chaque combat dès la mi-carrière.
 */
export function archidruideSurInitiative(
  sheet: CharacterSheet,
  derived: DerivedCharacter,
): CharacterSheet {
  if (levelInClass(sheet, 'druide') < 20) return sheet;
  if (formesRestantes(derived) > 0) return sheet;
  return rendreFormeSauvage(sheet);
}

// ═══════════════════════════════════════════════════════════════════════
// FORME SAUVAGE — DURÉE  (PHB 2024, p. 80)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Durée d'une Forme sauvage, en heures : la moitié du niveau de Druide.
 *
 * « You stay in that form for a number of hours equal to half your Druid
 * level. » Un Druide 2 ou 3 tient donc une heure : la règle ne descend pas
 * en dessous tant qu'on a accès à la capacité.
 */
export function dureeFormeSauvageHeures(sheet: CharacterSheet): number {
  const niveau = druidLevel(sheet);
  if (niveau < 2) return 0;
  return Math.max(1, Math.floor(niveau / 2));
}

// ═══════════════════════════════════════════════════════════════════════
// ARCHIDRUIDE — MAGICIEN DE LA NATURE  (niveau 20, PHB 2024, p. 82)
// ═══════════════════════════════════════════════════════════════════════

export const MAGICIEN_NATURE_KEY = 'druide:magicien-nature';

/**
 * Rang de l'emplacement obtenu en convertissant `utilisations` Formes
 * sauvages : deux niveaux de sort par utilisation, en UN SEUL emplacement.
 *
 * Distinct de l'effet 2 de Résurgence sauvage, qui rend un emplacement de
 * rang 1 pour une utilisation : ici deux utilisations donnent un rang 4, pas
 * deux rangs 2.
 */
export const rangMagicienNature = (utilisations: number): number =>
  Math.max(0, Math.floor(utilisations)) * 2;

/** Le plus haut nombre d'utilisations convertibles : celles qui restent, et pas au-delà du rang 9. */
export function conversionsMagicienNaturePossibles(sheet: CharacterSheet, derived: DerivedCharacter): number[] {
  if (druidLevel(sheet) < 20) return [];
  if ((sheet.live.resourcesSpent[MAGICIEN_NATURE_KEY] ?? 0) > 0) return [];
  const restantes = derived.resources.find((r) => r.key === WILD_SHAPE_RESOURCE_KEY)?.remaining ?? 0;
  const possibles: number[] = [];
  for (let n = 1; n <= restantes; n += 1) {
    if (rangMagicienNature(n) <= 9) possibles.push(n);
  }
  return possibles;
}

/**
 * Convertit des utilisations de Forme sauvage en un emplacement.
 *
 * L'emplacement obtenu est rendu en retirant une dépense sur ce rang. Un
 * Druide 20 n'a d'emplacements que jusqu'au rang 9 : convertir cinq
 * utilisations n'ouvre pas un rang 10, et la conversion est refusée.
 */
export function magicienDeLaNature(
  sheet: CharacterSheet,
  derived: DerivedCharacter,
  utilisations: number,
): CharacterSheet {
  if (!conversionsMagicienNaturePossibles(sheet, derived).includes(utilisations)) return sheet;
  const rang = rangMagicienNature(utilisations);
  const depensesRang = sheet.live.spellSlotsSpent[rang] ?? 0;
  return {
    ...sheet,
    live: {
      ...sheet.live,
      spellSlotsSpent: { ...sheet.live.spellSlotsSpent, [rang]: Math.max(0, depensesRang - 1) },
      resourcesSpent: {
        ...sheet.live.resourcesSpent,
        [WILD_SHAPE_RESOURCE_KEY]: (sheet.live.resourcesSpent[WILD_SHAPE_RESOURCE_KEY] ?? 0) + utilisations,
        [MAGICIEN_NATURE_KEY]: 1,
      },
    },
  };
}
