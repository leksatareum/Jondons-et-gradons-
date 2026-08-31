import { useState } from 'react';
import { orderedCombatants, type Combatant, type EncounterState } from '../domain/encounter';

/**
 * La saisie des initiatives, juste avant de lancer le combat.
 *
 * « Lancer » démarrait le tour par tour sur l'ordre tel qu'il était — c'est-à-dire
 * sur les initiatives saisies à l'ajout de chaque adversaire, et sur zéro pour
 * les joueurs, qui n'en ont jamais saisi. Le premier round partait donc dans un
 * ordre faux, et le corriger demandait de rouvrir chaque combattant.
 *
 * L'écran demande les nombres UNE fois, tous ensemble, au moment où on les
 * jette à la table. Il ne lance aucun dé : le joueur annonce, le MJ tape.
 */
const sign = (value: number): string => (value >= 0 ? `+${value}` : `${value}`);

export function InitiativeDialog({ state, onLancer, onFermer }: {
  state: EncounterState;
  onLancer: (initiatives: Record<string, number>) => void;
  onFermer: () => void;
}) {
  // Saisies en texte : un champ vidé ne doit pas se relire comme un zéro tant
  // qu'on n'a pas fini de taper.
  const [saisies, setSaisies] = useState<Record<string, string>>(
    () => Object.fromEntries(state.combatants.map((c) => [c.id, c.initiative ? String(c.initiative) : ''])),
  );

  const valeur = (combatant: Combatant) => {
    const brut = saisies[combatant.id];
    const nombre = Number(brut);
    return brut !== '' && Number.isFinite(nombre) ? nombre : 0;
  };

  // L'ordre se recompose à chaque frappe : on voit qui passe devant qui avant
  // de valider, pas après.
  const apercu = orderedCombatants({
    ...state,
    combatants: state.combatants.map((c) => ({ ...c, initiative: valeur(c) })),
  });

  const manquantes = state.combatants.filter((c) => (saisies[c.id] ?? '') === '').length;

  return (
    <div
      role="dialog"
      aria-label="Initiatives"
      style={{
        position: 'fixed', inset: 0, zIndex: 30, background: 'var(--bg)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <header style={{
        flexShrink: 0, padding: '13px 16px 12px',
        paddingTop: 'calc(13px + env(safe-area-inset-top))',
        borderBottom: '1px solid var(--gold-dim)', background: 'var(--surface)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <h2 className="ttl" style={{ margin: 0, fontSize: 18 }}>Initiatives</h2>
          <div className="lbl" style={{ marginTop: 3, textTransform: 'none' }}>
            {manquantes === 0
              ? 'Tout le monde a la sienne.'
              : `${manquantes} à saisir — celles qui restent vides comptent pour 0.`}
          </div>
        </div>
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
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {state.combatants.map((combatant) => {
          const rang = apercu.findIndex((c) => c.id === combatant.id) + 1;
          return (
            <div
              key={combatant.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 'var(--radius)',
                border: '1px solid var(--gold-dim)', background: 'var(--surface)',
              }}
            >
              <div className="num lbl" style={{ width: 20, textAlign: 'right', color: 'var(--muted)' }}>
                {rang}
              </div>
              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <label
                  htmlFor={`init-${combatant.id}`}
                  style={{
                    fontSize: 15, fontWeight: 600, display: 'block',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >
                  {combatant.name}
                </label>
                <div className="lbl" style={{ textTransform: 'none', marginTop: 1 }}>
                  {/* Le modificateur — celui qu'on ajoute au d20 jeté à la
                      table — manquait ici : rien ne le rappelait au moment
                      même où on demande à chacun son initiative. Toujours
                      affiché, même à +0, qui reste une vraie valeur. */}
                  {combatant.side === 'joueur' ? 'joueur' : 'créature'}
                  {` · modificateur ${sign(combatant.dexterity)}`}
                </div>
              </div>
              <input
                id={`init-${combatant.id}`}
                type="number"
                inputMode="numeric"
                value={saisies[combatant.id] ?? ''}
                onChange={(event) => setSaisies((courant) => ({
                  ...courant, [combatant.id]: event.target.value,
                }))}
                style={{
                  width: 68, minHeight: 'var(--tap)', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--gold-dim)', background: 'var(--bg)',
                  color: 'var(--ink)', fontSize: 17, fontWeight: 700, textAlign: 'center',
                  fontVariantNumeric: 'tabular-nums',
                }}
              />
            </div>
          );
        })}

        <div className="lbl" style={{ textTransform: 'none', color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>
          À initiative égale, c'est la Dextérité qui départage, puis l'ordre
          d'ajout. L'application ne jette aucun dé : chacun annonce le sien.
        </div>

        <button
          onClick={() => onLancer(Object.fromEntries(
            state.combatants.map((combatant) => [combatant.id, valeur(combatant)]),
          ))}
          style={{
            width: '100%', minHeight: 52, marginTop: 12, borderRadius: 'var(--radius-sm)',
            background: 'var(--accent)', color: 'var(--accent-ink)',
            fontSize: 15, fontWeight: 700,
          }}
        >
          Lancer le combat
        </button>
      </div>
    </div>
  );
}
