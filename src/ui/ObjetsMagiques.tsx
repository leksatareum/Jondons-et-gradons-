import { useMemo, useState } from 'react';
import {
  categoriesPresentes, filtrerObjets, LIBELLE_CATEGORIE, LIBELLE_RARETE,
  NOTE_COMMUNS, OBJETS_MAGIQUES, RAPPEL_HARMONISATION,
  type CategorieObjet, type ObjetMagique, type Rarete,
} from '../content/objets-magiques';
import { catalogueADonner, type ObjetADonner } from '../domain/don-d-objet';
import { DonnerObjet } from './DonnerObjet';

/**
 * Les objets magiques du Guide — pour choisir ce qu'on donne.
 *
 * ═══ Ce que l'écran doit permettre ═══
 *
 * Pas « retrouver un objet dont on connaît le nom » : ça, une recherche
 * suffisait. Mais « composer un butin » — et là les questions sont d'un autre
 * ordre :
 *
 * 1. Qu'est-ce que je peux donner à ce niveau ? → le filtre de RARETÉ.
 * 2. Qu'est-ce qui irait à CE personnage ? → le filtre de CATÉGORIE. Une
 *    baguette pour Veya, une armure pour Dauby : on cherche par ce que la
 *    chose EST, pas par son nom.
 * 3. Est-ce que ça va lui coûter un de ses trois emplacements
 *    d'harmonisation ? → le filtre correspondant, parce que c'est la seule
 *    vraie limite d'un personnage et qu'on l'oublie en distribuant.
 *
 * Les filtres se cumulent, et le compteur en tête dit toujours combien
 * d'objets restent : un filtre qui vide la liste doit se voir tout de suite,
 * pas après avoir fait défiler.
 *
 * La recherche par nom reste, en dessous, pour quand on sait ce qu'on cherche.
 */

const RARETES: Rarete[] = ['commun', 'peu-commun'];

