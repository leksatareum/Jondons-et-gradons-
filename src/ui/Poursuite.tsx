import { useState } from 'react';
import {
  AVERTISSEMENT_SORTS, FACTEURS_DE_FUITE, LIBELLE_TERRAIN, PENDANT_LA_COURSE,
  pointesGratuites, POUR_COMMENCER, REGLE_COMPLICATION_SUIVANT, REGLE_EVASION,
  REGLE_POINTE_SUPPLEMENTAIRE, REGLE_SEPARATION, tirerComplication,
  type Complication, type TerrainDePoursuite,
} from '../content/poursuites';

/**
 * La poursuite : le compteur de Pointes, et le d12 de complications.
 *
 * ═══ Ce que cet écran fait, et ce qu'il ne fait pas ═══
 *
 * Il ne rejoue pas la poursuite à la place du MJ — la distance, la course,
 * les décisions restent à la table. Il tient les deux seules choses qui se
 * suivent mal de tête pendant qu'on décrit une course :
 *
 * 1. Combien de Pointes il reste à CHACUN. Le compte vaut 3 + le modificateur
 *    de Constitution, donc il diffère d'un personnage à l'autre : Dauby n'a
 *    pas le même souffle que Veya, et personne ne retient trois compteurs
 *    différents en décrivant des toits qui défilent.
 * 2. Le d12 de fin de tour, avec le rappel qui compte : la complication
 *    frappe le SUIVANT dans l'ordre d'initiative, pas celui qui lance.
 *
 * Le reste de l'écran est du texte : ce sont les règles qu'on cherche une
 * fois, au début, et qu'on n'a plus besoin de relire ensuite.
 */

/** Les Pointes d'un personnage : dépensées / gratuites, et ce qui vient après. */
function LignePointes({ nom, modCon, prises, onChanger }: {
  nom: string;
  modCon: number;
  prises: number;
  onChanger: (suivant: number) => void;
}) {
  const gratuites = pointesGratuites(modCon);
  const reste = gratuites - prises;
  const enDette = reste <= 0;

  return (
    <div className="card" style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flexGrow: 1, minWidth: 0 }}>
        <div className="ttl" style={{ fontSize: 14 }}>{nom}</div>
        <div className="lbl" style={{ fontSize: 8, marginTop: 2 }}>
          {gratuites} pointe{gratuites > 1 ? 's' : ''} · CON {modCon >= 0 ? `+${modCon}` : modCon}
        </div>
      </div>

      <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 46 }}>
        <div
          className="ttl num"
          style={{ fontSize: 21, lineHeight: 1, color: enDette ? 'var(--vital)' : 'var(--ok)' }}
        >
          {enDette ? 'DD 10' : reste}
        </div>
        <div className="lbl" style={{ fontSize: 7.5, marginTop: 2 }}>
          {enDette ? 'sauvegarde CON' : 'sans risque'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
        <button
          onClick={() => onChanger(Math.max(0, prises - 1))}
          disabled={prises === 0}
          aria-label={`Reprendre une pointe à ${nom}`}
          className="jg-rond"
          style={{ width: 34, height: 34, fontSize: 15, opacity: prises === 0 ? 0.35 : 1 }}
        >
          −
        </button>
        <button
          onClick={() => onChanger(prises + 1)}
          aria-label={`Pointe de ${nom}`}
          className="jg-rond"
          style={{ width: 34, height: 34, fontSize: 15 }}
        >
          +
        </button>
      </div>
    </div>
  );
}

function Liste({ titre, lignes, couleur }: { titre: string; lignes: string[]; couleur?: string }) {
  return (
    <>
      <div className="lbl" style={{ marginTop: 18, fontSize: 9, color: couleur ?? 'var(--gold)' }}>{titre}</div>
      <ul style={{ margin: '6px 0 0', paddingLeft: 17, fontSize: 12.5, lineHeight: 1.55 }}>
        {lignes.map((ligne) => <li key={ligne} style={{ marginBottom: 3 }}>{ligne}</li>)}
      </ul>
    </>
  );
}

