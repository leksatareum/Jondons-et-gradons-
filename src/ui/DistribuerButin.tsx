import { useState } from 'react';
import { ficheDeLaLigne, partDeChacun, type ButinPrepare, type LigneDeButin } from '../domain/butin-prepare';

/**
 * Distribuer le butin préparé, une fois le combat fini.
 *
 * ═══ Ligne par ligne, et pas d'un bloc ═══
 *
 * Un bouton « tout donner » n'existerait pas ici, parce qu'un butin ne se
 * partage pas tout seul : c'est la table qui décide qui prend l'épée. L'écran
 * ne fait donc que rendre chaque geste court — un appui pour ouvrir la ligne,
 * un pour cocher les destinataires, un pour donner — et se souvient de ce qui
 * est déjà parti, ce qui est la seule chose qu'on oublie vraiment.
 *
 * L'or, lui, se partage bien tout seul : sa part se calcule et se distribue
 * d'un appui, avec le reste annoncé au lieu d'une division à virgule.
 */

function ChoixDesJoueurs({ titre, sousTitre, personnages, onValider, onFermer }: {
  titre: string;
  sousTitre: string;
  personnages: { id: string; nom: string }[];
  onValider: (ids: string[]) => void;
  onFermer: () => void;
}) {
  const [choisis, setChoisis] = useState<string[]>([]);
  return (
    <div
      onClick={onFermer}
      style={{
        position: 'fixed', inset: 0, zIndex: 46, background: 'rgba(13,15,18,.86)',
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
            <div className="lbl" style={{ fontSize: 9 }}>{sousTitre}</div>
            <div className="ttl" style={{ fontSize: 16, marginTop: 1 }}>{titre}</div>
          </div>
          <button onClick={onFermer} aria-label="Annuler" className="jg-rond" style={{ fontSize: 18 }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {personnages.map((personnage) => {
            const actif = choisis.includes(personnage.id);
            return (
              <button
                key={personnage.id}
                onClick={() => setChoisis((liste) =>
                  (liste.includes(personnage.id) ? liste.filter((x) => x !== personnage.id) : [...liste, personnage.id]))}
                aria-pressed={actif}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  minHeight: 44, padding: '0 13px', borderRadius: 10, textAlign: 'left',
                  border: `1px solid ${actif ? 'var(--accent)' : 'var(--line)'}`,
                  background: actif ? 'rgba(214,150,74,.14)' : 'transparent',
                  color: 'inherit',
                }}
              >
                <span
                  aria-hidden
                  style={{
                    flexShrink: 0, width: 18, height: 18, borderRadius: 5,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: 'var(--gold-bright)',
                    border: `1px solid ${actif ? 'var(--accent)' : 'var(--line)'}`,
                  }}
                >
                  {actif ? '✓' : ''}
                </span>
                <span className="ttl" style={{ fontSize: 14 }}>{personnage.nom}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onValider(choisis)}
          disabled={choisis.length === 0}
          className="jg-btn-hot"
          style={{
            width: '100%', minHeight: 46, borderRadius: 10, marginTop: 13,
            fontSize: 14, fontWeight: 700, opacity: choisis.length === 0 ? 0.4 : 1,
          }}
        >
          {choisis.length === 0 ? 'Choisis qui reçoit' : 'Donner'}
        </button>
      </div>
    </div>
  );
}

export function DistribuerButin({ nom, butin, personnages, onDonnerObjet, onDonnerOr, onFermer }: {
  /** Le nom de la rencontre — pour savoir de quel butin on parle. */
  nom: string;
  butin: ButinPrepare;
  personnages: { id: string; nom: string }[];
  onDonnerObjet: (ficheId: string, ligne: { name: string; qty: number; catalogId?: string }, mot?: string) => void;
  onDonnerOr: (ficheId: string, montant: number) => void;
  onFermer: () => void;
}) {
  /** Ce qui est déjà parti, et à qui. La seule chose qu'on oublie vraiment. */
  const [distribue, setDistribue] = useState<Record<string, string>>({});
  const [enCours, setEnCours] = useState<LigneDeButin | null>(null);
  const [orEnCours, setOrEnCours] = useState(false);

  const partage = partDeChacun(butin.or, personnages.length);

  const nomsDe = (ids: string[]) =>
    personnages.filter((p) => ids.includes(p.id)).map((p) => p.nom).join(', ');

  const donnerLigne = (ids: string[]) => {
    if (!enCours) return;
    for (const id of ids) {
      // Le mot n'a pas à être tapé ici : le nom de la rencontre le dit déjà,
      // et c'est ce que le joueur verra apparaître (« Trouvé dans : Le
      // repaire gobelin ») plutôt qu'une ligne surgie de nulle part.
      onDonnerObjet(id, {
        name: enCours.nom,
        qty: enCours.qty,
        ...(enCours.catalogId ? { catalogId: enCours.catalogId } : {}),
      }, `Trouvé dans : ${nom}`);
    }
    setDistribue((actuel) => ({ ...actuel, [enCours.id]: nomsDe(ids) }));
    setEnCours(null);
  };

  const donnerOr = (ids: string[]) => {
    // Chacun reçoit sa part ; le reste va au premier de la liste, comme on le
    // fait à une vraie table plutôt que de couper une pièce en trois.
    ids.forEach((id, rang) => onDonnerOr(id, partage.part + (rang === 0 ? partage.reste : 0)));
    setDistribue((actuel) => ({ ...actuel, or: nomsDe(ids) }));
    setOrEnCours(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(13,15,18,.95)',
      display: 'flex', flexDirection: 'column',
    }}>
      <header style={{
        flexShrink: 0, padding: '13px 16px 12px',
        paddingTop: 'calc(13px + env(safe-area-inset-top))',
        borderBottom: '1px solid var(--gold-dim)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <h2 className="ttl" style={{ margin: 0, fontSize: 18 }}>Le butin</h2>
          <div className="lbl" style={{ fontSize: 9, marginTop: 2 }}>{nom}</div>
        </div>
        <button onClick={onFermer} aria-label="Fermer" className="jg-rond" style={{ fontSize: 18 }}>✕</button>
      </header>

      <div style={{
        flexGrow: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '13px 16px calc(20px + env(safe-area-inset-bottom))',
        display: 'flex', flexDirection: 'column', gap: 7,
      }}>
        {butin.or > 0 && (
          <button
            onClick={() => setOrEnCours(true)}
            className="card"
            style={{
              display: 'flex', alignItems: 'center', gap: 11, width: '100%',
              minHeight: 52, padding: '10px 13px', textAlign: 'left', color: 'inherit',
              opacity: distribue.or ? 0.5 : 1,
            }}
          >
            <span className="ttl num" style={{ flexShrink: 0, fontSize: 19, color: 'var(--gold-bright)' }}>
              {butin.or}
            </span>
            <span style={{ flexGrow: 1, minWidth: 0 }}>
              <span className="ttl" style={{ display: 'block', fontSize: 14 }}>pièces d’or</span>
              <span className="lbl" style={{ display: 'block', fontSize: 8, marginTop: 2 }}>
                {distribue.or
                  ? `donné à ${distribue.or}`
                  : `${partage.part} chacun${partage.reste > 0 ? `, reste ${partage.reste}` : ''}`}
              </span>
            </span>
            <span aria-hidden style={{ flexShrink: 0, fontSize: 13, color: 'var(--muted)' }}>
              {distribue.or ? '✓' : '›'}
            </span>
          </button>
        )}

        {butin.objets.map((ligne) => {
          const fiche = ficheDeLaLigne(ligne);
          const parti = distribue[ligne.id];
          return (
            <button
              key={ligne.id}
              onClick={() => setEnCours(ligne)}
              className="card"
              style={{
                display: 'flex', alignItems: 'center', gap: 11, width: '100%',
                minHeight: 52, padding: '10px 13px', textAlign: 'left', color: 'inherit',
                opacity: parti ? 0.5 : 1,
              }}
            >
              {ligne.qty > 1 && (
                <span className="ttl num" style={{ flexShrink: 0, fontSize: 16, color: 'var(--gold-bright)' }}>
                  ×{ligne.qty}
                </span>
              )}
              <span style={{ flexGrow: 1, minWidth: 0 }}>
                <span className="ttl" style={{ display: 'block', fontSize: 14 }}>{ligne.nom}</span>
                <span className="lbl" style={{ display: 'block', fontSize: 8, marginTop: 2 }}>
                  {parti ? `donné à ${parti}` : (fiche?.detail ?? 'écrit à la main')}
                </span>
              </span>
              <span aria-hidden style={{ flexShrink: 0, fontSize: 13, color: 'var(--muted)' }}>
                {parti ? '✓' : '›'}
              </span>
            </button>
          );
        })}

        <p style={{ margin: '10px 0 0', fontSize: 11.5, lineHeight: 1.5, color: 'var(--muted)' }}>
          Rien n’est distribué tout seul : c’est la table qui décide qui prend quoi. L’écran se
          contente de retenir ce qui est déjà parti.
        </p>
      </div>

      {enCours && (
        <ChoixDesJoueurs
          titre={`${enCours.qty > 1 ? `${enCours.qty} × ` : ''}${enCours.nom}`}
          sousTitre="Donner"
          personnages={personnages}
          onValider={donnerLigne}
          onFermer={() => setEnCours(null)}
        />
      )}

      {orEnCours && (
        <ChoixDesJoueurs
          titre={`${partage.part} po chacun${partage.reste > 0 ? `, ${partage.reste} au premier` : ''}`}
          sousTitre="Partager l’or"
          personnages={personnages}
          onValider={donnerOr}
          onFermer={() => setOrEnCours(false)}
        />
      )}
    </div>
  );
}
