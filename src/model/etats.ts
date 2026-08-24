import { CONDITIONS, type ConditionEffect, type ConditionId } from '../domain/conditions';

/**
 * Les états, raccordés à ce que l'application manipule vraiment.
 *
 * `domain/conditions.ts` porte les 14 états du PHB 2024, vérifiés page à page
 * contre le glossaire (appendice C) — et n'était importé par personne. Les
 * combattants d'une rencontre avaient bien un champ `conditions`, mais aucun
 * écran ne permettait d'en poser un, et rien n'en disait l'effet.
 *
 * Un état vit sur le COMBATTANT, pas sur la fiche : c'est le MJ qui l'attribue
 * pendant la rencontre, et la rencontre se synchronise déjà en temps réel vers
 * tous les joueurs. Écrire sur la fiche d'un autre joueur aurait demandé un
 * second chemin d'écriture pour la même information.
 */

/**
 * L'ordre d'affichage : les plus courants d'abord.
 *
 * Pas l'ordre alphabétique du livre — en pleine partie, on cherche « À terre »
 * et « Agrippé » vingt fois plus souvent que « Pétrifié ». Un ordre de
 * fréquence fait gagner le geste que l'ordre alphabétique fait perdre.
 */
export const ETATS_ORDONNES: ConditionId[] = [
  'a-terre', 'agrippe', 'entrave', 'empoisonne', 'effraye', 'charme',
  'aveugle', 'assourdi', 'incapable-agir', 'etourdi', 'paralyse',
  'inconscient', 'invisible', 'petrifie',
];

export interface EtatAffiche {
  id: ConditionId;
  name: string;
  actif: boolean;
  effet: ConditionEffect;
}

/** Les 14 états, chacun avec son effet et son état actif sur ce combattant. */
export function etatsDe(conditions: readonly string[]): EtatAffiche[] {
  const actifs = new Set(conditions);
  return ETATS_ORDONNES.map((id) => ({
    id,
    name: CONDITIONS[id].name,
    actif: actifs.has(id),
    effet: CONDITIONS[id],
  }));
}

/** Les seuls états actifs, dans l'ordre d'affichage. */
export const etatsActifs = (conditions: readonly string[]): EtatAffiche[] =>
  etatsDe(conditions).filter((etat) => etat.actif);

/**
 * Pose ou retire un état. Un identifiant inconnu est ignoré plutôt que stocké
 * — sans quoi une faute de frappe créerait un état fantôme, affiché mais sans
 * aucun effet connu.
 */
export function basculerEtat(conditions: readonly string[], id: string): string[] {
  if (!(id in CONDITIONS)) return [...conditions];
  return conditions.includes(id)
    ? conditions.filter((present) => present !== id)
    : [...conditions, id];
}

/**
 * Ce que les états actifs imposent, cumulé.
 *
 * Seuls les effets INCONDITIONNELS y entrent. Le désavantage d'Effrayé ne vaut
 * que si la source est en vue, celui d'Agrippé que contre une autre cible que
 * l'agrippeur : les compter ici les appliquerait à tort. Ils restent lisibles
 * dans la note de chaque état.
 */
export interface ResumeDesEtats {
  /** Désavantage à tes jets d'attaque. */
  attaquesDesavantagees: boolean;
  /** Désavantage à tes tests de caractéristique. */
  testsDesavantages: boolean;
  /** Avantage aux attaques CONTRE toi. */
  attaquesSubiesAvantagees: boolean;
  /** Vitesse réduite à 0. */
  vitesseNulle: boolean;
  /** Ni action, ni action bonus, ni réaction ; concentration rompue. */
  incapable: boolean;
  /** Sauvegardes de Force et de Dextérité ratées d'office. */
  sauvegardesRatees: boolean;
  /** Résistance à tous les dégâts (Pétrifié). */
  resistanceTotale: boolean;
}

export function resumeDesEtats(conditions: readonly string[]): ResumeDesEtats {
  const actifs = etatsActifs(conditions).map((etat) => etat.effet);
  const un = (predicat: (effet: ConditionEffect) => boolean) => actifs.some(predicat);
  return {
    attaquesDesavantagees: un((effet) => effet.attack === 'dis'),
    testsDesavantages: un((effet) => effet.check === 'dis'),
    attaquesSubiesAvantagees: un((effet) => effet.incoming === 'adv'),
    vitesseNulle: un((effet) => effet.speed0 === true),
    incapable: un((effet) => effet.incapacitated === true),
    sauvegardesRatees: un((effet) => Boolean(effet.autoFail?.length)),
    resistanceTotale: un((effet) => effet.resistAll === true),
  };
}
