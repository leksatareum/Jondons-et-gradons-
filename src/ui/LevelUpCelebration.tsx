import type { ClassTheme } from '../content/class-themes';
import bgTexture from '../assets/level-up/bg-texture.jpg';
import cornerOrnament from '../assets/level-up/corner-ornament.png';

/**
 * L'écran plein cadre qui célèbre une montée de niveau.
 *
 * Le seul endroit de l'appli qui s'autorise du faste — justement parce que
 * c'est rare et mérité : une texture de fond, quatre coins ornés (fournis,
 * recadrés en PNG transparent), et le médaillon « Braise et fer » DÉJÀ
 * existant (`.jg-orb-ring` de `theme.css`, le même qui entoure l'orbe de vie
 * en combat) plutôt qu'une image du nombre — recoloré à la matière de la
 * classe comme partout ailleurs, il resterait faux en violet chez un
 * Occultiste s'il était figé dans une image.
 *
 * Rien n'arrive en même temps : le cadre se pose, le médaillon tombe, le
 * chiffre s'écrase avec son onde de choc, puis les gains se déroulent. C'est
 * la seule mise en scène de l'appli qui dépasse la demi-seconde — ailleurs le
 * mouvement doit disparaître derrière le geste (voir `theme.css`), ici il EST
 * la récompense. Un joueur pressé peut appuyer sur « Continuer » sans
 * attendre : le bouton n'est jamais désactivé, et la fiche est déjà à jour
 * derrière (voir `SheetView`, `monterDeNiveau`).
 *
 * Tout le texte reste du texte natif : rien d'important ne doit dépendre
 * d'une image pour être lisible.
 */

/** Le rythme, en millisecondes — un seul endroit pour régler la cadence. */
const TEMPS = {
  coins: 80,
  titre: 200,
  medaillon: 300,
  chiffre: 560,
  nom: 820,
  matiere: 900,
  gains: 990,
  bouton: 1180,
};

export function LevelUpCelebration({ nom, theme, niveau, gains, onContinuer }: {
  nom: string;
  theme: ClassTheme;
  niveau: number;
  /** Deux ou trois gains chiffrés — ce que la fiche « Après la montée » affiche déjà. */
  gains: { label: string; avant: string; apres: string }[];
  onContinuer: () => void;
}) {
  const coin = (style: React.CSSProperties, retard: number) => (
    <img
      src={cornerOrnament} alt="" aria-hidden width={68} height={71}
      className="jg-anim-rise"
      style={{
        position: 'absolute', opacity: 0.85, pointerEvents: 'none',
        animationDelay: `${retard}ms`, animationDuration: '520ms', ...style,
      }}
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
      {coin({ top: 14, left: 14 }, TEMPS.coins)}
      {coin({ top: 14, right: 14, transform: 'scaleX(-1)' }, TEMPS.coins + 70)}
      {coin({ bottom: 14, left: 14, transform: 'scaleY(-1)' }, TEMPS.coins + 140)}
      {coin({ bottom: 14, right: 14, transform: 'scale(-1, -1)' }, TEMPS.coins + 210)}

      <div
        className="lbl jg-anim-rise"
        style={{ color: 'var(--gold-bright)', letterSpacing: '.22em', animationDelay: `${TEMPS.titre}ms` }}
      >
        Montée de niveau
      </div>

      <div style={{ position: 'relative', marginTop: 20, display: 'grid', placeItems: 'center' }}>
        {/* La lueur de fond : elle déborde du médaillon et prend la couleur
            de la classe — c'est elle qui fait « briller » l'écran, pas une
            image, donc elle suit un Occultiste en violet sans rien changer. */}
        <div
          aria-hidden
          className="jg-anim-pop"
          style={{
            position: 'absolute', width: 260, height: 260, borderRadius: '50%',
            background: 'radial-gradient(circle, var(--accent-glow), transparent 68%)',
            animationDelay: `${TEMPS.medaillon}ms`, animationDuration: '900ms',
          }}
        />

        {/* L'onde de choc, calée sur l'écrasement du chiffre. */}
        <div
          aria-hidden
          className="jg-anim-shockwave"
          style={{
            position: 'absolute', width: 142, height: 142, borderRadius: '50%',
            border: '2px solid var(--gold-bright)',
            animationDelay: `${TEMPS.chiffre}ms`,
          }}
        />

        <div className="jg-anim-pop" style={{ animationDelay: `${TEMPS.medaillon}ms` }}>
          <div className="jg-orb-ring">
            <div className="jg-shine" style={{
              width: 132, height: 132, borderRadius: '50%', display: 'grid', placeItems: 'center',
              background: 'radial-gradient(circle at 35% 28%, var(--surface-raised), #0c0e11)',
              boxShadow: 'inset 0 8px 22px rgba(0,0,0,.9), inset 0 -3px 10px var(--accent-glow)',
            }}>
              <div className="num jg-anim-slam" style={{
                fontSize: 52, fontWeight: 800, lineHeight: 1, color: '#fff',
                textShadow: '0 2px 4px rgba(0,0,0,.9), 0 0 26px var(--accent-glow)',
                animationDelay: `${TEMPS.chiffre}ms`,
              }}>
                {niveau}
              </div>
            </div>
          </div>
        </div>
      </div>

      <h2
        className="ttl jg-anim-rise"
        style={{ marginTop: 20, fontSize: 22, animationDelay: `${TEMPS.nom}ms` }}
      >
        {nom}
      </h2>
      <div
        className="lbl jg-anim-rise"
        style={{ marginTop: 4, color: 'var(--gold)', animationDelay: `${TEMPS.matiere}ms` }}
      >
        {theme.label}
      </div>

      {gains.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 22 }}>
          {gains.map((gain, index) => (
            <div
              key={gain.label}
              className="jg-anim-pop"
              style={{
                padding: '7px 12px', borderRadius: 999, border: '1px solid var(--gold-dim)',
                background: 'rgba(0,0,0,.35)',
                animationDelay: `${TEMPS.gains + index * 90}ms`,
              }}
            >
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
        className="jg-btn-hot jg-anim-rise"
        style={{
          marginTop: 28, width: '100%', maxWidth: 340, minHeight: 52,
          borderRadius: 'var(--radius-sm)', fontSize: 15,
          animationDelay: `${TEMPS.bouton}ms`,
        }}
      >
        Continuer
      </button>
    </div>
  );
}
