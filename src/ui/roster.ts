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
 * Complète la rencontre avec les joueurs qui n'y sont pas encore.
 *
 * Ajoute, ne remplace jamais : un combattant déjà présent porte les dégâts que
 * le MJ lui a donnés pendant le combat, et les réécrire depuis la fiche les
 * effacerait au premier rendu. C'est aussi ce qui permet à l'écran du MJ de
 * montrer le groupe avant même qu'une rencontre existe en base.
 */
export function withParty(state: EncounterState, sheets: StoredSheet[]): EncounterState {
  const present = new Set(state.combatants.map((combatant) => combatant.id));
  const manquants = sheets
    .filter((sheet) => !present.has(sheet.id))
    .map((sheet) => combatantFromSheet(sheet.data, sheet.id));
  if (manquants.length === 0) return state;
  return { ...state, combatants: [...state.combatants, ...manquants] };
}
