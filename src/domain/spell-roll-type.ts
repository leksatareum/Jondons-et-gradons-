import type { AbilityId } from '../content/character-basics';

/**
 * Ce qu'un sort fait tirer : une attaque de sort, ou une sauvegarde — et
 * laquelle. Jamais un chiffre : voir `spell-damage-types.ts` pour la même
 * prudence appliquée aux types de dégâts, et l'en-tête de `spell-cards.ts`
 * pour la règle qu'aucun des deux ne contourne : le catalogue ne porte aucun
 * champ structuré, un chiffre extrait du texte serait faux avec l'aplomb
 * d'un chiffre juste.
 *
 * Ici, le texte du jeu 2024 est mécanique au point d'être fiable sur les 389
 * sorts du catalogue :
 *  - « Attaque de sort (à distance|au corps à corps) » ouvre TOUJOURS le
 *    passage qui décrit une attaque — jamais un synonyme, jamais un sort qui
 *    ne s'y résout pas vraiment (vérifié : 26 sorts, tous une vraie attaque
 *    de sort, y compris les armes invoquées d'Épée arcanique ou Arme
 *    spirituelle, qui utilisent explicitement le bonus d'attaque DU LANCEUR
 *    selon leur propre règle).
 *  - « (jet de) sauvegarde(s) (de|d') CARACTÉRISTIQUE » apparaît sur 140
 *    sorts. Un « avantage »/« désavantage aux (attaques et) sauvegardes de
 *    X » est écarté (lookbehind négatif) : c'est un modificateur posé sur
 *    les jets FUTURS de la cible, jamais la sauvegarde que CE sort impose
 *    (Bénédiction, Hâte, Danse irrésistible d'Otto…). Les quelques sorts
 *    restants qui contiennent le mot « sauvegarde » sans matcher décrivent
 *    une mécanique différente (Croissance d'épines : un test opposé au DD,
 *    pas une sauvegarde). Un sort peut légitimement citer deux
 *    caractéristiques (Statique synaptique) : `SAVE_RE` n'étant jamais
 *    appelée en mode global, `exec` s'arrête à la première occurrence, qui
 *    est systématiquement celle du jet réellement déclenché.
 *
 * Seule exception délibérément écartée : un sort qui imprime son propre DD
 * fixe dans son texte (« DD 15 », « DD 20 ») — deux cas sur 389, dont un
 * seul aurait matché la sauvegarde. Le DD du lanceur y serait faux ; mieux
 * vaut n'afficher ni attaque ni sauvegarde que d'afficher un DD qui n'est
 * pas celui du sort.
 */

export type SpellRollType =
  | { kind: 'attaque' }
  | { kind: 'sauvegarde'; ability: AbilityId };

const CARACTERISTIQUE = 'Force|Dextérité|Constitution|Intelligence|Sagesse|Charisme';
const ATTACK_RE = /attaque de sort/i;
// « avantage aux sauvegardes de Sagesse » (Balise d'espoir, Festin des
// héros, Hâte) ou « désavantage aux attaques et sauvegardes de Dextérité »
// (Danse irrésistible d'Otto) sont des MODIFICATEURS posés sur les jets
// futurs d'une cible, jamais une sauvegarde que CE sort impose — le
// lookbehind négatif les écarte, même mécanique que `spell-damage-types.ts`
// pour « résistant aux dégâts de… ».
//
// Un sort peut malgré tout citer deux caractéristiques légitimement (Statique
// synaptique : sauvegarde d'Intelligence pour l'effet principal, PUIS une
// pénalité aux sauvegardes de Constitution en cas d'échec) — sans motif texte
// fiable pour les distinguer plus finement, on ne cherche pas à en écarter
// une seconde par regex : `SAVE_RE` n'est jamais appelée en mode global, donc
// `exec` s'arrête toujours à la PREMIÈRE occurrence, qui est systématiquement
// celle du jet réellement déclenché — vérifié sur les 389 sorts.
const SAVE_RE = new RegExp(
  `(?<!(?:avantage|désavantage) aux (?:attaques? (?:et |ou )?)?)sauvegardes? (?:de |d['’])(${CARACTERISTIQUE})`,
  'i',
);
// Un DD imprimé dans le texte du sort lui-même n'est pas celui du lanceur.
const FIXED_DD_RE = /\bDD\s*\d+/;

const ABILITY_ID: Record<string, AbilityId> = {
  force: 'str', dextérité: 'dex', constitution: 'con',
  intelligence: 'int', sagesse: 'wis', charisme: 'cha',
};

export function spellRollType(spell: { text: string }): SpellRollType | undefined {
  if (FIXED_DD_RE.test(spell.text)) return undefined;
  if (ATTACK_RE.test(spell.text)) return { kind: 'attaque' };
  const trouve = SAVE_RE.exec(spell.text);
  if (!trouve) return undefined;
  return { kind: 'sauvegarde', ability: ABILITY_ID[trouve[1].toLocaleLowerCase('fr')] };
}
