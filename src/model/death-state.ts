import type { CharacterSheet } from './character';
import type { DerivedCharacter } from './derive';
import {
  applyDamageAtZero, emptyDeathSaves, resolveDeathSave, stabilizeDeathState,
  type DeathStatus, type DeathTracked,
} from '../domain/death';
import { rollDie } from '../domain/dice';

/**
 * Les jets de sauvegarde contre la mort, sur une VRAIE fiche.
 *
 * Toute la règle vit déjà dans `domain/death.ts`, écrite et testée à part :
 * trois succès stabilisent, trois échecs tuent, un 1 naturel compte double,
 * un 20 naturel relève à 1 PV, et des dégâts encaissés à terre ajoutent un
 * échec (deux sur un critique, la mort d'un coup si le montant atteint le
 * maximum de PV). Ce module ne rejoue rien de tout ça : il ne fait que
 * TRADUIRE entre les deux vocabulaires.
 *
 * La traduction n'est pas cosmétique. Le domaine raisonne en `hp`/`hpMax`,
 * la fiche ne stocke pas les PV mais la BLESSURE (`live.damageTaken`, le
 * maximum restant dérivé — voir `model/damage.ts`). Un 20 naturel qui rend
 * « 1 PV » doit donc redescendre ici en « blessure = maximum − 1 », sans
 * quoi il ne relèverait personne.
 *
 * Aucune de ces fonctions ne décide QUAND les appeler : c'est l'écran qui
 * sait qu'un joueur vient d'appuyer, ou que des dégâts viennent de tomber.
 */

export type ResultatJet = 'succes' | 'echec' | 'nat1' | 'nat20';

export interface EtatDeMort {
  /** À 0 PV — le seul cas où les jets contre la mort existent. */
  aTerre: boolean;
  statut: DeathStatus;
  succes: number;
  echecs: number;
}

const pvActuels = (sheet: CharacterSheet, derived: DerivedCharacter): number =>
  Math.max(0, derived.maxHp - Math.max(0, sheet.live.damageTaken ?? 0));

/**
 * Le statut lisible, déduit quand la fiche n'en porte pas.
 *
 * Une fiche d'avant l'ajout du champ — ou importée de l'ancienne app — peut
 * être à 0 PV sans statut : elle est en train de mourir, c'est le seul état
 * que trois échecs n'ont pas déjà tranché.
 */
export function etatDeMort(sheet: CharacterSheet, derived: DerivedCharacter): EtatDeMort {
  const pv = pvActuels(sheet, derived);
  const saves = sheet.live.deathSaves ?? emptyDeathSaves();
  const enregistre = sheet.live.deathStatus ?? null;
  const statut: DeathStatus = enregistre
    ?? (saves.fail >= 3 ? 'dead' : pv <= 0 ? 'dying' : null);
  return { aTerre: pv <= 0, statut, succes: saves.success, echecs: saves.fail };
}

const versSuivi = (sheet: CharacterSheet, derived: DerivedCharacter): DeathTracked => {
  const etat = etatDeMort(sheet, derived);
  return {
    hp: pvActuels(sheet, derived),
    hpMax: derived.maxHp,
    deathStatus: etat.statut,
    deathSaves: { success: etat.succes, fail: etat.echecs },
  };
};

const versFiche = (
  sheet: CharacterSheet,
  derived: DerivedCharacter,
  suivi: DeathTracked,
): CharacterSheet => {
  // Le domaine peut RELEVER (20 naturel, 1 PV) : la blessure se recalcule
  // depuis les PV rendus, elle ne se contente pas de rester en place.
  const damageTaken = Math.max(0, Math.min(derived.maxHp, derived.maxHp - suivi.hp));
  const deathSaves = suivi.deathSaves ?? emptyDeathSaves();
  const deathStatus = suivi.deathStatus ?? null;

  // Rien n'a bougé (un mort à qui on redemande un jet, des dégâts sur
  // quelqu'un debout) : rendre la fiche TELLE QUELLE, pas une copie
  // identique. Les écrans se fient à l'identité pour ne pas réécrire —
  // `soignerOuBlesser` teste `suivante === donnees` — et une copie
  // déclencherait un enregistrement, donc une écriture réseau, pour rien.
  const inchange = damageTaken === (sheet.live.damageTaken ?? 0)
    && deathSaves.success === (sheet.live.deathSaves?.success ?? 0)
    && deathSaves.fail === (sheet.live.deathSaves?.fail ?? 0)
    && deathStatus === (sheet.live.deathStatus ?? null);
  if (inchange) return sheet;

  return { ...sheet, live: { ...sheet.live, damageTaken, deathSaves, deathStatus } };
};

