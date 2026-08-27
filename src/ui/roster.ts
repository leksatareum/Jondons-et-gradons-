import { deriveCharacter } from '../model/derive';
import type { CharacterSheet } from '../model/character';
import type { Combatant, EncounterState } from '../domain/encounter';
import type { StoredSheet } from '../sync/campaign-sync';

/**
 * Le groupe, en combattants.
 *
 * Les points de vie, la classe d'armure et la Dextérité ne sont pas recopiés
 * depuis la fiche : ils en sont dérivés, comme partout ailleurs. Une règle
 * ajoutée demain change donc aussi la ligne d'initiative, sans rien migrer.
 *
 * L'initiative reste à 0 : elle se jette à la table, et rien dans cet écran ne
 * la jette encore. À égalité, l'ordre se règle sur la Dextérité puis sur
 * l'ordre d'ajout — c'est faux comme ordre de combat, mais c'est visiblement
 * faux, ce qui vaut mieux qu'un ordre inventé qui aurait l'air juste.
 */
export function combatantFromSheet(sheet: CharacterSheet, id: string): Combatant {
  const derived = deriveCharacter(sheet);
  return {
    id,
    name: sheet.name,
    side: 'joueur',
    initiative: 0,
    dexterity: derived.modifiers.dex,
    maxHp: derived.maxHp,
    damageTaken: sheet.live.damageTaken,
    temporaryHp: sheet.live.temporaryHp,
    armorClass: derived.armorClass,
    conditions: sheet.live.conditions.map((condition) => condition.id),
  };
}

/**
 * Complète la rencontre avec les joueurs qui n'y sont pas encore, et
 * rafraîchit les PV/CA de ceux qui y sont déjà.
 *
 * Un joueur n'a pas de PV « de rencontre » distincts des siens : sa fiche
 * fait foi, à chaque lecture, jamais figée au moment où il a rejoint le
 * combat — même principe que l'arme en main (`model/weapons.ts`). Les
 * dégâts que le MJ inflige d'ici (`onDegatsJoueur`) écrivent directement sur
 * cette fiche ; sans ce rafraîchissement, la carte du combattant restait sur
 * les PV du round où il a rejoint la rencontre, pendant que la Fiche, elle,
 * suivait — un joueur qui voyait ses dégâts nulle part sur son propre écran
 * de combat.
 *
 * Les conditions, en revanche, restent celles que le MJ pose ici pendant le
 * combat (`basculerEtatDeLaCible`) : la fiche ne les écrase jamais.
 */
export function withParty(state: EncounterState, sheets: StoredSheet[]): EncounterState {
  const parId = new Map(sheets.map((sheet) => [sheet.id, sheet]));
  const combatants = state.combatants.map((combatant) => {
    if (combatant.side !== 'joueur') return combatant;
    const sheet = parId.get(combatant.id);
    if (!sheet) return combatant;
    const { maxHp, damageTaken, temporaryHp, armorClass, dexterity } = combatantFromSheet(sheet.data, sheet.id);
    return { ...combatant, maxHp, damageTaken, temporaryHp, armorClass, dexterity };
  });
  const present = new Set(combatants.map((combatant) => combatant.id));
  const manquants = sheets
    .filter((sheet) => !present.has(sheet.id))
    .map((sheet) => combatantFromSheet(sheet.data, sheet.id));
  return { ...state, combatants: [...combatants, ...manquants] };
}
