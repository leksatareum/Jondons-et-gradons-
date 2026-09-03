/**
 * Le butin, et les degrés de difficulté — Guide du Maître 2024.
 *
 * ═══ Pourquoi ici ═══
 *
 * Ce sont les deux choses qu'un MJ cherche dans le livre en pleine séance et
 * qu'il finit par inventer quand il ne les trouve pas : « ils ont tué le
 * gobelours, il avait quoi sur lui ? » et « je mets combien, en DD ? ».
 * Inventer un DD ne coûte rien ; inventer un trésor déséquilibre une
 * campagne sur dix séances.
 *
 * ═══ Provenance ═══
 *
 * Trésor individuel et trésor de réserve : Guide p. 120-121. Degrés de
 * difficulté : Guide p. 29.
 *
 * Deux valeurs ont été corrigées par l'arithmétique de la table elle-même,
 * l'océrisation ayant abîmé le multiplicateur — chaque ligne imprime sa
 * moyenne, ce qui rend la vérification immédiate :
 *
 *   - Réserve FP 11-16, lue « 8d8 × 10 000 » pour une moyenne annoncée de
 *     36 000. Or 8d8 vaut 36 en moyenne : le multiplicateur est 1 000, pas
 *     10 000, sinon la ligne annoncerait 360 000.
 *   - Réserve FP 5-10, lue « 8d1 × 100 … (4 400) » : 8d10 donne 44, donc
 *     4 400. C'est bien 8d10.
 *
 * La ligne « FP 17+ » du trésor INDIVIDUEL est illisible dans le scan : elle
 * est absente plutôt qu'inventée, et `tresorIndividuel` le dit.
 */

import { rollFormula, type JetDeDes } from './dice';

/** Une tranche de facteur de puissance, telle que les tables du Guide les découpent. */
type Tranche = { min: number; max: number };

const TRANCHES: Tranche[] = [
  { min: 0, max: 4 },
  { min: 5, max: 10 },
  { min: 11, max: 16 },
  { min: 17, max: Infinity },
];

/** Le FP d'une créature, en nombre — « 1/4 » vaut 0 pour le découpage en tranches. */
export function fpEnNombre(cr: string): number {
  if (cr.includes('/')) return 0;
  const valeur = Number(cr);
  return Number.isFinite(valeur) ? valeur : 0;
}

const trancheDe = (cr: string): number =>
  TRANCHES.findIndex((tranche) => fpEnNombre(cr) >= tranche.min && fpEnNombre(cr) <= tranche.max);

/** Monnaie du Guide : l'or et le platine ne se mélangent pas dans une même ligne. */
export type Monnaie = 'po' | 'pp';

export type LigneTresor = {
  /** La formule imprimée, telle qu'on la relit dans le livre. */
  formule: string;
  /** Le dé à lancer, puis le multiplicateur appliqué au total. */
  des: string;
  multiplicateur: number;
  monnaie: Monnaie;
  /** La moyenne imprimée — utilisable telle quelle, sans lancer. */
  moyenne: number;
};

/**
 * Ce qu'une créature porte sur elle — Guide p. 120.
 *
 * `null` au-delà du FP 16 : la ligne est illisible dans le scan, et un
 * trésor inventé se paie sur toute une campagne.
 */
export const TRESOR_INDIVIDUEL: (LigneTresor | null)[] = [
  { formule: '3d6 po', des: '3d6', multiplicateur: 1, monnaie: 'po', moyenne: 10 },
  { formule: '2d8 × 10 po', des: '2d8', multiplicateur: 10, monnaie: 'po', moyenne: 90 },
  { formule: '2d10 × 10 pp', des: '2d10', multiplicateur: 10, monnaie: 'pp', moyenne: 110 },
  null,
];

/** Le magot d'un repaire — Guide p. 121. `objets` est le nombre d'objets magiques à tirer. */
export const TRESOR_DE_RESERVE: { tresor: LigneTresor; objets: string }[] = [
  { tresor: { formule: '2d4 × 100 po', des: '2d4', multiplicateur: 100, monnaie: 'po', moyenne: 500 }, objets: '1d4-1' },
  { tresor: { formule: '8d10 × 100 po', des: '8d10', multiplicateur: 100, monnaie: 'po', moyenne: 4400 }, objets: '1d3' },
  { tresor: { formule: '8d8 × 1000 po', des: '8d8', multiplicateur: 1000, monnaie: 'po', moyenne: 36000 }, objets: '1d4' },
  { tresor: { formule: '6d10 × 10000 po', des: '6d10', multiplicateur: 10000, monnaie: 'po', moyenne: 330000 }, objets: '1d6' },
];

