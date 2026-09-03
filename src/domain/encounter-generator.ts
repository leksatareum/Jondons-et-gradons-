import type { CreatureTemplate } from '../content/creatures';
import type { Combatant } from './encounter';

/**
 * Le budget d'une rencontre, et ce qui rend le chiffre faux.
 *
 * ═══ La règle ═══
 *
 * Guide du Maître 2024, « Combat Encounter Difficulty » (p. 114) : on choisit
 * une difficulté, on croise le niveau du groupe dans la table des PX par
 * personnage, on multiplie par le nombre de personnages, et on dépense en
 * additionnant les PX des créatures. Pas de multiplicateur pour le nombre
 * d'ennemis — c'était la règle de 2014, elle a sauté.
 *
 * ═══ Ce que le budget ne voit pas ═══
 *
 * Le livre le dit lui-même dans son encadré « Troubleshooting », et c'est ce
 * que `evaluerRencontre` ajoute au simple total : au-delà de deux créatures
 * par personnage, une série de bons jets côté monstres fait plus de dégâts
 * que le budget ne le laisse croire, et il faut alors des créatures fragiles
 * qui tombent vite — « especially important for characters of level 1 or 2 ».
 * Les créatures de FP 0 sont à employer avec parcimonie ; pour une nuée, le
 * livre renvoie aux profils de nuée du Manuel des Monstres.
 *
 * ═══ Provenance ═══
 *
 * Les deux tables sont lues dans les livres, pas reconstituées : le budget
 * dans le Guide du Maître p. 115, les PX par FP dans le Manuel des Monstres
 * p. 8. Elles se recoupent par les exemples chiffrés du Guide — un Géant du
 * feu (FP 9) y vaut 5 000 PX et un Dragon rouge adulte (FP 17) 18 000, ce
 * que les deux tables redonnent exactement.
 */

export type Difficulte = 'faible' | 'moderee' | 'elevee';

/** Ce que la difficulté PROMET à la table — les mots du Guide, pas une glose. */
export const SENS_DIFFICULTE: Record<Difficulte, string> = {
  faible: 'Une ou deux frayeurs, mais le groupe s’en sort sans perte. Il y laissera peut-être des soins.',
  moderee: 'Sans soins ni ressources, ça peut mal tourner. Un personnage fragile peut tomber, et il existe un risque faible de mort.',
  elevee: 'Peut tuer un ou plusieurs personnages. Il leur faudra de bonnes tactiques, de la présence d’esprit, et un peu de chance.',
};

/**
 * PX par personnage, par niveau et par difficulté — Guide du Maître 2024,
 * p. 115. Table complète du niveau 1 au niveau 20 : l'ancienne version de ce
 * fichier s'arrêtait au niveau 5 faute de source, et refusait au-delà.
 */
const BUDGET_PAR_PERSONNAGE: Record<number, Record<Difficulte, number>> = {
  1: { faible: 50, moderee: 75, elevee: 100 },
  2: { faible: 100, moderee: 150, elevee: 200 },
  3: { faible: 150, moderee: 225, elevee: 400 },
  4: { faible: 250, moderee: 375, elevee: 500 },
  5: { faible: 500, moderee: 750, elevee: 1100 },
  6: { faible: 600, moderee: 1000, elevee: 1400 },
  7: { faible: 750, moderee: 1300, elevee: 1700 },
  8: { faible: 1000, moderee: 1700, elevee: 2100 },
  9: { faible: 1300, moderee: 2000, elevee: 2600 },
  10: { faible: 1600, moderee: 2300, elevee: 3100 },
  11: { faible: 1900, moderee: 2900, elevee: 4100 },
  12: { faible: 2200, moderee: 3700, elevee: 4700 },
  13: { faible: 2600, moderee: 4200, elevee: 5400 },
  14: { faible: 2900, moderee: 4900, elevee: 6200 },
  15: { faible: 3300, moderee: 5400, elevee: 7800 },
  16: { faible: 3800, moderee: 6100, elevee: 9800 },
  17: { faible: 4500, moderee: 7200, elevee: 11700 },
  18: { faible: 5000, moderee: 8700, elevee: 14200 },
  19: { faible: 5500, moderee: 10700, elevee: 17200 },
  20: { faible: 6400, moderee: 13200, elevee: 22000 },
};

/** Le budget total de PX de la rencontre, ou `null` hors des niveaux 1 à 20. */
export function budgetDeRencontre(niveauGroupe: number, tailleGroupe: number, difficulte: Difficulte): number | null {
  const table = BUDGET_PAR_PERSONNAGE[Math.round(niveauGroupe)];
  if (!table || tailleGroupe < 1) return null;
  return table[difficulte] * Math.round(tailleGroupe);
}

