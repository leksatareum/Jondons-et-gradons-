import { SHIELD } from '../content/armor';

/**
 * Le bouclier est-il vraiment dans le sac — pour que son bonus de CA ne
 * survive pas à sa disparition (vendu, donné, jamais eu).
 *
 * Même logique de reconnaissance que les armes (`weapon-ownership.ts`) : le
 * sac est en texte libre, jamais rempli avec un `catalogId` par le flux de
 * création — la reconnaissance se fait donc sur le nom, normalisé pareil.
 */

const normaliser = (nom: string): string => nom
  .normalize('NFD').replace(/[̀-ͯ]/g, '') // accents : marques diacritiques isolées par NFD
  .replace(/[‘’]/g, "'") // apostrophes courbes alignées sur l'apostrophe droite
  .replace(/\s*\([^)]*\)\s*$/, '') // « Bouclier (orné) » → « Bouclier »
  .trim()
  .toLocaleLowerCase('fr');

const NOM_BOUCLIER_NORMALISE = normaliser(SHIELD.name);

/** Résout un objet du sac en bouclier du catalogue, ou `undefined` si ce n'en est pas un. */
export function estUnBouclier(item: { name: string; catalogId?: string }): boolean {
  if (item.catalogId === SHIELD.id) return true;
  return normaliser(item.name) === NOM_BOUCLIER_NORMALISE;
}

/** Vrai si le sac contient au moins un bouclier — qu'il soit équipé ou non. */
export function possedeBouclier(inventory: { name: string; catalogId?: string }[]): boolean {
  return inventory.some((item) => estUnBouclier(item));
}
