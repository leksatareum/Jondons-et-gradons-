import { useState } from 'react';
import {
  AVERTISSEMENT_TRANCHE, dangersPourNiveau, graviteAuNiveau,
  type Danger, type Gravite,
} from '../content/dangers';
import { effetsParUsure, LIBELLE_RYTHME, type EffetEnvironnement } from '../content/environnement';

/**
 * Les dangers du décor et les pièges, filtrés sur le niveau du groupe.
 *
 * Le Guide met exactement deux leviers en face du budget de PX : mélanger les
 * profils, et se servir du décor. Le second était affiché dans l'éditeur de
 * rencontre sous forme de conseil — « un danger du décor : les deux camps
 * peuvent s'en servir » — sans rien derrière. Voici ce qu'il y a derrière.
 *
 * Le filtre par niveau n'est pas un confort : le livre prévient qu'un danger
 * ANODIN pour une tranche peut être MORTEL pour la tranche du dessous. Une
 * liste où le Fleuve Styx (niveaux 11-16) côtoie une flaque de vase est un
 * piège pour le MJ, pas pour les joueurs.
 */

const COULEUR: Record<Gravite, string> = {
  mortel: 'var(--vital)',
  anodin: 'var(--gold-bright)',
};

function Fiche({ danger, niveau }: { danger: Danger; niveau: number }) {
  const [ouvert, setOuvert] = useState(false);
  const gravite = graviteAuNiveau(danger, niveau);
  const tranche = danger.tranches.find((t) => niveau >= t.min && niveau <= t.max);

  return (
    <div className="card" style={{ padding: '11px 13px' }}>
      <button
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
        style={{ width: '100%', textAlign: 'left', color: 'inherit' }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span className="ttl" style={{ flexGrow: 1, fontSize: 15 }}>{danger.nom}</span>
          {gravite && (
            <span className="lbl" style={{ fontSize: 8.5, color: COULEUR[gravite], flexShrink: 0 }}>
              {gravite}
            </span>
          )}
          <span aria-hidden style={{ fontSize: 9, color: 'var(--muted)' }}>{ouvert ? '▲' : '▼'}</span>
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--muted)', marginTop: 3 }}>
          {danger.resume}
        </div>
        {tranche && (
          <div className="lbl" style={{ fontSize: 8, marginTop: 4 }}>
            niveaux {tranche.min}–{tranche.max} · Guide p. {danger.page}
          </div>
        )}
      </button>

      {ouvert && (
        <div style={{ marginTop: 9, paddingTop: 9, borderTop: '1px solid var(--line)' }}>
          {danger.declencheur && (
            <p style={{ margin: '0 0 7px', fontSize: 12.5, lineHeight: 1.5 }}>
              <span className="lbl" style={{ fontSize: 8.5, color: 'var(--accent)' }}>Déclencheur </span>
              {danger.declencheur}
            </p>
          )}
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55 }}>{danger.effet}</p>
          {danger.detection && (
            <p style={{ margin: '9px 0 0', fontSize: 12.5, lineHeight: 1.5 }}>
              <span className="lbl" style={{ fontSize: 8.5, color: 'var(--ok)' }}>Repérer et neutraliser </span>
              {danger.detection}
            </p>
          )}
          {danger.echelle && (
            <p style={{ margin: '9px 0 0', fontSize: 11.5, lineHeight: 1.5, color: 'var(--muted)' }}>
              <span className="lbl" style={{ fontSize: 8.5 }}>Plus haut </span>
              {danger.echelle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Un effet d'environnement : ce qui RONGE, par opposition au danger qui
 * frappe. Deux choses passent avant le texte — à quelle fréquence le MJ doit
 * s'en occuper, et si ça coûte de l'Épuisement.
 */
function FicheEnvironnement({ effet }: { effet: EffetEnvironnement }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="card" style={{ padding: '11px 13px' }}>
      <button
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
        style={{ width: '100%', textAlign: 'left', color: 'inherit' }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span className="ttl" style={{ flexGrow: 1, fontSize: 15 }}>{effet.nom}</span>
          {effet.sauvegarde && (
            <span className="num" style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold-bright)', flexShrink: 0 }}>
              {effet.sauvegarde.caracteristique}{' '}
              {effet.sauvegarde.dd === 'croissant' ? 'DD ↑' : `DD ${effet.sauvegarde.dd}`}
            </span>
          )}
          <span aria-hidden style={{ fontSize: 9, color: 'var(--muted)' }}>{ouvert ? '▲' : '▼'}</span>
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--muted)', marginTop: 3 }}>
          {effet.resume}
        </div>
        <div className="lbl" style={{ fontSize: 8, marginTop: 4 }}>
          {LIBELLE_RYTHME[effet.rythme]}
          {effet.epuisement && <span style={{ color: 'var(--vital)' }}> · épuisement</span>}
          {' · Guide p. '}{effet.page}
        </div>
      </button>
      {ouvert && (
        <div style={{ marginTop: 9, paddingTop: 9, borderTop: '1px solid var(--line)' }}>
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55 }}>{effet.effet}</p>
          {effet.exemption && (
            <p style={{ margin: '9px 0 0', fontSize: 12, lineHeight: 1.5, color: 'var(--ok)' }}>
              {effet.exemption}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function DangersDuDecor({ niveau, onFermer }: {
  /** Le niveau du groupe — c'est lui qui décide de la liste, pas un choix du MJ. */
  niveau: number;
  onFermer: () => void;
}) {
  const [onglet, setOnglet] = useState<'decor' | 'piege' | 'environnement'>('decor');
  const liste = onglet === 'environnement' ? [] : dangersPourNiveau(niveau, onglet);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 30, background: 'rgba(13,15,18,.95)',
      display: 'flex', flexDirection: 'column',
    }}>
      <header style={{
        flexShrink: 0, padding: '13px 16px 0',
        paddingTop: 'calc(13px + env(safe-area-inset-top))',
        borderBottom: '1px solid var(--gold-dim)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 className="ttl" style={{ margin: 0, fontSize: 18, flexGrow: 1 }}>Le décor</h2>
          <button onClick={onFermer} aria-label="Fermer" className="jg-rond" style={{ fontSize: 18 }}>✕</button>
        </div>
        {/* Le sous-titre suit l'onglet : annoncer « pour un groupe de niveau 2 »
            au-dessus du climat serait faux, il ne dépend d'aucun niveau. */}
        <div className="lbl" style={{ fontSize: 9, margin: '2px 0 8px' }}>
          {onglet === 'environnement' ? 'à tous les niveaux' : `pour un groupe de niveau ${niveau}`}
        </div>
        <div className="jg-onglets" style={{ borderBottom: 'none' }}>
          {([['decor', 'Dangers'], ['piege', 'Pièges'], ['environnement', 'Climat']] as const).map(([clef, libelle]) => (
            <button
              key={clef}
              onClick={() => setOnglet(clef)}
              aria-pressed={onglet === clef}
              className="jg-onglet"
            >
              <span className="ttl" style={{ fontSize: 12 }}>{libelle}</span>
            </button>
          ))}
        </div>
      </header>

      <div style={{
        flexGrow: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '13px 16px calc(20px + env(safe-area-inset-bottom))',
      }}>
        {onglet === 'environnement' ? (
          <>
            {/* Le climat ne se filtre PAS par niveau : le froid mord un
                groupe de niveau 17 exactement comme un groupe de niveau 2.
                C'est la durée qui fait le danger, pas la puissance. */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {effetsParUsure().map((effet) => <FicheEnvironnement key={effet.id} effet={effet} />)}
            </div>
            <p style={{ margin: '14px 0 0', fontSize: 11.5, lineHeight: 1.5, color: 'var(--muted)' }}>
              Ces règles ne dépendent pas du niveau : elles usent un groupe de niveau 17
              comme un groupe de niveau 2. C’est la durée d’exposition qui fait le danger.
            </p>
          </>
        ) : liste.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>
            Rien de prévu pour cette tranche de niveaux dans le Guide.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {liste.map((danger) => <Fiche key={danger.id} danger={danger} niveau={niveau} />)}
          </div>
        )}

        {onglet !== 'environnement' && (
          <p style={{ margin: '14px 0 0', fontSize: 11.5, lineHeight: 1.5, color: 'var(--muted)' }}>
            {AVERTISSEMENT_TRANCHE}
          </p>
        )}
        {onglet === 'piege' && (
          <p style={{ margin: '8px 0 0', fontSize: 11.5, lineHeight: 1.5, color: 'var(--muted)' }}>
            Le Guide conseille d’en user avec parcimonie : trop de pièges rendent les joueurs
            méfiants et ralentissent la partie. Les meilleurs sont une diversion vite franchie,
            ou une énigme mortelle qui demande de réfléchir vite à plusieurs.
          </p>
        )}
      </div>
    </div>
  );
}
