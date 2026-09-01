import { useState, type FormEvent } from 'react';

/**
 * Choisir un nouveau mot de passe, au retour du lien reçu par mail.
 *
 * Cet écran passe AVANT tout le reste, y compris la table : le lien de
 * récupération ouvre déjà une session valide (c'est ainsi que Supabase le
 * fait), donc sans cet écran on entrerait droit dans sa fiche sans avoir rien
 * changé — et le mot de passe oublié le resterait. Voir `App`,
 * `lireLienDeRecuperation`.
 *
 * Deux champs plutôt qu'un : on ne relit pas ce qu'on tape en points, et se
 * tromper ici verrouille son propre compte jusqu'au prochain mail.
 */

/** Le minimum imposé côté serveur est plus bas ; celui-ci est le nôtre. */
export const LONGUEUR_MINIMALE = 8;

export function NewPasswordScreen({ onValider, onAbandonner }: {
  onValider: (motDePasse: string) => Promise<void>;
  /** Repartir sans changer — le lien restera valable jusqu'à son expiration. */
  onAbandonner: () => void;
}) {
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const tropCourt = motDePasse.length > 0 && motDePasse.length < LONGUEUR_MINIMALE;
  const discordent = confirmation.length > 0 && confirmation !== motDePasse;
  const valide = motDePasse.length >= LONGUEUR_MINIMALE && confirmation === motDePasse;

  const envoyer = async (event: FormEvent) => {
    event.preventDefault();
    if (!valide || enCours) return;
    setEnCours(true);
    setErreur(null);
    try {
      await onValider(motDePasse);
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : String(cause));
      setEnCours(false);
    }
  };

  return (
    <main style={page}>
      <div style={bloc}>
        <h1 className="ttl" style={titreStyle}>Nouveau mot de passe</h1>
        <p style={sous}>Choisis-en un, puis tu resteras connecté·e.</p>

        <form onSubmit={envoyer} style={{ display: 'grid', gap: 12 }}>
          <label style={champ}>
            <span className="lbl">Nouveau mot de passe</span>
            <input
              type="password"
              value={motDePasse}
              onChange={(event) => setMotDePasse(event.target.value)}
              autoComplete="new-password"
              autoFocus
              style={saisie}
            />
          </label>

          <label style={champ}>
            <span className="lbl">Encore une fois</span>
            <input
              type="password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="new-password"
              style={saisie}
            />
          </label>

          {/* Dit AVANT d'appuyer, pas après : le serveur refuserait de toute
              façon, mais un aller-retour pour apprendre « trop court » est un
              aller-retour de trop. */}
          <p style={indice}>
            {tropCourt ? `Au moins ${LONGUEUR_MINIMALE} caractères.`
              : discordent ? 'Les deux ne sont pas identiques.'
                : `Au moins ${LONGUEUR_MINIMALE} caractères.`}
          </p>

          <button type="submit" disabled={!valide || enCours} style={bouton(valide && !enCours)}>
            {enCours ? 'Enregistrement…' : 'Enregistrer'}
          </button>

          <button type="button" onClick={onAbandonner} style={lien}>
            Annuler
          </button>

          {erreur && <p role="alert" style={alerte}>{erreur}</p>}
        </form>
      </div>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: '100dvh',
  display: 'grid',
  placeItems: 'center',
  padding: '24px max(20px, env(safe-area-inset-left)) calc(24px + env(safe-area-inset-bottom))',
};

const bloc: React.CSSProperties = { width: '100%', maxWidth: 340 };
const titreStyle: React.CSSProperties = { margin: 0, fontSize: 24, letterSpacing: '-0.01em' };
const sous: React.CSSProperties = { margin: '6px 0 26px', color: 'var(--muted)', fontSize: 13 };
const champ: React.CSSProperties = { display: 'grid', gap: 6 };

const saisie: React.CSSProperties = {
  height: 'var(--tap)', padding: '0 12px', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)',
  // 16px ou plus : en dessous, iOS zoome sur le champ à la mise au point.
  fontSize: 16,
};

const indice: React.CSSProperties = { margin: 0, fontSize: 12, color: 'var(--muted)' };

const bouton = (actif: boolean): React.CSSProperties => ({
  height: 'var(--tap)', marginTop: 6, borderRadius: 'var(--radius-sm)',
  fontWeight: 700, fontSize: 15,
  background: actif ? 'var(--accent)' : 'var(--surface-raised)',
  color: actif ? 'var(--accent-ink)' : 'var(--muted)',
  border: actif ? 'none' : '1px solid var(--line)',
});

const lien: React.CSSProperties = {
  justifySelf: 'start', padding: '6px 0', fontSize: 13, color: 'var(--muted)',
  textDecoration: 'underline', textUnderlineOffset: 3,
};

const alerte: React.CSSProperties = {
  margin: 0, padding: '10px 12px', borderRadius: 'var(--radius-sm)',
  background: 'var(--vital-wash)', color: 'var(--vital)', fontSize: 13,
};
