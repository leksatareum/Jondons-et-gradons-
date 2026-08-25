import { resolveDamageAmount, type DamageProfile } from './damage';
import type { AbilityId } from './multiclassing';

/**
 * Déroulement d'un combat : ordre d'initiative, tours, rounds, dégâts.
 *
 * Joueurs et créatures vivent dans la MÊME liste, parce que c'est ainsi que
 * l'initiative fonctionne. Ce qui les distingue est leur provenance : un
 * personnage-joueur est une fiche synchronisée dont le MJ ne possède pas
 * l'état, une créature est locale à la rencontre.
 *
 * Comme partout ailleurs dans ce projet, l'état vivant est stocké en
 * DÉPENSES : `damageTaken` plutôt que « points de vie restants ». Un maximum
 * qui change ne rend jamais la ligne fausse.
 */

export type CombatantSide = 'joueur' | 'creature';

/**
 * Une attaque d'adversaire, à lire à la table — jamais à jouer pour lui.
 * L'app ne lance aucun dé : `damage` reste une formule (« 1d6+2 »), que le MJ
 * jette lui-même comme il l'a toujours fait.
 */
export interface CombatantAttack {
  id: string;
  name: string;
  toHit?: number;
  damage?: string;
  damageType?: string;
  /** Effet annexe : « la cible M ou moins tombe à terre »… */
  detail?: string;
}

export interface Combatant {
  id: string;
  name: string;
  side: CombatantSide;
  initiative: number;
  /** Départage les égalités : modificateur de Dextérité, puis ordre d'ajout. */
  dexterity: number;
  maxHp: number;
  damageTaken: number;
  temporaryHp: number;
  armorClass: number;
  conditions: string[];
  /** Créatures seulement : le MJ peut cacher les PV aux joueurs. */
  hidden?: boolean;
  /** Modèle d'origine, pour retrouver les actions d'une créature. */
  templateId?: string;
  /** Créatures seulement : ses attaques, saisies ou reprises du bestiaire. */
  attacks?: CombatantAttack[];
  /** Créatures seulement : ses caractéristiques — pour un test que l'app ne devine pas. */
  abilities?: Partial<Record<AbilityId, number>>;
  /** Créatures seulement : lu au bestiaire ou au FP, pour calculer une DD à la volée. */
  proficiencyBonus?: number;
  /** Créatures seulement : jets de sauvegarde où elle est maîtrisée (bonus total, pas le seul modificateur). */
  savingThrows?: Partial<Record<AbilityId, number>>;
  /** Créatures seulement : compétences où elle est maîtrisée (bonus total). */
  skills?: Record<string, number>;
}

export interface EncounterState {
  combatants: Combatant[];
  /** Index dans l'ordre trié. -1 tant que le combat n'a pas commencé. */
  turnIndex: number;
  round: number;
}

/**
 * Ordre de jeu. À initiative égale, la Dextérité départage ; à Dextérité
 * égale, l'ordre d'ajout, qui est stable et donc reproductible — le Manuel
 * laisse les joueurs trancher entre eux et le MJ trancher pour le reste, ce
 * qu'un réordonnancement manuel permettra plus tard.
 */
export function orderedCombatants(state: EncounterState): Combatant[] {
  return state.combatants
    .map((combatant, index) => ({ combatant, index }))
    .sort((a, b) =>
      b.combatant.initiative - a.combatant.initiative
      || b.combatant.dexterity - a.combatant.dexterity
      || a.index - b.index)
    .map(({ combatant }) => combatant);
}

export const activeCombatant = (state: EncounterState): Combatant | null => {
  if (state.turnIndex < 0) return null;
  return orderedCombatants(state)[state.turnIndex] ?? null;
};

/** Points de vie restants — dérivés, jamais stockés. */
export const remainingHp = (combatant: Combatant): number =>
  Math.max(0, combatant.maxHp - combatant.damageTaken);

export const isDown = (combatant: Combatant): boolean => remainingHp(combatant) <= 0;

