/**
 * Vocabulaire de recharge — pas une règle du PHB, un classement interne pour
 * décrire quand une ressource se recharge. Repêché de
 * `table-connectee/src/App.jsx` (`RECHARGE`), utile pour typer les
 * ressources de classe/sous-classe au lieu de chaînes de caractères libres.
 */
export type RechargeType =
  | 'court' // repos court
  | 'long' // repos long
  | 'court_ou_long' // l'un ou l'autre
  | 'initiative' // au lancer d'initiative
  | 'tour' // à chaque tour
  | 'condition' // déclenchement particulier, décrit à part
  | 'jamais' // capacité à usage unique définitif
  | 'unknown';

export const RECHARGE_TYPES: readonly RechargeType[] = [
  'court', 'long', 'court_ou_long', 'initiative', 'tour', 'condition', 'jamais', 'unknown',
];
