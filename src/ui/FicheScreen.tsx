import type { CharacterSheet } from '../model/character';
import type { DerivedCharacter } from '../model/derive';
import { AbilityScoresStrip, SkillsGrid } from './CombatScreen';
import { AlliesScreen } from './AlliesScreen';
import { TAB_BAR_CLEARANCE } from './TabBar';

/**
 * La fiche : caractéristiques, compétences, formes et créature liée.
 *
 * Le journal et les notes en sont partis pour leur propre onglet — ils n'ont
 * rien de commun avec un score de Force, et les empiler ici obligeait à
 * défiler la moitié de la fiche pour relire une note.
 */

const sign = (value: number) => (value >= 0 ? `+${value}` : `${value}`);

export function FicheScreen({
  sheet, derived, avecAllies, estMj,
  onTransformer, onRevenir, onApprendre, onEchanger, onLier, onDegatsCompagnon, onDetacherCompagnon,
  onNiveauSuperieur,
}: {
  sheet: CharacterSheet;
  derived: DerivedCharacter;
  avecAllies: boolean;
  estMj: boolean;
  onTransformer: (formId: string) => void;
  onRevenir: () => void;
  onApprendre: (formId: string) => void;
  onEchanger: (fromId: string, toId: string) => void;
  onLier: (optionId: string) => void;
  onDegatsCompagnon: (companionId: string, delta: number) => void;
  onDetacherCompagnon: (companionId: string) => void;
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
    </main>
  );
}
