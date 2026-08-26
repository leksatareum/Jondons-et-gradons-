import { useRef, useState } from 'react';
import type { ClassTheme } from '../content/class-themes';

/**
 * Le médaillon de portrait : un cerclage d'or (ou d'argent, ou de bronze —
 * la matière de la classe) autour de l'image que le joueur a choisie, ou
 * d'une silhouette générique tant qu'il n'en a pas mis une.
 *
 * `onChoisir` absent : le médaillon est purement décoratif (c'est le cas de
 * l'écran de combat, qui ne fait qu'afficher). Présent : cliquer ouvre le
 * sélecteur de fichier, l'échec s'affiche sous le médaillon plutôt que de
 * disparaître dans la console — un envoi qui rate en pleine partie doit se
 * voir.
 */
export function PortraitMedallion({
  portraitUrl, theme, size = 46, onChoisir,
}: {
  portraitUrl?: string | null;
  theme: ClassTheme;
  size?: number;
  onChoisir?: (file: File) => Promise<void>;
}) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editable = Boolean(onChoisir);

  const choisir = async (file: File) => {
    setErreur(null);
    setEnCours(true);
    try {
      await onChoisir?.(file);
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : 'Échec de l’envoi.');
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => editable && inputRef.current?.click()}
        disabled={!editable || enCours}
        aria-label={editable ? 'Changer le portrait' : undefined}
        style={{
          width: size, height: size, borderRadius: '50%', padding: Math.max(2, size * 0.045),
          background: `conic-gradient(from 200deg, ${theme.goldDim}, ${theme.goldBright} 22%, ${theme.goldDim} 44%, ${theme.gold} 66%, ${theme.goldDim} 88%)`,
          boxShadow: '0 3px 10px rgba(0,0,0,.5)',
          cursor: editable ? 'pointer' : 'default',
        }}
      >
        <div style={{
          position: 'relative', width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
          background: 'radial-gradient(circle at 50% 24%, #4b3a24, #1a1109 78%)',
          boxShadow: 'inset 0 2px 7px rgba(0,0,0,.7)', opacity: enCours ? 0.5 : 1,
        }}>
          {portraitUrl ? (
            <img
              src={portraitUrl} alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <svg
              width="72%" height="72%" viewBox="0 0 24 24" fill={theme.gold} opacity=".85"
              style={{ position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)' }}
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M12 13.4 c-4.2 0-7.2 2.7-7.2 6.6 h14.4 c0-3.9-3-6.6-7.2-6.6 Z" />
            </svg>
          )}
        </div>
      </button>

      {editable && (
        <input
          ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp"
          style={{ display: 'none' }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void choisir(file);
          }}
        />
      )}

      {erreur && (
        <div
          role="alert"
          className="lbl"
          style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6,
            width: 150, textTransform: 'none', textAlign: 'center', fontSize: 11,
            color: 'var(--vital)', background: 'var(--surface-raised)', border: '1px solid var(--vital)',
            borderRadius: 8, padding: '5px 8px', zIndex: 10,
          }}
        >
          {erreur}
        </div>
      )}
    </div>
  );
}
