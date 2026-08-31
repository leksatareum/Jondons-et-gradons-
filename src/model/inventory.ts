import type { CharacterSheet, InventoryItem } from './character';
import { resolveActionableItem, resolveHealingItem } from '../domain/consumable-ownership';
import { rollFormula, type JetDeDes } from '../domain/dice';
import { heal } from './damage';

/**
 * Le sac.
 *
 * `inventory` et `gold` sont des décisions comme les autres — ce qu'on
 * possède n'est jamais dérivé, personne ne veut voir son inventaire recalculé
 * depuis une règle. Ces fonctions ne font qu'écrire la liste, jamais deviner
 * le poids ou le prix d'un objet inventé sur la fiche.
 */

const nouvelId = () => `inv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function addItem(sheet: CharacterSheet, item: { name: string; qty: number }): CharacterSheet {
  const nouvel: InventoryItem = { id: nouvelId(), name: item.name, qty: Math.max(1, Math.floor(item.qty)) };
  return { ...sheet, inventory: [...sheet.inventory, nouvel] };
}

/** Quantité fixée ; à 0 ou moins, l'objet disparaît — un « 0 dague » n'a rien à faire dans un sac. */
export function setItemQty(sheet: CharacterSheet, itemId: string, qty: number): CharacterSheet {
  if (qty <= 0) return removeItem(sheet, itemId);
  return {
    ...sheet,
    inventory: sheet.inventory.map((entry) => (entry.id === itemId ? { ...entry, qty: Math.floor(qty) } : entry)),
  };
}

export function removeItem(sheet: CharacterSheet, itemId: string): CharacterSheet {
  return { ...sheet, inventory: sheet.inventory.filter((entry) => entry.id !== itemId) };
}

/** Ce qu'un don d'objet transporte — jamais l'id local de l'expéditeur, qui n'a aucun sens dans le sac du destinataire. */
export interface ObjetDonne {
  name: string;
  qty: number;
  note?: string;
  catalogId?: string;
}

/**
 * Retire tout ou partie d'un objet du sac pour l'envoyer à quelqu'un —
 * jamais plus qu'il n'en reste. `envoye` vaut `null` si l'objet n'existe
 * plus ou si `qty` ne veut rien dire (0 ou moins) : rien à faire, rien à
 * donner.
 */
export function donnerItem(
  sheet: CharacterSheet, itemId: string, qty: number,
): { sheet: CharacterSheet; envoye: ObjetDonne | null } {
  const item = sheet.inventory.find((entry) => entry.id === itemId);
  const quantiteDemandee = Math.floor(qty);
  if (!item || quantiteDemandee <= 0) return { sheet, envoye: null };
  const quantiteEnvoyee = Math.min(item.qty, quantiteDemandee);
  const suivant = quantiteEnvoyee >= item.qty ? removeItem(sheet, itemId) : setItemQty(sheet, itemId, item.qty - quantiteEnvoyee);
  return {
    sheet: suivant,
    envoye: { name: item.name, qty: quantiteEnvoyee, note: item.note, catalogId: item.catalogId },
  };
}

/**
 * Ajoute un objet reçu — toujours une nouvelle ligne, jamais fondue dans une
 * pile existante : même choix que `addItem`, le joueur reste maître de
 * regrouper ou non depuis le Sac lui-même.
 */
export function recevoirItem(sheet: CharacterSheet, objet: ObjetDonne): CharacterSheet {
  const nouvel: InventoryItem = {
    id: nouvelId(), name: objet.name, qty: Math.max(1, Math.floor(objet.qty)),
    ...(objet.note ? { note: objet.note } : {}),
    ...(objet.catalogId ? { catalogId: objet.catalogId } : {}),
  };
  return { ...sheet, inventory: [...sheet.inventory, nouvel] };
}

/**
 * Boire une potion de soins (ou tout futur consommable du même genre) :
 * tirée avec les mêmes probabilités qu'un vrai dé (`domain/dice.ts`),
 * jamais une moyenne — puis appliquée et l'objet consommé, en un seul
 * geste. `null` si l'objet visé n'existe pas, n'est plus en stock, ou n'est
 * pas un consommable de soin reconnu (`domain/consumable-ownership.ts`) :
 * rien à boire, rien à tirer.
 */
export function useHealingItem(
  sheet: CharacterSheet, itemId: string, random: () => number = Math.random,
): { sheet: CharacterSheet; itemName: string; jet: JetDeDes } | null {
  const item = sheet.inventory.find((entry) => entry.id === itemId);
  if (!item || item.qty <= 0) return null;
  const catalogue = resolveHealingItem(item);
  if (!catalogue?.healDice) return null;
  const jet = rollFormula(catalogue.healDice, random);
  if (!jet) return null;
  const consomme = item.qty <= 1 ? removeItem(sheet, itemId) : setItemQty(sheet, itemId, item.qty - 1);
  return { sheet: heal(consomme, jet.total), itemName: item.name, jet };
}

/**
 * Le raccourci de l'écran de Combat : « utiliser » n'importe quel objet
 * reconnu comme une action de combat (`domain/consumable-ownership.ts`,
 * `resolveActionableItem`) — potion, antitoxine, poison, acide, parchemin
 * de sort… Un soignant (`healDice`) se résout exactement comme
 * `useHealingItem` — jet compris. Les autres n'ont rien à tirer : leur
 * texte de règle (dégâts d'une fiole d'acide, avantage de l'antitoxine…)
 * se lit sur la carte, et se joue à la table comme une attaque à l'arme —
 * cet écran ne fait que consommer l'objet. `null` dans les mêmes cas que
 * `useHealingItem` : rien à utiliser, rien à tirer.
 */
export function useActionItem(
  sheet: CharacterSheet, itemId: string, random: () => number = Math.random,
): { sheet: CharacterSheet; itemName: string; jet: JetDeDes | null } | null {
  const item = sheet.inventory.find((entry) => entry.id === itemId);
  if (!item || item.qty <= 0) return null;
  const catalogue = resolveActionableItem(item);
  if (!catalogue) return null;
  if (catalogue.healDice) return useHealingItem(sheet, itemId, random);
  const consomme = item.qty <= 1 ? removeItem(sheet, itemId) : setItemQty(sheet, itemId, item.qty - 1);
  return { sheet: consomme, itemName: item.name, jet: null };
}

/** Jamais sous 0 : une dette n'a pas de sens en pièces d'or comptées à la table. */
export function setGold(sheet: CharacterSheet, gold: number): CharacterSheet {
  return { ...sheet, gold: Math.max(0, Math.floor(gold)) };
}
