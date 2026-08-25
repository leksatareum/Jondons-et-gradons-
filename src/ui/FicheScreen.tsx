import { useState } from 'react';
import type { CharacterSheet } from '../model/character';
import type { DerivedCharacter } from '../model/derive';
import { AbilityScoresStrip, SkillsGrid } from './CombatScreen';
import { AlliesScreen } from './AlliesScreen';
import { TAB_BAR_CLEARANCE } from './TabBar';
import { decisionsDeClasse } from '../model/choix-de-classe';
import { speciesById } from '../content/species';
import { classById } from '../content/classes';

/**
 * La fiche : l'identité du personnage, ses caractéristiques, ses compétences,
 * ses formes — et les deux portes qui n'avaient pas leur place dans la barre
 * d'onglets : le repos (une action qu'on fait à son personnage) et les
 * réglages (un utilitaire, rangé ici comme les réglages d'Instagram vivent
 * dans le profil).
 *
 * Le journal et les notes en sont partis pour leur propre onglet — ils n'ont
 * rien de commun avec un score de Force, et les empiler ici obligeait à
 * défiler la moitié de la fiche pour relire une note.
 */

const sign = (value: number) => (value >= 0 ? `+${value}` : `${value}`);

export function FicheScreen({
  sheet, derived, avecAllies, estMj,
  onTransformer, onRevenir, onApprendre, onEchanger, onLier, onDegatsCompagnon, onDetacherCompagnon,
  onNiveauSuperieur, onRepos, onReglages, onRegles, onChoixDeClasse,
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
  /** Ouvrent les écrans fils : la barre d'onglets, elle, ne les liste plus. */
  onRepos: () => void;
  onReglages: () => void;
  onRegles: () => void;
  /** Enregistre une décision de classe (Ordre primordial, terrain du cercle…). */
  onChoixDeClasse: (classId: string, key: string, optionId: string) => void;
}) {
  // Décisions que le MJ a rouvertes pour correction, le temps de l'écran.
  const [aCorriger, setACorriger] = useState<ReadonlySet<string>>(new Set());
  const decisions = decisionsDeClasse(sheet, derived);
  const espece = speciesById(sheet.speciesId)?.name;
  const classes = sheet.classLevels
    .map((entry) => `${classById(entry.classId)?.name ?? entry.classId} ${entry.level}`)
    .join(' / ');

  return (
    <main style={{
      flexGrow: 1, padding: `12px 14px calc(${TAB_BAR_CLEARANCE} + 8px)`,
      display: 'flex', flexDirection: 'column', gap: 20,
      overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    }}>
      {/* ───── Identité : qui l'on est, et les gestes qui s'y rattachent ───── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            <h1 className="ttl" style={{ margin: 0, fontSize: 21 }}>{sheet.name}</h1>
            <div className="lbl" style={{ textTransform: 'none', marginTop: 3, fontSize: 13 }}>
              {[espece, classes].filter(Boolean).join(' · ')}
            </div>
          </div>
          <button
            onClick={onRegles}
            aria-label="Règles"
            style={{
              flexShrink: 0, width: 40, height: 40, borderRadius: 10,
              border: '1px solid var(--line)', color: 'var(--muted)',
              display: 'grid', placeItems: 'center',
            }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 6.4 C10 4.8 7 4.5 4.5 5.3 V17.8 C7 17 10 17.3 12 18.8 C14 17.3 17 17 19.5 17.8 V5.3 C17 4.5 14 4.8 12 6.4 Z M12 6.4 V18.8" />
            </svg>
          </button>
          <button
            onClick={onReglages}
            aria-label="Réglages"
            style={{
              flexShrink: 0, width: 40, height: 40, borderRadius: 10,
              border: '1px solid var(--line)', color: 'var(--muted)',
              display: 'grid', placeItems: 'center',
            }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="3.2" />
              <path d="M12 2.8 v2.6 M12 18.6 v2.6 M2.8 12 h2.6 M18.6 12 h2.6 M5.5 5.5 l1.85 1.85 M16.65 16.65 l1.85 1.85 M18.5 5.5 l-1.85 1.85 M7.35 16.65 L5.5 18.5" />
            </svg>
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={onRepos}
            style={{
              flexGrow: 1, minHeight: 'var(--tap)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--line)', background: 'var(--surface)',
              color: 'var(--ink)', fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M20 13.5 A8.3 8.3 0 1 1 10.5 4 A6.6 6.6 0 0 0 20 13.5 Z" />
            </svg>
            Prendre un repos
          </button>
          {estMj && (
            <button
              onClick={onNiveauSuperieur}
              style={{
                flexShrink: 0, minHeight: 'var(--tap)', padding: '0 16px',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent)',
                color: 'var(--accent)', fontSize: 14, fontWeight: 700,
              }}
            >
              Niveau +
            </button>
          )}
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <h2 className="ttl" style={{ fontSize: 17, flexGrow: 1 }}>Caractéristiques</h2>
          <div className="lbl" style={{ color: 'var(--muted)' }}>Maîtrise {sign(derived.proficiencyBonus)}</div>
        </div>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AbilityScoresStrip abilities={derived.abilities} modifiers={derived.modifiers} />
          <SkillsGrid skills={derived.skills} />
        </div>
      </section>

      {/* ───── Décisions de classe ─────
          Elles ne se dérivent pas du niveau : elles appartiennent au joueur.
          Sans cet écran, un Druide du Cercle de la Terre n'avait aucun moyen
          de choisir son terrain — donc aucun sort de cercle, jamais. */}
      {decisions.length > 0 && (
        <section>
          <h2 className="ttl" style={{ fontSize: 17, marginBottom: 10 }}>Choix de classe</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {decisions.map((decision) => {
              const cle = `${decision.classId}-${decision.key}`;
              // Verrouillée : le choix est fait et définitif. On n'affiche
              // alors QUE l'option retenue — montrer l'autre en grisé, c'est
              // proposer un geste qui n'aboutira pas.
              const fige = Boolean(decision.verrouillee) && !aCorriger.has(cle);
              const montrees = fige
                ? decision.options.filter((option) => option.id === decision.choisi)
                : decision.options;
              return (
              <div key={cle}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div className="lbl" style={{ flexGrow: 1 }}>{decision.label}</div>
                  {!decision.choisi && (
                    <div className="lbl" style={{ color: 'var(--accent)' }}>à choisir</div>
                  )}
                  {/* Seul le MJ peut revenir sur un choix définitif — c'est déjà
                      lui qui déclenche les montées de niveau. */}
                  {fige && estMj && (
                    <button
                      onClick={() => setACorriger((courant) => new Set(courant).add(cle))}
                      className="lbl"
                      style={{ color: 'var(--accent)', minHeight: 28, padding: '0 4px' }}
                    >
                      Corriger
                    </button>
                  )}
                </div>
                <div className="lbl" style={{ textTransform: 'none', marginTop: 2, color: 'var(--muted)' }}>
                  {decision.help}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 8 }}>
                  {montrees.map((option) => {
                    const actif = decision.choisi === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => {
                          if (fige) return;
                          onChoixDeClasse(decision.classId, decision.key, option.id);
                          setACorriger((courant) => {
                            const suite = new Set(courant);
                            suite.delete(cle);
                            return suite;
                          });
                        }}
                        className="card"
                        aria-disabled={fige || undefined}
                        style={{
                          textAlign: 'left', padding: '10px 12px', borderRadius: 'var(--radius)',
                          border: `1px solid ${actif ? 'var(--accent)' : 'var(--line)'}`,
                          background: actif ? 'var(--accent-wash)' : 'var(--surface)',
                          cursor: fige ? 'default' : 'pointer',
                        }}
                      >
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{option.name}</div>
                        <div style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--muted)', marginTop: 2 }}>
                          {option.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {/* Ce que la décision donne réellement sur cette fiche. Sans
                    cette ligne, choisir « Mage » n'avait aucun effet visible. */}
                {decision.effet && (
                  <div style={{
                    marginTop: 8, padding: '8px 11px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--line)', fontSize: 13, lineHeight: 1.45,
                    color: 'var(--muted)',
                  }}>
                    {decision.effet}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </section>
      )}

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