export function Poursuite({ personnages, onFermer }: {
  /** Les aventuriers, avec leur modificateur de Constitution lu sur la fiche. */
  personnages: { nom: string; con: number }[];
  onFermer: () => void;
}) {
  const [terrain, setTerrain] = useState<TerrainDePoursuite>('ville');
  const [pointes, setPointes] = useState<Record<string, number>>({});
  const [tirage, setTirage] = useState<{ de: number; complication: Complication | null } | null>(null);

  const lancer = () => setTirage(tirerComplication(terrain, Math.random));

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
          <h2 className="ttl" style={{ margin: 0, fontSize: 18, flexGrow: 1 }}>La poursuite</h2>
          <button onClick={onFermer} aria-label="Fermer" className="jg-rond" style={{ fontSize: 18 }}>✕</button>
        </div>
        <div className="lbl" style={{ fontSize: 9, margin: '2px 0 8px' }}>
          Guide du Maître, p. 52 à 54
        </div>
        {/* Le terrain n'est pas un décor : il décide de la table de
            complications, donc du dé qu'on va lancer. */}
        <div className="jg-onglets" style={{ borderBottom: 'none' }}>
          {(Object.keys(LIBELLE_TERRAIN) as TerrainDePoursuite[]).map((clef) => (
            <button
              key={clef}
              onClick={() => { setTerrain(clef); setTirage(null); }}
              aria-pressed={terrain === clef}
              className="jg-onglet"
            >
              <span className="ttl" style={{ fontSize: 12 }}>{LIBELLE_TERRAIN[clef]}</span>
            </button>
          ))}
        </div>
      </header>

      <div style={{
        flexGrow: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '13px 16px calc(20px + env(safe-area-inset-bottom))',
      }}>
        <button
          onClick={lancer}
          className="jg-btn-hot"
          style={{ width: '100%', minHeight: 44, borderRadius: 10, fontSize: 14, fontWeight: 700 }}
        >
          Complication · 1d12
        </button>

        {tirage && (
          <div
            className="card"
            style={{ marginTop: 9, padding: '11px 13px', display: 'flex', gap: 11, alignItems: 'flex-start' }}
          >
            <div
              className="ttl num"
              style={{
                flexShrink: 0, width: 34, textAlign: 'center', fontSize: 24, lineHeight: 1.1,
                color: tirage.complication ? 'var(--gold-bright)' : 'var(--muted)',
              }}
            >
              {tirage.de}
            </div>
            <div style={{ flexGrow: 1, minWidth: 0 }}>
              {tirage.complication ? (
                <>
                  <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5 }}>{tirage.complication.texte}</p>
                  <p style={{ margin: '7px 0 0', fontSize: 11, lineHeight: 1.4, color: 'var(--accent)' }}>
                    Pour le SUIVANT dans l’initiative, pas pour celui qui a lancé.
                  </p>
                </>
              ) : (
                <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--muted)' }}>
                  Rien. Le Guide ne met de complication que sur 1 à 6 — la moitié des tours passe sans incident.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="lbl" style={{ marginTop: 20, fontSize: 9, color: 'var(--gold)' }}>Les pointes</div>
        <p style={{ margin: '5px 0 8px', fontSize: 11.5, lineHeight: 1.5, color: 'var(--muted)' }}>
          {REGLE_POINTE_SUPPLEMENTAIRE}
        </p>
        {personnages.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--muted)' }}>
            Aucune fiche : le compte de pointes ne peut pas se calculer.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {personnages.map((personnage) => (
              <LignePointes
                key={personnage.nom}
                nom={personnage.nom}
                modCon={personnage.con}
                prises={pointes[personnage.nom] ?? 0}
                onChanger={(suivant) => setPointes((courant) => ({ ...courant, [personnage.nom]: suivant }))}
              />
            ))}
          </div>
        )}
        {personnages.length > 0 && Object.values(pointes).some((n) => n > 0) && (
          <button
            onClick={() => setPointes({})}
            style={{
              marginTop: 8, minHeight: 34, padding: '0 12px', borderRadius: 8, fontSize: 12,
              border: '1px solid var(--line)', background: 'transparent', color: 'var(--muted)',
            }}
          >
            Tout remettre à zéro
          </button>
        )}

        <Liste titre="Pour commencer" lignes={POUR_COMMENCER} />
        <Liste titre="Pendant la course" lignes={PENDANT_LA_COURSE} />

        <div className="lbl" style={{ marginTop: 18, fontSize: 9, color: 'var(--gold)' }}>S’échapper</div>
        <p style={{ margin: '6px 0 0', fontSize: 12.5, lineHeight: 1.55 }}>{REGLE_EVASION}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
          {FACTEURS_DE_FUITE.map((facteur) => (
            <div key={facteur.texte} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span
                className="lbl"
                style={{
                  flexShrink: 0, width: 74, fontSize: 8,
                  color: facteur.sens === 'avantage' ? 'var(--ok)' : 'var(--vital)',
                }}
              >
                {facteur.sens === 'avantage' ? 'avantage' : 'désavantage'}
              </span>
              <span style={{ fontSize: 12, lineHeight: 1.4 }}>{facteur.texte}</span>
            </div>
          ))}
        </div>

        <p style={{ margin: '18px 0 0', fontSize: 11.5, lineHeight: 1.5, color: 'var(--muted)' }}>
          {REGLE_COMPLICATION_SUIVANT}
        </p>
        <p style={{ margin: '8px 0 0', fontSize: 11.5, lineHeight: 1.5, color: 'var(--muted)' }}>
          {REGLE_SEPARATION}
        </p>
        <p style={{ margin: '8px 0 0', fontSize: 11.5, lineHeight: 1.5, color: 'var(--gold)' }}>
          {AVERTISSEMENT_SORTS}
        </p>
      </div>
    </div>
  );
}
