import type { CharacterSheet } from '../model/character';
import type { DerivedCharacter } from '../model/derive';
import type { JournalEntry, Note } from '../sync/campaign-sync';
import { AbilityScoresStrip, SkillsGrid } from './CombatScreen';
import { AlliesScreen } from './AlliesScreen';
import { JournalScreen } from './JournalScreen';
import { TAB_BAR_CLEARANCE } from './TabBar';

/**
 * La fiche : caractéristiques, compétences, formes/créature liée, journal et
 * notes — tout ce qui n'est ni le combat en cours ni le grimoire.
 *
 * Un seul rouleau, un seul défilement : `AlliesScreen` et `JournalScreen` ne
 * possèdent plus leur propre `<main>`, c'est celui-ci qui les encadre tous
 * les deux, plutôt que d'empiler des zones de scroll indépendantes.
 */

const sign = (value: number) => (value >= 0 ? `+${value}` : `${value}`);

export function FicheScreen({
  sheet, derived, avecAllies, estMj, journalEntries, notes, notesOwnerName,
  onTransformer, onRevenir, onApprendre, onEchanger, onLier, onDegatsCompagnon, onDetacherCompagnon,
  onAjouterEntreeJournal, onSupprimerEntreeJournal,
  onAjouterNote, onModifierNote, onSupprimerNote,
  onNiveauSuperieur,
}: {
  sheet: CharacterSheet;
  derived: DerivedCharacter;
  avecAllies: boolean;
  estMj: boolean;
  journalEntries: JournalEntry[];
  notes: Note[];
  notesOwnerName?: string;
  onTransformer: (formId: string) => void;
  onRevenir: () => void;
  onApprendre: (formId: string) => void;
  onEchanger: (fromId: string, toId: string) => void;
  onLier: (optionId: string) => void;
  onDegatsCompagnon: (companionId: string, delta: number) => void;
  onDetacherCompagnon: (companionId: string) => void;
  onAjouterEntreeJournal?: (entree: { title: string | null; body: string }) => void;
  onSupprimerEntreeJournal?: (id: string) => void;
  onAjouterNote?: (note: { title: string | null; body: string }) => void;
  onModifierNote?: (id: string, note: { title: string | null; body: string }) => void;
  onSupprimerNote?: (id: string) => void;
  /** MJ seulement : ouvre la fenêtre de montée de niveau. */
  onNiveauSuperieur?: () => void;
}) {
  return (
    <main style={{
      flexGrow: 1, padding: `12px 14px calc(${TAB_BAR_CLEARANCE} + 8px)`,
      display: 'flex', flexDirection: 'column', gap: 20,
      overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    }}>
      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <h2 className="ttl" style={{ fontSize: 17, flexGrow: 1 }}>Caractéristiques</h2>
          <div className="lbl" style={{ color: 'var(--muted)' }}>Maîtrise {sign(derived.proficiencyBonus)}</div>
        </div>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AbilityScoresStrip abilities={derived.abilities} modifiers={derived.modifiers} />
          <SkillsGrid skills={derived.skills} />
        </div>
        {estMj && (
          <button
            onClick={onNiveauSuperieur}
            className="lbl"
            style={{
              marginTop: 12, minHeight: 'var(--tap)', padding: '0 16px', borderRadius: 999,
              border: '1px solid var(--accent)', color: 'var(--accent)', fontWeight: 700,
            }}
          >
            Niveau +
          </button>
        )}
      </section>

      {avecAllies && (
        <section>
          <h2 className="ttl" style={{ fontSize: 17, marginBottom: 10 }}>Formes & créature liée</h2>
          <AlliesScreen
            sheet={sheet}
            derived={derived}
            onTransformer={onTransformer}
            onRevenir={onRevenir}
            onApprendre={onApprendre}
            onEchanger={onEchanger}
            onLier={onLier}
            onDegatsCompagnon={onDegatsCompagnon}
            onDetacherCompagnon={onDetacherCompagnon}
          />
        </section>
      )}

      <section>
        <JournalScreen
          entries={journalEntries}
          notes={notes}
          estMj={estMj}
          notesOwnerName={notesOwnerName}
          onAjouterEntree={onAjouterEntreeJournal}
          onSupprimerEntree={onSupprimerEntreeJournal}
          onAjouterNote={onAjouterNote}
          onModifierNote={onModifierNote}
          onSupprimerNote={onSupprimerNote}
        />
      </section>
    </main>
  );
}
