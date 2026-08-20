import { useMemo, useState } from 'react';
import { preparedBudget, spellbookOf, spellChoices, type BookEntry, type ChoiceState, type ClassBudget } from '../model/spellbook';
import { detailOf, economyOf } from './spell-cards';
import { grantedSpells, grantResourceKey } from '../model/spell-grants';
import type { Spell } from '../content/spell-catalogue';
import type { CharacterSheet } from '../model/character';
import type { DerivedCharacter } from '../model/derive';

/**
 * Le grimoire.
 *
 * Un seul écran, pas deux : « ce que j'ai préparé » et « ce que j'aurais pu »
 * sont la même question posée dans les deux sens, et les séparer obligerait à
 * faire des allers-retours pour comparer.
 *
 * Trois partis pris :
 *
 * 1. **Le budget est l'en-tête.** Pas une ligne de statut en bas de page :
 *    c'est la question qu'on se pose vingt fois par soirée.
 * 2. **Trois natures jamais mélangées** — préparé, toujours préparé, accordé
 *    hors budget. Les confondre est le bug que le backlog garde en mémoire :
 *    « Liste 9/6 » sans enfreindre la moindre règle.
 * 3. **Rien ne disparaît sans dire pourquoi.** Un sort hors d'atteinte reste
 *    affiché, grisé, avec sa raison — sinon le joueur cherche s'il s'agit
 *    d'une règle ou d'un défaut.
 */

const LIBELLE: Record<ChoiceState['kind'], string> = {
  'prepare': 'préparé',
  'toujours-prepare': 'toujours préparé',
  'accorde': 'accordé',
  'disponible': 'disponible',
  'budget-plein': 'plus de place',
};

const COULEUR: Record<ChoiceState['kind'], string> = {
  'prepare': 'var(--accent)',
  'toujours-prepare': 'var(--ok)',
  'accorde': 'var(--ok)',
  'disponible': 'var(--muted)',
  'budget-plein': 'var(--muted)',
};

