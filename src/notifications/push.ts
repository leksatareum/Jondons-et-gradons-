// Le même que celui déjà installé au démarrage pour le hors-ligne : deux
// chemins voudraient dire deux programmes de fond concurrents.
import { CHEMIN_SERVICE_WORKER } from '../sync/service-worker';

/**
 * Notifications push : le navigateur détient une souscription (une adresse
 * `endpoint`, deux clés) que le serveur utilise pour réveiller l'appareil,
 * même l'appli fermée — voir la fonction Edge `send-push` et le
 * déclencheur SQL de la migration 0012_notifications_push.sql.
 *
 * La clé VAPID ci-dessous est la moitié PUBLIQUE de la paire — publique par
 * construction, comme la clé anon de Supabase (voir
 * `sync/supabase-client.ts`) : c'est elle qui autorise n'importe qui à
 * s'abonner, jamais à envoyer. Seule la moitié privée protège l'envoi, et
 * elle ne vit que dans la fonction Edge, jamais ici.
 *
 * iOS/Safari n'active les notifications web que si l'appli a d'abord été
 * ajoutée à l'écran d'accueil (Partager → Sur l'écran d'accueil) — une
 * limite d'Apple, pas de cette appli. Chrome/Android n'a pas cette
 * contrainte. `pushDisponible()` ne dit que si le navigateur SAIT faire du
 * push, pas si l'utilisateur a fait ce geste-là.
 */

export const VAPID_PUBLIC_KEY = 'BMbUdvw3uNb6RkKRS6ixhfpJ5BV1M26QQjnXgHN85jTtXRypRYdH9PUCVoVagNPw5Syzr7ZYP6dlL6tPAet9dVM';


export function pushDisponible(): boolean {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window;
}

const urlBase64VersUint8Array = (base64: string): Uint8Array => {
  const remplissage = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64Sur = (base64 + remplissage).replace(/-/g, '+').replace(/_/g, '/');
  const brut = atob(base64Sur);
  return new Uint8Array([...brut].map((caractere) => caractere.charCodeAt(0)));
};

export interface SouscriptionPush {
  endpoint: string;
  p256dh: string;
  authKey: string;
}

const versSouscription = (abonnement: PushSubscription): SouscriptionPush | null => {
  const json = abonnement.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return null;
  return { endpoint: json.endpoint, p256dh: json.keys.p256dh, authKey: json.keys.auth };
};

/**
 * La souscription déjà active sur CET appareil, s'il y en a une — pour
 * savoir si le réglage doit proposer « Activer » ou « Désactiver » sans
 * redemander la permission à chaque ouverture de l'écran.
 */
export async function souscriptionActive(): Promise<SouscriptionPush | null> {
  if (!pushDisponible() || Notification.permission !== 'granted') return null;
  const registration = await navigator.serviceWorker.getRegistration(CHEMIN_SERVICE_WORKER);
  const abonnement = await registration?.pushManager.getSubscription();
  return abonnement ? versSouscription(abonnement) : null;
}

/**
 * Demande la permission puis souscrit. `null` si refusé ou indisponible —
 * jamais d'exception : ce geste reste entièrement optionnel, il ne
 * conditionne rien d'autre dans l'appli.
 */
export async function activerNotifications(): Promise<SouscriptionPush | null> {
  if (!pushDisponible()) return null;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const registration = await navigator.serviceWorker.register(CHEMIN_SERVICE_WORKER);
  await navigator.serviceWorker.ready;
  const abonnement = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    // `Uint8Array<ArrayBufferLike>` n'est plus directement assignable à
    // `BufferSource` depuis que lib.dom distingue `ArrayBuffer` de
    // `SharedArrayBuffer` — le tableau construit ici est toujours un
    // `ArrayBuffer` ordinaire, jamais partagé.
    applicationServerKey: urlBase64VersUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
  });
  return versSouscription(abonnement);
}

/** Retire la souscription de CET appareil. L'endpoint retourné sert à effacer la ligne côté serveur. */
export async function desactiverNotifications(): Promise<string | null> {
  if (!pushDisponible()) return null;
  const registration = await navigator.serviceWorker.getRegistration(CHEMIN_SERVICE_WORKER);
  const abonnement = await registration?.pushManager.getSubscription();
  if (!abonnement) return null;
  const endpoint = abonnement.endpoint;
  await abonnement.unsubscribe();
  return endpoint;
}
