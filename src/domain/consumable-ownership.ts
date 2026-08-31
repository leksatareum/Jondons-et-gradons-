import { EQUIPMENT_CATALOG, type EquipmentEntry } from '../content/equipment';

/**
 * Reconnaît un objet du sac comme un consommable à effet automatique (une
 * potion de soins, pour l'instant la seule du catalogue) — même principe que
 * `domain/weapon-ownership.ts` pour les armes : le sac est en texte libre,
 * jamais rempli d'un `catalogId` par un flux existant, donc la
 * reconnaissance se fait d'abord sur le nom tel qu'un joueur le tape
 * lui-même — « Potion de soins » — `catalogId` restant vérifié en premier
 * pour le jour où un flux le renseignera.
 */

const normaliser = (nom: string): string => nom
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[‘’]/g, "'")
  .trim()
  .toLocaleLowerCase('fr');

const soignantsParNomNormalise = new Map<string, EquipmentEntry>(
  EQUIPMENT_CATALOG
    .filter((entry) => entry.healDice)
    .map((entry) => [normaliser(entry.name), entry]),
);

/** L'entrée du catalogue si cet objet est un consommable de soin reconnu — sinon `undefined`. */
export function resolveHealingItem(item: { name: string; catalogId?: string }): EquipmentEntry | undefined {
  if (item.catalogId) {
    const parCatalogue = EQUIPMENT_CATALOG.find((entry) => entry.id === item.catalogId);
    if (parCatalogue?.healDice) return parCatalogue;
  }
  return soignantsParNomNormalise.get(normaliser(item.name));
}
