import { useMemo, useState } from 'react';
import {
  chercherADonner, LIBELLE_PROVENANCE, ligneDeSac,
  type ObjetADonner, type Provenance,
} from '../domain/don-d-objet';

/**
 * Donner un objet à un joueur, depuis l'écran du MJ.
 *
 * ═══ Ce que ça remplace ═══
 *
 * Jusqu'ici, distribuer du butin voulait dire dicter : « tu notes, Potion de
 * soins, deux dés quatre plus deux ». Le joueur tapait, parfois de travers, et
 * une potion mal orthographiée n'était plus reconnue comme buvable. L'appli
 * savait aider à CHOISIR un objet, pas à le DONNER.
 *
 * ═══ Deux gestes, dans cet ordre ═══
 *
 * 1. Trouver l'objet — dans les quatre catalogues réunis, filtrables par
 *    provenance. Les objets magiques passent devant à nom égal.
 * 2. Choisir à QUI, et combien. Plusieurs destinataires d'un coup, parce que
 *    « une potion chacun » est le cas le plus fréquent, et qu'il serait
 *    absurde de refaire la manœuvre trois fois.
 *
 * L'objet arrive dans le sac avec son identifiant de catalogue, donc vivant :
 * une potion donnée se boit, un parchemin se lance.
 */

const PROVENANCES: Provenance[] = ['magique', 'equipement', 'arme', 'armure'];

function Pastille({ actif, onClic, children }: {
  actif: boolean; onClic: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClic}
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
      {children}
    </button>
  );
}

/**
 * Le second geste : à qui, et combien.
 *
 * Sur un panneau par le bas, pour que le choix se fasse sous le pouce sans
 * quitter la liste — on revient souvent en donner un deuxième.
 */
