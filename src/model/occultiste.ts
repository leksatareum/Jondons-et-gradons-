import { abilityModifier, effectiveAbilities, levelInClass, type CharacterSheet } from './character';
import { grantTemporaryHp } from './damage';
import type { DerivedCharacter } from './derive';

/**
 * Les capacités de l'Occultiste qui déplacent des ressources, sur une VRAIE
 * `CharacterSheet`. Règles PHB 2024 fournies par l'utilisateur.
 */

const niveauOccultiste = (sheet: CharacterSheet): number => levelInClass(sheet, 'occultiste');

const modCharisme = (sheet: CharacterSheet): number =>
  abilityModifier(effectiveAbilities(sheet).cha);

/**
 * Le patron, quelle que soit la façon dont la fiche le porte.
 *
 * Une fiche créée dans l'application stocke l'identifiant (`celeste`) ; une
 * fiche importée de l'ancienne application ne porte que le nom affiché
 * (« Patron Céleste »). Ne lire que l'identifiant privait les personnages
 * importés de toutes leurs capacités de patron — silencieusement.
 */
const PATRON_PAR_NOM: Record<string, string> = {
  'patron celeste': 'celeste',
  'patron fielon': 'fielon',
  'patron archifee': 'archifee',
  'patron grand ancien': 'grand-ancien',
};

const sansAccent = (valeur: string): string =>
  valeur.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('fr');

export const patronDe = (sheet: CharacterSheet): string | null => {
  const entree = sheet.classLevels.find((entry) => entry.classId === 'occultiste');
  if (!entree) return null;
  if (entree.subclassId) return entree.subclassId;
  return entree.subclass ? PATRON_PAR_NOM[sansAccent(entree.subclass)] ?? null : null;
};

// ═══════════════════════════════════════════════════════════════════════
// §16 / §17 — RUSE MAGIQUE (2) et MAÎTRE OCCULTE (20)
// ═══════════════════════════════════════════════════════════════════════

export const RUSE_MAGIQUE_KEY = 'occultiste:ruse-magique';

/**
 * Nombre d'emplacements de pacte que Ruse magique peut rendre.
 *
 * La moitié du MAXIMUM d'emplacements de pacte, arrondie au supérieur :
 * max 1 → 1, max 2 → 1, max 3 → 2, max 4 → 2.
 *
 * Au niveau 20, Maître occulte les rend TOUS.
 */
export function ruseMagiqueRecuperables(sheet: CharacterSheet, derived: DerivedCharacter): number {
  const pacte = derived.spellcasting.slots.find((slot) => slot.pact);
  if (!pacte) return 0;
  if (niveauOccultiste(sheet) >= 20) return pacte.max;
  return Math.ceil(pacte.max / 2);
}

/** Ruse magique n'est utilisable qu'une fois avant un repos long, et seulement s'il y a à rendre. */
export function peutUtiliserRuseMagique(sheet: CharacterSheet, derived: DerivedCharacter): boolean {
  if (niveauOccultiste(sheet) < 2) return false;
  if ((sheet.live.resourcesSpent[RUSE_MAGIQUE_KEY] ?? 0) > 0) return false;
  return (sheet.live.pactSlotsSpent ?? 0) > 0;
}

/**
 * Le rite d'une minute : il rend jusqu'à `ruseMagiqueRecuperables` emplacements
 * de pacte réellement dépensés, et marque la capacité comme employée.
 *
 * Un simple compteur 1/1 n'était pas une automatisation : rien ne diminuait
 * `live.pactSlotsSpent`.
 */
export function utiliserRuseMagique(
  sheet: CharacterSheet,
  derived: DerivedCharacter,
): { sheet: CharacterSheet; recuperes: number } {
  if (!peutUtiliserRuseMagique(sheet, derived)) return { sheet, recuperes: 0 };
  const recuperes = Math.min(sheet.live.pactSlotsSpent, ruseMagiqueRecuperables(sheet, derived));
  const apres: CharacterSheet = {
    ...sheet,
    live: {
      ...sheet.live,
      pactSlotsSpent: sheet.live.pactSlotsSpent - recuperes,
      resourcesSpent: { ...sheet.live.resourcesSpent, [RUSE_MAGIQUE_KEY]: 1 },
    },
  };
  // §19 : Résilience céleste se déclenche AUSSI sur Ruse magique.
  return { sheet: resilienceCeleste(apres), recuperes };
}

