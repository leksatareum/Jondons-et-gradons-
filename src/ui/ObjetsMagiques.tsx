import { useMemo, useState } from 'react';
import {
  chercherObjet, LIBELLE_CATEGORIE, NOTE_COMMUNS, RAPPEL_HARMONISATION,
  type ObjetMagique,
} from '../content/objets-magiques';

/**
 * Les objets magiques du Guide, cherchables.
 *
 * ═══ Une recherche, pas des onglets ═══
 *
 * Les autres écrans du Guide tiennent en une liste qu'on parcourt. Celui-ci
 * non : il y a cinquante et une entrées dans ce seul lot, et il y en aura
 * plusieurs centaines quand les autres raretés arriveront. On n'y arrive pas
 * en faisant défiler — on y arrive en tapant trois lettres du nom.
 *
 * La recherche ignore les accents : « epee » trouve l'Épée touchée par la
 * lune. Personne ne compose un accent d'une main pendant que la table attend.
 *
 * ═══ L'harmonisation en tête, et pas en bas ═══
 *
 * C'est le seul chiffre qui limite vraiment un personnage — trois objets
 * harmonisés, pas quatre — et c'est celui qu'on oublie en distribuant du
 * butin. Elle est donc sur la ligne de titre, pas noyée dans le texte.
 */

function Fiche({ objet }: { objet: ObjetMagique }) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <div className="card" style={{ padding: '10px 13px' }}>
      <button
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
        style={{ width: '100%', textAlign: 'left', color: 'inherit' }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span className="ttl" style={{ flexGrow: 1, fontSize: 15 }}>{objet.nom}</span>
          {objet.harmonisation !== undefined && (
            <span className="lbl" style={{ fontSize: 8, color: 'var(--accent)', flexShrink: 0 }}>
              harmonisation
            </span>
          )}
          <span aria-hidden style={{ fontSize: 9, color: 'var(--muted)' }}>{ouvert ? '▲' : '▼'}</span>
        </div>
        <div className="lbl" style={{ fontSize: 8, marginTop: 3 }}>
          {LIBELLE_CATEGORIE[objet.categorie]}
          {' · Guide p. '}{objet.page}
        </div>
      </button>

      {ouvert && (
        <div style={{ marginTop: 9, paddingTop: 9, borderTop: '1px solid var(--line)' }}>
          {objet.support && (
            <p style={{ margin: '0 0 7px', fontSize: 11.5, lineHeight: 1.45, color: 'var(--muted)' }}>
              <span className="lbl" style={{ fontSize: 8.5 }}>Sur </span>
              {objet.support}
            </p>
          )}
          {objet.harmonisation !== undefined && (
            <p style={{ margin: '0 0 7px', fontSize: 11.5, lineHeight: 1.45, color: 'var(--accent)' }}>
              <span className="lbl" style={{ fontSize: 8.5, color: 'var(--accent)' }}>Harmonisation </span>
              {objet.harmonisation || 'sans condition'}
            </p>
          )}
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55 }}>{objet.effet}</p>
        </div>
      )}
    </div>
  );
}

export function ObjetsMagiques({ onFermer }: { onFermer: () => void }) {
  const [question, setQuestion] = useState('');
  const resultats = useMemo(() => chercherObjet(question), [question]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 30, background: 'rgba(13,15,18,.95)',
      display: 'flex', flexDirection: 'column',
    }}>
      <header style={{
        flexShrink: 0, padding: '13px 16px 12px',
        paddingTop: 'calc(13px + env(safe-area-inset-top))',
        borderBottom: '1px solid var(--gold-dim)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            <h2 className="ttl" style={{ margin: 0, fontSize: 18 }}>Les objets magiques</h2>
            <div className="lbl" style={{ fontSize: 9, marginTop: 2 }}>
              {resultats.length} objet{resultats.length > 1 ? 's' : ''} commun{resultats.length > 1 ? 's' : ''}
            </div>
          </div>
          <button onClick={onFermer} aria-label="Fermer" className="jg-rond" style={{ fontSize: 18 }}>✕</button>
        </div>
        <input
          value={question}
          onChange={(evenement) => setQuestion(evenement.target.value)}
          placeholder="Chercher un objet…"
          aria-label="Chercher un objet magique"
          type="search"
          style={{
            width: '100%', marginTop: 10, minHeight: 40, padding: '0 12px',
            borderRadius: 9, border: '1px solid var(--line)',
            background: 'rgba(255,255,255,.04)', color: 'inherit', fontSize: 14,
          }}
        />
      </header>

      <div style={{
        flexGrow: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '13px 16px calc(20px + env(safe-area-inset-bottom))',
      }}>
        {resultats.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--muted)' }}>
            Rien de ce nom parmi les objets communs. Les raretés supérieures ne sont pas encore là.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {resultats.map((objet) => <Fiche key={objet.id} objet={objet} />)}
          </div>
        )}

        <p style={{ margin: '16px 0 0', fontSize: 11.5, lineHeight: 1.5, color: 'var(--gold)' }}>
          {RAPPEL_HARMONISATION}
        </p>
        <p style={{ margin: '8px 0 0', fontSize: 11.5, lineHeight: 1.5, color: 'var(--muted)' }}>
          {NOTE_COMMUNS}
        </p>
      </div>
    </div>
  );
}
