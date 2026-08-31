import type { ClassTheme } from '../content/class-themes';
import bgTexture from '../assets/level-up/bg-texture.jpg';
import cornerOrnament from '../assets/level-up/corner-ornament.png';

/**
 * L'écran plein cadre qui célèbre une montée de niveau.
 *
 * Le seul endroit de l'appli qui s'autorise un peu de faste — justement
 * parce que c'est rare et mérité : une texture de fond, quatre coins ornés
 * (fournis, recadrés en PNG transparent), et le médaillon « Braise et fer »
 * DÉJÀ existant (`.jg-orb-ring` de `theme.css`, le même qui entoure l'orbe
 * de vie en combat) plutôt qu'une image du nombre — recoloré à la matière
 * de la classe comme partout ailleurs, il resterait faux en violet chez un
 * Occultiste s'il était figé dans une image.
 *
 * Tout le texte reste du texte natif de l'appli : rien d'important ne doit
 * dépendre d'une image pour être lisible ou traduisible.
 */
export function LevelUpCelebration({ nom, theme, niveau, gains, onContinuer }: {
  nom: string;
  theme: ClassTheme;
  niveau: number;
  /** Deux ou trois gains chiffrés — ce que la fiche « Après la montée » affiche déjà. */
  gains: { label: string; avant: string; apres: string }[];
  onContinuer: () => void;
}) {
  const coin = (style: React.CSSProperties) => (
    <img
      src={cornerOrnament} alt="" aria-hidden width={68} height={71}
      style={{ position: 'absolute', opacity: 0.85, pointerEvents: 'none', ...style }}
    />
  );

  return (
    <div
      role="dialog"
      aria-label={`${nom} passe niveau ${niveau}`}
      style={{
        position: 'fixed', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '24px 20px calc(24px + env(safe-area-inset-bottom))',
        backgroundImage: `linear-gradient(180deg, rgba(9,10,12,.55), rgba(9,10,12,.88)), url(${bgTexture})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        // Même matière que l'écran de Combat : seuls ces jetons changent
        // avec la classe (voir `class-themes.ts`) — le médaillon réutilise
        // donc exactement la bague dorée de l'orbe de vie, à la bonne teinte.
        ...{
          '--accent': theme.accent, '--accent-wash': theme.accentWash, '--accent-glow': theme.accentGlow,
          '--gold': theme.gold, '--gold-bright': theme.goldBright, '--gold-dim': theme.goldDim,
        } as React.CSSProperties,
      }}
    >
      {coin({ top: 14, left: 14 })}
      {coin({ top: 14, right: 14, transform: 'scaleX(-1)' })}
      {coin({ bottom: 14, left: 14, transform: 'scaleY(-1)' })}
      {coin({ bottom: 14, right: 14, transform: 'scale(-1, -1)' })}

      <div className="lbl" style={{ color: 'var(--gold-bright)', letterSpacing: '.22em' }}>
        Montée de niveau
      </div>

      <div className="jg-orb-ring" style={{ marginTop: 20 }}>
        <div style={{
          width: 132, height: 132, borderRadius: '50%', display: 'grid', placeItems: 'center',
          background: 'radial-gradient(circle at 35% 28%, var(--surface-raised), #0c0e11)',
          boxShadow: 'inset 0 8px 22px rgba(0,0,0,.9), inset 0 -3px 10px var(--accent-glow)',
        }}>
          <div className="num" style={{
            fontSize: 52, fontWeight: 800, lineHeight: 1, color: '#fff',
            textShadow: '0 2px 4px rgba(0,0,0,.9), 0 0 26px var(--accent-glow)',
          }}>
            {niveau}
          </div>
        </div>
      </div>

      <h2 className="ttl" style={{ marginTop: 20, fontSize: 22 }}>{nom}</h2>
      <div className="lbl" style={{ marginTop: 4, color: 'var(--gold)' }}>{theme.label}</div>

      {gains.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 22 }}>
          {gains.map((gain) => (
            <div key={gain.label} style={{
              padding: '7px 12px', borderRadius: 999, border: '1px solid var(--gold-dim)',
              background: 'rgba(0,0,0,.35)',
            }}>
              <div className="lbl" style={{ fontSize: 9 }}>{gain.label}</div>
              <div className="num" style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>
                {gain.avant} → <strong style={{ color: 'var(--gold-bright)' }}>{gain.apres}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onContinuer}
        className="jg-btn-hot"
        style={{ marginTop: 28, width: '100%', maxWidth: 340, minHeight: 52, borderRadius: 'var(--radius-sm)', fontSize: 15 }}
      >
        Continuer
      </button>
    </div>
  );
}
