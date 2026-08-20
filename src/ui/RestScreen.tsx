import { useMemo, useState } from 'react';
import { longRest, shortRest, type RestKind } from '../model/rest';
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
export function RestScreen({ sheet, derived, onRepos }: {
  sheet: CharacterSheet;
  derived: DerivedCharacter;
  onRepos: (kind: RestKind) => void;
}) {
  const [kind, setKind] = useState<RestKind>('long');

  // Calculé à blanc : le même code que celui qui appliquera le repos, donc
  // l'aperçu ne peut pas mentir sur le résultat.
  const apercu = useMemo(
    () => (kind === 'long' ? longRest(sheet, derived) : shortRest(sheet, derived)),
    [sheet, derived, kind],
  );

  const desRestants = derived.hitDice.reduce((somme, entry) => somme + entry.remaining, 0);
  const desTotal = derived.hitDice.reduce((somme, entry) => somme + entry.total, 0);

  return (
    <main style={{
      flexGrow: 1, padding: `16px 16px calc(${TAB_BAR_CLEARANCE} + 8px)`,
      overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    }}>
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
          Un repos long ne rend que la moitié des dés de vie, et ne descend
          l’épuisement que d’un cran — c’est ce qui fait qu’une journée
          difficile pèse encore le lendemain.
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

      <button
        onClick={() => onRepos(kind)}
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
