import type { CreatureTemplate } from '../content/creatures';

/**
 * Suggérer une composition de rencontre à partir d'un budget de PX.
 *
 * Le DMG 2024 (pas le PHB) fixe pour chaque niveau de personnage un budget de
 * PX par difficulté ; on le multiplie par la taille du groupe, puis on
 * compare la somme des PX des adversaires à ce budget — sans multiplicateur
 * pour plusieurs ennemis, contrairement à l'ancienne règle de 2014. Cette
 * table n'est vérifiée que du niveau 1 à 5 (au-delà, aucune source vérifiée
 * sous la main) : au-delà, `budgetDeRencontre` refuse plutôt que d'inventer.
 */

export type Difficulte = 'faible' | 'moderee' | 'elevee';

const BUDGET_PAR_PERSONNAGE: Record<number, Record<Difficulte, number>> = {
  1: { faible: 50, moderee: 75, elevee: 100 },
  2: { faible: 100, moderee: 150, elevee: 200 },
  3: { faible: 150, moderee: 225, elevee: 400 },
  4: { faible: 250, moderee: 375, elevee: 500 },
  5: { faible: 500, moderee: 750, elevee: 1100 },
};

/** Le budget total de PX de la rencontre, ou `null` hors de la plage vérifiée (niveaux 1 à 5). */
export function budgetDeRencontre(niveauGroupe: number, tailleGroupe: number, difficulte: Difficulte): number | null {
  const table = BUDGET_PAR_PERSONNAGE[Math.round(niveauGroupe)];
  if (!table || tailleGroupe < 1) return null;
  return table[difficulte] * Math.round(tailleGroupe);
}

/** Points d'expérience par facteur de puissance — table stable du Manuel des monstres. */
const XP_PAR_FP: Record<string, number> = {
  '0': 10, '1/8': 25, '1/4': 50, '1/2': 100,
  '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800,
};

/** `0` pour un FP hors table (au-delà de 5, ou mal formé) : exclu du budget plutôt qu'estimé. */
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