export type ButinTire = {
  /** Le montant obtenu, multiplicateur déjà appliqué. */
  montant: number;
  monnaie: Monnaie;
  /** Le jet brut, pour que le MJ voie ce qui est tombé plutôt qu'un total opaque. */
  jet: JetDeDes;
  formule: string;
};

/**
 * Le butin d'UNE créature.
 *
 * Le Guide autorise à lancer une seule fois pour un groupe de créatures
 * semblables et à multiplier par leur nombre : c'est ce que fait
 * `butinDuGroupe`, plutôt que dix jets pour dix gobelins.
 */
export function tresorIndividuel(cr: string, random: () => number = Math.random): ButinTire | null {
  const ligne = TRESOR_INDIVIDUEL[trancheDe(cr)];
  if (!ligne) return null;
  const jet = rollFormula(ligne.des, random) ?? { total: ligne.moyenne, des: [], bonus: 0 };
  return { montant: jet.total * ligne.multiplicateur, monnaie: ligne.monnaie, jet, formule: ligne.formule };
}

/** Un jet pour tout un groupe de créatures semblables, multiplié par l'effectif (Guide p. 120). */
export function butinDuGroupe(cr: string, nombre: number, random: () => number = Math.random): ButinTire | null {
  const base = tresorIndividuel(cr, random);
  if (!base) return null;
  return { ...base, montant: base.montant * Math.max(1, Math.round(nombre)) };
}

export type ReserveTiree = {
  montant: number;
  monnaie: Monnaie;
  jet: JetDeDes;
  formule: string;
  /** Nombre d'objets magiques à tirer — le Guide renvoie à ses propres tables pour LESQUELS. */
  objets: number;
  jetObjets: JetDeDes;
  formuleObjets: string;
};

/**
 * Le magot d'un repaire, ou la récompense d'une quête.
 *
 * Pour une quête, le Guide dit d'utiliser le NIVEAU DES PERSONNAGES à la
 * place du facteur de puissance (p. 121) — d'où un paramètre qui accepte les
 * deux sans distinguer.
 */
export function tresorDeReserve(crOuNiveau: string, random: () => number = Math.random): ReserveTiree {
  const index = Math.max(0, trancheDe(crOuNiveau));
  const { tresor, objets } = TRESOR_DE_RESERVE[index];
  const jet = rollFormula(tresor.des, random) ?? { total: tresor.moyenne, des: [], bonus: 0 };
  const jetObjets = rollFormula(objets, random) ?? { total: 0, des: [], bonus: 0 };
  return {
    montant: jet.total * tresor.multiplicateur,
    monnaie: tresor.monnaie,
    jet,
    formule: tresor.formule,
    objets: Math.max(0, jetObjets.total),
    jetObjets,
    formuleObjets: objets,
  };
}

/**
 * Les degrés de difficulté — Guide p. 29.
 *
 * Le livre insiste sur deux choses qui ne se lisent pas dans les chiffres
 * seuls, et qui sont donc recopiées ici : un DD 5 ne se lance pas (« let
 * characters succeed without making a check »), et une sauvegarde ne descend
 * jamais sous 10 ni ne monte au-dessus de 20.
 */
export const DEGRES_DE_DIFFICULTE: { dd: number; label: string; note?: string }[] = [
  { dd: 5, label: 'Très facile', note: 'Ne fais pas lancer : accorde la réussite.' },
  { dd: 10, label: 'Facile' },
  { dd: 15, label: 'Moyenne' },
  { dd: 20, label: 'Difficile' },
  { dd: 25, label: 'Très difficile', note: 'Hors de portée avant le niveau 10.' },
  { dd: 30, label: 'Presque impossible', note: 'Inatteignable à bas niveau.' },
];

/** Ce que le Guide dit des trois DD courants — les seuls dont on a vraiment besoin. */
export const NOTE_DEGRES =
  'Facile, moyenne, difficile suffisent à faire tourner une partie. À DD 10, un personnage sans maîtrise et à 10 dans la caractéristique réussit une fois sur deux ; à DD 15 il lui faut un bon score OU la maîtrise ; à DD 20, les deux.';

/** Pour une sauvegarde, le Guide borne le DD entre 10 et 20 (p. 29). */
export const BORNES_SAUVEGARDE = { min: 10, max: 20 };

export const AVANTAGE: string[] = [
  'Des circonstances extérieures à la créature lui donnent un avantage.',
  'Un aspect de l’environnement améliore ses chances.',
  'Le joueur fait preuve d’une créativité ou d’une ruse remarquable.',
  'Ce qui a été fait avant — par lui ou par un autre — améliore ses chances.',
];

export const DESAVANTAGE: string[] = [
  'Les circonstances gênent la réussite.',
  'Un aspect de l’environnement la rend moins probable.',
  'Un élément du plan ou de la description la rend moins probable.',
];
