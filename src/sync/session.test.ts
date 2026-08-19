import { describe, expect, it, vi } from 'vitest';
import { ErreurDeConnexion, messageDeConnexion, observerCompte, seConnecter } from './session';

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
