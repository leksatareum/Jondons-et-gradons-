import { AVANTAGE, BORNES_SAUVEGARDE, DEGRES_DE_DIFFICULTE, DESAVANTAGE, NOTE_DEGRES } from '../domain/tresor';

/**
 * Le pense-bête du MJ : quel DD mettre, et quand donner l'avantage.
 *
 * C'est ce qu'on cherche vingt fois par soirée et qu'on finit par inventer —
 * inventer un DD n'est pas grave une fois, mais un MJ qui invente tous les
 * siens dérive vers le trop dur ou le trop facile sans s'en apercevoir.
 *
 * Rien d'autre n'est mis ici, et c'est délibéré : un pense-bête qui contient
 * tout est un livre, et un livre ne s'ouvre pas en pleine scène.
 */
export function AideDuMJ({ onFermer }: { onFermer: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 30, background: 'rgba(13,15,18,.95)',
      display: 'flex', flexDirection: 'column',
    }}>
      <header style={{
        flexShrink: 0, padding: '13px 16px 12px',
        paddingTop: 'calc(13px + env(safe-area-inset-top))',
        borderBottom: '1px solid var(--gold-dim)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <h2 className="ttl" style={{ margin: 0, fontSize: 18, flexGrow: 1 }}>Quel degré de difficulté ?</h2>
        <button onClick={onFermer} aria-label="Fermer" className="jg-rond" style={{ fontSize: 18 }}>✕</button>
      </header>

      <div style={{
        flexGrow: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '14px 16px calc(20px + env(safe-area-inset-bottom))',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {DEGRES_DE_DIFFICULTE.map((degre) => (
            <div key={degre.dd} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 13px' }}>
              <div className="ttl num" style={{
                flexShrink: 0, width: 38, textAlign: 'center', fontSize: 22,
                color: degre.dd <= 20 ? 'var(--gold-bright)' : 'var(--muted)',
              }}>
                {degre.dd}
              </div>
              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <div className="ttl" style={{ fontSize: 15 }}>{degre.label}</div>
                {degre.note && (
                  <div style={{ fontSize: 11.5, lineHeight: 1.4, color: 'var(--muted)', marginTop: 2 }}>
                    {degre.note}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <p style={{ margin: '12px 0 0', fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>
          {NOTE_DEGRES}
        </p>
        <p style={{ margin: '8px 0 0', fontSize: 12, lineHeight: 1.5, color: 'var(--gold)' }}>
          Pour une sauvegarde, ne descends jamais sous {BORNES_SAUVEGARDE.min} ni au-dessus de {BORNES_SAUVEGARDE.max}.
        </p>

        <div className="lbl" style={{ marginTop: 20, fontSize: 9, color: 'var(--ok)' }}>Donner l’avantage quand…</div>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12.5, lineHeight: 1.6 }}>
          {AVANTAGE.map((ligne) => <li key={ligne}>{ligne}</li>)}
        </ul>

        <div className="lbl" style={{ marginTop: 16, fontSize: 9, color: 'var(--vital)' }}>Imposer le désavantage quand…</div>
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12.5, lineHeight: 1.6 }}>
          {DESAVANTAGE.map((ligne) => <li key={ligne}>{ligne}</li>)}
        </ul>

        <p style={{ margin: '16px 0 0', fontSize: 11.5, lineHeight: 1.5, color: 'var(--muted)' }}>
          Guide du Maître 2024, p. 29. L’avantage est aussi la façon la plus simple de récompenser
          un joueur qui trouve une bonne idée — le livre le dit avant de donner la table.
        </p>
      </div>
    </div>
  );
}
