import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { TAB_BAR_CLEARANCE } from './TabBar';
import {
  activerNotifications, desactiverNotifications, pushDisponible, souscriptionActive,
} from '../notifications/push';
import { deletePushSubscription, savePushSubscription } from '../sync/mutations';

/**
 * Réglages.
 *
 * La déconnexion n'avait nulle part où vivre en usage normal — seulement
 * dans l'écran d'erreur, qu'on ne traverse jamais quand tout va bien. Les
 * notifications sont le premier vrai réglage : activer/désactiver, propre
 * à CET appareil (voir `notifications/push.ts`).
 */

type EtatNotifications = 'chargement' | 'actif' | 'inactif' | 'refuse' | 'indisponible';

/**
 * Le réglage des notifications push — propre à cet appareil, pas au compte :
 * s'y abonner sur son téléphone n'abonne pas sa tablette.
 *
 * iOS/Safari n'active les notifications web que si l'appli a d'abord été
 * ajoutée à l'écran d'accueil (Partager → Sur l'écran d'accueil) : sans ce
 * geste, la permission reste indisponible même en appuyant sur « Activer ».
 * C'est une limite d'Apple, pas de cette appli — le texte le rappelle plutôt
 * que de laisser deviner pourquoi rien ne se passe.
 */
function SectionNotifications({ client, userId }: { client: SupabaseClient; userId: string }) {
  const [etat, setEtat] = useState<EtatNotifications>('chargement');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    (async () => {
      if (!pushDisponible()) { if (!annule) setEtat('indisponible'); return; }
      if (Notification.permission === 'denied') { if (!annule) setEtat('refuse'); return; }
      const souscription = await souscriptionActive();
      if (!annule) setEtat(souscription ? 'actif' : 'inactif');
    })();
    return () => { annule = true; };
  }, []);

  const activer = async () => {
    setEnCours(true);
    setErreur(null);
    try {
      const souscription = await activerNotifications();
      if (!souscription) {
        setEtat(Notification.permission === 'denied' ? 'refuse' : 'indisponible');
        return;
      }
      await savePushSubscription(client, userId, souscription);
      setEtat('actif');
    } catch (cause) {
      setErreur(String(cause));
    } finally {
      setEnCours(false);
    }
  };

  const desactiver = async () => {
    setEnCours(true);
    setErreur(null);
    try {
      const endpoint = await desactiverNotifications();
      if (endpoint) await deletePushSubscription(client, endpoint);
      setEtat('inactif');
    } catch (cause) {
      setErreur(String(cause));
    } finally {
      setEnCours(false);
    }
  };

  const texte: Record<EtatNotifications, string> = {
    chargement: 'Vérification…',
    actif: 'Activées sur cet appareil.',
    inactif: 'Une entrée de journal, un message ou un secret te préviendra ici même l’appli fermée.',
    refuse: 'Refusées pour ce site — à réactiver dans les réglages du navigateur.',
    indisponible: 'Indisponibles sur cet appareil ou ce navigateur. Sur iPhone/iPad : ajoute d’abord l’appli à l’écran d’accueil (Partager → Sur l’écran d’accueil), puis reviens ici.',
  };

  return (
    <div style={{
      marginTop: 12, padding: '12px 14px', borderRadius: 'var(--radius)',
      border: '1px solid var(--gold-dim)', background: 'var(--surface)',
    }}>
      <div className="lbl">Notifications</div>
      <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.45, color: 'var(--muted)' }}>
        {texte[etat]}
      </div>
      {erreur && (
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--vital)' }}>{erreur}</div>
      )}
      {(etat === 'inactif' || etat === 'actif') && (
        <button
          onClick={etat === 'actif' ? desactiver : activer}
          disabled={enCours}
          style={{
            marginTop: 10, minHeight: 'var(--tap)', padding: '0 16px', borderRadius: 'var(--radius-sm)',
            border: etat === 'actif' ? '1px solid var(--gold-dim)' : 'none',
            background: etat === 'actif' ? 'transparent' : 'var(--accent)',
            color: etat === 'actif' ? 'var(--ink)' : 'var(--accent-ink)',
            fontSize: 14, fontWeight: 700, opacity: enCours ? 0.6 : 1,
          }}
        >
          {enCours ? 'Un instant…' : etat === 'actif' ? 'Désactiver' : 'Activer les notifications'}
        </button>
      )}
    </div>
  );
}

export function SettingsScreen({ client, userId, email, onDeconnexion, onRetour }: {
  client: SupabaseClient;
  userId: string;
  email: string;
  onDeconnexion: () => void;
  /** Cet écran s'ouvre depuis la Fiche : le chemin du retour doit se voir. */
  onRetour: () => void;
}) {
  return (
    <main style={{
      flexGrow: 1, padding: `16px 16px calc(${TAB_BAR_CLEARANCE} + 8px)`,
      overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    }}>
      <button
        onClick={onRetour}
        className="lbl"
        style={{
          display: 'block', width: 'fit-content', minHeight: 34, padding: '0 12px', marginBottom: 12,
          borderRadius: 999, border: '1px solid var(--gold-dim)', color: 'var(--muted)', fontWeight: 700,
        }}
      >
        ← Fiche
      </button>
      <h2 className="ttl" style={{ margin: 0, fontSize: 18 }}>Réglages</h2>

      <div style={{
        marginTop: 16, padding: '12px 14px', borderRadius: 'var(--radius)',
        border: '1px solid var(--gold-dim)', background: 'var(--surface)',
      }}>
        <div className="lbl">Compte</div>
        <div style={{ marginTop: 4, fontSize: 15 }}>{email}</div>
      </div>

      <SectionNotifications client={client} userId={userId} />

      <button
        onClick={onDeconnexion}
        style={{
          width: '100%', minHeight: 'var(--tap)', marginTop: 20, borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--vital)', color: 'var(--vital)', fontSize: 15, fontWeight: 700,
        }}
      >
        Se déconnecter
      </button>
    </main>
  );
}
