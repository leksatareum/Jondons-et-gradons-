import { SHIELD } from '../content/armor';

/**
 * Le bouclier est-il vraiment dans le sac — pour que son bonus de CA ne
 * survive pas à sa disparition (vendu, donné, jamais eu).
 *
 * Même logique de reconnaissance que les armes (`weapon-ownership.ts`) : le
 * sac est en texte libre, jamais rempli avec un `catalogId` par le flux de
 * création — la reconnaissance se fait donc sur le nom, normalisé pareil.
 *
 * Le catalogue ne connaît qu'UN bouclier (`content/armor.ts`, +2), mais le
 * sac, lui, est du texte libre : un objet trouvé en jeu ou noté par le MJ
 * peut s'appeler « Bouclier +1 », « Petit bouclier », « Boucliers de
 * rechange »… Tous doivent compter, chacun avec SON bonus — pas seulement
 * l'exemplaire qui porte le nom pile du catalogue. Un bouclier magique se
 * nomme par convention avec son bonus en suffixe (« Bouclier +1/+2/+3 », la
 * convention DMG) : ce chiffre s'ajoute au bonus de base plutôt que d'être
 * réinventé dans une note libre — la note reste réservée au texte de règle,
 * jamais à ce qui se calcule.
 */

const normaliser = (nom: string): string => nom
  .normalize('NFD').replace(/[̀-ͯ]/g, '') // accents : marques diacritiques isolées par NFD
  .replace(/[‘’]/g, "'") // apostrophes courbes alignées sur l'apostrophe droite
  .replace(/\s*\([^)]*\)\s*$/, '') // « Bouclier (orné) » → « Bouclier »
  .trim()
  .toLocaleLowerCase('fr');

const MOT_BOUCLIER = normaliser(SHIELD.name);

export interface BouclierReconnu {
  /** Le nom tel qu'il apparaît dans le sac — pas forcément « Bouclier ». */
  name: string;
  /** Bonus de CA de CET exemplaire — celui du catalogue, ajusté du « +N » de son nom s'il y en a un. */
  bonus: number;
}

/**
 * Reconnaît un objet du sac comme un bouclier, et donne SON bonus — celui du
 * catalogue s'il y correspond, sinon celui de base ajusté du « +N » que son
 * nom porterait (bouclier magique). `undefined` si ce n'en est pas un.
 */
export function resolveShieldFromItem(item: { name: string; catalogId?: string }): BouclierReconnu | undefined {
  if (item.catalogId === SHIELD.id) return { name: item.name, bonus: SHIELD.bonus };
  // Le mot « bouclier » peut apparaître n'importe où dans le nom — avant
  // (« Petit bouclier », « Grand bouclier »), après (« Bouclier +1 »,
  // « Bouclier de fer ») ou au pluriel (« Boucliers de rechange »).
  if (!normaliser(item.name).includes(MOT_BOUCLIER)) return undefined;
  const magique = item.name.match(/\+\s*(\d+)/);
  return { name: item.name, bonus: SHIELD.bonus + (magique ? Number(magique[1]) : 0) };
}

/** Vrai si l'objet est un bouclier, quel que soit son bonus. */
export function estUnBouclier(item: { name: string; catalogId?: string }): boolean {
  return resolveShieldFromItem(item) !== undefined;
}

/** Vrai si le sac contient au moins un bouclier — qu'il soit équipé ou non. */
export function possedeBouclier(inventory: { name: string; catalogId?: string }[]): boolean {
  return inventory.some((item) => estUnBouclier(item));
}

/**
 * Le meilleur bouclier du sac — celui dont le bonus de CA compterait s'il
 * est équipé. Posséder deux boucliers différents (l'un trouvé en jeu) ne
 * pénalise jamais : c'est celui qui protège le mieux qui est porté au bras.
 */
export function meilleurBouclier(inventory: { name: string; catalogId?: string }[]): BouclierReconnu | undefined {
  let meilleur: BouclierReconnu | undefined;
  for (const item of inventory) {
    const reconnu = resolveShieldFromItem(item);
    if (reconnu && (!meilleur || reconnu.bonus > meilleur.bonus)) meilleur = reconnu;
  }
  return meilleur;
}

/** Le bonus de CA que le bouclier équipé donnerait vraiment — 0 si le sac n'en a aucun. */
export function bonusBouclier(inventory: { name: string; catalogId?: string }[]): number {
  return meilleurBouclier(inventory)?.bonus ?? 0;
}
