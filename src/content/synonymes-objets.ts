/**
 * Les noms que les joueurs écrivent réellement, et ce qu'ils désignent.
 *
 * Le sac est en texte libre — il doit le rester : un objet de quête n'existe
 * dans aucun catalogue. Mais quand ce qui est tapé DÉSIGNE bien une entrée du
 * catalogue, l'objet doit se comporter comme telle : une potion qui lance ses
 * dés, un bâton qui apparaît en carte d'attaque.
 *
 * Deux mécanismes se partagent le travail, et il faut savoir lequel employer :
 *
 * · Une variante d'ORTHOGRAPHE (« Potion de soin » au singulier, « Flasque
 *   d'huile ») se rattrape toute seule par `formeTolerante`. Rien à écrire.
 * · Un autre MOT (« Bâton » pour « Bâton de combat ») ne se devine pas. Il
 *   s'écrit ici, une ligne, relisible par quelqu'un qui connaît le jeu et pas
 *   le code.
 *
 * On n'y met que ce qu'on a vu écrit, ou ce qu'on écrirait soi-même sans
 * hésiter. Un synonyme inventé « au cas où » est un faux positif en
 * puissance, et rattacher le mauvais objet est bien pire que de n'en
 * rattacher aucun : le joueur boirait une potion qu'il n'a pas. « Arc » ne
 * figure donc pas ici — court ou long, on ne peut pas trancher à sa place.
 *
 * Les clés sont sous forme TOLÉRANTE (`formeTolerante`) : minuscules, sans
 * accent, au singulier. Un test le vérifie, parce qu'une clé accentuée ne
 * serait jamais consultée et que rien ne le signalerait.
 */

/** Nom tapé → identifiant du catalogue d'ARMES (`content/weapons.ts`). */
export const SYNONYMES_ARMES: Record<string, string> = {
  // Vu dans la campagne en cours, sur deux fiches : le Druide et l'Occultiste
  // écrivent tous deux « Bâton ». C'est le nom courant du bâton de combat, et
  // sans cette ligne ni l'un ni l'autre n'avait de carte d'attaque pour lui.
  baton: 'baton',
};

/** Nom tapé → identifiant du catalogue d'ÉQUIPEMENT (`content/equipment.ts`). */
export const SYNONYMES_EQUIPEMENT: Record<string, string> = {
  'potion de guerison': 'av-potion-soins',
  antidote: 'av-antitoxine',
};