/** Enregistre un jet, qu'il vienne du dé de l'appli ou de celui de la table. */
export function noterJetContreLaMort(
  sheet: CharacterSheet,
  derived: DerivedCharacter,
  resultat: ResultatJet,
): CharacterSheet {
  const correspondance = {
    succes: 'success', echec: 'fail', nat1: 'nat1', nat20: 'nat20',
  } as const;
  return versFiche(sheet, derived, resolveDeathSave(versSuivi(sheet, derived), correspondance[resultat]));
}

/**
 * Lance un vrai d20 et en applique le résultat.
 *
 * Les mêmes probabilités qu'un dé de table : `rollDie` et rien d'autre (voir
 * `domain/dice.ts`). Le dé tiré est RENDU en plus de la fiche — l'écran doit
 * pouvoir montrer le 14 qui a sauvé le personnage, pas seulement son effet.
 */
export function lancerJetContreLaMort(
  sheet: CharacterSheet,
  derived: DerivedCharacter,
  random: () => number = Math.random,
): { sheet: CharacterSheet; de: number; resultat: ResultatJet } {
  const de = rollDie(20, random);
  const resultat: ResultatJet = de === 20 ? 'nat20' : de === 1 ? 'nat1' : de >= 10 ? 'succes' : 'echec';
  return { sheet: noterJetContreLaMort(sheet, derived, resultat), de, resultat };
}

/** Stabilisé autrement que par trois succès : Médecine DD 10, trousse de soins… */
export function stabiliser(sheet: CharacterSheet, derived: DerivedCharacter): CharacterSheet {
  return versFiche(sheet, derived, stabilizeDeathState(versSuivi(sheet, derived)));
}

/**
 * Repartir de zéro — une erreur de saisie, pas une règle.
 *
 * Volontairement écrit ici plutôt que délégué à `resolveDeathSave(…, 'reset')` :
 * le domaine refuse toute transition sur un personnage stabilisé ou mort, et
 * il a raison — aucune RÈGLE ne doit pouvoir les faire bouger. Mais ce bouton
 * n'est pas une règle : c'est le joueur qui dit « je me suis trompé », et
 * c'est justement une fois arrivé à « mort » ou « stabilisé » par erreur qu'on
 * en a le plus besoin. Un bouton qui promet de repartir de zéro et ne fait
 * rien serait pire que pas de bouton du tout.
 *
 * Il efface les compteurs SANS ressusciter : à 0 PV on retombe « en train de
 * mourir », les PV ne bougent pas d'un point.
 */
export function reinitialiserJets(sheet: CharacterSheet, derived: DerivedCharacter): CharacterSheet {
  const debout = pvActuels(sheet, derived) > 0;
  const saves = sheet.live.deathSaves ?? emptyDeathSaves();
  const statut: DeathStatus = debout ? null : 'dying';
  if (saves.success === 0 && saves.fail === 0 && (sheet.live.deathStatus ?? null) === statut) return sheet;
  return {
    ...sheet,
    live: { ...sheet.live, deathSaves: emptyDeathSaves(), deathStatus: statut },
  };
}

/** Des dégâts encaissés alors qu'on est déjà à terre : un échec, deux sur un critique. */
export function echecParDegats(
  sheet: CharacterSheet,
  derived: DerivedCharacter,
  degats: number,
  critique = false,
): CharacterSheet {
  return versFiche(sheet, derived, applyDamageAtZero(versSuivi(sheet, derived), degats, critique));
}

/**
 * À appeler après TOUT changement de PV : remonter au-dessus de 0 efface les
 * jets et remet debout (« récupérer au moins 1 PV efface les jets contre la
 * mort », voir le compendium de règles).
 *
 * Le maximum de PV se lit sur la dérivation d'AVANT le soin, ce qui est sans
 * effet : soigner ne change jamais le maximum.
 */
export function apresChangementDePv(sheet: CharacterSheet, derived: DerivedCharacter): CharacterSheet {
  const debout = pvActuels(sheet, derived) > 0;
  const saves = sheet.live.deathSaves ?? emptyDeathSaves();
  const rienARemettre = saves.success === 0 && saves.fail === 0 && !sheet.live.deathStatus;
  if (!debout || rienARemettre) return sheet;
  // Un mort qu'on « soigne » ne se relève pas tout seul : seul le MJ tranche,
  // en remettant les compteurs à zéro depuis l'écran.
  if (sheet.live.deathStatus === 'dead') return sheet;
  return { ...sheet, live: { ...sheet.live, deathSaves: emptyDeathSaves(), deathStatus: null } };
}
