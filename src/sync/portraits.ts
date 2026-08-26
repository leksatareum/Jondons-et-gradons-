import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Le portrait d'un personnage : une image que le joueur dépose lui-même,
 * dans le bucket public `portraits` (migration `0010_portraits_joueurs`).
 *
 * Le chemin de stockage est `<sheetId>/<horodatage>.<extension>` : le
 * premier segment est ce que la politique RLS du bucket vérifie (elle
 * retrouve le propriétaire de la fiche par cet identifiant), et
 * l'horodatage fait qu'un remplacement produit une URL différente — sans
 * ça, le CDN continuerait de servir l'ancienne image sous la même adresse.
 */

const BUCKET = 'portraits';
const TAILLE_MAX = 5 * 1024 * 1024;
const TYPES_ACCEPTES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

export class PortraitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PortraitError';
  }
}

/** Vérifie le fichier avant même d'ouvrir la connexion — un refus immédiat vaut mieux qu'un aller-retour réseau pour rien. */
export function validerPortrait(file: File): void {
  if (!TYPES_ACCEPTES[file.type]) {
    throw new PortraitError('Formats acceptés : PNG, JPEG ou WebP.');
  }
  if (file.size > TAILLE_MAX) {
    throw new PortraitError('Image trop lourde : 5 Mo maximum.');
  }
}

export async function uploadPortrait(
  client: SupabaseClient,
  sheetId: string,
  file: File,
): Promise<string> {
  validerPortrait(file);
  const extension = TYPES_ACCEPTES[file.type];
  const chemin = `${sheetId}/${Date.now()}.${extension}`;
  const { error } = await client.storage.from(BUCKET).upload(chemin, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new PortraitError(`Envoi impossible : ${error.message}`);
  return client.storage.from(BUCKET).getPublicUrl(chemin).data.publicUrl;
}