/** Les trois budgets d'un coup — ce qu'il faut pour SITUER une rencontre, pas seulement en viser une. */
export function budgetsDuGroupe(niveauGroupe: number, tailleGroupe: number): Record<Difficulte, number> | null {
  const table = BUDGET_PAR_PERSONNAGE[Math.round(niveauGroupe)];
  if (!table || tailleGroupe < 1) return null;
  const taille = Math.round(tailleGroupe);
  return { faible: table.faible * taille, moderee: table.moderee * taille, elevee: table.elevee * taille };
}

/**
 * Points d'expérience par facteur de puissance — Manuel des Monstres 2024,
 * p. 8.
 *
 * Le FP 0 vaut « 0 ou 10 » selon le profil ; on retient 10, le seul des deux
 * qui pèse quelque chose dans un budget.
 *
 * Le FP 24 se lit « 52 000 » dans le scan, entre 50 000 et 75 000 : la
 * progression ne laisse la place qu'à 62 000, et le 6 confondu avec un 5 est
 * l'erreur d'océrisation la plus banale de ce livre. Aucune conséquence en
 * pratique — un groupe de niveau 20 s'arrête au budget de 22 000 PX.
 */
const XP_PAR_FP: Record<string, number> = {
  '0': 10, '1/8': 25, '1/4': 50, '1/2': 100,
  '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800,
  '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900,
  '11': 7200, '12': 8400, '13': 10000, '14': 11500, '15': 13000,
  '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000,
  '21': 33000, '22': 41000, '23': 50000, '24': 62000, '25': 75000,
  '26': 90000, '27': 105000, '28': 120000, '29': 135000, '30': 155000,
};

/** `0` pour un FP mal formé : exclu du budget plutôt qu'estimé. */
export const xpDuFP = (cr: string): number => XP_PAR_FP[cr] ?? 0;

/** Thèmes de rencontre reconnus par le bestiaire fourni, du plus courant au moins courant. */
export const THEMES_RENCONTRE: [string, string][] = [
  ['bandit', 'Bandits'],
  ['gobelin', 'Gobelins'],
  ['loup', 'Loups'],
  ['mort-vivant', 'Morts-vivants'],
  ['kobold', 'Kobolds'],
  ['ogre', 'Ogres'],
  ['orc', 'Orcs'],
  ['gnoll', 'Gnolls'],
];

/** Un avertissement tiré de l'encadré « Troubleshooting » du Guide, jamais une invention. */
export type AvertissementRencontre = {
  /** `danger` : la rencontre sera plus dure que son budget. `note` : à surveiller. */
  gravite: 'danger' | 'note';
  texte: string;
};

export type EvaluationRencontre = {
  /** Somme des PX des créatures — les personnages joueurs ne comptent pas. */
  xp: number;
  /** Nombre de créatures hostiles. */
  creatures: number;
  /** Les trois seuils du groupe, ou `null` si le niveau sort de la table. */
  budgets: Record<Difficulte, number> | null;
  /**
   * La bande atteinte. `null` quand le budget est inconnu ; `'au-dela'`
   * au-dessus du seuil « élevée » — le Guide ne nomme rien au-delà, et un
   * chiffre sans nom vaut mieux qu'un nom inventé.
   */
  difficulte: Difficulte | 'au-dela' | 'aucune' | null;
  avertissements: AvertissementRencontre[];
};

/**
 * Situer une rencontre déjà composée, au lieu d'en engendrer une.
 *
 * C'est le geste que fait vraiment un MJ : il pose trois gobelins et un chef
 * parce que la scène le demande, PUIS il se demande si ça va tuer quelqu'un.
 * Le générateur répond à l'autre question, plus rare.
 */
export function evaluerRencontre(
  creatures: { cr: string }[],
  niveauGroupe: number,
  tailleGroupe: number,
): EvaluationRencontre {
  const xp = creatures.reduce((total, creature) => total + xpDuFP(creature.cr), 0);
  const budgets = budgetsDuGroupe(niveauGroupe, tailleGroupe);

  let difficulte: EvaluationRencontre['difficulte'] = null;
  if (budgets) {
    if (creatures.length === 0) difficulte = 'aucune';
    else if (xp > budgets.elevee) difficulte = 'au-dela';
    else if (xp > budgets.moderee) difficulte = 'elevee';
    else if (xp > budgets.faible) difficulte = 'moderee';
    else difficulte = 'faible';
  }

  const avertissements: AvertissementRencontre[] = [];
  const parPersonnage = tailleGroupe > 0 ? creatures.length / Math.round(tailleGroupe) : 0;
  if (parPersonnage > 2) {
    // Guide du Maître p. 115, « Many Creatures ».
    avertissements.push({
      gravite: niveauGroupe <= 2 ? 'danger' : 'note',
      texte: niveauGroupe <= 2
        ? `Plus de deux créatures par personnage. À bas niveau, une série de bons jets côté monstres fait bien plus mal que le budget ne le dit — mets-y des profils fragiles qui tombent en un coup.`
        : `Plus de deux créatures par personnage : prévois des profils fragiles, qui tombent vite.`,
    });
  }
  const fp0 = creatures.filter((creature) => creature.cr === '0').length;
  if (fp0 > 0) {
    // Guide du Maître p. 115, « CR 0 Creatures ».
    avertissements.push({
      gravite: 'note',
      texte: `${fp0} créature${fp0 > 1 ? 's' : ''} de FP 0 : à employer avec parcimonie. Pour en mettre beaucoup, un profil de nuée vaut mieux.`,
    });
  }
  if (difficulte === 'au-dela' && budgets) {
    avertissements.push({
      gravite: 'danger',
      texte: `${xp - budgets.elevee} PX au-dessus du budget « élevée ». Le Guide ne décrit rien au-delà : à ce stade, prévois une porte de sortie — des ennemis qui fuient, ou un renfort de ton côté.`,
    });
  }
  return { xp, creatures: creatures.length, budgets, difficulte, avertissements };
}