// ═══════════════════════════════════════════════════════════════════════
// §18 — LUMIÈRE GUÉRISSEUSE (Céleste 3)
// ═══════════════════════════════════════════════════════════════════════

export const LUMIERE_GUERISSEUSE_KEY = 'occultiste:lumiere-guerisseuse';

/** Réserve de dés : 1 + niveau d'Occultiste. Warlock 3 → 4d6, 8 → 9d6, 20 → 21d6. */
export function lumiereGuerisseuseDes(sheet: CharacterSheet): number {
  const niveau = niveauOccultiste(sheet);
  if (niveau < 3 || patronDe(sheet) !== 'celeste') return 0;
  return 1 + niveau;
}

/** Dés dépensables en une seule utilisation : modificateur de Charisme, minimum 1. */
export const lumiereGuerisseuseMaxParUsage = (sheet: CharacterSheet): number =>
  Math.max(1, modCharisme(sheet));

/**
 * Dépense des dés de la réserve. L'app ne lance JAMAIS les dés : le joueur
 * jette lui-même et applique les soins, on ne retient que la dépense.
 */
export function depenserLumiereGuerisseuse(
  sheet: CharacterSheet,
  des: number,
): { sheet: CharacterSheet; depenses: number } {
  const reserve = lumiereGuerisseuseDes(sheet);
  if (reserve === 0) return { sheet, depenses: 0 };
  const dejaDepenses = sheet.live.resourcesSpent[LUMIERE_GUERISSEUSE_KEY] ?? 0;
  const restants = Math.max(0, reserve - dejaDepenses);
  const depenses = Math.max(0, Math.min(des, restants, lumiereGuerisseuseMaxParUsage(sheet)));
  if (depenses === 0) return { sheet, depenses: 0 };
  return {
    sheet: {
      ...sheet,
      live: {
        ...sheet.live,
        resourcesSpent: {
          ...sheet.live.resourcesSpent,
          [LUMIERE_GUERISSEUSE_KEY]: dejaDepenses + depenses,
        },
      },
    },
    depenses,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// §19 — RÉSILIENCE CÉLESTE (Céleste 10)
// ═══════════════════════════════════════════════════════════════════════

/** PV temporaires que l'Occultiste gagne : niveau d'Occultiste + mod. de Charisme. */
export const resilienceCelestePourSoi = (sheet: CharacterSheet): number =>
  niveauOccultiste(sheet) + modCharisme(sheet);

/** Ce que reçoit chacune des cinq créatures choisies : moitié du niveau + mod. de Charisme. */
export const resilienceCelestePourAutrui = (sheet: CharacterSheet): number =>
  Math.floor(niveauOccultiste(sheet) / 2) + modCharisme(sheet);

/**
 * Résilience céleste se déclenche sur TROIS événements : Ruse magique, fin de
 * repos court, fin de repos long. Les PV temporaires suivent leur règle
 * normale — ils ne se cumulent pas.
 */
export function resilienceCeleste(sheet: CharacterSheet): CharacterSheet {
  if (niveauOccultiste(sheet) < 10 || patronDe(sheet) !== 'celeste') return sheet;
  return grantTemporaryHp(sheet, resilienceCelestePourSoi(sheet));
}

// ═══════════════════════════════════════════════════════════════════════
// §20 — BÉNÉDICTION DU TÉNÉBREUX (Fiélon 3)
// ═══════════════════════════════════════════════════════════════════════

/** PV temporaires gagnés : niveau d'Occultiste + mod. de Charisme, minimum 1. */
export const benedictionDuTenebreuxMontant = (sheet: CharacterSheet): number =>
  Math.max(1, niveauOccultiste(sheet) + modCharisme(sheet));

/**
 * Se déclenche quand un ennemi tombe à 0 PV, si l'Occultiste l'a réduit à 0
 * OU si cet ennemi était à 3 m ou moins de lui à ce moment.
 *
 * Les deux conditions sont des faits de table que l'app ne peut pas deviner :
 * elles sont passées en paramètre, pas inventées.
 */
export function benedictionDuTenebreux(
  sheet: CharacterSheet,
  circonstance: { reduitParLOccultiste: boolean; aPortee: boolean },
): CharacterSheet {
  if (niveauOccultiste(sheet) < 3 || patronDe(sheet) !== 'fielon') return sheet;
  if (!circonstance.reduitParLOccultiste && !circonstance.aPortee) return sheet;
  return grantTemporaryHp(sheet, benedictionDuTenebreuxMontant(sheet));
}
