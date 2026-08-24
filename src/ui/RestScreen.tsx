import { useMemo, useState } from 'react';
import { longRest, shortRest, type RestKind } from '../model/rest';
import {
  blocagesRecuperationNaturelle, budgetRecuperationNaturelle,
  RECUPERATION_NATURELLE_KEY, type ChoixRecuperation,
} from '../model/druide';
import type { CharacterSheet } from '../model/character';
import type { DerivedCharacter } from '../model/derive';
import { TAB_BAR_CLEARANCE } from './TabBar';

/**
 * Le repos, en onglet plutôt qu'en fenêtre modale — il avait sa propre
 * fenêtre quand il ne partait que d'un bouton du combat ; maintenant qu'il a
 * son propre onglet, la fenêtre par-dessus tout le reste n'ajoutait rien.
 *
 * L'écran montre ce qui sera rendu AVANT de le rendre. Un repos est
 * irréversible en pratique — on ne redépense pas ses emplacements pour
 * revenir en arrière — et « Repos long » sur un bouton ne dit ni ce qu'on
 * récupère, ni ce qu'on perd. Les dés de vie non rendus et le cran
 * d'épuisement qui reste sont précisément ce qu'on découvre trop tard.
 */
export function RestScreen({ sheet, derived, onRepos, onRetour }: {
  sheet: CharacterSheet;
  derived: DerivedCharacter;
  /**
   * Récupération naturelle se compose PENDANT le repos court : la règle dit
   * « quand tu termines un repos court ». Le choix part donc avec le repos.
   */
  onRepos: (kind: RestKind, recuperation?: ChoixRecuperation) => void;
  /** Cet écran s'ouvre depuis la Fiche : le chemin du retour doit se voir. */
  onRetour: () => void;
}) {
  const [kind, setKind] = useState<RestKind>('long');
  const [recuperation, setRecuperation] = useState<ChoixRecuperation>({});

  // Calculé à blanc : le même code que celui qui appliquera le repos, donc
  // l'aperçu ne peut pas mentir sur le résultat.
  const apercu = useMemo(
    () => (kind === 'long' ? longRest(sheet, derived) : shortRest(sheet, derived)),
    [sheet, derived, kind],
  );

  const desRestants = derived.hitDice.reduce((somme, entry) => somme + entry.remaining, 0);
  const desTotal = derived.hitDice.reduce((somme, entry) => somme + entry.total, 0);

  // ── Récupération naturelle ────────────────────────────────────────
  const budget = budgetRecuperationNaturelle(sheet);
  const dejaUtilisee = (sheet.live.resourcesSpent[RECUPERATION_NATURELLE_KEY] ?? 0) > 0;
  const rangsRecuperables = Object.entries(sheet.live.spellSlotsSpent)
    .map(([rang, depenses]) => ({ rang: Number(rang), depenses }))
    .filter(({ rang, depenses }) => rang <= 5 && depenses > 0)
    .sort((a, b) => a.rang - b.rang);
  const totalChoisi = Object.entries(recuperation)
    .reduce((somme, [rang, nombre]) => somme + Number(rang) * (nombre ?? 0), 0);
  const blocages = totalChoisi > 0
    ? blocagesRecuperationNaturelle(sheet, derived, recuperation)
    : [];

  return (
    <main style={{
      flexGrow: 1, padding: `16px 16px calc(${TAB_BAR_CLEARANCE} + 8px)`,
      overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    }}>
      <button
        onClick={onRetour}
        className="lbl"
        style={{
          display: 'block', width: 'fit-content', minHeight: 34, padding: '0 12px', marginBottom: 12,
          borderRadius: 999, border: '1px solid var(--line)', color: 'var(--muted)', fontWeight: 700,
        }}
      >
        ← Fiche
      </button>
      <h2 className="ttl" style={{ margin: 0, fontSize: 18 }}>Repos</h2>

      <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
        {([['court', 'Repos court'], ['long', 'Repos long']] as const).map(([valeur, libelle]) => (
          <button
            key={valeur}
            onClick={() => setKind(valeur)}
            style={{
              flexGrow: 1, minHeight: 'var(--tap)', borderRadius: 'var(--radius-sm)',
              border: `1px solid ${kind === valeur ? 'var(--accent)' : 'var(--line)'}`,
              background: kind === valeur ? 'var(--accent-wash)' : 'transparent',
              color: kind === valeur ? 'var(--accent)' : 'var(--muted)',
              fontSize: 14, fontWeight: 700,
            }}
          >
            {libelle}
          </button>
        ))}
      </div>

      <div className="lbl" style={{ marginTop: 14 }}>Ce qui revient</div>
      {apercu.recovered.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--muted)', margin: '6px 0 0', lineHeight: 1.5 }}>
          Rien : tout est déjà au complet.
        </p>
      ) : (
        <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 14, lineHeight: 1.65 }}>
          {apercu.recovered.map((ligne) => <li key={ligne}>{ligne}</li>)}
        </ul>
      )}

      {kind === 'long' && (
        <div style={{
          marginTop: 12, padding: '10px 12px', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--line)', fontSize: 13, lineHeight: 1.45, color: 'var(--muted)',
        }}>
          {/* Ce texte affirmait « ne rend que la moitié des dés de vie » :
              c'était la règle de 2014, corrigée dans le moteur mais restée
              ici. Le PHB 2024 les rend tous. */}
          Un repos long rend tous les dés de vie, mais ne descend l’épuisement
          que d’un cran — c’est ce qui fait qu’une journée difficile pèse
          encore le lendemain.
        </div>
      )}

      {kind === 'court' && (
        <div style={{
          marginTop: 12, padding: '10px 12px', borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--line)', fontSize: 13, lineHeight: 1.45, color: 'var(--muted)',
        }}>
          Un repos court ne soigne pas tout seul : il te reste{' '}
          <strong style={{ color: 'var(--ink)' }}>{desRestants}/{desTotal}</strong>{' '}
          dé(s) de vie à dépenser, et ce geste-là t’appartient.
        </div>
      )}

      {/* ───── Récupération naturelle (Cercle de la Terre 6) ─────
          Le budget est un nombre de NIVEAUX, pas d'emplacements : la règle
          laisse le joueur composer. L'application ne compose pas à sa place,
          elle compte et refuse ce qui dépasse. */}
      {kind === 'court' && budget > 0 && (
        <div style={{
          marginTop: 12, padding: '12px 13px', borderRadius: 'var(--radius-sm)',
          border: `1px solid ${dejaUtilisee ? 'var(--line)' : 'var(--accent)'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div className="lbl" style={{ flexGrow: 1, color: dejaUtilisee ? 'var(--muted)' : 'var(--accent)' }}>
              Récupération naturelle
            </div>
            {!dejaUtilisee && (
              <div className="num lbl" style={{ color: totalChoisi > budget ? 'var(--vital)' : 'var(--muted)' }}>
                {totalChoisi}/{budget} niveaux
              </div>
            )}
          </div>

          {dejaUtilisee ? (
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
              Déjà utilisée — il faut un repos long pour la retrouver.
            </div>
          ) : rangsRecuperables.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
              Aucun emplacement dépensé à récupérer.
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, lineHeight: 1.45 }}>
                Choisis les emplacements à retrouver, dans la limite de {budget} niveaux
                cumulés. Le rang 6 et au-delà en sont exclus.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 10 }}>
                {rangsRecuperables.map(({ rang, depenses }) => {
                  const pris = recuperation[rang] ?? 0;
                  const bouton = (delta: number, libelle: string, actif: boolean) => (
                    <button
                      disabled={!actif}
                      onClick={() => setRecuperation((courant) => ({
                        ...courant, [rang]: Math.max(0, (courant[rang] ?? 0) + delta),
                      }))}
                      aria-label={`${libelle} rang ${rang}`}
                      style={{
                        width: 36, height: 36, borderRadius: 9,
                        border: '1px solid var(--line)',
                        color: actif ? 'var(--ink)' : 'var(--muted)',
                        opacity: actif ? 1 : 0.4, fontSize: 17, fontWeight: 700,
                      }}
                    >
                      {delta < 0 ? '−' : '+'}
                    </button>
                  );
                  return (
                    <div key={rang} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ flexGrow: 1, fontSize: 14 }}>
                        Rang {rang}
                        <span className="lbl" style={{ textTransform: 'none', marginLeft: 6 }}>
                          {depenses} dépensé(s)
                        </span>
                      </div>
                      {bouton(-1, 'Retirer', pris > 0)}
                      <div className="num" style={{ minWidth: 18, textAlign: 'center', fontWeight: 700 }}>{pris}</div>
                      {bouton(+1, 'Ajouter', pris < depenses && totalChoisi + rang <= budget)}
                    </div>
                  );
                })}
              </div>
              {blocages.length > 0 && totalChoisi > 0 && (
                <div style={{ fontSize: 12.5, color: 'var(--vital)', marginTop: 8 }}>
                  {blocages[0]}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <button
        onClick={() => onRepos(kind, kind === 'court' && totalChoisi > 0 && blocages.length === 0
          ? recuperation : undefined)}
        style={{
          width: '100%', minHeight: 52, marginTop: 20, borderRadius: 'var(--radius-sm)',
          background: 'var(--accent)', color: 'var(--accent-ink)',
          fontSize: 15, fontWeight: 700,
        }}
      >
        {kind === 'long' ? 'Prendre un repos long' : 'Prendre un repos court'}
      </button>
    </main>
  );
}
