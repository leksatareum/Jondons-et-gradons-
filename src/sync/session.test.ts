import { describe, expect, it, vi } from 'vitest';
import {
  definirMotDePasse, demanderReinitialisation, ErreurDeConnexion, lireLienDeRecuperation,
  messageDeConnexion, observerCompte, seConnecter,
} from './session';

function fakeAuth(resultat: { data: any; error: { message: string } | null }) {
  const appels: any[] = [];
  const client: any = {
    auth: {
      signInWithPassword: async (creds: any) => { appels.push(creds); return resultat; },
      getSession: async () => ({ data: { session: resultat.data?.session ?? null } }),
      onAuthStateChange: (cb: any) => {
        client.auth.emit = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    },
  };
  return { client, appels };
}

const session = (id: string, email: string) => ({ session: { user: { id, email } } });

describe('messages de connexion', () => {
  it('« Invalid login credentials » devient une phrase lisible, sans dire lequel des deux est faux', () => {
    const message = messageDeConnexion('Invalid login credentials');
    expect(message).toBe('Mail ou mot de passe incorrect.');
    // Ne pas révéler quels comptes existent : le message ne distingue pas.
    expect(message).not.toMatch(/inconnu|inexistant|introuvable/i);
  });

  it('la limite de tentatives et la panne réseau sont distinguées', () => {
    expect(messageDeConnexion('Email rate limit exceeded')).toMatch(/Trop de tentatives/);
    expect(messageDeConnexion('TypeError: Failed to fetch')).toMatch(/Pas de réseau/);
  });

  it('un message inconnu passe tel quel plutôt que d’être masqué par un texte vague', () => {
    expect(messageDeConnexion('Database is paused')).toBe('Database is paused');
  });
});

describe('connexion', () => {
  it('normalise le mail — un espace au collage ne doit pas faire échouer une soirée', async () => {
    const { client, appels } = fakeAuth({ data: session('u1', 'ylva@exemple.fr'), error: null });
    await seConnecter(client, '  Ylva@Exemple.FR ', 'secret');
    expect(appels[0].email).toBe('ylva@exemple.fr');
  });

  it('ne touche pas au mot de passe, espaces compris', async () => {
    const { client, appels } = fakeAuth({ data: session('u1', 'ylva@exemple.fr'), error: null });
    await seConnecter(client, 'ylva@exemple.fr', ' secret ');
    expect(appels[0].password).toBe(' secret ');
  });

  it('renvoie le compte connecté', async () => {
    const { client } = fakeAuth({ data: session('u1', 'ylva@exemple.fr'), error: null });
    await expect(seConnecter(client, 'ylva@exemple.fr', 'secret'))
      .resolves.toEqual({ userId: 'u1', email: 'ylva@exemple.fr' });
  });

  it('une erreur remonte traduite', async () => {
    const { client } = fakeAuth({ data: null, error: { message: 'Invalid login credentials' } });
    await expect(seConnecter(client, 'ylva@exemple.fr', 'faux'))
      .rejects.toThrow(/Mail ou mot de passe incorrect/);
  });

  it('un succès sans session ne passe pas pour une connexion', async () => {
    const { client } = fakeAuth({ data: { session: null }, error: null });
    await expect(seConnecter(client, 'ylva@exemple.fr', 'secret')).rejects.toThrow(ErreurDeConnexion);
  });
});

describe('suivi du compte', () => {
  it('annonce l’état connu au démarrage, sans attendre un événement', async () => {
    const { client } = fakeAuth({ data: session('u1', 'ylva@exemple.fr'), error: null });
    const vu = vi.fn();
    observerCompte(client, vu);
    await vi.waitFor(() => expect(vu).toHaveBeenCalledWith({ userId: 'u1', email: 'ylva@exemple.fr' }));
  });

  it('le rafraîchissement du jeton n’est pas une déconnexion', async () => {
    const { client } = fakeAuth({ data: session('u1', 'ylva@exemple.fr'), error: null });
    const vu = vi.fn();
    observerCompte(client, vu);
    await vi.waitFor(() => expect(vu).toHaveBeenCalled());

    client.auth.emit('TOKEN_REFRESHED', { user: { id: 'u1', email: 'ylva@exemple.fr' } });
    expect(vu).toHaveBeenLastCalledWith({ userId: 'u1', email: 'ylva@exemple.fr' });
  });

  it('après désabonnement, plus rien n’est annoncé', async () => {
    const { client } = fakeAuth({ data: session('u1', 'ylva@exemple.fr'), error: null });
    const vu = vi.fn();
    const arreter = observerCompte(client, vu);
    await vi.waitFor(() => expect(vu).toHaveBeenCalled());
    arreter();

    client.auth.emit('SIGNED_OUT', null);
    expect(vu).toHaveBeenCalledTimes(1);
  });
});

describe('mot de passe oublié — la lecture du lien de retour', () => {
  it('reconnaît un lien de récupération valide, jetons dans le fragment', () => {
    expect(lireLienDeRecuperation(
      '#access_token=abc&refresh_token=def&token_type=bearer&type=recovery',
    )).toBe('a-choisir');
  });

  it('ne confond pas avec les autres retours de Supabase', () => {
    // Une confirmation d'inscription revient avec le même genre d'URL, mais
    // `type=signup` : elle ne doit pas ouvrir l'écran de mot de passe.
    expect(lireLienDeRecuperation('#access_token=abc&type=signup')).toBe('aucune');
    expect(lireLienDeRecuperation('')).toBe('aucune');
    expect(lireLienDeRecuperation('#')).toBe('aucune');
  });

  it('repère un lien périmé — Supabase le dit dans l’URL, jamais en erreur', () => {
    expect(lireLienDeRecuperation(
      '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
    )).toBe('lien-expire');
  });

  it('lit l’échec aussi quand il arrive dans la requête et non le fragment', () => {
    expect(lireLienDeRecuperation('', '?error=access_denied&error_code=otp_expired')).toBe('lien-expire');
  });

  it('un échec d’une autre nature n’est pas présenté comme un lien périmé', () => {
    expect(lireLienDeRecuperation('#error=server_error&error_description=boom')).toBe('aucune');
  });
});

describe('mot de passe oublié — les appels', () => {
  it('demande le mail en normalisant l’adresse, et passe l’URL de retour', async () => {
    const appels: any[] = [];
    const client: any = { auth: {
      resetPasswordForEmail: async (email: string, options: any) => {
        appels.push({ email, options }); return { error: null };
      },
    } };
    await demanderReinitialisation(client, '  Alice@Exemple.FR ', 'https://appli.test');
    expect(appels).toEqual([{ email: 'alice@exemple.fr', options: { redirectTo: 'https://appli.test' } }]);
  });

  it('traduit un refus pour trop de demandes', async () => {
    const client: any = { auth: {
      resetPasswordForEmail: async () => ({ error: { message: 'email rate limit exceeded' } }),
    } };
    await expect(demanderReinitialisation(client, 'a@b.fr', 'https://x')).rejects.toThrow(
      'Trop de tentatives. Attends une minute avant de réessayer.',
    );
  });

  it('pose le nouveau mot de passe sur la session ouverte par le lien', async () => {
    const appels: any[] = [];
    const client: any = { auth: {
      updateUser: async (attrs: any) => { appels.push(attrs); return { error: null }; },
    } };
    await definirMotDePasse(client, 'un-nouveau-secret');
    expect(appels).toEqual([{ password: 'un-nouveau-secret' }]);
  });

  it('traduit un lien déjà consommé', async () => {
    const client: any = { auth: {
      updateUser: async () => ({ error: { message: 'Auth session missing!' } }),
    } };
    await expect(definirMotDePasse(client, 'x')).rejects.toThrow('Ce lien n’est plus valable. Redemande-en un.');
  });
});

describe('messageDeConnexion — les refus propres au mot de passe', () => {
  it('traduit un mot de passe trop court', () => {
    expect(messageDeConnexion('Password should be at least 6 characters'))
      .toBe('Mot de passe trop court.');
  });

  it('traduit un mot de passe identique à l’ancien', () => {
    expect(messageDeConnexion('New password should be different from the old password.'))
      .toBe('Choisis un mot de passe différent de l’ancien.');
  });
});
