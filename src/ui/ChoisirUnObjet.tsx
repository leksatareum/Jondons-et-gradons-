import { useMemo, useState } from 'react';
import {
  chercherADonner, LIBELLE_PROVENANCE, type ObjetADonner, type Provenance,
} from '../domain/don-d-objet';

/**
 * Le tiroir « prends un objet dans le catalogue ».
 *
 * Séparé de l'écran de don parce qu'il sert à deux gestes qui n'ont rien à
 * voir : donner tout de suite, et composer un butin qu'on donnera plus tard.
 * Ce qu'ils partagent, c'est exactement ça — trouver un objet parmi 356.
 *
 * Il laisse aussi écrire une LIGNE LIBRE, ce que le don direct n'a pas besoin
 * de permettre : un butin préparé contient souvent la clé de la cave ou la
 * lettre du commanditaire, que le livre ne connaît pas.
 */

const PROVENANCES: Provenance[] = ['magique', 'equipement', 'arme', 'armure'];

export function ChoisirUnObjet({ onChoisir, onLigneLibre, onFermer }: {
  onChoisir: (objet: ObjetADonner) => void;
  /** Absent quand seules les entrées du catalogue ont un sens. */
  onLigneLibre?: (nom: string) => void;
  onFermer: () => void;
}) {
  const [question, setQuestion] = useState('');
  const [provenances, setProvenances] = useState<Provenance[]>([]);

  const resultats = useMemo(() => chercherADonner(question, provenances), [question, provenances]);
  const libre = question.trim();

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 45, background: 'rgba(13,15,18,.96)',
      display: 'flex', flexDirection: 'column',
    }}>
      <header style={{
        flexShrink: 0, padding: '13px 16px 11px',
        paddingTop: 'calc(13px + env(safe-area-inset-top))',
        borderBottom: '1px solid var(--gold-dim)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 className="ttl" style={{ margin: 0, fontSize: 17, flexGrow: 1 }}>Ajouter au butin</h2>
          <button onClick={onFermer} aria-label="Fermer" className="jg-rond" style={{ fontSize: 18 }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 9, overflowX: 'auto', paddingBottom: 2 }}>
          {PROVENANCES.map((p) => {
            const actif = provenances.includes(p);
            return (
              <button
                key={p}
                onClick={() => setProvenances((liste) =>
                  (liste.includes(p) ? liste.filter((x) => x !== p) : [...liste, p]))}
                aria-pressed={actif}
                style={{
                  flexShrink: 0, minHeight: 32, padding: '0 11px', borderRadius: 999,
                  fontSize: 12, whiteSpace: 'nowrap',
                  border: `1px solid ${actif ? 'var(--accent)' : 'var(--line)'}`,
                  background: actif ? 'rgba(214,150,74,.16)' : 'transparent',
                  color: actif ? 'var(--gold-bright)' : 'var(--muted)',
                  fontWeight: actif ? 700 : 400,
                }}
              >
                {LIBELLE_PROVENANCE[p]}
              </button>
            );
          })}
        </div>

        <input
          value={question}
          onChange={(evenement) => setQuestion(evenement.target.value)}
          placeholder="Chercher, ou écrire un objet à toi…"
          aria-label="Chercher un objet"
          type="search"
          autoFocus
          style={{
            width: '100%', marginTop: 8, minHeight: 38, padding: '0 12px',
            borderRadius: 9, border: '1px solid var(--line)',
            background: 'rgba(255,255,255,.04)', color: 'inherit', fontSize: 14,
          }}
        />
      </header>

      <div style={{
        flexGrow: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '13px 16px calc(20px + env(safe-area-inset-bottom))',
      }}>
        {/* La ligne libre se propose DÈS qu'on tape, sans attendre que la
            recherche échoue : « la clé de la cave » commence par « la clé »,
            qui trouve peut-être quelque chose. */}
        {onLigneLibre && libre !== '' && (
          <button
            onClick={() => onLigneLibre(libre)}
            className="card"
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              minHeight: 46, padding: '9px 13px', marginBottom: 9,
              textAlign: 'left', color: 'inherit', border: '1px dashed var(--gold-dim)',
            }}
          >
            <span style={{ flexGrow: 1, minWidth: 0 }}>
              <span className="ttl" style={{ display: 'block', fontSize: 14, color: 'var(--gold-bright)' }}>
                « {libre} »
              </span>
              <span className="lbl" style={{ display: 'block', fontSize: 8, marginTop: 2 }}>
                l’ajouter tel quel, hors catalogue
              </span>
            </span>
            <span aria-hidden style={{ flexShrink: 0, fontSize: 15, color: 'var(--muted)' }}>+</span>
          </button>
        )}

        {resultats.length === 0 && !onLigneLibre ? (
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--muted)' }}>Rien de ce nom.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {resultats.map((objet) => (
              <button
                key={objet.clef}
                onClick={() => onChoisir(objet)}
                className="card"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  minHeight: 46, padding: '9px 13px', textAlign: 'left', color: 'inherit',
                }}
              >
                <span style={{ flexGrow: 1, minWidth: 0 }}>
                  <span className="ttl" style={{ display: 'block', fontSize: 14 }}>{objet.nom}</span>
                  <span className="lbl" style={{ display: 'block', fontSize: 8, marginTop: 2 }}>
                    {LIBELLE_PROVENANCE[objet.provenance]}
                    {objet.detail && ` · ${objet.detail}`}
                  </span>
                </span>
                <span aria-hidden style={{ flexShrink: 0, fontSize: 15, color: 'var(--muted)' }}>+</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