/**
 * Le tour par tour n'existe que lorsque le MJ le lance. Hors combat, il n'y a
 * ni round, ni tour actif, ni économie d'action à suivre — et les écrans des
 * joueurs le reflètent, sans jamais en décider eux-mêmes.
 */
export const isRunning = (state: EncounterState): boolean => state.turnIndex >= 0;

/** Démarre le combat sur le premier de l'ordre. Décision du MJ, uniquement. */
export const beginEncounter = (state: EncounterState): EncounterState =>
  ({ ...state, turnIndex: 0, round: 1 });

/**
 * Met fin au combat. Les combattants et leurs points de vie sont conservés :
 * on sort du tour par tour, on ne perd pas l'état de la rencontre — un combat
 * arrêté par erreur doit pouvoir être relancé sans rien ressaisir.
 */
export const endEncounter = (state: EncounterState): EncounterState =>
  ({ ...state, turnIndex: -1, round: 0 });

/**
 * Passe au suivant. Boucler en tête du tableau incrémente le round : c'est
 * la seule définition d'un round qui reste juste quand un combattant est
 * ajouté ou retiré en cours de combat.
 */
export function nextTurn(state: EncounterState): EncounterState {
  const count = state.combatants.length;
  if (count === 0) return state;
  if (state.turnIndex < 0) return beginEncounter(state);
  const next = state.turnIndex + 1;
  return next >= count
    ? { ...state, turnIndex: 0, round: state.round + 1 }
    : { ...state, turnIndex: next };
}

/** Revient au précédent, sans jamais descendre sous le round 1. */
export function previousTurn(state: EncounterState): EncounterState {
  const count = state.combatants.length;
  if (count === 0 || state.turnIndex < 0) return state;
  if (state.turnIndex > 0) return { ...state, turnIndex: state.turnIndex - 1 };
  return state.round <= 1
    ? state
    : { ...state, turnIndex: count - 1, round: state.round - 1 };
}

export interface DamageOutcome {
  combatant: Combatant;
  /** Dégâts réellement encaissés après résistances et PV temporaires. */
  applied: number;
  absorbedByTemporary: number;
  /** Mention de résistance ou de vulnérabilité, à afficher au MJ. */
  note: string;
  droppedToZero: boolean;
}

/**
 * Applique des dégâts. Les points de vie temporaires absorbent en premier,
 * après résistances — c'est l'ordre du Manuel, et l'inverse donne des
 * résultats faux dès qu'une résistance est en jeu.
 */
export function applyDamage(
  combatant: Combatant,
  amount: number,
  type: string | null = null,
  profile: DamageProfile = {},
): DamageOutcome {
  const resolved = resolveDamageAmount(
    { ...profile, conditions: profile.conditions ?? combatant.conditions.map((label) => ({ label })) },
    amount,
    type,
  );
  const absorbedByTemporary = Math.min(combatant.temporaryHp, resolved.final);
  const toHp = resolved.final - absorbedByTemporary;
  const wasUp = !isDown(combatant);
  const next: Combatant = {
    ...combatant,
    temporaryHp: combatant.temporaryHp - absorbedByTemporary,
    damageTaken: Math.min(combatant.maxHp, combatant.damageTaken + toHp),
  };
  return {
    combatant: next,
    applied: resolved.final,
    absorbedByTemporary,
    note: resolved.label,
    droppedToZero: wasUp && isDown(next),
  };
}

/** Soigne, sans jamais dépasser le maximum ni ressusciter un mort. */
export function applyHealing(combatant: Combatant, amount: number): Combatant {
  const healed = Math.max(0, Math.floor(amount));
  return { ...combatant, damageTaken: Math.max(0, combatant.damageTaken - healed) };
}

