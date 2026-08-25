import { useState } from 'react';
import { AddAdversaryDialog } from './AddAdversaryDialog';
import type { StoredEncounterTemplate } from '../sync/campaign-sync';
import type { Combatant } from '../domain/encounter';
import { TAB_BAR_CLEARANCE } from './TabBar';

/**
 * Rencontres préparées à l'avance.
 *
 * Composer un combat avant la table, et le déclencher d'un geste au bon
 * moment — que les joueurs soient en train de se faire écraser et méritent
 * du répit, ou l'inverse. Un sac de créatures nommé, rien de plus : ni
 * initiative ni tour, ça n'existe qu'une fois lancé (voir `GmCombatScreen`).
 *
 * Réutilise `AddAdversaryDialog` tel quel pour composer la liste — c'est le
 * même geste que d'ajouter un adversaire en pleine partie, juste rangé pour
 * plus tard plutôt qu'envoyé directement dans la rencontre en cours.
 */

const nouvelId = () => `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function ResumeCombattants({ combatants }: { combatants: Combatant[] }) {
  // Regroupe les homonymes en un seul mot : « 3 Gobelin » se lit d'un coup
  // d'œil, « Gobelin, Gobelin, Gobelin » se compte.
  const comptes = new Map<string, number>();
  for (const combatant of combatants) {
    const base = combatant.name.replace(/ \d+$/, '');
    comptes.set(base, (comptes.get(base) ?? 0) + 1);
  }
  const resume = [...comptes.entries()].map(([nom, n]) => (n > 1 ? `${n} ${nom}` : nom)).join(' · ');
  return (
    <div className="lbl" style={{ textTransform: 'none', color: 'var(--muted)', marginTop: 3 }}>
      {resume || 'Aucune créature'}
    </div>
  );
}

function NouvelleRencontre({ onEnregistrer, onFermer }: {
  onEnregistrer: (name: string, combatants: Combatant[]) => void;
  onFermer: () => void;
}) {
  const [nom, setNom] = useState('');
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [ajoutEnCours, setAjoutEnCours] = useState(false);

  const ajouter = (combatant: Omit<Combatant, 'id'>) => {
    setCombatants((liste) => [...liste, { ...combatant, id: nouvelId() }]);
    setAjoutEnCours(false);
  };
  const retirer = (id: string) => setCombatants((liste) => liste.filter((c) => c.id !== id));

  const nomValide = nom.trim().length > 0;
  const pret = nomValide && combatants.length > 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 20, background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
    }}>
      <header style={{
        flexShrink: 0, padding: '13px 16px 12px',
        paddingTop: 'calc(13px + env(safe-area-inset-top))',
        borderBottom: '1px solid var(--line)', background: 'var(--surface)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <h2 className="ttl" style={{ margin: 0, fontSize: 18, flexGrow: 1 }}>Nouvelle rencontre</h2>
        <button
          onClick={onFermer}
          aria-label="Annuler"
          style={{
            flexShrink: 0, width: 40, height: 40, borderRadius: 10,
            border: '1px solid var(--line)', color: 'var(--muted)', fontSize: 18,
          }}
        >
          ✕
        </button>
      </header>

      <div style={{
        flexGrow: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '14px 16px calc(20px + env(safe-area-inset-bottom))',
      }}>
        <label className="lbl" htmlFor="nom-rencontre">Nom</label>
        <input
          id="nom-rencontre" value={nom} onChange={(event) => setNom(event.target.value)}
          placeholder="Embuscade du pont, Repaire gobelin…" autoComplete="off"
          style={{
            width: '100%', minHeight: 'var(--tap)', marginTop: 6,
            padding: '0 12px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--line)', background: 'var(--surface)',
            color: 'var(--ink)', fontSize: 16,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 18 }}>
          <label className="lbl" style={{ flexGrow: 1 }}>Créatures</label>
          <button
            onClick={() => setAjoutEnCours(true)}
            className="lbl"
            style={{
              minHeight: 32, padding: '0 10px', borderRadius: 999,
              border: '1px solid var(--accent)', color: 'var(--accent)', fontWeight: 700,
            }}
          >
            + Ajouter
          </button>
        </div>

        {combatants.length === 0 ? (
          <div className="lbl" style={{ textTransform: 'none', color: 'var(--muted)', marginTop: 8 }}>
            Aucune pour l’instant — ajoute-en depuis le bestiaire ou à la main.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {combatants.map((combatant) => (
              <div key={combatant.id} className="card" style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 'var(--radius)',
                border: '1px solid var(--line)', background: 'var(--surface)',
              }}>
                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{combatant.name}</div>
                  <div className="lbl" style={{ textTransform: 'none', marginTop: 2, color: 'var(--muted)' }}>
                    CA {combatant.armorClass} · {combatant.maxHp} PV
                  </div>
                </div>
                <button
                  onClick={() => retirer(combatant.id)}
                  aria-label={`Retirer ${combatant.name}`}
                  style={{
                    flexShrink: 0, width: 'var(--tap)', height: 'var(--tap)', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--line)', color: 'var(--muted)', fontSize: 16,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => pret && onEnregistrer(nom.trim(), combatants)}
          disabled={!pret}
          style={{
            width: '100%', minHeight: 52, marginTop: 20, borderRadius: 'var(--radius-sm)',
            background: pret ? 'var(--accent)' : 'var(--surface)',
            color: pret ? 'var(--accent-ink)' : 'var(--muted)',
            border: pret ? 'none' : '1px solid var(--line)',
            fontSize: 15, fontWeight: 700, cursor: pret ? 'pointer' : 'not-allowed',
          }}
        >
          {!nomValide ? 'Donne-lui un nom' : combatants.length === 0 ? 'Ajoute au moins une créature' : 'Enregistrer la rencontre'}
        </button>
      </div>

      {ajoutEnCours && <AddAdversaryDialog onAjouter={ajouter} onFermer={() => setAjoutEnCours(false)} />}
    </div>
  );
}

export function PreparedEncountersScreen({ templates, onCreer, onSupprimer, onDeclencher }: {
  templates: StoredEncounterTemplate[];
  onCreer: (name: string, combatants: Combatant[]) => void;
  onSupprimer: (id: string) => void;
  /** Copie les créatures du modèle dans la rencontre en cours. */
  onDeclencher: (combatants: Combatant[]) => void;
}) {
  const [creationOuverte, setCreationOuverte] = useState(false);

  return (
    <div style={{ paddingBottom: TAB_BAR_CLEARANCE }}>
      <div style={{ padding: '14px 16px 0' }}>
        <button
          onClick={() => setCreationOuverte(true)}
          style={{
            width: '100%', minHeight: 'var(--tap)', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--accent)', color: 'var(--accent)', fontSize: 14, fontWeight: 700,
          }}
        >
          + Nouvelle rencontre
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="lbl" style={{ textTransform: 'none', color: 'var(--muted)', padding: '18px 16px' }}>
          Aucune rencontre préparée. Compose-en une à l’avance, tu la déclencheras d’un geste le moment venu.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 16px' }}>
          {templates.map((template) => (
            <div key={template.id} className="card" style={{
              padding: '12px 14px', borderRadius: 'var(--radius)',
              border: '1px solid var(--line)', background: 'var(--surface)',
            }}>
              <div className="ttl" style={{ fontSize: 15 }}>{template.name}</div>
              <ResumeCombattants combatants={template.combatants} />
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  onClick={() => onDeclencher(template.combatants.map((combatant) => ({ ...combatant, id: nouvelId() })))}
                  disabled={template.combatants.length === 0}
                  style={{
                    flexGrow: 1, minHeight: 'var(--tap)', borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent)', color: 'var(--accent-ink)', fontSize: 14, fontWeight: 700,
                    opacity: template.combatants.length === 0 ? 0.4 : 1,
                  }}
                >
                  Déclencher
                </button>
                <button
                  onClick={() => onSupprimer(template.id)}
                  aria-label={`Supprimer la rencontre ${template.name}`}
                  style={{
                    flexShrink: 0, minHeight: 'var(--tap)', padding: '0 14px',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)', color: 'var(--muted)', fontSize: 13,
                  }}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creationOuverte && (
        <NouvelleRencontre
          onEnregistrer={(name, combatants) => { onCreer(name, combatants); setCreationOuverte(false); }}
          onFermer={() => setCreationOuverte(false)}
        />
      )}
    </div>
  );
}
