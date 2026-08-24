import type { CharacterSheet } from './character';
import type { DerivedCharacter } from './derive';

/**
 * Les transitions canoniques de points de vie sur une VRAIE fiche.
 *
 * Elles existent parce que l'écran écrivait `live.damageTaken` directement,
 * sans jamais toucher `live.temporaryHp` : les PV temporaires s'affichaient
 * mais n'absorbaient rien. Toute source de PV temporaires en dépendait —
 * Forme sauvage, Cercle de la Lune, Résilience céleste, Bénédiction du
 * Ténébreux — et aucune ne fonctionnait réellement en jeu.
 *
 * Règle PHB 2024 appliquée (fournie par l'utilisateur, seule source
 * autorisée) :
 *
 *  · Des dégâts subis par une créature qui a des PV temporaires sont d'abord
 *    soustraits à ces PV temporaires ; seul l'excédent atteint les vrais PV.
 *    10 PV temporaires, 14 dégâts → PV temporaires à 0, 4 dégâts sur les
 *    vrais PV.
 *
 *  · Les PV temporaires NE SE CUMULENT PAS. Qui en reçoit alors qu'il en a
 *    déjà garde soit les anciens, soit les nouveaux — jamais la somme.
 *
 * Aucune de ces fonctions ne lance de dé : le nombre vient de la table.
 */

export interface DamageOutcome {
  sheet: CharacterSheet;
  /** Dégâts absorbés par les PV temporaires. */
  absorbedByTemporary: number;
  /** Dégâts qui ont réellement atteint les points de vie. */
  appliedToHp: number;
  /** Vrai au passage à 0, et seulement au passage — pas à chaque coup ensuite. */
  droppedToZero: boolean;
}

/** Dégâts subis : les PV temporaires d'abord, le reste sur les vrais PV. */
export function takeDamage(
  sheet: CharacterSheet,
  derived: DerivedCharacter,
  amount: number,
): DamageOutcome {
  const degats = Math.max(0, Math.floor(amount));
  const tempAvant = Math.max(0, sheet.live.temporaryHp ?? 0);
  const absorbedByTemporary = Math.min(tempAvant, degats);
  const reste = degats - absorbedByTemporary;

  const subisAvant = Math.max(0, sheet.live.damageTaken ?? 0);
  const subisApres = Math.min(derived.maxHp, subisAvant + reste);
  const appliedToHp = subisApres - subisAvant;

  return {
    sheet: {
      ...sheet,
      live: {
        ...sheet.live,
        temporaryHp: tempAvant - absorbedByTemporary,
        damageTaken: subisApres,
      },
    },
    absorbedByTemporary,
    appliedToHp,
    droppedToZero: subisAvant < derived.maxHp && subisApres >= derived.maxHp,
  };
}

/** Soins : ils ne touchent jamais les PV temporaires, seulement la blessure. */
export function heal(sheet: CharacterSheet, amount: number): CharacterSheet {
  const soins = Math.max(0, Math.floor(amount));
  if (soins === 0) return sheet;
  return {
    ...sheet,
    live: { ...sheet.live, damageTaken: Math.max(0, (sheet.live.damageTaken ?? 0) - soins) },
  };
}

/**
 * Recevoir des PV temporaires — sans jamais les cumuler.
 *
 * Le choix appartient au joueur quand il en a déjà : garder les anciens ou
 * prendre les nouveaux. `remplacer` porte ce choix. Par défaut on garde la
 * plus grande valeur, qui est le choix que personne ne regrette ; refuser
 * explicitement se fait avec `remplacer: false`.
 */
export function grantTemporaryHp(
  sheet: CharacterSheet,
  amount: number,
  options: { remplacer?: boolean } = {},
): CharacterSheet {
  const offerts = Math.max(0, Math.floor(amount));
  const actuels = Math.max(0, sheet.live.temporaryHp ?? 0);
  const suivants = options.remplacer === undefined
    ? Math.max(actuels, offerts)
    : options.remplacer ? offerts : actuels;
  if (suivants === actuels) return sheet;
  return { ...sheet, live: { ...sheet.live, temporaryHp: suivants } };
}
