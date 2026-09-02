import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { oublierTout, stockageDuNavigateur } from './cache-local';

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
  // Propres au changement de mot de passe.
  if (texte.includes('should be at least') || texte.includes('password is too short')) {
    return 'Mot de passe trop court.';
  }
  if (texte.includes('different from the old password')) {
    return 'Choisis un mot de passe différent de l’ancien.';
  }
  if (texte.includes('session') && texte.includes('missing')) {
    return 'Ce lien n’est plus valable. Redemande-en un.';
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

/**
 * Se déconnecter efface aussi ce que le téléphone a gardé pour le hors-ligne.
 *
 * Ici plutôt qu'aux quatre endroits qui appellent cette fonction : un cinquième
 * bouton « se déconnecter » ajouté un jour hériterait sinon d'un oubli
 * silencieux, et les fiches de la table resteraient lisibles sur un téléphone
 * qui vient d'en sortir.
 */
export async function seDeconnecter(client: SupabaseClient): Promise<void> {
  const stockage = stockageDuNavigateur();
  if (stockage) oublierTout(stockage);
  await client.auth.signOut();
}

/**
 * ═══ Mot de passe oublié ═══
 *
 * Le seul mail que l'appli envoie. L'en-tête de ce fichier explique pourquoi
 * la connexion, elle, n'en envoie aucun : le service d'envoi par défaut de
 * Supabase est limité à quelques mails par heure, et trois joueurs qui se
 * connectent en début de séance suffiraient à le saturer. Un mot de passe
 * oublié, lui, n'arrive pas trois fois par soirée — la même limite devient
 * acceptable. Elle reste réelle : deux demandes coup sur coup peuvent être
 * refusées, et `messageDeConnexion` traduit ce refus.
 */

/** Ce qu'un lien de récupération raconte en revenant sur l'appli. */
export type EtatRecuperation =
  /** Rien à voir : ouverture normale de l'appli. */
  | 'aucune'
  /** Le lien est bon, la personne doit choisir son nouveau mot de passe. */
  | 'a-choisir'
  /** Lien périmé ou déjà utilisé — Supabase le dit dans l'URL, pas en erreur. */
  | 'lien-expire';

/**
 * Lit l'URL de retour du mail.
 *
 * Supabase renvoie sur l'appli avec ses jetons dans le FRAGMENT (`#type=
 * recovery&access_token=…`), et ses échecs parfois dans le fragment, parfois
 * dans la requête (`?error=access_denied&error_code=otp_expired`) — d'où les
 * deux lectures.
 *
 * Pourquoi lire l'URL plutôt que d'attendre l'événement `PASSWORD_RECOVERY`
 * du client : ce dernier part dès que le client a fini de digérer l'URL, ce
 * qui peut arriver AVANT que l'écran ne se soit abonné. L'URL, elle, est là
 * dès la première ligne de code — on ne peut pas la rater. L'événement reste
 * écouté en second filet (`observerRecuperation`).
 */
export function lireLienDeRecuperation(hash: string, search = ''): EtatRecuperation {
  const fragment = new URLSearchParams(hash.replace(/^#/, ''));
  const requete = new URLSearchParams(search.replace(/^\?/, ''));
  const valeur = (clef: string) => fragment.get(clef) ?? requete.get(clef);

  if (valeur('error') || valeur('error_code')) {
    const code = `${valeur('error_code') ?? ''} ${valeur('error_description') ?? ''}`.toLowerCase();
    // Seul le lien périmé nous intéresse ici : c'est le seul échec qu'un
    // joueur peut corriger lui-même, en redemandant un mail.
    return code.includes('expired') || code.includes('invalid') ? 'lien-expire' : 'aucune';
  }
  return valeur('type') === 'recovery' ? 'a-choisir' : 'aucune';
}

/**
 * Demande le mail de réinitialisation.
 *
 * Ne dit JAMAIS si l'adresse existe : même silence que `messageDeConnexion`
 * sur « mail ou mot de passe incorrect ». L'écran affichera la même phrase
 * dans les deux cas — Supabase, de son côté, répond déjà sans erreur pour une
 * adresse inconnue.
 */
export async function demanderReinitialisation(
  client: SupabaseClient,
  email: string,
  redirectTo: string,
): Promise<void> {
  const { error } = await client.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo },
  );
  if (error) throw new ErreurDeConnexion(error.message);
}

/** Pose le nouveau mot de passe, sur la session ouverte par le lien du mail. */
export async function definirMotDePasse(
  client: SupabaseClient,
  motDePasse: string,
): Promise<void> {
  const { error } = await client.auth.updateUser({ password: motDePasse });
  if (error) throw new ErreurDeConnexion(error.message);
}

/**
 * Second filet : l'événement `PASSWORD_RECOVERY`, pour le cas où l'URL aurait
 * déjà été nettoyée par le client avant qu'on ait pu la lire.
 */
export function observerRecuperation(
  client: SupabaseClient,
  listener: () => void,
): () => void {
  const { data } = client.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') listener();
  });
  return () => data.subscription.unsubscribe();
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
