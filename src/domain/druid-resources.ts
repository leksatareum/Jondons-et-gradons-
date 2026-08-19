/**
 * Ressources du Druide dérivées du niveau — jamais stockées. Repêchées de
 * `table-connectee/src/App.jsx` (`CLASS_RESOURCES.druide`), vérifiées le
 * 19/08/2026 contre le tableau de classe du PHB 2024 papier de l'utilisateur.
 */

const clampLevel = (level: number): number => Math.max(1, Math.min(20, Math.floor(level)));

/**
 * Forme sauvage : nombre d'utilisations. Paliers confirmés PHB 2024 —
 * 2 aux niveaux 2-5, 3 aux niveaux 6-16, 4 aux niveaux 17-20. Une seule
 * utilisation revient après un repos court ; toutes reviennent après un
 * repos long.
 */
export const wildShapeUses = (level: number): number => {
  const lv = clampLevel(level);
  if (lv < 2) return 0;
  if (lv < 6) return 2;
  if (lv < 17) return 3;
  return 4;
};

/** Une utilisation de Forme sauvage revient après un repos court. */
export const wildShapeShortRestRecovery = 1;

/**
 * Résurgence sauvage (niveau 5+) : à l'initiative sans Forme sauvage active,
 * récupère une utilisation gratuitement. Une fois par repos long, échange
 * aussi une utilisation de Forme sauvage contre un emplacement de niveau 1,
 * ou l'inverse.
 */
export const hasWildResurgence = (level: number): boolean => clampLevel(level) >= 5;
