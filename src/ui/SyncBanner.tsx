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

export function SyncBanner({ status, onRefresh }: {
  status: SyncStatus;
  onRefresh: () => void;
}) {
  const texte = libelle[status];
  if (!texte) return null;

  const rompu = status === 'offline' || status === 'idle';

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
