import { STARTING_WEAPON_ALIASES } from '../content/starting-equipment';
import { normaliserNom } from './nom-normalise';
import { WEAPONS, weaponById, type WeaponDef } from '../content/weapons';

/**
 * Quelles armes du sac sont vraiment des armes — pour ne proposer en combat
 * QUE ce que le personnage a en sa possession : son équipement de départ, ou
 * ce qu'il a trouvé et noté dans son sac en jeu. Jamais le catalogue entier :
 * porter une arme suppose de l'avoir.
 *
 * Le sac (`inventory`) est en texte libre — jamais rempli avec un
 * `catalogId` par aucun flux existant, équipement de départ compris. La
 * reconnaissance se fait donc d'abord sur le nom, tel qu'il apparaît dans les
 * kits de départ (`content/starting-equipment.ts`) ou tel qu'un joueur le
 * tape lui-même : « Épée longue », « Cimeterre »… `catalogId` reste vérifié
 * en premier pour le jour où un flux le renseignera.
 */

const normaliser = (nom: string): string => normaliserNom(nom, { sansParenthese: true });

const armeParNomNormalise = new Map<string, WeaponDef>(
  WEAPONS.map((weapon) => [normaliser(weapon.name), weapon]),
);

/** Résout un objet du sac en arme du catalogue, ou `undefined` si ce n'en est pas une. */
export function resolveWeaponFromItem(item: { name: string; catalogId?: string }): WeaponDef | undefined {
  if (item.catalogId) {
    const parCatalogue = weaponById(item.catalogId);
    if (parCatalogue) return parCatalogue;
  }
  const aliasId = STARTING_WEAPON_ALIASES[item.name];
  if (aliasId) {
    const parAlias = weaponById(aliasId);
    if (parAlias) return parAlias;
  }
  return armeParNomNormalise.get(normaliser(item.name));
}

/** Les armes que possède réellement le personnage, une seule fois chacune — le sac ne compte pas les doublons. */
export function ownedWeapons(inventory: { name: string; catalogId?: string }[]): WeaponDef[] {
  const trouvees = new Map<string, WeaponDef>();
  for (const item of inventory) {
    const arme = resolveWeaponFromItem(item);
    if (arme) trouvees.set(arme.id, arme);
  }
  return Array.from(trouvees.values());
}
