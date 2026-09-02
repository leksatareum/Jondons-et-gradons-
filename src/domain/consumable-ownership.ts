import { formeTolerante, normaliserNom } from './nom-normalise';
import { SYNONYMES_EQUIPEMENT } from '../content/synonymes-objets';
import { EQUIPMENT_CATALOG, type EquipmentEntry } from '../content/equipment';

/**
 * Reconnaît un objet du sac comme un consommable à effet automatique —
 * même principe que `domain/weapon-ownership.ts` pour les armes : le sac
 * est en texte libre, jamais rempli d'un `catalogId` par un flux existant,
 * donc la reconnaissance se fait d'abord sur le nom tel qu'un joueur le
 * tape lui-même — « Potion de soins », « Antitoxine »… `catalogId` reste
 * vérifié en premier pour le jour où un flux le renseignera.
 *
 * Deux niveaux : `resolveActionableItem` reconnaît tout objet qui COÛTE une
 * action de combat (`actionSlot` renseigné au catalogue — potions,
 * antitoxine, poison, acide, parchemins de sort…), pour lui donner un
 * raccourci à l'écran de Combat. `resolveHealingItem` n'en garde que les
 * soignants (`healDice` renseigné), pour le geste plus étroit du Sac qui
 * tire les dés et applique le soin.
 */

const normaliser = (nom: string): string => normaliserNom(nom);

const actionnables = EQUIPMENT_CATALOG.filter((entry) => entry.actionSlot);

const actionnablesParNomNormalise = new Map<string, EquipmentEntry>(
  actionnables.map((entry) => [normaliser(entry.name), entry]),
);

/**
 * Deuxième chance sur la forme tolérante — un « s » de trop, un contenant en
 * tête. C'est là que « Potion de soin » retrouve la « Potion de soins », et
 * « Flasque d'huile » l'« Huile » : deux objets qui dormaient dans des sacs
 * de la campagne sans que rien ne le signale.
 */
const actionnablesParFormeTolerante = new Map<string, EquipmentEntry>(
  actionnables.map((entry) => [formeTolerante(entry.name), entry]),
);

/** L'entrée du catalogue si cet objet coûte une action de combat reconnue — sinon `undefined`. */
export function resolveActionableItem(item: { name: string; catalogId?: string }): EquipmentEntry | undefined {
  if (item.catalogId) {
    const parCatalogue = EQUIPMENT_CATALOG.find((entry) => entry.id === item.catalogId);
    if (parCatalogue?.actionSlot) return parCatalogue;
  }
  const exacte = actionnablesParNomNormalise.get(normaliser(item.name));
  if (exacte) return exacte;

  const tolerante = formeTolerante(item.name);
  const parForme = actionnablesParFormeTolerante.get(tolerante);
  if (parForme) return parForme;

  const synonyme = SYNONYMES_EQUIPEMENT[tolerante];
  const parSynonyme = synonyme ? EQUIPMENT_CATALOG.find((entry) => entry.id === synonyme) : undefined;
  return parSynonyme?.actionSlot ? parSynonyme : undefined;
}

/** L'entrée du catalogue si cet objet est un consommable de soin reconnu — sinon `undefined`. */
export function resolveHealingItem(item: { name: string; catalogId?: string }): EquipmentEntry | undefined {
  const entry = resolveActionableItem(item);
  return entry?.healDice ? entry : undefined;
}