/** Les créatures HOSTILES d'une rencontre : le groupe ne compte pas dans son propre budget. */
export const creaturesHostiles = (combatants: readonly Combatant[]): Combatant[] =>
  combatants.filter((combatant) => combatant.side === 'creature');

/**
 * Ce qui rend une rencontre intéressante autrement qu'en montant le budget —
 * Guide du Maître 2024, p. 114.
 *
 * Cette liste n'est pas décorative : c'est le levier que le livre met en face
 * du budget de PX. Deux gobelins sur un balcon, au-dessus d'un tas de caisses,
 * ne coûtent pas un PX de plus que deux gobelins dans un couloir vide, et ne
 * jouent pas du tout pareil. Elle est affichée au MJ pendant qu'il compose,
 * là où elle sert — pas rangée dans un écran de règles qu'on n'ouvre jamais.
 */
export const LEVIERS_DE_SCENE: { titre: string; texte: string }[] = [
  {
    titre: 'Du relief',
    texte: 'Caisses empilées, corniche, balcon : ce qui récompense un bon placement et pousse à sauter, grimper, voler.',
  },
  {
    titre: 'Des positions défendues',
    texte: 'Un ennemi difficile à atteindre force ceux qui tirent de loin à bouger.',
  },
  {
    titre: 'Un danger du décor',
    texte: 'Vase verte, gouffre, brasier : les deux camps peuvent s’en servir.',
  },
  {
    titre: 'Des profils mélangés',
    texte: 'Des monstres de types différents combinent leurs capacités, comme un groupe de classes différentes. Une troupe variée est plus forte.',
  },
  {
    titre: 'Une raison de bouger',
    texte: 'Lustre, tonneaux d’huile, rocher qui dévale : ce qui empêche les deux camps de rester plantés.',
  },
];

/**
 * Une composition homogène : une créature choisie au hasard dans les
 * profils qui tiennent dans le budget, répétée jusqu'à environ 85 % du
 * budget — ou jusqu'à 12 exemplaires, pour rester jouable à la table. La
 * seule règle assurée est le budget ; la répartition (chef + sbires,
 * embuscade…) reste au MJ, qui connaît sa scène mieux qu'un algorithme.
 *
 * `theme`, s'il est fourni, restreint le tirage aux créatures qui portent
 * cette étiquette (voir `CreatureTemplate.theme`) — pour diriger le genre
 * de rencontre (bandits, gobelins, loups…) plutôt que de laisser le hasard
 * choisir parmi tout le bestiaire.
 */
export function suggererComposition(
  budget: number,
  bestiaire: readonly CreatureTemplate[],
  random: () => number = Math.random,
  theme?: string | null,
): CreatureTemplate[] {
  const bassin = theme ? bestiaire.filter((creature) => creature.theme?.includes(theme)) : bestiaire;
  const utilisables = bassin.filter((creature) => {
    const cout = xpDuFP(creature.cr);
    return cout > 0 && cout <= budget;
  });
  if (utilisables.length === 0) return [];

  // FP 0 écarté par défaut : seul, un profil à 10 PX ne donne jamais une
  // vraie menace, seulement un essaim ingérable (douze faucons pour 600 PX,
  // par exemple). On n'y retombe que si rien d'autre ne rentre dans le budget.
  const prioritaires = utilisables.filter((creature) => creature.cr !== '0');
  const pool = prioritaires.length > 0 ? prioritaires : utilisables;

  const base = pool[Math.floor(random() * pool.length)];
  const cout = xpDuFP(base.cr);
  const composition: CreatureTemplate[] = [];
  let depense = 0;
  while (depense + cout <= budget && composition.length < 12) {
    composition.push(base);
    depense += cout;
    if (depense >= budget * 0.85) break;
  }
  return composition;
}
