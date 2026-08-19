export type CoverageLevel = 'automated' | 'assisted' | 'reference';

export type RuleCoverageArea = {
  id: string;
  label: string;
  level: CoverageLevel;
  tested: boolean;
  detail: string;
};

/**
 * Registre de couverture produit. Il mesure le comportement de l'application,
 * pas la présence d'un paragraphe dans le compendium.
 */
export const RULE_COVERAGE: RuleCoverageArea[] = [
  { id: 'd20', label: 'Tests de d20', level: 'automated', tested: true, detail: 'Avantage, désavantage, maîtrise, expertise, passifs et épuisement.' },
  { id: 'damage', label: 'Dégâts et PV', level: 'automated', tested: true, detail: 'Types, immunités, résistances, vulnérabilités, PV temporaires et concentration.' },
  { id: 'death', label: 'Inconscience et mort', level: 'automated', tested: true, detail: 'Zéro PV, dégâts subis à terre et sauvegardes contre la mort.' },
  { id: 'actions', label: 'Économie d’action', level: 'automated', tested: true, detail: 'Action, action bonus, réaction, attaques multiples et limites par tour.' },
  { id: 'masteries', label: 'Maîtrises d’armes', level: 'automated', tested: true, detail: 'Les huit maîtrises, leurs déclencheurs et limites principales.' },
  { id: 'rests', label: 'Repos et ressources', level: 'automated', tested: true, detail: 'Repos court/long, dés de vie, sommeil, interruptions et récupérations.' },
  { id: 'multiclass', label: 'Progression et multiclassage', level: 'automated', tested: true, detail: 'Niveaux 1–20, prérequis, dés de vie et emplacements combinés.' },
  { id: 'spell-management', label: 'Gestion de la magie', level: 'automated', tested: true, detail: 'Préparation, grimoire, emplacements, pacte, composantes et concentration.' },
  { id: 'movement', label: 'Mouvement et saut', level: 'automated', tested: true, detail: 'Coûts, terrain difficile, déplacement spécial, relevé et sauts.' },
  { id: 'conditions', label: 'États', level: 'assisted', tested: true, detail: 'Les modificateurs courants sont appliqués ; les sources, portées et fins complexes restent confirmées.' },
  { id: 'spells', label: 'Effets des 391 sorts', level: 'assisted', tested: false, detail: 'Lancement et ressources suivis ; toutes les zones, cibles et répétitions ne sont pas encore résolues.' },
  { id: 'class-features', label: 'Capacités de classe', level: 'assisted', tested: false, detail: 'Progressions et ressources présentes ; automatismes individuels encore incomplets.' },
  { id: 'subclasses', label: '48 sous-classes', level: 'assisted', tested: false, detail: 'Toutes sont sélectionnables ; leurs déclencheurs ne sont pas tous motorisés.' },
  { id: 'equipment', label: 'Équipement et artisanat', level: 'assisted', tested: true, detail: 'Monnaie, charge, contenants et projets suivis ; usages situationnels confirmés à la table.' },
  { id: 'exploration', label: 'Exploration et voyage', level: 'reference', tested: false, detail: 'Référence consultable, moteur de voyage et de visibilité encore à construire.' },
  { id: 'social', label: 'Interaction sociale', level: 'reference', tested: false, detail: 'Attitudes et influence restent arbitrées par le meneur.' },
  { id: 'spatial-combat', label: 'Combat spatial', level: 'reference', tested: false, detail: 'Portée réelle, lignes de vue, couvert et zones restent liés au plateau physique.' },
  { id: 'creatures', label: 'Créatures', level: 'assisted', tested: false, detail: '51 profils compacts ; actions et blocs complets à enrichir.' },
];

export const coverageCounts = () => RULE_COVERAGE.reduce((counts, area) => {
  counts[area.level] += 1;
  return counts;
}, { automated: 0, assisted: 0, reference: 0 } as Record<CoverageLevel, number>);

