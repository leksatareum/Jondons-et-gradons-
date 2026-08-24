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
 * Résurgence sauvage (niveau 5+).
 *
 * ⚠️ Ce commentaire décrivait la mauvaise règle : il confondait Résurgence
 * sauvage avec Forme sauvage pérenne de l'Archidruide (niveau 20), qui elle
 * rend une utilisation à l'Initiative. PHB 2024 p. 81 : Résurgence sauvage
 * permet, une fois par tour et SEULEMENT s'il ne reste aucune utilisation,
 * de dépenser un emplacement pour en retrouver une ; et, une fois avant un
 * repos long, de convertir une utilisation en un emplacement de rang 1.
 * La règle appliquée vit dans `src/model/druide.ts`.
 */
export const hasWildResurgence = (level: number): boolean => clampLevel(level) >= 5;

/**
 * Magicien de la nature (Archidruide, niveau 20) : sans action, convertit des
 * utilisations de Forme sauvage non dépensées en un seul emplacement de sort,
 * à raison de deux niveaux de sort par utilisation. Une fois par repos long.
 *
 * Absent du texte source d'App.jsx : ajouté par la chaîne de plugins, donc
 * repêché de la sortie construite.
 */
export const hasNatureMagician = (level: number): boolean => clampLevel(level) >= 20;

/** Deux niveaux de sort par utilisation de Forme sauvage convertie. */
export const natureMagicianSlotLevelFrom = (wildShapeUsesSpent: number): number =>
  Math.max(0, Math.floor(wildShapeUsesSpent)) * 2;
