import { useState, type FormEvent } from 'react';

/**
 * L'écran d'entrée.
 *
 * Deux champs, un bouton. Il n'a rien d'autre à faire, et surtout pas à
 * distraire : on y passe une fois puis plus jamais, la session étant
 * persistée et rafraîchie automatiquement.
 *
 * Le seul point de soin est l'erreur. Un message en anglais au moment où la
 * partie commence est une petite humiliation ; `messageDeConnexion` les
 * traduit, et cet écran se contente de les montrer là où l'œil est déjà —
 * sous le bouton, pas en haut de page.
 */

interface Props {
  onSubmit: (email: string, motDePasse: string) => Promise<void>;
  /** Envoie le mail de réinitialisation. Absent : le lien « oublié » ne s'affiche pas. */
  onMotDePasseOublie?: (email: string) => Promise<void>;
  /** Nom de la table, s'il est connu. Purement rassurant : on est au bon endroit. */
  titre?: string;
  /** Message posé par l'appli elle-même — un lien de récupération périmé, par exemple. */
  avis?: string | null;
}

export function SignInScreen({
  onSubmit, onMotDePasseOublie, titre = 'Jondons et gradons', avis = null,
}: Props) {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  /**
   * L'oubli se joue SUR cet écran, pas ailleurs : « mot de passe oublié » ne
   * remplace que le champ du mot de passe par un bouton d'envoi. Le mail
   * déjà tapé reste tapé — c'est le même qu'on allait utiliser pour entrer.
   */
  const [oubli, setOubli] = useState<'non' | 'demande' | 'envoye'>('non');

  const valide = email.trim().length > 0 && motDePasse.length > 0;

  const envoyer = async (event: FormEvent) => {
    event.preventDefault();
    if (!valide || enCours) return;
    setEnCours(true);
    setErreur(null);
    try {
      await onSubmit(email, motDePasse);
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : String(cause));
      setEnCours(false);
    }
    // En cas de succès on ne relâche pas `enCours` : l'écran disparaît, et un
    // bouton qui redevient actif juste avant de s'effacer clignote.
  };

  const envoyerLoubli = async () => {
    if (email.trim().length === 0 || enCours || !onMotDePasseOublie) return;
    setEnCours(true);
    setErreur(null);
    try {
      await onMotDePasseOublie(email);
      setOubli('envoye');
    } catch (cause) {
      setErreur(cause instanceof Error ? cause.message : String(cause));
    }
    setEnCours(false);
  };

  return (
    <main style={page}>
      <div style={bloc}>
        <h1 className="ttl" style={titreStyle}>{titre}</h1>
        <p style={sous}>Une fois connecté·e, tu le restes.</p>

        <form onSubmit={envoyer} style={{ display: 'grid', gap: 12 }}>
          <label style={champ}>
            <span className="lbl">Adresse mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              style={saisie}
            />
          </label>

          {oubli === 'non' && (
            <label style={champ}>
              <span className="lbl">Mot de passe</span>
              <input
                type="password"
                value={motDePasse}
                onChange={(event) => setMotDePasse(event.target.value)}
                autoComplete="current-password"
                style={saisie}
              />
            </label>
          )}

          {oubli === 'non' ? (
            <button type="submit" disabled={!valide || enCours} style={bouton(valide && !enCours)}>
              {enCours ? 'Connexion…' : 'Entrer'}
            </button>
          ) : oubli === 'demande' ? (
            <button
              type="button"
              onClick={envoyerLoubli}
              disabled={email.trim().length === 0 || enCours}
              style={bouton(email.trim().length > 0 && !enCours)}
            >
              {enCours ? 'Envoi…' : 'Envoyer le lien'}
            </button>
          ) : (
            /*
              Même phrase que l'adresse existe ou non : dire « ce compte est
              inconnu » révélerait qui a un compte à la table. C'est la même
              retenue que `messageDeConnexion` sur « mail ou mot de passe
              incorrect » (voir `sync/session.ts`).
            */
            <p role="status" style={confirmation}>
              Si un compte existe pour cette adresse, un lien vient d’y être envoyé.
              Ouvre-le depuis ce téléphone.
            </p>
          )}

          {onMotDePasseOublie && oubli !== 'envoye' && (
            <button
              type="button"
              onClick={() => { setOubli(oubli === 'non' ? 'demande' : 'non'); setErreur(null); }}
              style={lien}
            >
              {oubli === 'non' ? 'Mot de passe oublié ?' : 'Revenir à la connexion'}
            </button>
          )}

          {/* `role="alert"` : l'erreur est annoncée, pas seulement affichée. */}
          {erreur && <p role="alert" style={alerte}>{erreur}</p>}
          {avis && !erreur && <p role="status" style={alerte}>{avis}</p>}
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

const titreStyle: React.CSSProperties = { margin: 0, fontSize: 26, letterSpacing: '-0.01em' };

const sous: React.CSSProperties = { margin: '6px 0 26px', color: 'var(--muted)', fontSize: 13 };

const champ: React.CSSProperties = { display: 'grid', gap: 6 };

const saisie: React.CSSProperties = {
  height: 'var(--tap)',
  padding: '0 12px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--line)',
  background: 'var(--surface)',
  color: 'var(--ink)',
  // 16px ou plus : en dessous, iOS zoome sur le champ à la mise au point.
  fontSize: 16,
};

const bouton = (actif: boolean): React.CSSProperties => ({
  height: 'var(--tap)',
  marginTop: 6,
  borderRadius: 'var(--radius-sm)',
  fontWeight: 700,
  fontSize: 15,
  background: actif ? 'var(--accent)' : 'var(--surface-raised)',
  color: actif ? 'var(--accent-ink)' : 'var(--muted)',
  border: actif ? 'none' : '1px solid var(--line)',
});

const alerte: React.CSSProperties = {
  margin: 0,
  padding: '10px 12px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--vital-wash)',
  color: 'var(--vital)',
  fontSize: 13,
};

const lien: React.CSSProperties = {
  justifySelf: 'start',
  padding: '6px 0',
  fontSize: 13,
  color: 'var(--accent)',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
};

const confirmation: React.CSSProperties = {
  margin: 0,
  padding: '10px 12px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--accent-wash)',
  border: '1px solid var(--gold-dim)',
  color: 'var(--ink)',
  fontSize: 13,
  lineHeight: 1.45,
};