/** Une pastille de filtre : allumée ou éteinte, jamais une case à cocher minuscule. */
function Pastille({ actif, onClic, children }: {
  actif: boolean;
  onClic: () => void;
  children: React.ReactNode;
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

function Fiche({ objet, onDonner }: { objet: ObjetMagique; onDonner?: () => void }) {
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
          {' · '}
          <span style={{ color: objet.rarete === 'commun' ? 'var(--muted)' : 'var(--ok)' }}>
            {LIBELLE_RARETE[objet.rarete]}
          </span>
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

          {/* Le geste qui suit le choix. Sans lui, il faut dicter le nom au
              joueur, qui le tape — et une potion mal orthographiée n'est plus
              reconnue comme buvable. */}
          {onDonner && (
            <button
              onClick={onDonner}
              className="jg-btn-hot"
              style={{ width: '100%', minHeight: 40, borderRadius: 9, marginTop: 11, fontSize: 13, fontWeight: 700 }}
            >
              Donner à…
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ObjetsMagiques({ onFermer, personnages, onDonnerObjet }: {
  onFermer: () => void;
  /** Absents quand l'écran est ouvert hors table : la fiche n'affiche alors pas « Donner à… ». */
  personnages?: { id: string; nom: string }[];
  onDonnerObjet?: (ficheId: string, ligne: { name: string; qty: number; catalogId?: string }, mot?: string) => void;
}) {
  const [question, setQuestion] = useState('');
  const [raretes, setRaretes] = useState<Rarete[]>([]);
  const [categories, setCategories] = useState<CategorieObjet[]>([]);
  const [harmonisation, setHarmonisation] = useState<boolean | undefined>(undefined);
  /** L'objet qu'on est en train de donner — il ouvre le choix du destinataire. */
  const [aDonner, setADonner] = useState<ObjetADonner | null>(null);

  const peutDonner = Boolean(personnages && onDonnerObjet);
  /** La même entrée que celle de l'écran de don, pour que l'objet parte avec son identifiant de sac. */
  const entreeDuDon = (objet: ObjetMagique): ObjetADonner | null =>
    catalogueADonner().find((entree) => entree.clef === `mag:${objet.id}`) ?? null;

  const resultats = useMemo(
    () => filtrerObjets({ question, raretes, categories, harmonisation }),
    [question, raretes, categories, harmonisation],
  );

  /**
   * Les catégories proposées suivent la rareté choisie : filtrer sur
   * « commun » puis se voir offrir « Anneau », qui n'existe qu'en peu commun,
   * donnerait une liste vide sans qu'on comprenne pourquoi.
   */
  const categoriesOffertes = useMemo(
    () => categoriesPresentes(filtrerObjets({ raretes })),
    [raretes],
  );

  const basculer = <T,>(liste: T[], valeur: T): T[] =>
    (liste.includes(valeur) ? liste.filter((x) => x !== valeur) : [...liste, valeur]);

  const filtreActif = raretes.length > 0 || categories.length > 0
    || harmonisation !== undefined || question.trim() !== '';

  const toutEffacer = () => {
    setQuestion(''); setRaretes([]); setCategories([]); setHarmonisation(undefined);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 30, background: 'rgba(13,15,18,.95)',
      display: 'flex', flexDirection: 'column',
    }}>
      <header style={{
        flexShrink: 0, padding: '13px 16px 11px',
        paddingTop: 'calc(13px + env(safe-area-inset-top))',
        borderBottom: '1px solid var(--gold-dim)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            <h2 className="ttl" style={{ margin: 0, fontSize: 18 }}>Les objets magiques</h2>
            <div className="lbl" style={{ fontSize: 9, marginTop: 2 }}>
              {resultats.length} sur {OBJETS_MAGIQUES.length}
            </div>
          </div>
          {filtreActif && (
            <button
              onClick={toutEffacer}
              style={{
                flexShrink: 0, minHeight: 32, padding: '0 11px', borderRadius: 999, fontSize: 12,
                border: '1px solid var(--line)', background: 'transparent', color: 'var(--muted)',
              }}
            >
              Tout voir
            </button>
          )}
          <button onClick={onFermer} aria-label="Fermer" className="jg-rond" style={{ fontSize: 18 }}>✕</button>
        </div>

        {/* Les trois rangées de filtres. Elles défilent horizontalement plutôt
            que de passer à la ligne : l'en-tête garde une hauteur stable
            quelle que soit la sélection. */}
        <div style={{ display: 'flex', gap: 6, marginTop: 9, overflowX: 'auto', paddingBottom: 2 }}>
          {RARETES.map((rarete) => (
            <Pastille
              key={rarete}
              actif={raretes.includes(rarete)}
              onClic={() => setRaretes((liste) => basculer(liste, rarete))}
            >
              {LIBELLE_RARETE[rarete]}
            </Pastille>
          ))}
          <span aria-hidden style={{ flexShrink: 0, width: 1, background: 'var(--line)', margin: '4px 2px' }} />
          <Pastille
            actif={harmonisation === false}
            onClic={() => setHarmonisation((v) => (v === false ? undefined : false))}
          >
            sans harmonisation
          </Pastille>
          <Pastille
            actif={harmonisation === true}
            onClic={() => setHarmonisation((v) => (v === true ? undefined : true))}
          >
            à harmoniser
          </Pastille>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {categoriesOffertes.map(({ categorie, nombre }) => (
            <Pastille
              key={categorie}
              actif={categories.includes(categorie)}
              onClic={() => setCategories((liste) => basculer(liste, categorie))}
            >
              {LIBELLE_CATEGORIE[categorie]}{' '}
              <span className="num" style={{ opacity: 0.6 }}>{nombre}</span>
            </Pastille>
          ))}
        </div>

        <input
          value={question}
          onChange={(evenement) => setQuestion(evenement.target.value)}
          placeholder="Chercher un objet…"
          aria-label="Chercher un objet magique"
          type="search"
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
        {resultats.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--muted)' }}>
            Rien avec ces filtres. Le rare et au-delà ne sont pas encore là.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {resultats.map((objet) => (
              <Fiche
                key={objet.id}
                objet={objet}
                onDonner={peutDonner ? () => setADonner(entreeDuDon(objet)) : undefined}
              />
            ))}
          </div>
        )}

        <p style={{ margin: '16px 0 0', fontSize: 11.5, lineHeight: 1.5, color: 'var(--gold)' }}>
          {RAPPEL_HARMONISATION}
        </p>
        <p style={{ margin: '8px 0 0', fontSize: 11.5, lineHeight: 1.5, color: 'var(--muted)' }}>
          {NOTE_COMMUNS}
        </p>
      </div>

      {aDonner && personnages && onDonnerObjet && (
        <DonnerObjet
          personnages={personnages}
          onDonner={onDonnerObjet}
          objetInitial={aDonner}
          onFermer={() => setADonner(null)}
        />
      )}
    </div>
  );
}
