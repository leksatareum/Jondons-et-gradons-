/**
 * Bonus de maîtrise — dérivé du seul niveau total du personnage. Inchangé
 * depuis 2014, vérifié contre le PHB 2024. Repêché de `table-connectee`
 * (fonction locale `profByLevel` d'`App.jsx`, jamais exportée).
 */
export const proficiencyBonus = (level: number): number =>
  2 + Math.floor((Math.max(1, Math.floor(level)) - 1) / 4);
