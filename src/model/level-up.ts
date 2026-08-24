import { classById } from '../content/classes';
import { classFeaturesAt } from '../content/class-features';
import { subclassByName, subclassGroupFor, type SubclassFeature, type SubclassOption } from '../content/subclasses';
import { refreshCompanions } from './companions';
import { abilityModifier, effectiveAbilities, totalLevel, type AbilityScores, type CharacterSheet } from './character';
import {
  ajouterArcanum, ajouterInvocation, arcanumChoisis, invocationsAChoisir, invocationsChoisies,
  invocationsDisponibles, rangsArcanumAChoisir, remplacerArcanum, remplacerInvocation,
} from './invocations';

/**
 * Monter d'un niveau.
 *
 * Presque tout se dérive du niveau : emplacements, sorts préparables,
 * capacités, maîtrise. Monter de niveau ne consiste donc pas à recopier une
 * fiche, mais à recueillir les trois seules choses que le niveau ne dit pas —
 * le jet de dé de vie, la sous-classe quand elle s'ouvre, et l'augmentation de
 * caractéristique quand elle arrive. Le reste suit tout seul.
 */

export interface LevelUpPlan {
  classId: string;
  className: string;
  from: number;
  to: number;
  /** Niveau du personnage après la montée, toutes classes confondues. */
  characterLevel: number;
  hitDie: number;
  /** Valeur fixe si le joueur préfère ne pas jeter le dé. */
  average: number;
  /** Sous-classe à choisir maintenant, si le niveau l'ouvre et qu'aucune ne l'est. */
  subclass: { label: string; options: SubclassOption[] } | null;
  /** Le niveau ouvre une augmentation de caractéristique ou un don. */
  asi: boolean;
  /** Ce que la classe apporte à ce niveau. */
  features: string[];
  /**
   * Ce que la sous-classe déjà choisie apporte à ce niveau.
   *
   * Séparé des capacités de classe parce qu'au niveau où la sous-classe se
   * choisit, la classe elle-même ne donne souvent rien : un druide de niveau 3
   * gagne tout son Cercle et rien d'autre. Ne montrer que `features` laisserait
   * croire que le niveau est vide.
   */
  subclassFeatures: SubclassFeature[];
  /**
   * Les PV de cette fiche viennent d'un total imposé à l'import, sans détail
   * des jets. La montée s'ajoute au total au lieu d'être recalculée — sans
   * quoi les points de vie d'un personnage joué changeraient sous ses yeux.
   */
  usesOverride: boolean;
  /**
   * Occultiste : invocations à choisir en plus, remplacement offert, rangs
   * d'Arcanum à choisir.
   *
   * Le formulaire ne demandait que trois choses — jet de dé, sous-classe,
   * augmentation — comme si les autres classes n'avaient rien à décider. Un
   * Occultiste qui passe au niveau 5 gagne deux invocations et le droit d'en
   * échanger une ; celui qui passe au niveau 11 choisit un sort de rang 6.
   * Rien de tout cela ne se dérive : ce sont des décisions.
   */
  warlock: {
    /** Invocations supplémentaires dues par la table après la montée. */
    invocationsToChoose: number;
    /** Vrai à CHAQUE niveau d'Occultiste : on peut échanger une invocation. */
    mayReplaceInvocation: boolean;
    /**
     * Les invocations proposables, calculées au niveau D'APRÈS la montée.
     *
     * Les calculer au niveau actuel privait le joueur de tout ce que le
     * nouveau niveau vient précisément d'ouvrir : un Occultiste qui passe
     * au niveau 5 ne se serait pas vu proposer Lame assoiffée.
     */
    invocationOptions: { id: string; name: string; desc: string }[];
    /** Rangs d'Arcanum que ce niveau ouvre (11 → 6, 13 → 7, 15 → 8, 17 → 9). */
    arcanumRanks: number[];
    /** Vrai dès qu'un Arcanum existe : il peut être échangé, à rang égal. */
    mayReplaceArcanum: boolean;
  } | null;
}

/** Ce qu'une sous-classe apporte exactement à ce niveau, pas avant, pas après. */
export const subclassFeaturesAtLevel = (name: string | null | undefined, level: number): SubclassFeature[] =>
  (subclassByName(name)?.features ?? []).filter((feature) => feature.level === level);

