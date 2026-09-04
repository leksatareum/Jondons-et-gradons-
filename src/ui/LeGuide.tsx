/**
 * Le menu du Guide : une seule porte pour toutes les consultations.
 *
 * ═══ Pourquoi ce menu existe ═══
 *
 * Chaque pense-bête ajouté à l'en-tête du MJ y posait un rond de plus. À
 * quatre, la rangée était devenue un mur de cercles identiques : rien ne
 * distinguait le triangle du décor de la silhouette des PNJ sans appuyer
 * dessus pour voir. Un cinquième (les objets magiques) l'aurait rendue
 * illisible, et il y en aura d'autres.
 *
 * Ce menu range les consultations derrière UN bouton nommé, et leur rend ce
 * qu'un rond ne peut pas porter : un nom et une phrase qui dit à quoi ça sert.
 * Chaque écran s'ouvre ensuite tel quel, inchangé.
 *
 * Ce qui reste dans l'en-tête, et pourquoi : les ACTIONS. Passer au tour
 * précédent, ajouter un adversaire, tout retirer, lancer ou terminer. Une
 * action se fait en plein combat et doit tenir en un appui ; une consultation
 * se lit, et supporte très bien d'en coûter deux.
 */

export type OutilDuGuide = 'dd' | 'decor' | 'gens' | 'poursuite' | 'objets';

type Entree = {
  id: OutilDuGuide;
  nom: string;
  /** Ce que le rond ne pouvait pas dire. */
  quoi: string;
  icone: React.ReactNode;
};

const trait = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const ENTREES: Entree[] = [
  {
    id: 'dd',
    nom: 'Degrés de difficulté',
    quoi: 'Quel DD mettre, et quand donner l’avantage.',
    icone: (
      <span className="ttl" style={{ fontSize: 13, fontWeight: 700 }}>DD</span>
    ),
  },
  {
    id: 'decor',
    nom: 'Le décor',
    quoi: 'Dangers, pièges et climat, filtrés sur le niveau du groupe.',
    icone: (
      <svg width="19" height="19" viewBox="0 0 24 24" {...trait} aria-hidden>
        <path d="M12 2 L22 20 H2 Z" />
        <path d="M12 9v5M12 17.2v.1" />
      </svg>
    ),
  },
  {
    id: 'gens',
    nom: 'Les gens',
    quoi: 'Tirer un PNJ, et suivre sa loyauté.',
    icone: (
      <svg width="19" height="19" viewBox="0 0 24 24" {...trait} aria-hidden>
        <circle cx="12" cy="8" r="3.6" />
        <path d="M4.8 20.5a7.2 7.2 0 0 1 14.4 0" />
      </svg>
    ),
  },
  {
    id: 'poursuite',
    nom: 'La poursuite',
    quoi: 'Les pointes de chacun, et le d12 de complications.',
    icone: (
      <svg width="19" height="19" viewBox="0 0 24 24" {...trait} aria-hidden>
        <path d="M3 12h11M10.5 7.5 15 12l-4.5 4.5" />
        <path d="M19 4.5v15" />
      </svg>
    ),
  },
  {
    id: 'objets',
    nom: 'Les objets magiques',
    quoi: 'Les 51 objets communs du Guide, cherchables par leur nom.',
    icone: (
      <svg width="19" height="19" viewBox="0 0 24 24" {...trait} aria-hidden>
        <path d="M12 3.2 14.4 9l6.1.4-4.7 3.9 1.5 5.9L12 16.1 6.7 19.2l1.5-5.9L3.5 9.4 9.6 9Z" />
      </svg>
    ),
  },
];

export function LeGuide({ onChoisir, onFermer }: {
  onChoisir: (outil: OutilDuGuide) => void;
  onFermer: () => void;
}) {
  return (
    <div
      onClick={onFermer}
      style={{
        position: 'fixed', inset: 0, zIndex: 30, background: 'rgba(13,15,18,.86)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}
    >
      {/* Un panneau par le bas plutôt qu'un plein écran : c'est un aiguillage,
          pas une lecture, et le pouce y arrive sans traverser l'écran. */}
      <div
        onClick={(evenement) => evenement.stopPropagation()}
        style={{
          background: 'rgba(22,25,29,.97)',
          backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
          borderTop: '1px solid var(--gold-dim)',
          borderTopLeftRadius: 16, borderTopRightRadius: 16,
          padding: '14px 16px calc(16px + env(safe-area-inset-bottom))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 11 }}>
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            <h2 className="ttl" style={{ margin: 0, fontSize: 17 }}>Le Guide</h2>
            <div className="lbl" style={{ fontSize: 9, marginTop: 2 }}>ce qu’on cherche en pleine séance</div>
          </div>
          <button onClick={onFermer} aria-label="Fermer" className="jg-rond" style={{ fontSize: 18 }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {ENTREES.map((entree) => (
            <button
              key={entree.id}
              onClick={() => onChoisir(entree.id)}
              className="card"
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                minHeight: 52, padding: '9px 13px', textAlign: 'left', color: 'inherit',
              }}
            >
              <span style={{
                flexShrink: 0, width: 34, height: 34, borderRadius: 999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--gold-dim)', color: 'var(--gold-bright)',
              }}>
                {entree.icone}
              </span>
              <span style={{ flexGrow: 1, minWidth: 0 }}>
                <span className="ttl" style={{ display: 'block', fontSize: 14.5 }}>{entree.nom}</span>
                <span style={{ display: 'block', fontSize: 11.5, lineHeight: 1.4, color: 'var(--muted)', marginTop: 1 }}>
                  {entree.quoi}
                </span>
              </span>
              <span aria-hidden style={{ flexShrink: 0, fontSize: 13, color: 'var(--muted)' }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
