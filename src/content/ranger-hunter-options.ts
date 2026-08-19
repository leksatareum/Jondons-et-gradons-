/**
 * Sous-classe Chasseur (Rôdeur) — choix de niveau 3 (Proie du chasseur) et
 * de niveau 7 (Tactiques défensives). Repêché de
 * `table-connectee/src/App.jsx` (`HUNTER_PREY`, `HUNTER_DEFENSE`).
 *
 * ⚠️ Confiance modérée, pas confirmée page à page contre le PHB 2024
 * papier. En 2014, Proie du chasseur avait une troisième option (Tueur de
 * géants) et Tactiques défensives une troisième option différente (Volonté
 * de fer) que je ne retrouve pas ici — soit le PHB 2024 a effectivement
 * réduit ces choix à deux et trois options respectivement, soit il en
 * manque une. À vérifier si un jour un Rôdeur de la table choisit le
 * Chasseur (c'est la sous-classe listée par défaut dans l'ancienne app,
 * donc plausible).
 */
export interface HunterOption {
  id: string;
  name: string;
  desc: string;
}

export const HUNTER_PREY: HunterOption[] = [
  { id: 'colossus-slayer', name: 'Tueur de colosses', desc: 'Une fois par tour, +1d8 contre une cible déjà blessée touchée par une arme.' },
  { id: 'horde-breaker', name: 'Briseur de horde', desc: 'Une attaque supplémentaire contre une autre créature proche de la cible initiale.' },
];

export const HUNTER_DEFENSE: HunterOption[] = [
  { id: 'escape-horde', name: "Échapper à la horde", desc: "Les attaques d'opportunité contre toi ont le désavantage." },
  { id: 'multiattack-defense', name: 'Défense contre les attaques multiples', desc: "+4 CA contre les attaques suivantes du même assaillant après son premier coup au même tour." },
  { id: 'hunter-leap', name: 'Bond du chasseur', desc: "Une fois par tour, un déplacement de 1,50 m avant un saut évite que ce saut consomme ta vitesse." },
];
