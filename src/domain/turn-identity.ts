import { activeCombatant, type EncounterState } from './encounter';

/**
 * L'identité d'un tour.
 *
 * L'écran de combat retenait localement quelles économies d'action avaient
 * été dépensées (`spent.action`, `spent.bonus`, `spent.reaction`) sans jamais
 * remettre ce compteur à zéro : une Action dépensée à un tour restait dépensée
 * au suivant, et le joueur voyait « Action » barrée pour le reste du combat.
 *
 * Une dépense appartient AU TOUR pendant lequel elle a eu lieu. Il faut donc
 * une identité de tour stable — même valeur tant qu'on est dans le même tour,
 * valeur différente dès qu'on en change — pour savoir quand l'oublier.
 *
 * Trois composantes suffisent : la rencontre, le round, et qui joue. Le
 * round seul ne suffirait pas (tous les combattants d'un round le
 * partagent) ; le combattant seul non plus (il rejoue au round suivant).
 */
export function turnIdentity(
  encounterId: string | null | undefined,
  state: EncounterState | null | undefined,
): string {
  // Hors combat il n'y a pas de tour : une seule identité stable, et aucune
  // économie d'action à suivre (l'écran ne l'affiche d'ailleurs pas).
  if (!state || state.turnIndex < 0) return 'libre';
  const actif = activeCombatant(state);
  return `${encounterId ?? 'sans-rencontre'}#${state.round}#${actif?.id ?? 'personne'}`;
}
