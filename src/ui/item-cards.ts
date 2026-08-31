import { resolveActionableItem } from '../domain/consumable-ownership';
import type { CharacterSheet } from '../model/character';
import type { Economy, PlayableCard } from './combat-layout';

/**
 * Les objets du sac reconnus comme une action de combat, convertis en
 * cartes — un raccourci direct à l'écran de Combat pour les potions,
 * l'antitoxine, le poison, les fioles d'acide, les parchemins de sort…
 * sans passer par le Sac.
 *
 * Une carte par LIGNE d'inventaire, jamais fondue entre plusieurs — le sac
 * ne fusionne jamais deux piles (voir `model/inventory.ts`), la carte n'a
 * pas à s'y essayer non plus. Rien de plus que le texte de règle imprimé :
 * ni dégâts ni jet affichés d'avance — la carte de la Potion de soins ne
 * montre pas « 2d4+2 » en gros comme une carte d'arme montre ses dégâts,
 * parce que jouer cette carte-là SOIGNE — l'étiquette « dégâts » de
 * `ActionCard` mentirait.
 */
export function itemCardsFromCharacter(sheet: CharacterSheet): PlayableCard[] {
  return sheet.inventory
    .filter((item) => item.qty > 0)
    .flatMap((item) => {
      const catalogue = resolveActionableItem(item);
      if (!catalogue?.actionSlot) return [];
      const economy: Economy = catalogue.actionSlot;
      return [{
        id: `objet-${item.id}`,
        name: item.qty > 1 ? `${item.name} (${item.qty})` : item.name,
        economy,
        category: 'objets',
        detail: catalogue.desc,
        useItemId: item.id,
      } satisfies PlayableCard];
    });
}
