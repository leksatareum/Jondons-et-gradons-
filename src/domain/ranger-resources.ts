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
 * Marque du chasseur sans emplacement (Ennemi juré, niveau 1) : une table par
 * palier de niveau de Rôdeur, tous les usages revenant au repos long.
 *
 * PHB 2024 : 1–4 → 2, 5–8 → 3, 9–12 → 4, 13–16 → 5, 17–20 → 6. Ces nombres
 * coïncident avec le bonus de maîtrise, mais la règle ne dit pas « bonus de
 * maîtrise » : elle donne une table de niveaux de CLASSE. Écrire `proficiencyBonus`
 * donnait le bon nombre pour un Rôdeur pur et un nombre faux pour un
 * multiclassé — un Rôdeur 1 / Magicien 10 a un bonus de +4 et deux usages.
 */
export const hunterMarkFreeCastUses = (level: number): number => {
  if (level < 1) return 0;
  if (level < 5) return 2;
  if (level < 9) return 3;
  if (level < 13) return 4;
  if (level < 17) return 5;
  return 6;
};

/**
 * Voile de la nature (niveau 14) : Invisible en action bonus jusqu'à la fin
 * du tour suivant, un nombre de fois égal au modificateur de Sagesse
 * (minimum 1), récupéré à un repos long.
 */
export const natureVeilUses = (level: number, wisdomModifier: number): number =>
  level >= 14 ? Math.max(1, wisdomModifier) : 0;
