import { classById } from '../content/classes';
import { classFeaturesAt } from '../content/class-features';
import { subclassByName, subclassGroupFor, type SubclassFeature, type SubclassOption } from '../content/subclasses';
import { refreshCompanions } from './companions';
import { abilityModifier, effectiveAbilities, totalLevel, type AbilityScores, type CharacterSheet } from './character';

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

  // Un compagnon primordial grandit avec son Rôdeur : sans ce rafraîchissement,
  // « Niveau + » monterait le personnage sans jamais monter la bête à ses côtés.
  return avecJet.companions?.length ? refreshCompanions(avecJet) : avecJet;
}
