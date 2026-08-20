/**
 * Bonus de maîtrise — dérivé du seul niveau total du personnage. Inchangé
 * depuis 2014, vérifié contre le PHB 2024. Repêché de `table-connectee`
 * (fonction locale `profByLevel` d'`App.jsx`, jamais exportée).
 */
export const proficiencyBonus = (level: number): number =>
  2 + Math.floor((Math.max(1, Math.floor(level)) - 1) / 4);

/**
 * Bonus de maîtrise d'une créature, dérivé de son Facteur de Puissance —
 * même table que pour un personnage, mais indexée par FP plutôt que par
 * niveau. Inchangée depuis 2014, vérifiée contre le Manuel des Monstres 2024.
 * Le FP est une chaîne (« 1/8 », « 1/2 », « 5 »…) telle qu'affichée au bestiaire.
 */
export const proficiencyBonusForChallengeRating = (cr: string): number => {
  const valeur = cr.includes('/') ? Number(cr.split('/')[0]) / Number(cr.split('/')[1]) : Number(cr);
  const fp = Number.isFinite(valeur) ? valeur : 0;
  if (fp >= 29) return 9;
  if (fp >= 25) return 8;
  if (fp >= 21) return 7;
  if (fp >= 17) return 6;
  if (fp >= 13) return 5;
  if (fp >= 9) return 4;
  if (fp >= 5) return 3;
  return 2;
};
