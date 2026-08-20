import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * À quelle table le compte connecté appartient-il, et de quel côté de l'écran.
 *
 * Le rôle vient de la base, jamais d'un réglage local : c'est lui qui décide
 * si on voit l'écran du MJ, donc s'y fier depuis le téléphone reviendrait à
 * offrir le bouton « lancer le combat » à qui le demande. Ici, même un client
 * modifié ne gagne rien — la RLS refuse l'écriture derrière.
 */

export interface Appartenance {
  campaignId: string;
  nom: string;
  estMj: boolean;
  /** Qui mène la table — pour lui adresser un message privé sans le chercher. */
  gmId: string;
}

export class ErreurAppartenance extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ErreurAppartenance';
  }
}

export async function chargerAppartenances(
  client: SupabaseClient,
  userId: string,
): Promise<Appartenance[]> {
  // La RLS ne renvoie que les campagnes dont on est membre ou MJ : pas de
  // filtre à écrire ici, et surtout pas de filtre à oublier.
  const { data, error } = await client
    .from('jg_campaigns')
    .select('id, name, gm_id')
    .order('created_at', { ascending: true });
  if (error) throw new ErreurAppartenance(error.message);

  return (data ?? []).map((ligne) => ({
    campaignId: String(ligne.id),
    nom: String(ligne.name),
    estMj: String(ligne.gm_id) === userId,
    gmId: String(ligne.gm_id),
  }));
}

/**
 * Choisit la campagne à ouvrir. Une seule : on entre directement, sans écran
 * de sélection à traverser à chaque séance. Plusieurs : il faut demander.
 */
export type ChoixDeCampagne =
  | { quoi: 'aucune' }
  | { quoi: 'une'; campagne: Appartenance }
  | { quoi: 'plusieurs'; campagnes: Appartenance[] };

export function choisirCampagne(appartenances: Appartenance[]): ChoixDeCampagne {
  if (appartenances.length === 0) return { quoi: 'aucune' };
  if (appartenances.length === 1) return { quoi: 'une', campagne: appartenances[0]! };
  return { quoi: 'plusieurs', campagnes: appartenances };
}
