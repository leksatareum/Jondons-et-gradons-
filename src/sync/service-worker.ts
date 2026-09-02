/**
 * Installation du programme de fond, au démarrage.
 *
 * Il existait déjà, mais n'était installé que par `activerNotifications` —
 * c'est-à-dire seulement pour qui avait accepté les notifications. Or c'est
 * lui, et lui seul, qui permet à l'application de s'ouvrir sans réseau : la
 * laisser dépendre d'un réglage facultatif revenait à offrir le hors-ligne à
 * une partie de la table au hasard.
 *
 * L'installation est donc inconditionnelle et silencieuse. Elle ne conditionne
 * rien : un navigateur qui la refuse rend simplement l'application telle
 * qu'elle était avant, c'est-à-dire dépendante du réseau.
 */

export const CHEMIN_SERVICE_WORKER = '/sw.js';

export function installerServiceWorker(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  // Après `load` : l'installation télécharge la coquille et les fichiers de
  // l'appli, et on ne veut pas que ce trafic dispute la bande passante au
  // premier affichage.
  const lancer = () => {
    navigator.serviceWorker.register(CHEMIN_SERVICE_WORKER).catch((cause) => {
      // Contexte non sécurisé, mode privé, réglage restrictif : rien à
      // rattraper, et surtout rien qui doive empêcher de jouer.
      console.warn('Hors-ligne indisponible :', cause);
    });
  };

  if (document.readyState === 'complete') lancer();
  else window.addEventListener('load', lancer, { once: true });
}
