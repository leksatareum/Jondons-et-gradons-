import { pactMagicSlots } from './spellcasting-progression';

/**
 * Ruse magique et Maître occulte — Occultiste. Repêchées de
 * `table-connectee/src/App.jsx` (`CLASS_RESOURCES.occultiste`), vérifiées le
 * 19/08/2026 contre le PHB 2024 papier de l'utilisateur.
 *
 * Ruse magique (niveau 2) : après un rituel d'une minute, récupère un
 * nombre d'emplacements de Magie de pacte dépensés égal au maximum à la
 * moitié de son nombre maximal d'emplacements (arrondie au supérieur), une
 * fois par repos long. Maître occulte (niveau 20) transforme la récupération
 * en totale : tous les emplacements dépensés reviennent.
 */

export const hasRuseMagique = (level: number): boolean => level >= 2;

/** Emplacements récupérables par Ruse magique — la moitié du maximum, arrondie au supérieur. */
export const ruseMagiqueRecoverableSlots = (level: number): number => {
  if (!hasRuseMagique(level)) return 0;
  const max = pactMagicSlots(level).slots;
  return level >= 20 ? max : Math.ceil(max / 2);
};
