import { useState } from 'react';
import type { CharacterSheet } from '../model/character';
import type { DerivedCharacter } from '../model/derive';
import type { Constellation } from '../model/wild-shape';
import { AbilityScoresStrip, SkillsGrid } from './CombatScreen';
import { AlliesScreen } from './AlliesScreen';
import { WeaponsScreen } from './WeaponsScreen';
import { PortraitMedallion } from './Portrait';
import { TAB_BAR_CLEARANCE } from './TabBar';
import { decisionsDeClasse } from '../model/choix-de-classe';
import { resolvedSize, SIZE_LABEL, sizesFor, speciesById } from '../content/species';
import { classById } from '../content/classes';
import { themeDeClasse } from '../content/class-themes';
import { vitesseEffective } from '../model/derive';

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
  onTransformer, onRevenir, onApprendre, onEchanger, onLier, onDegatsCompagnon, onDetacherCompagnon, onRamenerCompagnon,
  onCourrouxDeLaMer, onFinCourrouxDeLaMer, onFormeStellaire, onFinFormeStellaire,
  onEquiperArme, onDegainerArme, onEquiperBouclier, onRetirerBouclier,
  onNiveauSuperieur, niveauDisponible, onRepos, onReglages, onRegles, onChoixDeClasse, onChoisirPortrait,
  onChoisirTaille, onModifierHistorique,
}: {
  sheet: CharacterSheet;
  derived: DerivedCharacter;
  avecAllies: boolean;
  estMj: boolean;
  onTransformer: (formId: string) => void;
  onRevenir: () => void;
  onApprendre: (formId: string) => void;
  onEchanger: (fromId: string, toId: string) => void;
  /** Courroux de la mer (Cercle de la Mer 3) : activer, terminer — dépense/relâche une Forme sauvage. */
  onCourrouxDeLaMer: () => void;
  onFinCourrouxDeLaMer: () => void;
  /** Forme stellaire (Cercle des Étoiles 3) : activer avec une constellation, terminer. */
  onFormeStellaire: (constellation: Constellation) => void;
  onFinFormeStellaire: () => void;
  onLier: (optionId: string, nom?: string) => void;
  onDegatsCompagnon: (companionId: string, delta: number) => void;
  onDetacherCompagnon: (companionId: string) => void;
  onRamenerCompagnon: (companionId: string, rang: number) => void;
  onEquiperArme: (weaponId: string) => void;
  onDegainerArme: () => void;
  onEquiperBouclier: () => void;
  onRetirerBouclier: () => void;
  /**
   * Côté MJ : bascule la montée de niveau proposée (dé)/verrouillée.
   * Côté joueur : ouvre la fenêtre de choix, présente seulement quand le MJ
   * l'a proposée (`niveauDisponible`).
   */
  onNiveauSuperieur?: () => void;
  /** Vrai quand le MJ a autorisé une montée de niveau pour ce personnage. */
  niveauDisponible?: boolean;
  /** Ouvrent les écrans fils : la barre d'onglets, elle, ne les liste plus. */
  onRepos: () => void;
  onReglages: () => void;
  onRegles: () => void;
  /** Enregistre une décision de classe (Ordre primordial, terrain du cercle…). */
  onChoixDeClasse: (classId: string, key: string, optionId: string) => void;
  /** Envoie le fichier choisi et enregistre son URL sur la fiche. */
  onChoisirPortrait: (file: File) => Promise<void>;
  /** `'TP' | 'P' | 'M' | 'G'` — voir `content/species.ts`. */
  onChoisirTaille: (size: string) => void;
  onModifierHistorique: (history: string) => void;
}) {
  // Décisions que le MJ a rouvertes pour correction, le temps de l'écran.
  const [aCorriger, setACorriger] = useState<ReadonlySet<string>>(new Set());
  const [selecteurTailleOuvert, setSelecteurTailleOuvert] = useState(false);
  const [historiqueOuvert, setHistoriqueOuvert] = useState(false);
  const [brouillonHistorique, setBrouillonHistorique] = useState<string | null>(null);
  const decisions = decisionsDeClasse(sheet, derived);
  const espece = speciesById(sheet.speciesId)?.name;
  const classes = sheet.classLevels
    .map((entry) => `${classById(entry.classId)?.name ?? entry.classId} ${entry.level}`)
    .join(' / ');
  const theme = themeDeClasse(sheet.classLevels);
  const tailleOptions = sizesFor(sheet.speciesId);
  const taille = resolvedSize(sheet);
  const vitesse = vitesseEffective(derived);

  return (
    <main style={{
      flexGrow: 1, padding: `12px 14px calc(${TAB_BAR_CLEARANCE} + 8px)`,
      display: 'flex', flexDirection: 'column', gap: 20,
      overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    }}>
      {/* ───── Identité : qui l'on est, et les gestes qui s'y rattachent ───── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <PortraitMedallion
            portraitUrl={sheet.portraitUrl}
            theme={theme}
            size={76}
            onChoisir={onChoisirPortrait}
          />
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            <h1 className="ttl" style={{ margin: 0, fontSize: 21 }}>{sheet.name}</h1>
            <div className="lbl" style={{ textTransform: 'none', marginTop: 3, fontSize: 13 }}>
              {[espece, classes].filter(Boolean).join(' · ')}
            </div>
            <div className="lbl" style={{ textTransform: 'none', marginTop: 2, fontSize: 13, color: 'var(--muted)' }}>
              {tailleOptions.length > 1 ? (
                // Un vrai choix (Aasimar, Humain, Tieffelin…) : le libellé
                // s'ouvre en petit sélecteur plutôt que de figer une taille
                // qu'on ne pourrait jamais revoir — c'est une décision de
                // création, pas une règle qui se dérive.
                <button
                  onClick={() => setSelecteurTailleOuvert((ouvert) => !ouvert)}
                  style={{ color: 'var(--accent)', fontWeight: 600 }}
                >
                  {SIZE_LABEL[taille]} ▾
                </button>
              ) : (
                <span>{SIZE_LABEL[taille]}</span>
              )}
              {' · '}{vitesse} de vitesse
            </div>
            {selecteurTailleOuvert && tailleOptions.length > 1 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                {tailleOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => { onChoisirTaille(option); setSelecteurTailleOuvert(false); }}
                    className="lbl"
                    style={{
                      minHeight: 30, padding: '0 12px', borderRadius: 999,
                      border: `1px solid ${option === taille ? 'var(--accent)' : 'var(--gold-dim)'}`,
                      background: option === taille ? 'var(--accent-wash)' : 'transparent',
                      color: option === taille ? 'var(--accent)' : 'var(--muted)', fontWeight: 700,
                    }}
                  >
                    {SIZE_LABEL[option]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onRegles}
            aria-label="Règles"
            style={{
              flexShrink: 0, width: 40, height: 40, borderRadius: 10,
              border: '1px solid var(--gold-dim)', background: 'linear-gradient(180deg, var(--surface-raised), var(--surface))',
              color: 'var(--gold)', display: 'grid', placeItems: 'center',
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
              border: '1px solid var(--gold-dim)', background: 'linear-gradient(180deg, var(--surface-raised), var(--surface))',
              color: 'var(--gold)', display: 'grid', placeItems: 'center',
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
              border: '1px solid var(--gold-dim)', background: 'linear-gradient(180deg, var(--surface-raised), var(--surface))',
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
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${niveauDisponible ? 'var(--line)' : 'var(--accent)'}`,
                color: niveauDisponible ? 'var(--muted)' : 'var(--accent)',
                fontSize: 14, fontWeight: 700,
              }}
            >
              {niveauDisponible ? 'Niveau + · proposé' : 'Niveau +'}
            </button>
          )}
          {!estMj && niveauDisponible && (
            <button
              onClick={onNiveauSuperieur}
              style={{
                flexShrink: 0, minHeight: 'var(--tap)', padding: '0 16px',
                borderRadius: 'var(--radius-sm)', border: 'none',
                background: 'var(--accent)', color: 'var(--accent-ink)', fontSize: 14, fontWeight: 700,
              }}
            >
              Monter de niveau !
            </button>
          )}
        </div>
        {estMj && niveauDisponible && (
          <div className="lbl" style={{ textTransform: 'none', color: 'var(--muted)', marginTop: 6 }}>
            En attente du joueur — reclique pour annuler.
          </div>
        )}
      </section>

      {/* ───── Historique : le roman du personnage, replié par défaut — la
          fiche ne doit pas s'ouvrir sur un mur de texte quand on ne cherche
          qu'un score de Force. */}
      <section>
        <button
          onClick={() => {
            if (!historiqueOuvert) setBrouillonHistorique(sheet.history ?? '');
            setHistoriqueOuvert((ouvert) => !ouvert);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}
        >
          <h2 className="ttl" style={{ fontSize: 17, flexGrow: 1, textAlign: 'left' }}>Historique</h2>
          <span className="lbl" style={{ color: 'var(--muted)' }}>{historiqueOuvert ? '▴' : '▾'}</span>
        </button>
        {!historiqueOuvert && !sheet.history && (
          <div className="lbl" style={{ textTransform: 'none', color: 'var(--muted)', marginTop: 4 }}>
            Rien d'écrit pour l'instant.
          </div>
        )}
        {historiqueOuvert && (
          <textarea
            value={brouillonHistorique ?? ''}
            onChange={(event) => setBrouillonHistorique(event.target.value)}
            onBlur={() => { if (brouillonHistorique !== null) onModifierHistorique(brouillonHistorique.trim()); }}
            placeholder="D'où vient ton personnage, ce qui l'a mené là…"
            rows={8}
            style={{
              width: '100%', marginTop: 10, padding: '10px 12px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--gold-dim)', background: 'var(--surface)', color: 'var(--ink)',
              fontSize: 14, lineHeight: 1.5, resize: 'vertical',
            }}
          />
        )}
      </section>

      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <h2 className="ttl" style={{ fontSize: 17, flexGrow: 1 }}>Caractéristiques</h2>
          {/* L'initiative ne se lisait nulle part par son nom — seulement
              déductible de la case DEX ci-dessous, ce qui suppose de déjà
              savoir que c'est elle qui compte. */}
          <div className="lbl" style={{ color: 'var(--muted)' }}>Initiative {sign(derived.modifiers.dex)}</div>
          <div className="lbl" style={{ color: 'var(--muted)' }}>Maîtrise {sign(derived.proficiencyBonus)}</div>
        </div>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AbilityScoresStrip abilities={derived.abilities} modifiers={derived.modifiers} />
          <SkillsGrid skills={derived.skills} />
        </div>
      </section>

      <section>
        <h2 className="ttl" style={{ fontSize: 17, marginBottom: 10 }}>Armes</h2>
        <WeaponsScreen
          sheet={sheet} derived={derived} onEquiper={onEquiperArme} onDegainer={onDegainerArme}
          onEquiperBouclier={onEquiperBouclier} onRetirerBouclier={onRetirerBouclier}
        />
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
              // Choix multiple (Maîtrise d'armes…) : plusieurs options actives
              // à la fois — c'est `choisis`, pas `choisi`, qui dit ce qui est
              // retenu, mais elle se verrouille comme les autres (voir
              // `choix-de-classe.ts` : entre deux repos longs pour la
              // Maîtrise d'armes, au lieu de « prise pour de bon »).
              const multiple = Boolean(decision.max && decision.max > 1);
              // Verrouillée : le choix est fait et définitif — ou, pour la
              // Maîtrise d'armes, fait pour cette journée. On n'affiche alors
              // QUE ce qui est retenu — montrer le reste en grisé, c'est
              // proposer un geste qui n'aboutira pas.
              const fige = Boolean(decision.verrouillee) && !aCorriger.has(cle);
              const montrees = fige
                ? decision.options.filter((option) => (
                  multiple ? decision.choisis?.includes(option.id) : option.id === decision.choisi
                ))
                : decision.options;
              const nombreChoisi = decision.choisis?.length ?? 0;
              return (
              <div key={cle}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div className="lbl" style={{ flexGrow: 1 }}>{decision.label}</div>
                  {multiple ? (
                    <div className="lbl" style={{ color: nombreChoisi < (decision.max ?? 0) ? 'var(--accent)' : 'var(--muted)' }}>
                      {nombreChoisi}/{decision.max}
                    </div>
                  ) : !decision.choisi && (
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
                    const actif = multiple
                      ? Boolean(decision.choisis?.includes(option.id))
                      : decision.choisi === option.id;
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
                          border: `1px solid ${actif ? 'var(--accent)' : 'var(--gold-dim)'}`,
                          background: actif
                            ? 'linear-gradient(180deg, var(--accent-wash), var(--surface))'
                            : 'linear-gradient(180deg, var(--surface-raised), var(--surface))',
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
                    border: '1px solid var(--gold-dim)', fontSize: 13, lineHeight: 1.45,
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
            onCourrouxDeLaMer={onCourrouxDeLaMer}
            onFinCourrouxDeLaMer={onFinCourrouxDeLaMer}
            onFormeStellaire={onFormeStellaire}
            onFinFormeStellaire={onFinFormeStellaire}
            onApprendre={onApprendre}
            onEchanger={onEchanger}
            onLier={onLier}
            onDegatsCompagnon={onDegatsCompagnon}
            onDetacherCompagnon={onDetacherCompagnon}
            onRamenerCompagnon={onRamenerCompagnon}
          />
        </section>
      )}
    </main>
  );
}
