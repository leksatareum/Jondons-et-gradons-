import { TAB_BAR_CLEARANCE } from './TabBar';

/**
 * Réglages.
 *
 * Minimal pour l'instant, volontairement : la déconnexion n'avait nulle part
 * où vivre en usage normal — seulement dans l'écran d'erreur, qu'on ne
 * traverse jamais quand tout va bien. Les préférences viendront quand il y en
 * aura une vraie à proposer ; un réglage qui ne change rien encore n'aide
 * personne.
 */
export function SettingsScreen({ email, onDeconnexion }: {
  email: string;
  onDeconnexion: () => void;
}) {
  return (
    <main style={{
      flexGrow: 1, padding: `16px 16px calc(${TAB_BAR_CLEARANCE} + 8px)`,
      overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    }}>
      <h2 className="ttl" style={{ margin: 0, fontSize: 18 }}>Réglages</h2>

      <div style={{
        marginTop: 16, padding: '12px 14px', borderRadius: 'var(--radius)',
        border: '1px solid var(--line)', background: 'var(--surface)',
      }}>
        <div className="lbl">Compte</div>
        <div style={{ marginTop: 4, fontSize: 15 }}>{email}</div>
      </div>

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