/**
 * Numérote les créatures homonymes (Gobelin 1, Gobelin 2…) sans toucher aux
 * noms uniques. Trois « Gobelin » indiscernables dans la liste sont l'une des
 * plaies classiques de la gestion de combat.
 *
 * Regroupe par nom DE BASE (le suffixe « N » retiré), pas par nom littéral :
 * `addCombatant` rappelle cette fonction à chaque ajout, un par un. Grouper
 * par nom littéral faisait dérailler la numérotation dès le troisième
 * « Gobelin » ajouté séparément — les deux premiers devenaient « Gobelin 1 »
 * et « Gobelin 2 », deux noms désormais uniques à ses yeux, et le troisième
 * restait « Gobelin » tout court au lieu de « Gobelin 3 ».
 */
export function withDistinctNames(combatants: Combatant[]): Combatant[] {
  const baseNameOf = (name: string) => name.replace(/ \d+$/, '');
  const counts = new Map<string, number>();
  for (const combatant of combatants) {
    const base = baseNameOf(combatant.name);
    counts.set(base, (counts.get(base) ?? 0) + 1);
  }
  const seen = new Map<string, number>();
  return combatants.map((combatant) => {
    const base = baseNameOf(combatant.name);
    if ((counts.get(base) ?? 0) <= 1) return combatant;
    const rank = (seen.get(base) ?? 0) + 1;
    seen.set(base, rank);
    return { ...combatant, name: `${base} ${rank}` };
  });
}

/** Remplace un combattant par sa version modifiée, en conservant l'ordre. */
export const replaceCombatant = (state: EncounterState, combatant: Combatant): EncounterState =>
  ({ ...state, combatants: state.combatants.map((entry) => (entry.id === combatant.id ? combatant : entry)) });

/**
 * Ajoute un combattant — un adversaire que le MJ vient de saisir, une
 * créature invoquée en cours de combat. Renomme au passage s'il porte déjà le
 * nom d'un autre : deux « Gobelin » à la table sont invivables à cibler.
 *
 * L'ordre d'initiative n'a rien à recalculer : `orderedCombatants` le fait à
 * la lecture, et un combattant qui rejoint milieu de round y prend
 * naturellement sa place au tour suivant.
 */
export const addCombatant = (state: EncounterState, combatant: Combatant): EncounterState =>
  ({ ...state, combatants: withDistinctNames([...state.combatants, combatant]) });

/**
 * Ajoute plusieurs combattants d'un coup — déclencher une rencontre préparée
 * (voir `jg_encounter_templates`), c'est ça : le sac de créatures composé à
 * l'avance rejoint la rencontre en cours, sans y toucher pour le reste.
 */
export const addCombatants = (state: EncounterState, combatants: Combatant[]): EncounterState =>
  combatants.reduce(addCombatant, state);

/**
 * Retire un combattant — adversaire ajouté par erreur, ou qu'on ne veut
 * simplement plus voir à la table.
 *
 * `turnIndex` pointe dans la liste TRIÉE (`orderedCombatants`), pas dans
 * `state.combatants` : le retirer déplace donc les positions qui le
 * suivaient d'un cran. On ajuste l'index pour que le MÊME combattant reste
 * actif — sauf si c'est justement lui qu'on retire, auquel cas c'est celui
 * qui prend sa place qui devient actif, exactement comme un tour normal.
 * Le retirer alors qu'il était le dernier de l'ordre boucle comme `nextTurn`
 * : premier de la liste, round suivant.
 */
export function removeCombatant(state: EncounterState, combatantId: string): EncounterState {
  const combatants = state.combatants.filter((combatant) => combatant.id !== combatantId);
  if (combatants.length === state.combatants.length) return state;
  if (state.turnIndex < 0) return { ...state, combatants };
  if (combatants.length === 0) return { ...state, combatants, turnIndex: -1, round: 0 };

  const positionRetiree = orderedCombatants(state).findIndex((combatant) => combatant.id === combatantId);
  const turnIndex = positionRetiree >= 0 && positionRetiree < state.turnIndex
    ? state.turnIndex - 1
    : state.turnIndex;

  return turnIndex >= combatants.length
    ? { ...state, combatants, turnIndex: 0, round: state.round + 1 }
    : { ...state, combatants, turnIndex };
}
