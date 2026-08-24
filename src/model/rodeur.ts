import { levelInClass, type CharacterSheet, type HuntersMark } from './character';
import type { DerivedCharacter } from './derive';

/**
 * Marque du chasseur, et tout ce que le Rôdeur bâtit dessus.
 *
 * L'ancien domaine savait déjà calculer ces règles — mais sur une forme qui
 * n'existe plus : une cible rangée à la racine (`hunterMarkTarget`) et une
 * concentration lue dans un texte de condition. Rien de tout cela n'est
 * jamais écrit par la fiche jouée : le calcul était juste, l'automatisation
 * inexistante. Ce module travaille sur `CharacterSheet` + `LiveState`.
 *
 * Le dé bonus n'est volontairement PAS stocké dans la marque : il se dérive
 * du niveau de Rôdeur, de sorte que le passage au d10 de Tueur d'ennemis
 * (niveau 20) suive tout seul partout où le dé est lu — y compris pour la
 * bête du Maître des bêtes.
 */

export const MARQUE_CHASSEUR_SPELL_ID = 'marque-chasseur';

/** La réserve de lancements gratuits d'Ennemi juré, telle que `derive` la nomme. */
export const MARQUE_LIBRE_KEY = 'rodeur:marque-chasseur';

const niveauRodeur = (sheet: CharacterSheet): number => levelInClass(sheet, 'rodeur');

/**
 * Durée de la concentration selon le rang de l'emplacement dépensé.
 *
 * PHB 2024 : rang 1 ou 2 → 1 heure ; rang 3 ou 4 → 8 heures ; rang 5 et
 * au-delà → 24 heures. Un lancement gratuit d'Ennemi juré ne change pas le
 * sort, seulement son coût : il dure donc une heure.
 */
export function dureeMarqueHeures(slotLevel: number | null | undefined): number {
  const rang = slotLevel ?? 1;
  if (rang >= 5) return 24;
  if (rang >= 3) return 8;
  return 1;
}

export interface CibleMarquee {
  id: string;
  name: string;
}

export interface PaiementMarque {
  /** Clé de ressource telle qu'elle vient de la carte jouée. */
  key: string;
  /** Rang de l'emplacement dépensé, `null` pour un lancement gratuit. */
  slotLevel: number | null;
}

/**
 * Poser la marque. La dépense de la ressource reste au module `cast` : ici
 * on ne fixe que l'état du sort — cible, concentration, provenance, durée.
 */
export function marquer(sheet: CharacterSheet, cible: CibleMarquee, paiement: PaiementMarque): CharacterSheet {
  const marque: HuntersMark = {
    targetId: cible.id,
    targetName: cible.name,
    source: paiement.key === MARQUE_LIBRE_KEY ? 'ennemi-jure' : 'emplacement',
    ...(paiement.slotLevel !== null ? { slotLevel: paiement.slotLevel } : {}),
    durationHours: dureeMarqueHeures(paiement.slotLevel),
  };
  return {
    ...sheet,
    live: {
      ...sheet.live,
      huntersMark: marque,
      concentration: { spellId: MARQUE_CHASSEUR_SPELL_ID, note: cible.name },
    },
  };
}

/**
 * La cible est tombée à 0 PV : une action bonus déplace la marque. Le sort
 * n'est pas relancé — ni emplacement, ni usage gratuit, et la durée déjà
 * engagée continue de courir.
 */
export function transfererMarque(sheet: CharacterSheet, cible: CibleMarquee): CharacterSheet {
  const marque = sheet.live.huntersMark;
  if (!marque) return sheet;
  return {
    ...sheet,
    live: {
      ...sheet.live,
      huntersMark: { ...marque, targetId: cible.id, targetName: cible.name },
      concentration: { spellId: MARQUE_CHASSEUR_SPELL_ID, note: cible.name },
    },
  };
}

/** Le sort s'arrête : la marque et la concentration tombent ensemble. */
export function finMarque(sheet: CharacterSheet): CharacterSheet {
  if (!sheet.live.huntersMark && sheet.live.concentration?.spellId !== MARQUE_CHASSEUR_SPELL_ID) return sheet;
  return {
    ...sheet,
    live: {
      ...sheet.live,
      huntersMark: null,
      concentration: sheet.live.concentration?.spellId === MARQUE_CHASSEUR_SPELL_ID
        ? null
        : sheet.live.concentration ?? null,
    },
  };
}

/** Vrai quand la marque est réellement active sur cette créature. */
export function marqueActiveSur(sheet: CharacterSheet, targetId: string): boolean {
  const marque = sheet.live.huntersMark;
  if (!marque) return false;
  if (sheet.live.concentration?.spellId !== MARQUE_CHASSEUR_SPELL_ID) return false;
  return marque.targetId === targetId;
}

// ═══════════════════════════════════════════════════════════════════════
// §14 — TUEUR D'ENNEMIS (20)
// ═══════════════════════════════════════════════════════════════════════

/** Le dé bonus : 1d6, et 1d10 à partir du niveau 20 de Rôdeur. */
export const deBonusMarque = (sheet: CharacterSheet): '1d6' | '1d10' =>
  (niveauRodeur(sheet) >= 20 ? '1d10' : '1d6');

/** Ce que la marque ajoute à une attaque qui touche cette créature. */
export function degatsBonusMarque(sheet: CharacterSheet, targetId: string): string | null {
  return marqueActiveSur(sheet, targetId) ? `${deBonusMarque(sheet)} force` : null;
}

/**
 * Maître des bêtes 11 : la bête inflige les dégâts bonus de Marque du
 * chasseur, une fois par tour. Le dé est le même que celui du Rôdeur — il
 * passe donc au d10 au niveau 20 sans qu'on ait à y penser.
 */
export function degatsBonusBeteCompagnon(
  sheet: CharacterSheet,
  targetId: string,
  dejaUtiliseCeTour = false,
): string | null {
  if (niveauRodeur(sheet) < 11) return null;
  const entree = sheet.classLevels.find((e) => e.classId === 'rodeur');
  if (entree?.subclassId !== 'bestial') return null;
  if (dejaUtiliseCeTour) return null;
  return degatsBonusMarque(sheet, targetId);
}

// ═══════════════════════════════════════════════════════════════════════
// §12 — CHASSEUR IMPLACABLE (13) · §13 — CHASSEUR PRÉCIS (17)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Vrai quand SUBIR DES DÉGÂTS ne peut plus briser cette concentration.
 *
 * La capacité ne protège que de cette cause-là, et seulement pour Marque du
 * chasseur : les autres façons de perdre la concentration continuent de
 * s'appliquer, et un autre sort concentré n'est pas protégé.
 */
export function degatsPeuventBriserLaConcentration(sheet: CharacterSheet): boolean {
  if (!sheet.live.concentration) return false;
  if (niveauRodeur(sheet) < 13) return true;
  return sheet.live.concentration.spellId !== MARQUE_CHASSEUR_SPELL_ID;
}

/** Chasseur précis : Avantage aux attaques contre la créature marquée. */
export function avantageContre(sheet: CharacterSheet, targetId: string): boolean {
  return niveauRodeur(sheet) >= 17 && marqueActiveSur(sheet, targetId);
}

// ═══════════════════════════════════════════════════════════════════════
// §11 — ENNEMI JURÉ : les lancements gratuits
// ═══════════════════════════════════════════════════════════════════════

/** Lancements gratuits restants, lus sur la ressource dérivée. */
export function lancementsGratuitsRestants(derived: DerivedCharacter): number {
  return derived.resources.find((resource) => resource.key === MARQUE_LIBRE_KEY)?.remaining ?? 0;
}
