/**
 * Des dés, tirés avec les mêmes probabilités que des vrais : chaque face
 * d'un dé à N faces a une chance sur N, exactement comme au tirage physique
 * — jamais une moyenne, jamais un résultat pondéré. `random` s'injecte
 * (`Math.random` par défaut) pour que le tirage se teste sans dépendre du
 * hasard réel, au même titre que le d20 discret du Journal
 * (`ui/JournalScreen.tsx`) ou la guérison du Calice étoilé
 * (`domain/druid-level3-subclasses.ts`) — ce module ne fait que donner à
 * cette même formule un endroit unique, réutilisable pour n'importe quelle
 * formule de dés plutôt qu'un seul cas particulier.
 */

/** Un jet, sur un dé à `faces` faces : un entier entre 1 et `faces` inclus. */
export function rollDie(faces: number, random: () => number = Math.random): number {
  // `random()` vaut normalement [0, 1[, mais jamais garanti à 100 % — un
  // 1.0 en bord de plage ferait déborder d'une face qui n'existe pas.
  const tirage = Math.max(0, Math.min(0.999999999, random()));
  return 1 + Math.floor(tirage * faces);
}

export interface JetDeDes {
  total: number;
  /** Chaque dé, dans l'ordre où il a été tiré — pour montrer le détail, jamais juste le total. */
  des: number[];
  bonus: number;
}

/**
 * Lit une formule imprimée telle quelle — « 2d4+2 », « 1d8 », « 4d4 - 1 » —
 * et la tire. `null` si ce n'est pas une formule de dés reconnaissable :
 * mieux vaut ne rien tirer que deviner un nombre de dés faux.
 */
export function rollFormula(formule: string, random: () => number = Math.random): JetDeDes | null {
  const correspondance = /^(\d+)\s*d\s*(\d+)\s*(?:([+-])\s*(\d+))?$/i.exec(formule.trim());
  if (!correspondance) return null;
  const [, nombreTxt, facesTxt, signe, bonusTxt] = correspondance;
  const nombre = Number(nombreTxt);
  const faces = Number(facesTxt);
  if (nombre <= 0 || faces <= 0) return null;
  const des = Array.from({ length: nombre }, () => rollDie(faces, random));
  const bonus = bonusTxt ? Number(bonusTxt) * (signe === '-' ? -1 : 1) : 0;
  return { total: des.reduce((somme, valeur) => somme + valeur, 0) + bonus, des, bonus };
}
