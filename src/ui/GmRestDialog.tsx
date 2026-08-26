import { useState } from 'react';
import { deriveCharacter } from '../model/derive';
import { rest, type RestKind } from '../model/rest';
import type { StoredSheet } from '../sync/campaign-sync';

/**
 * Déclencher un repos, côté MJ.
 *
 * Un repos est un geste de table, pas un bouton que chaque joueur presse
 * quand ça l'arrange : c'est le MJ qui dit « on s'arrête là », et c'est lui
 * seul qui l'enclenche ici — voir le bouton désactivé de `RestScreen` pour
 * un joueur. Court ou long, pour toute la table ou pour un seul personnage
 * (un rôdeur qui monte la garde pendant que les autres dorment, par exemple).
 *
 * Volontairement simple : pas de composition fine par personnage (comme la
 * Récupération naturelle du Cercle de la Terre, qui reste un choix de
 * joueur) — ce réglage-là se fait toujours depuis la fiche ouverte par le
 * MJ (« Fiche → » puis Repos), qui applique le même moteur un seul
 * personnage à la fois.
 */
export function GmRestDialog({ sheets, onAppliquer, onFermer }: {
  sheets: StoredSheet[];
  onAppliquer: (kind: RestKind, sheetIds: string[]) => void;
  onFermer: () => void;
}) {
  const [kind, setKind] = useState<RestKind>('long');
  const [selection, setSelection] = useState<Set<string>>(() => new Set(sheets.map((fiche) => fiche.id)));

  const tousSelectionnes = sheets.length > 0 && selection.size === sheets.length;
  const basculerTous = () => setSelection(tousSelectionnes ? new Set() : new Set(sheets.map((fiche) => fiche.id)));
  const basculer = (id: string) => setSelection((courant) => {
    const suivant = new Set(courant);
    if (suivant.has(id)) suivant.delete(id); else suivant.add(id);
    return suivant;
  });

  const pret = selection.size > 0;
  const applique = () => {
    if (!pret) return;
    onAppliquer(kind, [...selection]);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 30, background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
    }}>
      <header style={{
        flexShrink: 0, padding: '13px 16px 12px',
        paddingTop: 'calc(13px + env(safe-area-inset-top))',
        borderBottom: '1px solid var(--gold-dim)', background: 'var(--surface)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <h2 className="ttl" style={{ margin: 0, fontSize: 18, flexGrow: 1 }}>Repos</h2>
        <button
          onClick={onFermer}
          aria-label="Annuler"
          style={{
            flexShrink: 0, width: 40, height: 40, borderRadius: 10,
            border: '1px solid var(--gold-dim)', color: 'var(--muted)', fontSize: 18,
          }}
        >
          ✕
        </button>
      </header>

      <div style={{
        flexGrow: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '14px 16px calc(20px + env(safe-area-inset-bottom))',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {([['court', 'Repos court'], ['long', 'Repos long']] as const).map(([valeur, libelle]) => (
            <button
              key={valeur}
              onClick={() => setKind(valeur)}
              style={{
                flexGrow: 1, minHeight: 'var(--tap)', borderRadius: 'var(--radius-sm)',
                border: `1px solid ${kind === valeur ? 'var(--accent)' : 'var(--gold-dim)'}`,
                background: kind === valeur ? 'var(--accent-wash)' : 'transparent',
                color: kind === valeur ? 'var(--accent)' : 'var(--muted)',
                fontSize: 14, fontWeight: 700,
              }}
            >
              {libelle}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 18 }}>
          <label className="lbl" style={{ flexGrow: 1 }}>Pour qui</label>
          <button
            onClick={basculerTous}
            className="lbl"
            style={{
              minHeight: 30, padding: '0 10px', borderRadius: 999,
              border: '1px solid var(--accent)', color: 'var(--accent)', fontWeight: 700,
            }}
          >
            {tousSelectionnes ? 'Aucun' : 'Tout le monde'}
          </button>
        </div>

        {sheets.length === 0 ? (
          <div className="lbl" style={{ textTransform: 'none', color: 'var(--muted)', marginTop: 8 }}>
            Aucun personnage dans la campagne.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {sheets.map((fiche) => {
              const coche = selection.has(fiche.id);
              return (
                <button
                  key={fiche.id}
                  onClick={() => basculer(fiche.id)}
                  aria-pressed={coche}
                  className="card"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                    padding: '10px 12px', borderRadius: 'var(--radius)',
                    border: `1px solid ${coche ? 'var(--accent)' : 'var(--gold-dim)'}`,
                    background: coche ? 'var(--accent-wash)' : 'var(--surface)',
                  }}
                >
                  <div style={{
                    flexShrink: 0, width: 20, height: 20, borderRadius: 5,
                    border: `1.5px solid ${coche ? 'var(--accent)' : 'var(--gold-dim)'}`,
                    background: coche ? 'var(--accent)' : 'transparent',
                    display: 'grid', placeItems: 'center', color: 'var(--accent-ink)', fontSize: 13, fontWeight: 700,
                  }}>
                    {coche ? '✓' : ''}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{fiche.data.name}</div>
                </button>
              );
            })}
          </div>
        )}

        <div style={{
          marginTop: 14, padding: '10px 12px', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--gold-dim)', fontSize: 13, lineHeight: 1.45, color: 'var(--muted)',
        }}>
          {kind === 'long'
            ? 'Rend tous les points de vie, emplacements et dés de vie ; ne descend l’épuisement que d’un cran.'
            : 'Ne rend ni points de vie ni emplacements ordinaires — seulement les réserves qui reviennent au repos court.'}
          {' '}Un réglage plus fin (Récupération naturelle…) se fait depuis la fiche du personnage.
        </div>

        <button
          onClick={applique}
          disabled={!pret}
          style={{
            width: '100%', minHeight: 52, marginTop: 20, borderRadius: 'var(--radius-sm)',
            background: pret ? 'var(--accent)' : 'var(--surface)',
            color: pret ? 'var(--accent-ink)' : 'var(--muted)',
            border: pret ? 'none' : '1px solid var(--gold-dim)',
            fontSize: 15, fontWeight: 700, cursor: pret ? 'pointer' : 'not-allowed',
          }}
        >
          {!pret
            ? 'Choisis au moins un personnage'
            : `${kind === 'long' ? 'Repos long' : 'Repos court'} pour ${selection.size === sheets.length ? 'tout le monde' : `${selection.size} personnage${selection.size > 1 ? 's' : ''}`}`}
        </button>
      </div>
    </div>
  );
}

/** Applique le repos à chaque fiche sélectionnée — même moteur que celui d'un joueur, une fois par personnage. */
export const reposDeGroupe = (
  sheets: StoredSheet[],
  kind: RestKind,
  sheetIds: string[],
): { id: string; suivante: ReturnType<typeof rest>['sheet'] }[] =>
  sheetIds
    .map((id) => sheets.find((fiche) => fiche.id === id))
    .filter((fiche): fiche is StoredSheet => fiche !== undefined)
    .map((fiche) => ({ id: fiche.id, suivante: rest(fiche.data, deriveCharacter(fiche.data), kind).sheet }));