function ChoixDuDestinataire({ objet, personnages, onDonner, onAnnuler }: {
  objet: ObjetADonner;
  personnages: { id: string; nom: string }[];
  onDonner: (ids: string[], quantite: number, mot: string) => void;
  onAnnuler: () => void;
}) {
  const [choisis, setChoisis] = useState<string[]>([]);
  const [quantite, setQuantite] = useState(1);
  const [mot, setMot] = useState('');

  const basculer = (id: string) =>
    setChoisis((liste) => (liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id]));

  return (
    <div
      onClick={onAnnuler}
      style={{
        position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(13,15,18,.86)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}
    >
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            <div className="lbl" style={{ fontSize: 9 }}>Donner</div>
            <div className="ttl" style={{ fontSize: 16, marginTop: 1 }}>{objet.nom}</div>
          </div>
          <button onClick={onAnnuler} aria-label="Annuler" className="jg-rond" style={{ fontSize: 18 }}>✕</button>
        </div>

        {personnages.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--muted)' }}>
            Aucune fiche à la table : il n’y a personne à qui donner.
          </p>
        ) : (
          <>
            <div className="lbl" style={{ fontSize: 9, marginBottom: 6 }}>À qui</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {personnages.map((personnage) => (
                <button
                  key={personnage.id}
                  onClick={() => basculer(personnage.id)}
                  aria-pressed={choisis.includes(personnage.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    minHeight: 44, padding: '0 13px', borderRadius: 10, textAlign: 'left',
                    border: `1px solid ${choisis.includes(personnage.id) ? 'var(--accent)' : 'var(--line)'}`,
                    background: choisis.includes(personnage.id) ? 'rgba(214,150,74,.14)' : 'transparent',
                    color: 'inherit',
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      flexShrink: 0, width: 18, height: 18, borderRadius: 5,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700,
                      border: `1px solid ${choisis.includes(personnage.id) ? 'var(--accent)' : 'var(--line)'}`,
                      color: 'var(--gold-bright)',
                    }}
                  >
                    {choisis.includes(personnage.id) ? '✓' : ''}
                  </span>
                  <span className="ttl" style={{ fontSize: 14 }}>{personnage.nom}</span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
              <span className="lbl" style={{ fontSize: 9, flexGrow: 1 }}>
                Combien {choisis.length > 1 ? 'chacun' : ''}
              </span>
              <button
                onClick={() => setQuantite((q) => Math.max(1, q - 1))}
                disabled={quantite <= 1}
                aria-label="Un de moins"
                className="jg-rond"
                style={{ width: 36, height: 36, fontSize: 16, opacity: quantite <= 1 ? 0.35 : 1 }}
              >
                −
              </button>
              <span className="ttl num" style={{ minWidth: 28, textAlign: 'center', fontSize: 19 }}>{quantite}</span>
              <button
                onClick={() => setQuantite((q) => q + 1)}
                aria-label="Un de plus"
                className="jg-rond"
                style={{ width: 36, height: 36, fontSize: 16 }}
              >
                +
              </button>
            </div>

            {/* Le mot qui accompagne l'objet. C'est lui que le joueur verra
                dans son pop-up : « tu la trouves serrée dans la main du
                chef » vaut mieux qu'une ligne apparue sans raison. */}
            <input
              value={mot}
              onChange={(evenement) => setMot(evenement.target.value)}
              placeholder="Un mot avec l’objet (facultatif)"
              aria-label="Un mot avec l’objet"
              maxLength={200}
              style={{
                width: '100%', marginTop: 11, minHeight: 40, padding: '0 12px',
                borderRadius: 9, border: '1px solid var(--line)',
                background: 'rgba(255,255,255,.04)', color: 'inherit', fontSize: 13.5,
              }}
            />

            <button
              onClick={() => onDonner(choisis, quantite, mot)}
              disabled={choisis.length === 0}
              className="jg-btn-hot"
              style={{
                width: '100%', minHeight: 46, borderRadius: 10, marginTop: 13,
                fontSize: 14, fontWeight: 700, opacity: choisis.length === 0 ? 0.4 : 1,
              }}
            >
              {choisis.length === 0
                ? 'Choisis un destinataire'
                : `Donner à ${choisis.length === personnages.length && personnages.length > 1
                  ? 'tout le groupe'
                  : personnages.filter((p) => choisis.includes(p.id)).map((p) => p.nom).join(', ')}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function DonnerObjet({ personnages, onDonner, onFermer, objetInitial }: {
  personnages: { id: string; nom: string }[];
  onDonner: (ficheId: string, ligne: { name: string; qty: number; catalogId?: string }, mot?: string) => void;
  onFermer: () => void;
  /** Ouvre directement le choix du destinataire — quand on arrive depuis la fiche d'un objet. */
  objetInitial?: ObjetADonner;
}) {
  const [question, setQuestion] = useState('');
  const [provenances, setProvenances] = useState<Provenance[]>([]);
  const [enCours, setEnCours] = useState<ObjetADonner | null>(objetInitial ?? null);
  /** Le dernier don, gardé à l'écran : sans lui, rien ne dit que le geste a marché. */
  const [dernier, setDernier] = useState<string | null>(null);

  const resultats = useMemo(
    () => chercherADonner(question, provenances),
    [question, provenances],
  );

  const donner = (ids: string[], quantite: number, mot: string) => {
    if (!enCours) return;
    const ligne = ligneDeSac(enCours, quantite);
    for (const id of ids) onDonner(id, ligne, mot);
    const noms = personnages.filter((p) => ids.includes(p.id)).map((p) => p.nom).join(', ');
    setDernier(`${ligne.qty > 1 ? `${ligne.qty} × ` : ''}${enCours.nom} → ${noms}`);
    setEnCours(null);
    // Arrivé depuis la fiche d'un objet, il n'y a rien d'autre à faire ici.
    if (objetInitial) onFermer();
  };

  const basculer = (p: Provenance) =>
    setProvenances((liste) => (liste.includes(p) ? liste.filter((x) => x !== p) : [...liste, p]));

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 35, background: 'rgba(13,15,18,.95)',
      display: 'flex', flexDirection: 'column',
    }}>
      <header style={{
        flexShrink: 0, padding: '13px 16px 11px',
        paddingTop: 'calc(13px + env(safe-area-inset-top))',
        borderBottom: '1px solid var(--gold-dim)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            <h2 className="ttl" style={{ margin: 0, fontSize: 18 }}>Donner un objet</h2>
            <div className="lbl" style={{ fontSize: 9, marginTop: 2 }}>
              {resultats.length} objet{resultats.length > 1 ? 's' : ''}
            </div>
          </div>
          <button onClick={onFermer} aria-label="Fermer" className="jg-rond" style={{ fontSize: 18 }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 9, overflowX: 'auto', paddingBottom: 2 }}>
          {PROVENANCES.map((p) => (
            <Pastille key={p} actif={provenances.includes(p)} onClic={() => basculer(p)}>
              {LIBELLE_PROVENANCE[p]}
            </Pastille>
          ))}
        </div>

        <input
          value={question}
          onChange={(evenement) => setQuestion(evenement.target.value)}
          placeholder="Chercher…"
          aria-label="Chercher un objet à donner"
          type="search"
          style={{
            width: '100%', marginTop: 8, minHeight: 38, padding: '0 12px',
            borderRadius: 9, border: '1px solid var(--line)',
            background: 'rgba(255,255,255,.04)', color: 'inherit', fontSize: 14,
          }}
        />
      </header>

      {dernier && (
        <div
          role="status"
          style={{
            flexShrink: 0, padding: '8px 16px', fontSize: 12.5,
            background: 'rgba(93,168,116,.16)', color: 'var(--ok)',
            borderBottom: '1px solid var(--line)',
          }}
        >
          Donné : {dernier}
        </div>
      )}

      <div style={{
        flexGrow: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '13px 16px calc(20px + env(safe-area-inset-bottom))',
      }}>
        {resultats.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--muted)' }}>
            Rien de ce nom. Tu peux toujours faire ajouter la ligne à la main dans son sac.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {resultats.map((objet) => (
              <button
                key={objet.clef}
                onClick={() => setEnCours(objet)}
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
                <span aria-hidden style={{ flexShrink: 0, fontSize: 13, color: 'var(--muted)' }}>›</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {enCours && (
        <ChoixDuDestinataire
          objet={enCours}
          personnages={personnages}
          onDonner={donner}
          onAnnuler={() => { setEnCours(null); if (objetInitial) onFermer(); }}
        />
      )}
    </div>
  );
}
