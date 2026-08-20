import type { CharacterSheet, InventoryItem } from './character';

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

/** Jamais sous 0 : une dette n'a pas de sens en pièces d'or comptées à la table. */
export function setGold(sheet: CharacterSheet, gold: number): CharacterSheet {
  return { ...sheet, gold: Math.max(0, Math.floor(gold)) };
}
