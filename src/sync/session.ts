import type { Session, SupabaseClient } from '@supabase/supabase-js';

/**
 * Entrée dans l'application : mail et mot de passe.
 *
 * Choisi contre le lien magique pour une raison pratique, pas théorique : le
 * service d'envoi par défaut de Supabase est limité à quelques mails par
 * heure. Trois joueurs qui se connectent au début d'une séance suffisent à le
 * saturer, et la panne tombe exactement au pire moment. Ici, aucun mail n'est
 * envoyé, donc rien ne peut échouer de ce côté.
 *
 * La session est persistée et rafraîchie automatiquement (voir
 * `createJgClient`) : on se connecte une fois, pas à chaque séance.
 */

export interface CompteConnecte {
  userId: string;
  email: string;
}

const fromSession = (session: Session | null): CompteConnecte | null =>
  session ? { userId: session.user.id, email: session.user.email ?? '' } : null;

/**
 * Traduit les messages de Supabase, qui sont en anglais et souvent obscurs.
 * « Invalid login credentials » ne dit rien à une joueuse — et surtout ne dit
 * pas si c'est le mail ou le mot de passe qui cloche, ce qui est délibéré :
 * on ne révèle pas quels comptes existent.
 */
export function messageDeConnexion(brut: string): string {
  const texte = brut.toLowerCase();
  if (texte.includes('invalid login credentials')) return 'Mail ou mot de passe incorrect.';
  if (texte.includes('email not confirmed')) return 'Ce compte doit encore être confirmé.';
  if (texte.includes('rate limit') || texte.includes('too many')) {
    return 'Trop de tentatives. Attends une minute avant de réessayer.';
  }
  if (texte.includes('failed to fetch') || texte.includes('network')) {
    return 'Pas de réseau. Vérifie ta connexion.';
  }
  return brut;
}

export class ErreurDeConnexion extends Error {
  constructor(brut: string) {
    super(messageDeConnexion(brut));
    this.name = 'ErreurDeConnexion';
  }
}

export async function seConnecter(
  client: SupabaseClient,
  email: string,
  motDePasse: string,
): Promise<CompteConnecte> {
  const { data, error } = await client.auth.signInWithPassword({
    // Les mails sont insensibles à la casse et un espace se glisse vite au
    // collage depuis un gestionnaire de mots de passe.
    email: email.trim().toLowerCase(),
    password: motDePasse,
  });
  if (error) throw new ErreurDeConnexion(error.message);
  const compte = fromSession(data.session);
  if (!compte) throw new ErreurDeConnexion('connexion sans session');
  return compte;
}

export async function seDeconnecter(client: SupabaseClient): Promise<void> {
  await client.auth.signOut();
}

/**
 * Suit le compte connecté. Appelle le rappel tout de suite avec l'état connu,
 * puis à chaque changement — y compris le rafraîchissement automatique du
 * jeton, qu'on ne veut surtout pas confondre avec une déconnexion.
 */
export function observerCompte(
  client: SupabaseClient,
  listener: (compte: CompteConnecte | null) => void,
): () => void {
  let vivant = true;

  void client.auth.getSession().then(({ data }) => {
    if (vivant) listener(fromSession(data.session));
  });

  const { data } = client.auth.onAuthStateChange((_event, session) => {
    if (vivant) listener(fromSession(session));
  });

  return () => {
    vivant = false;
    data.subscription.unsubscribe();
  };
}
