/**
 * Par où passe un objet que le MJ donne.
 *
 * ═══ Le défaut que ceci corrige ═══
 *
 * La première version écrivait la fiche du joueur directement. L'objet
 * arrivait donc en SILENCE : le joueur ne le découvrait qu'en faisant défiler
 * son sac, sans savoir d'où il venait ni ce que le MJ avait voulu dire en le
 * lui donnant.
 *
 * Or un objet donné entre joueurs passe déjà par un vrai canal
 * (`jg_item_transfers`, migration 0014) : il porte un mot, il se reçoit, il
 * fait apparaître un pop-up. Le don du MJ n'avait aucune raison de
 * court-circuiter ce chemin — il lui manquait juste le lien entre une FICHE
 * (ce que le MJ choisit) et un COMPTE (ce que le transfert adresse).
 *
 * ═══ Pourquoi l'écriture directe reste, malgré tout ═══
 *
 * Un transfert s'adresse à un compte. Une fiche sans propriétaire — ou dont
 * le propriétaire est le MJ lui-même, cas d'un PNJ qu'il joue — n'en a pas à
 * qui l'adresser. Passer par le transfert reviendrait alors à s'envoyer
 * l'objet à soi-même, et il n'arriverait jamais dans le sac visé.
 *
 * Ces cas gardent donc l'écriture directe. C'est moins bien, et c'est dit :
 * personne n'est prévenu. Mais l'objet arrive, ce qui vaut mieux que de
 * refuser le geste.
 */

export type RouteDuDon =
  | { voie: 'transfert'; destinataire: string }
  | { voie: 'directe'; pourquoi: 'sans-proprietaire' | 'fiche-du-mj' };

export function routeDuDon(
  fiche: { ownerId?: string | null },
  mjUserId: string,
): RouteDuDon {
  const proprietaire = fiche.ownerId?.trim();
  if (!proprietaire) return { voie: 'directe', pourquoi: 'sans-proprietaire' };
  if (proprietaire === mjUserId) return { voie: 'directe', pourquoi: 'fiche-du-mj' };
  return { voie: 'transfert', destinataire: proprietaire };
}

/** Ce qu'on dit au MJ quand l'objet ne peut pas être annoncé à son destinataire. */
export const RAISON_ECRITURE_DIRECTE: Record<
  Extract<RouteDuDon, { voie: 'directe' }>['pourquoi'],
  string
> = {
  'sans-proprietaire': 'Cette fiche n’appartient à personne : l’objet y est posé, mais rien ne le signalera.',
  'fiche-du-mj': 'Cette fiche est la tienne : l’objet y est posé, sans notification.',
};
