/**
 * Ressources propres à chaque Patron de l'Occultiste — dérivées du niveau ou
 * de la caractéristique, jamais stockées. Repêchées de
 * `table-connectee/src/App.jsx` (`SUBCLASS_RESOURCES`), pas encore
 * confrontées page à page au PHB 2024 papier — confiance détaillée par
 * capacité ci-dessous. Aucune n'a déclenché de plugin de correction.
 *
 * `abilityModifier` est toujours le modificateur de Charisme (caractéristique
 * d'incantation de l'Occultiste), sauf mention contraire.
 */

const clampLevel = (level: number): number => Math.max(1, Math.min(20, Math.floor(level)));

/**
 * Patron Céleste — Lumière guérisseuse (niveau 3+) : réserve de d6 dépensés
 * en action bonus pour soigner. Motif simple (niveau + 1), plausible mais
 * pas confirmé page à page.
 */
export const celestialHealingLightDice = (level: number): number => {
  const lv = clampLevel(level);
  return lv >= 3 ? lv + 1 : 0;
};

/**
 * Patron Fiélon — Chance du Ténébreux (niveau 6+) : ajoute 1d10 à un test de
 * caractéristique ou une sauvegarde. Usages = modificateur de Charisme,
 * minimum 1. Motif identique à Voile de la nature (Rôdeur) et vérifié
 * contre la règle connue (« Dark One's Own Luck »).
 */
export const fiendDarkOnesLuckUses = (level: number, charismaModifier: number): number =>
  clampLevel(level) >= 6 ? Math.max(1, charismaModifier) : 0;

/**
 * Patron Grand Ancien — Combattant clairvoyant (niveau 6+) : lien
 * psychique en action bonus. Progression identique au bonus de maîtrise à
 * partir du niveau 6 (3/4/5/6) — motif cohérent, pas confirmé page à page.
 */
export const greatOldOneClairvoyantCombatantUses = (level: number): number => {
  const lv = clampLevel(level);
  if (lv < 6) return 0;
  if (lv < 9) return 3;
  if (lv < 13) return 4;
  if (lv < 17) return 5;
  return 6;
};

/**
 * Patron Archifée — Pas des fées (niveau 3+) : Pas brumeux sans emplacement
 * plus un effet féerique au choix. Progression identique au bonus de
 * maîtrise à partir du niveau 3 (2/3/4/5/6) — motif cohérent, pas confirmé
 * page à page. À ne pas confondre avec le « Pas des fées » du Rôdeur
 * Vagabond féerique (niveau 11, modificateur de Sagesse) : même nom
 * français, deux capacités différentes.
 */
export const archfeyFeyStepUses = (level: number): number => {
  const lv = clampLevel(level);
  if (lv < 3) return 0;
  if (lv < 5) return 2;
  if (lv < 9) return 3;
  if (lv < 13) return 4;
  if (lv < 17) return 5;
  return 6;
};
