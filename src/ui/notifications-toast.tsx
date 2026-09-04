import { useEffect, useRef, useState } from 'react';
import type { CampaignSnapshot } from '../sync/campaign-sync';

/**
 * Le pop-up dans l'app : ce que la notification push fait sur le téléphone
 * quand l'appli est fermée (voir `notifications/push.ts`), cet écran le
 * fait tout seul quand elle est déjà ouverte — une nouvelle entrée de
 * journal, un message ou un secret qui vient d'arriver, sans qu'il faille
 * aller le chercher dans l'onglet Journal pour s'en apercevoir.
 *
 * Jamais au premier instantané (l'ouverture de l'appli, un changement de
 * campagne, une reconnexion) : ce serait redécouvrir tout l'historique
 * d'un coup. Seulement ce qui arrive VRAIMENT après qu'on regarde l'écran —
 * même logique que `SyncBanner` ignore le premier `idle`.
 */

export interface Toast {
  id: string;
  titre: string;
  corps: string;
}

const RESUME = (texte: string, max: number): string =>
  texte.length > max ? `${texte.slice(0, max).trimEnd()}…` : texte;

const DUREE_AFFICHAGE_MS = 6000;

export function useToastsDeCampagne(snapshot: CampaignSnapshot, moi: string): {
  toasts: Toast[];
  fermer: (id: string) => void;
} {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const vuJournal = useRef<Set<string> | null>(null);
  const vuMessages = useRef<Set<string> | null>(null);
  /** Jamais `null` : contrairement aux deux autres, on n'ignore pas le premier instantané. */
  const vuDons = useRef<Set<string>>(new Set());

  const ajouter = (nouveaux: Toast[]) => {
    if (nouveaux.length === 0) return;
    setToasts((courant) => [...courant, ...nouveaux]);
    for (const toast of nouveaux) {
      window.setTimeout(() => {
        setToasts((courant) => courant.filter((entree) => entree.id !== toast.id));
      }, DUREE_AFFICHAGE_MS);
    }
  };

  useEffect(() => {
    const entrees = snapshot.journalEntries;
    if (vuJournal.current === null) {
      vuJournal.current = new Set(entrees.map((entree) => entree.id));
      return;
    }
    const dejaVues = vuJournal.current;
    const nouvelles = entrees.filter((entree) => entree.authorId !== moi && !dejaVues.has(entree.id));
    vuJournal.current = new Set(entrees.map((entree) => entree.id));
    ajouter(nouvelles.map((entree) => ({
      id: `journal-${entree.id}`,
      titre: 'Nouvelle entrée de journal',
      corps: entree.title || RESUME(entree.body, 90),
    })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.journalEntries, moi]);

  useEffect(() => {
    const messages = snapshot.messages;
    if (vuMessages.current === null) {
      vuMessages.current = new Set(messages.map((message) => message.id));
      return;
    }
    const dejaVus = vuMessages.current;
    // Seulement ce qui m'est adressé : le MJ voit tous les messages par RLS
    // (il garde un œil sur la table), mais n'a pas à être averti d'une
    // conversation entre deux joueurs qui ne le concerne pas.
    const nouveaux = messages.filter((message) =>
      message.recipientId === moi && message.authorId !== moi && !dejaVus.has(message.id));
    vuMessages.current = new Set(messages.map((message) => message.id));
    ajouter(nouveaux.map((message) => ({
      id: `message-${message.id}`,
      titre: message.kind === 'secret' ? 'Un secret t’a été confié' : 'Nouveau message',
      corps: RESUME(message.body, 90),
    })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.messages, moi]);

  /**
   * Un objet reçu — du MJ ou d'un autre joueur.
   *
   * Deux choses le distinguent des deux effets ci-dessus, et les deux
   * comptent :
   *
   * 1. Il NE SAUTE PAS le premier instantané. Pour une entrée de journal,
   *    l'ignorer au démarrage évite de redécouvrir tout l'historique ; ici
   *    c'est l'inverse — un objet donné pendant qu'on avait l'appli fermée
   *    attend justement dans cette première lecture, et c'est le seul moment
   *    où l'on peut l'annoncer.
   * 2. La ligne est EFFACÉE dès qu'elle est reçue (voir `App`, l'effet qui
   *    dépose l'objet dans le sac). On l'annonce donc à sa première
   *    apparition, sans quoi il n'y aurait plus rien à annoncer.
   */
  useEffect(() => {
    const dejaVus = vuDons.current;
    const nouveaux = snapshot.itemTransfers.filter(
      (don) => don.recipientId === moi && !dejaVus.has(don.id),
    );
    for (const don of nouveaux) dejaVus.add(don.id);
    ajouter(nouveaux.map((don) => ({
      id: `don-${don.id}`,
      titre: don.qty > 1 ? `${don.qty} × ${don.itemName}` : don.itemName,
      corps: don.itemNote?.trim() || 'Un objet vient d’arriver dans ton sac.',
    })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.itemTransfers, moi]);

  const fermer = (id: string) => setToasts((courant) => courant.filter((entree) => entree.id !== id));

  return { toasts, fermer };
}

/** La pile de pop-up, posée en haut de l'écran — au-dessus de tout, y compris la barre de synchro. */
export function ToastStack({ toasts, onFermer }: { toasts: Toast[]; onFermer: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div
      style={{
        position: 'fixed', top: 'calc(8px + env(safe-area-inset-top))', left: 8, right: 8, zIndex: 60,
        display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'none',
        // Même correctif que `TabBar.tsx` : sur son propre calque, pour ne
        // pas se faire décaler par le défilement inertiel d'un écran en
        // dessous pendant une glissade rapide.
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
        willChange: 'transform',
      }}
    >
      {toasts.map((toast) => (
        <button
          key={toast.id}
          onClick={() => onFermer(toast.id)}
          className="jg-anim-toast-in"
          style={{
            pointerEvents: 'auto', textAlign: 'left', padding: '10px 12px', borderRadius: 'var(--radius)',
            border: '1px solid var(--accent)', background: 'var(--surface-raised)',
            boxShadow: '0 6px 18px rgba(0,0,0,.45)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{toast.titre}</div>
          <div style={{ fontSize: 13, marginTop: 2, color: 'var(--ink)', lineHeight: 1.4 }}>{toast.corps}</div>
        </button>
      ))}
    </div>
  );
}
