import { STARTING_WEAPON_ALIASES } from '../content/starting-equipment';
import { formeTolerante, normaliserNom } from './nom-normalise';
import { SYNONYMES_ARMES } from '../content/synonymes-objets';
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
const tolerer = (nom: string): string => formeTolerante(nom, { sansParenthese: true });

const armeParNomNormalise = new Map<string, WeaponDef>(
  WEAPONS.map((weapon) => [normaliser(weapon.name), weapon]),
);

/**
 * Deuxième chance : la même table, mais indexée sur la forme tolérante. Une
 * fiche qui porte « Batons » ou « Épee courte » désigne sans ambiguïté une
 * arme du catalogue ; refuser de la reconnaître ne prive pas d'une subtilité,
 * ça prive d'une carte d'attaque.
 */
const armeParFormeTolerante = new Map<string, WeaponDef>(
  WEAPONS.map((weapon) => [tolerer(weapon.name), weapon]),
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
  const exacte = armeParNomNormalise.get(normaliser(item.name));
  if (exacte) return exacte;

  // Les deux replis, dans cet ordre : l'orthographe d'abord (mécanique et
  // sans surprise), le synonyme ensuite (une décision écrite à la main).
  const tolerante = tolerer(item.name);
  return armeParFormeTolerante.get(tolerante)
    ?? (SYNONYMES_ARMES[tolerante] ? weaponById(SYNONYMES_ARMES[tolerante]) : undefined);
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