/** Le détail d'un sort, description comprise — c'est ce qu'on vient y lire. */
function Fiche({ spell, onFermer }: { spell: Spell; onFermer: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 20, background: 'var(--bg)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <header style={{
        flexShrink: 0, padding: '14px 16px 12px',
        paddingTop: 'calc(14px + env(safe-area-inset-top))',
        borderBottom: '1px solid var(--line)', background: 'var(--surface)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            <h2 className="ttl" style={{ margin: 0, fontSize: 19, lineHeight: 1.2 }}>{spell.name}</h2>
            <div className="lbl" style={{ marginTop: 4, textTransform: 'none' }}>
              {spell.level === 0 ? 'Sort mineur' : `Rang ${spell.level}`} · {spell.school}
            </div>
          </div>
          <button
            onClick={onFermer}
            aria-label="Fermer"
            style={{
              flexShrink: 0, width: 40, height: 40, borderRadius: 10,
              border: '1px solid var(--line)', display: 'grid', placeItems: 'center',
              color: 'var(--muted)', fontSize: 18,
            }}
          >
            ✕
          </button>
        </div>
      </header>

      <div style={{
        flexGrow: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '14px 16px calc(20px + env(safe-area-inset-bottom))',
      }}>
        <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 14px', fontSize: 13 }}>
          <dt className="lbl">Incantation</dt><dd style={{ margin: 0 }}>{spell.castingTime}</dd>
          <dt className="lbl">Portée</dt><dd style={{ margin: 0 }}>{spell.range}</dd>
          <dt className="lbl">Composantes</dt><dd style={{ margin: 0 }}>{spell.components}</dd>
          <dt className="lbl">Durée</dt><dd style={{ margin: 0 }}>{spell.duration}</dd>
        </dl>

        <p style={{ fontSize: 15, lineHeight: 1.55, marginTop: 16, marginBottom: 0 }}>
          {spell.text}
        </p>

        {spell.upcast && (
          <div style={{
            marginTop: 14, padding: '11px 13px', borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-wash)', border: '1px solid var(--line)',
          }}>
            <div className="lbl" style={{ color: 'var(--accent)' }}>Aux rangs supérieurs</div>
            <p style={{ margin: '5px 0 0', fontSize: 14, lineHeight: 1.5 }}>{spell.upcast}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Ligne({ spell, etat, onOuvrir, onBasculer }: {
  spell: Spell;
  etat: ChoiceState;
  onOuvrir: () => void;
  onBasculer: (() => void) | null;
}) {
  const attenue = etat.kind === 'budget-plein';
  return (
    <div
      className="card"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', borderRadius: 'var(--radius)',
        border: `1px solid ${etat.kind === 'prepare' ? 'var(--accent)' : 'var(--line)'}`,
        background: 'var(--surface)', opacity: attenue ? 0.45 : 1,
      }}
    >
      <button
        onClick={onOuvrir}
        style={{ flexGrow: 1, minWidth: 0, textAlign: 'left', minHeight: 40 }}
      >
        <div style={{ fontSize: 15, fontWeight: 600 }}>{spell.name}</div>
        <div className="lbl" style={{ textTransform: 'none', marginTop: 2 }}>
          {detailOf(spell)} · {economyOf(spell) === 'bonus' ? 'action bonus'
            : economyOf(spell) === 'reaction' ? 'réaction'
            : economyOf(spell) === 'action' ? 'action' : spell.castingTime.toLocaleLowerCase('fr')}
        </div>
        <div className="lbl" style={{ color: COULEUR[etat.kind], marginTop: 3 }}>
          {LIBELLE[etat.kind]}{etat.kind === 'accorde' ? ` · ${etat.par}` : ''}
        </div>
      </button>

      {onBasculer && (
        <button
          onClick={onBasculer}
          aria-label={etat.kind === 'prepare' ? `Retirer ${spell.name}` : `Préparer ${spell.name}`}
          style={{
            flexShrink: 0, minHeight: 'var(--tap)', minWidth: 46, borderRadius: 10,
            border: etat.kind === 'prepare' ? 'none' : '1px solid var(--line)',
            background: etat.kind === 'prepare' ? 'var(--accent)' : 'transparent',
            color: etat.kind === 'prepare' ? 'var(--accent-ink)' : 'var(--muted)',
            fontSize: 20, fontWeight: 700,
          }}
        >
          {etat.kind === 'prepare' ? '−' : '+'}
        </button>
      )}
    </div>
  );
}

const MODE_TEXTE: Record<ClassBudget['mode'], string> = {
  'long-rest': 'Liste rechoisie à chaque repos long.',
  'long-rest-one': 'Un sort échangeable à chaque repos long.',
  'level-up': 'Un sort échangeable en montant de niveau.',
  'spellbook': 'Préparés depuis le grimoire, au repos long.',
  'none': '',
};

export function SpellbookScreen({ sheet, derived, onToggle, dons }: {
  sheet: CharacterSheet;
  derived: DerivedCharacter;
  /** Absent : l'écran est en consultation. */
  onToggle?: (spellId: string, classId: string) => void;
  /**
   * Accorder et révoquer, réservé au MJ. Absent pour un joueur : accorder un
   * sort n'est pas une décision de personnage.
   */
  dons?: { onAccorder: () => void; onRevoquer: (grantId: string) => void };
}) {
  const budgets = useMemo(() => preparedBudget(sheet, derived), [sheet, derived]);
  const [classeActive, setClasseActive] = useState<string | null>(null);
  const [ouvert, setOuvert] = useState<Spell | null>(null);

  const classId = classeActive ?? budgets[0]?.classId ?? null;
  const budget = budgets.find((entry) => entry.classId === classId) ?? null;

  const choix = useMemo(
    () => (classId ? spellChoices(sheet, derived, classId) : []),
    [sheet, derived, classId],
  );

  // Les sorts accordés hors de la liste de classe — magie d'espèce, don —
  // n'apparaissent pas dans `spellChoices` : ils y seraient hors sujet, mais
  // les taire reviendrait à les perdre.
  const horsListe = useMemo((): BookEntry[] => {
    const dedans = new Set(choix.map((entry) => entry.spell.id));
    return spellbookOf(sheet, derived).filter((entry) => !dedans.has(entry.spell.id));
  }, [sheet, derived, choix]);

  if (!budget || !classId) {
    return (
      <main style={{ display: 'grid', placeItems: 'center', minHeight: '60dvh', padding: 24 }}>
        <p style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center', maxWidth: 280 }}>
          {sheet.name} ne lance pas de sorts.
        </p>
      </main>
    );
  }

  const accordes = grantedSpells(sheet, derived);
  const prets = choix.filter((entry) => entry.state.kind !== 'disponible' && entry.state.kind !== 'budget-plein');
  const reste = choix.filter((entry) => entry.state.kind === 'disponible' || entry.state.kind === 'budget-plein');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <header style={{
        flexShrink: 0, position: 'sticky', top: 0, zIndex: 5,
        background: 'var(--surface)', borderBottom: '1px solid var(--line)',
        boxShadow: 'var(--raise)', padding: '11px 14px 12px',
        paddingTop: 'calc(11px + env(safe-area-inset-top))',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <div className="ttl num" style={{ fontSize: 22 }}>
            <span style={{ color: budget.room ? 'var(--ink)' : 'var(--accent)' }}>{budget.prepared}</span>
            <span style={{ color: 'var(--muted)', fontSize: 16 }}>/{budget.max}</span>
          </div>
          <div className="lbl">préparés</div>
          {budget.free > 0 && (
            <div className="lbl" style={{ marginLeft: 'auto', color: 'var(--ok)', textTransform: 'none' }}>
              +{budget.free} hors budget
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 9, flexWrap: 'wrap' }}>
          {derived.spellcasting.slots.map((slot) => (
            <span
              key={`${slot.level}-${slot.pact ? 'p' : 'n'}`}
              className="lbl num"
              style={{
                padding: '3px 8px', borderRadius: 999, border: '1px solid var(--line)',
                textTransform: 'none', color: slot.remaining > 0 ? 'var(--ink)' : 'var(--muted)',
              }}
            >
              {slot.pact ? 'pacte' : `rang ${slot.level}`} {slot.remaining}/{slot.max}
            </span>
          ))}
          <span className="lbl num" style={{
            padding: '3px 8px', borderRadius: 999, border: '1px solid var(--line)', textTransform: 'none',
          }}>
            DD {derived.spellcasting.numbers[classId]?.saveDc ?? '—'} · att. +{derived.spellcasting.numbers[classId]?.attackBonus ?? '—'}
          </span>
        </div>

        <div className="lbl" style={{ textTransform: 'none', marginTop: 8 }}>
          {MODE_TEXTE[budget.mode]}
        </div>

        {budgets.length > 1 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 9 }}>
            {budgets.map((entry) => (
              <button
                key={entry.classId}
                onClick={() => setClasseActive(entry.classId)}
                className="lbl"
                style={{
                  padding: '5px 10px', borderRadius: 999,
                  border: `1px solid ${entry.classId === classId ? 'var(--accent)' : 'var(--line)'}`,
                  color: entry.classId === classId ? 'var(--accent)' : 'var(--muted)',
                }}
              >
                {entry.classId}
              </button>
            ))}
          </div>
        )}
      </header>

      <main style={{
        flexGrow: 1, padding: '12px 14px calc(20px + env(safe-area-inset-bottom))',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {prets.map((entry) => (
          <Ligne
            key={entry.spell.id}
            spell={entry.spell}
            etat={entry.state}
            onOuvrir={() => setOuvert(entry.spell)}
            onBasculer={onToggle && entry.state.kind === 'prepare'
              ? () => onToggle(entry.spell.id, classId) : null}
          />
        ))}

        {horsListe.length > 0 && (
          <>
            <div className="lbl" style={{ marginTop: 10 }}>Accordés hors liste</div>
            {horsListe.map((entry) => (
              <Ligne
                key={entry.spell.id}
                spell={entry.spell}
                etat={entry.standing}
                onOuvrir={() => setOuvert(entry.spell)}
                onBasculer={null}
              />
            ))}
          </>
        )}

        {(accordes.length > 0 || dons) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <div className="lbl" style={{ flexGrow: 1 }}>Accordés en jeu</div>
            {dons && (
              <button
                onClick={dons.onAccorder}
                className="lbl"
                style={{
                  minHeight: 34, padding: '0 12px', borderRadius: 999,
                  border: '1px solid var(--accent)', color: 'var(--accent)', fontWeight: 700,
                }}
              >
                + Accorder
              </button>
            )}
          </div>
        )}

        {accordes.map(({ grant, spell, auDessusDeSonRang }) => {
          const ressource = derived.resources.find((entry) => entry.key === grantResourceKey(grant));
          return (
            <div
              key={grant.id}
              className="card"
              style={{
                padding: '10px 12px', borderRadius: 'var(--radius)',
                border: '1px solid var(--ok)', background: 'var(--surface)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => setOuvert(spell)}
                  style={{ flexGrow: 1, minWidth: 0, textAlign: 'left', minHeight: 40 }}
                >
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{spell.name}</div>
                  <div className="lbl" style={{ textTransform: 'none', marginTop: 2 }}>
                    {detailOf(spell)}
                  </div>
                  <div className="lbl" style={{ color: 'var(--ok)', marginTop: 3 }}>
                    {grant.source}
                    {ressource ? ` · ${ressource.remaining}/${ressource.max} lancement${ressource.max > 1 ? 's' : ''}` : ''}
                    {` · recharge au repos ${grant.recharge}`}
                  </div>
                  {auDessusDeSonRang && (
                    <div className="lbl" style={{ color: 'var(--accent)', marginTop: 3, textTransform: 'none' }}>
                      Rang {spell.level} — au-delà de ses emplacements : lançable par ces lancements seulement.
                    </div>
                  )}
                </button>
                {dons && (
                  <button
                    onClick={() => dons.onRevoquer(grant.id)}
                    aria-label={`Révoquer ${spell.name}`}
                    className="lbl"
                    style={{
                      flexShrink: 0, minHeight: 'var(--tap)', padding: '0 12px',
                      borderRadius: 10, border: '1px solid var(--line)', color: 'var(--muted)',
                    }}
                  >
                    Révoquer
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <div className="lbl" style={{ marginTop: 14 }}>
          À préparer — {reste.length} sort{reste.length > 1 ? 's' : ''} de ta liste
        </div>
        {reste.map((entry) => (
          <Ligne
            key={entry.spell.id}
            spell={entry.spell}
            etat={entry.state}
            onOuvrir={() => setOuvert(entry.spell)}
            onBasculer={onToggle && entry.state.kind === 'disponible'
              ? () => onToggle(entry.spell.id, classId) : null}
          />
        ))}
      </main>

      {ouvert && <Fiche spell={ouvert} onFermer={() => setOuvert(null)} />}
    </div>
  );
}
