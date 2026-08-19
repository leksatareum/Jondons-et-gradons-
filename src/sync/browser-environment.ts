import type { SyncEnvironment } from './connection';

/**
 * Branchement de la machine de synchronisation sur un vrai navigateur.
 *
 * Les trois écouteurs ci-dessous sont exactement ceux qui manquaient à
 * `table-connectee`, et dont l'absence obligeait les joueurs à recharger
 * l'application :
 *
 *  - `visibilitychange` : sur téléphone, l'app passe en arrière-plan à la
 *    moindre notification, et l'OS coupe le websocket sans prévenir.
 *  - `online` / `offline` : passage en 4G, tunnel, ascenseur.
 *  - `pageshow` : retour depuis le cache de navigation (bfcache), où la page
 *    reprend telle quelle — avec un websocket mort et aucun événement pour le
 *    signaler.
 */
export function createBrowserEnvironment(target: {
  document?: Document;
  window?: Window & typeof globalThis;
  navigator?: Navigator;
} = {}): SyncEnvironment {
  const doc = target.document ?? (typeof document !== 'undefined' ? document : undefined);
  const win = target.window ?? (typeof window !== 'undefined' ? window : undefined);
  const nav = target.navigator ?? (typeof navigator !== 'undefined' ? navigator : undefined);

  return {
    now: () => Date.now(),
    setTimeout: (handler, delayMs) => setTimeout(handler, delayMs),
    clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
    // Sans information, on suppose le réseau présent : mieux vaut tenter une
    // connexion inutile que rester muet à tort.
    isOnline: () => nav?.onLine ?? true,
    isVisible: () => doc?.visibilityState !== 'hidden',
    onPlatformSignal: (listener) => {
      doc?.addEventListener('visibilitychange', listener);
      win?.addEventListener('online', listener);
      win?.addEventListener('offline', listener);
      win?.addEventListener('pageshow', listener);
      return () => {
        doc?.removeEventListener('visibilitychange', listener);
        win?.removeEventListener('online', listener);
        win?.removeEventListener('offline', listener);
        win?.removeEventListener('pageshow', listener);
      };
    },
  };
}