export function levelUpPlan(sheet: CharacterSheet, classId: string): LevelUpPlan | null {
  const entree = sheet.classLevels.find((niveau) => niveau.classId === classId);
  const klass = classById(classId);
  if (!entree || !klass) return null;

  const to = entree.level + 1;
  if (to > 20) return null;

  const groupe = subclassGroupFor(classId);
  const ouvreSousClasse = groupe != null && to >= groupe.choiceLevel && !entree.subclass;

  return {
    classId,
    className: klass.name,
    from: entree.level,
    to,
    characterLevel: totalLevel(sheet) + 1,
    hitDie: klass.hitDie,
    average: Math.floor(klass.hitDie / 2) + 1,
    subclass: ouvreSousClasse ? { label: groupe.label, options: groupe.options } : null,
    asi: klass.asi.includes(to),
    features: classFeaturesAt(classId, to),
    subclassFeatures: entree.subclass ? subclassFeaturesAtLevel(entree.subclass, to) : [],
    usesOverride: typeof sheet.maxHpOverride === 'number',
    warlock: classId === 'occultiste' ? warlockDecisions(sheet, to) : null,
  };
}

/**
 * Ce que la montée d'un niveau d'Occultiste réclame, calculé sur la fiche
 * APRÈS la montée : c'est le nouveau niveau qui dit combien d'invocations
 * sont dues et quel rang d'Arcanum s'ouvre.
 */
function warlockDecisions(sheet: CharacterSheet, to: number) {
  const apres: CharacterSheet = {
    ...sheet,
    classLevels: sheet.classLevels.map((niveau) => (
      niveau.classId === 'occultiste' ? { ...niveau, level: to } : niveau
    )),
  };
  return {
    invocationsToChoose: invocationsAChoisir(apres),
    invocationOptions: invocationsDisponibles(apres),
    // « À chaque fois que le personnage gagne un niveau d'Occultiste » : le
    // remplacement ne dépend pas d'un palier, seulement d'en avoir une.
    mayReplaceInvocation: invocationsChoisies(sheet).length > 0,
    arcanumRanks: rangsArcanumAChoisir(apres),
    mayReplaceArcanum: arcanumChoisis(sheet).length > 0,
  };
}

export interface LevelUpChoice {
  classId: string;
  /** Résultat du dé, ou la moyenne si le joueur ne jette pas. */
  hitPointRoll: number;
  /** Sous-classe, quand le niveau l'ouvre. */
  subclass?: string | null;
  /** Augmentation de caractéristique choisie, quand le niveau en ouvre une. */
  improvement?: Partial<AbilityScores>;
  /** Don choisi à la place de l'augmentation. */
  featId?: string;
  /** Occultiste : les invocations nouvellement choisies. */
  invocations?: string[];
  /** Occultiste : l'échange offert à chaque niveau, s'il est utilisé. */
  invocationSwap?: { out: string; in: string } | null;
  /** Occultiste : les Arcanum choisis, un par rang ouvert. */
  arcanum?: { rank: number; spellId: string }[];
  /** Occultiste : l'échange d'un Arcanum contre un sort du MÊME rang. */
  arcanumSwap?: { out: string; in: string } | null;
}

/** Ce qui empêche d'appliquer la montée, en clair. Vide : tout est prêt. */
export function levelUpBlockers(plan: LevelUpPlan, choice: LevelUpChoice): string[] {
  const blocages: string[] = [];
  if (choice.hitPointRoll < 1 || choice.hitPointRoll > plan.hitDie) {
    blocages.push(`Le jet doit être entre 1 et ${plan.hitDie}.`);
  }
  if (plan.subclass && !choice.subclass) {
    blocages.push(`${plan.subclass.label} : il faut en choisir une.`);
  }
  if (plan.asi && !choice.improvement && !choice.featId) {
    blocages.push('Ce niveau ouvre une augmentation de caractéristique ou un don.');
  }
  if (choice.improvement) {
    const total = Object.values(choice.improvement).reduce((somme, n) => somme + (n ?? 0), 0);
    if (total !== 2) blocages.push('Une augmentation vaut +2 en tout : +2 sur une, ou +1 sur deux.');
  }
  if (plan.warlock) {
    const prises = choice.invocations?.length ?? 0;
    if (prises < plan.warlock.invocationsToChoose) {
      const reste = plan.warlock.invocationsToChoose - prises;
      blocages.push(`Il reste ${reste} invocation(s) occulte(s) à choisir.`);
    }
    const arcanes = choice.arcanum?.length ?? 0;
    if (arcanes < plan.warlock.arcanumRanks.length) {
      const rangs = plan.warlock.arcanumRanks.join(', ');
      blocages.push(`Arcanum mystique : il faut choisir un sort de rang ${rangs}.`);
    }
  }
  return blocages;
}

