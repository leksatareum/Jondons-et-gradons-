import { useEffect, useState } from 'react';
import type { SyncStatus } from '../sync/connection';

/**
 * L'état de la connexion, visible.
 *
 * C'est la réponse frontale à la panne de l'ancienne application : elle
 * pouvait être déconnectée sans que personne le sache, et il fallait recharger
 * la page pour voir le combat démarrer. Ici, si le lien est rompu, ça se voit
 * — et un bouton permet de forcer la relecture sans recharger.
 *
 * Quand tout va bien, le bandeau n'existe pas. Un voyant vert permanent n'est
 * qu'un bruit de plus sur un petit écran, et on cesse de le regarder.
 */

const libelle: Partial<Record<SyncStatus, string>> = {
  connecting: 'Reconnexion…',
  syncing: 'Mise à jour…',
  offline: 'Hors ligne',
  idle: 'Déconnecté',
};

/**
 * Un petit retard avant d'AFFICHER « connecting »/« syncing ».
 *
 * Sur téléphone, le canal meurt à chaque passage en arrière-plan (l'OS coupe
 * le websocket) — revenir au premier plan rouvre le canal et resynchronise en
 * une fraction de seconde la plupart du temps. Montrer « Reconnexion… »
 * immédiatement faisait clignoter le bandeau à chaque verrouillage d'écran ou
 * changement d'appli, lu comme une instabilité alors que rien n'était perdu.
 *
 * « offline » et « idle » restent immédiats : ce sont de vraies coupures
 * détectées comme telles, pas des reconnexions qui vont se résoudre seules.
 * « live » aussi : dès que tout va bien, on l'affiche sans délai, jamais la
 * peine de laisser le bandeau traîner après coup.
 */
const RETARD_AFFICHAGE_MS = 600;

function useStatutAffiche(status: SyncStatus): SyncStatus {
  const [affiche, setAffiche] = useState(status);
  useEffect(() => {
    if (status !== 'connecting' && status !== 'syncing') {
      setAffiche(status);
      return;
    }
    const handle = window.setTimeout(() => setAffiche(status), RETARD_AFFICHAGE_MS);
    return () => window.clearTimeout(handle);
  }, [status]);
  return affiche;
}

/**
 * « Hier 21:40 », « 14:05 », « 28/08 » — la précision utile et rien de plus.
 *
 * Ce que la joueuse veut savoir tient en une question : est-ce que ce que je
 * lis date d'il y a dix minutes ou de la séance d'avant ? Une date complète
 * demanderait un calcul mental au moment où l'on cherche justement à ne pas
 * réfléchir.
 */
export function dateDuCacheLisible(quand: number, maintenant: number): string {
  const jour = (instant: number) => {
    const date = new Date(instant);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  };
  const heure = new Date(quand).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const ecart = (jour(maintenant) - jour(quand)) / 86_400_000;
  if (ecart <= 0) return heure;
  if (ecart === 1) return `hier ${heure}`;
  return new Date(quand).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

export function SyncBanner({ status, onRefresh, depuisLeCache = false, dateDuCache = null }: {
  status: SyncStatus;
  onRefresh: () => void;
  /** Ce qui est affiché vient du téléphone, pas du réseau. */
  depuisLeCache?: boolean;
  dateDuCache?: number | null;
}) {
  const affiche = useStatutAffiche(status);

  /*
    Le cache passe AVANT le statut, et sans le délai d'affichage.

    Sans réseau, la machine à reconnexion reste longtemps en « connecting » :
    afficher « Reconnexion… » sur des données de la veille laisserait croire
    qu'on regarde l'état réel de la partie. Ce qui compte alors n'est pas où
    en est le canal, mais ce qu'on a sous les yeux.
  */
  if (depuisLeCache) {
    const quand = dateDuCache ? dateDuCacheLisible(dateDuCache, Date.now()) : null;
    return (
      <div role="status" style={{ ...barre, background: 'var(--surface-raised)' }}>
        <span style={{ color: 'var(--muted)' }}>
          {quand ? `Hors ligne — état du ${quand}` : 'Hors ligne — dernier état connu'}
        </span>
        <button onClick={onRefresh} style={{ ...bouton, borderColor: 'var(--line)', color: 'var(--muted)' }}>
          Réessayer
        </button>
      </div>
    );
  }

  const texte = libelle[affiche];
  if (!texte) return null;

  const rompu = affiche === 'offline' || affiche === 'idle';

  return (
    <div role="status" style={{ ...barre, background: rompu ? 'var(--vital-wash)' : 'var(--surface-raised)' }}>
      <span style={{ color: rompu ? 'var(--vital)' : 'var(--muted)' }}>{texte}</span>
      {rompu && <button onClick={onRefresh} style={bouton}>Réessayer</button>}
    </div>
  );
}

const barre: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  minHeight: 30,
  paddingTop: 'env(safe-area-inset-top)',
  fontSize: 12,
  borderBottom: '1px solid var(--line)',
};

const bouton: React.CSSProperties = {
  padding: '3px 9px',
  borderRadius: 999,
  border: '1px solid var(--vital)',
  color: 'var(--vital)',
  fontSize: 11,
  fontWeight: 700,
};
