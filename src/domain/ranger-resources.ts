import { proficiencyBonus } from './proficiency';

/**
 * Ressources du Rôdeur dérivées du niveau/de la caractéristique — jamais
 * stockées. Repêchées de `table-connectee/src/App.jsx` (table
 * `CLASS_RESOURCES.rodeur`), vérifiées contre le PHB 2024.
 *
 * L'Infatigable (niveau 10) n'est pas ici : elle existe déjà, correcte et
 * testée, dans `ranger-core-2024.ts` (`tirelessMaxUses`,
 * `applyRangerTirelessShortRest`). Voir `docs/legacy-rules-backlog.md` pour
 * le détail — dans l'ancienne app, cette version correcte n'était câblée
 * nulle part ; le jeu affichait à la place une table figée par niveau qui
 * ignorait la Sagesse du personnage.
 */

/**
 * Marque du chasseur sans emplacement : un nombre d'usages égal au bonus de
 * maîtrise, récupérés à un repos long. Disponible dès le niveau 1.
 */
export const hunterMarkFreeCastUses = (level: number): number => proficiencyBonus(level);

/**
 * Voile de la nature (niveau 14) : Invisible en action bonus jusqu'à la fin
 * du tour suivant, un nombre de fois égal au modificateur de Sagesse
 * (minimum 1), récupéré à un repos long.
 */
export const natureVeilUses = (level: number, wisdomModifier: number): number =>
  level >= 14 ? Math.max(1, wisdomModifier) : 0;