/**
 * Points de vie gagnés, quand la fiche porte un total imposé.
 *
 * Le jet, plus le modificateur de Constitution — et, si l'augmentation vient
 * de monter la Constitution, le point rétroactif que chaque niveau déjà acquis
 * y gagne. Sans ce rattrapage, augmenter sa Constitution ne rapporterait rien
 * aux niveaux passés, alors que la règle le prévoit.
 */
function hpGainOnOverride(
  sheet: CharacterSheet,
  suivante: CharacterSheet,
  roll: number,
): number {
  const avant = abilityModifier(effectiveAbilities(sheet).con);
  const apres = abilityModifier(effectiveAbilities(suivante).con);
  const niveauxAcquis = totalLevel(sheet);
  return roll + apres + (apres - avant) * niveauxAcquis;
}

export function applyLevelUp(
  sheet: CharacterSheet,
  plan: LevelUpPlan,
  choice: LevelUpChoice,
): CharacterSheet {
  const classLevels = sheet.classLevels.map((niveau) => (
    niveau.classId === plan.classId
      ? {
          ...niveau,
          level: plan.to,
          ...(choice.subclass ? { subclass: choice.subclass } : {}),
        }
      : niveau
  ));

  const suivante: CharacterSheet = {
    ...sheet,
    classLevels,
    ...(choice.improvement
      ? { abilityImprovements: [...sheet.abilityImprovements, choice.improvement] }
      : {}),
    ...(choice.featId
      ? { featIds: [...new Set([...sheet.featIds, choice.featId])] }
      : {}),
  };

  const avecJet: CharacterSheet = plan.usesOverride
    ? {
        ...suivante,
        maxHpOverride: (sheet.maxHpOverride ?? 0) + hpGainOnOverride(sheet, suivante, choice.hitPointRoll),
        // Le jet est consigné malgré tout : le jour où le total imposé sera
        // levé, l'historique aura commencé à se reconstituer.
        hitPointRolls: [...(sheet.hitPointRolls ?? []), choice.hitPointRoll],
      }
    : { ...suivante, hitPointRolls: [...(sheet.hitPointRolls ?? []), choice.hitPointRoll] };

  // Les choix d'Occultiste s'appliquent APRÈS la montée : le remplacement
  // vérifie ses prérequis sur la fiche telle qu'elle sera, et un Arcanum de
  // rang 6 ne s'écrit qu'une fois le niveau 11 acquis.
  let avecOccultiste = avecJet;
  const echange = choice.invocationSwap;
  if (echange) avecOccultiste = remplacerInvocation(avecOccultiste, echange.out, echange.in);
  for (const invocation of choice.invocations ?? []) {
    avecOccultiste = ajouterInvocation(avecOccultiste, invocation);
  }
  const echangeArcanum = choice.arcanumSwap;
  if (echangeArcanum) avecOccultiste = remplacerArcanum(avecOccultiste, echangeArcanum.out, echangeArcanum.in);
  for (const arcanum of choice.arcanum ?? []) {
    avecOccultiste = ajouterArcanum(avecOccultiste, arcanum.rank, arcanum.spellId);
  }

  // Un compagnon primordial grandit avec son Rôdeur : sans ce rafraîchissement,
  // « Niveau + » monterait le personnage sans jamais monter la bête à ses côtés.
  return avecOccultiste.companions?.length ? refreshCompanions(avecOccultiste) : avecOccultiste;
}
