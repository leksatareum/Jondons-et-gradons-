/**
 * Sous-classe Chasseur (Rôdeur) — Proie du chasseur (niveau 3) et Tactique
 * défensive (niveau 7).
 *
 * Vérifié page à page contre le PHB 2024 (p. 127) : le doute noté ici
 * jusque-là est levé, et il cachait deux erreurs.
 *
 * 1. Proie du chasseur a bien DEUX options en 2024 — Tueur de géants, la
 *    troisième de 2014, a disparu.
 * 2. Tactique défensive n'en a que deux, elle aussi : « Bond du chasseur »
 *    n'existe pas dans le livre et a été retiré.
 * 3. Défense contre les attaques multiples ne donne plus « +4 CA » — c'était
 *    la règle de 2014. En 2024, l'assaillant qui te touche subit le
 *    désavantage sur toutes ses autres attaques contre toi ce tour-ci.
 *
 * Les deux choix se rechoisissent à la fin de CHAQUE repos, court ou long.
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
  { id: 'multiattack-defense', name: 'Défense contre les attaques multiples', desc: "Quand une créature te touche avec un jet d'attaque, elle a le désavantage sur toutes ses autres attaques contre toi jusqu'à la fin de ce tour." },
];
