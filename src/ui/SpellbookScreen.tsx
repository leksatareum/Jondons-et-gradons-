import { useMemo, useState } from 'react';
import { preparedBudget, spellbookOf, spellChoices, type BookEntry, type ChoiceState, type ClassBudget } from '../model/spellbook';
import { detailOf, economyOf, sourceLisible } from './spell-cards';
import { FicheDeSort } from './FicheDeSort';
import { damageTypesOf } from '../domain/spell-damage-types';
import { DamageTypeSlot } from './damage-type-icon';
import { grantedSpells, grantResourceKey } from '../model/spell-grants';
import { cantripBudget, cantripChoices, grantedCantrips } from '../model/spellbook';
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

/**
 * Une carte de sort du grimoire — composée exactement comme celle de l'écran
 * de combat (`ActionCard`).
 *
 * C'est le même objet vu deux fois : le même sort, la même image, le même
 * geste pour ouvrir sa fiche. Deux compositions différentes obligeaient à
 * réapprendre où lire quoi en changeant d'onglet. Donc, dans les deux :
 *
 *   [médaillon] [nom / ce que ça coûte] [jeton rond]
 *
 * Le médaillon PRÉCÈDE le nom, dans un emplacement de largeur fixe
 * (`DamageTypeSlot`) : c'est cette largeur constante qui garde les titres
 * alignés d'une carte à l'autre, y compris pour les sorts sans dégâts. Le
 * corps de la carte ouvre la fiche, le jeton rond prépare ou retire — deux
 * gestes, deux cibles, comme en combat.
 */
function Ligne({ spell, etat, origine, onOuvrir, onBasculer }: {
  spell: Spell;
  etat: ChoiceState;
  /** Ce qui a payé ce sort quand ce n'est pas le simple quota de la table. */
  origine?: string;
  onOuvrir: () => void;
  onBasculer: (() => void) | null;
}) {
  const attenue = etat.kind === 'budget-plein';
  const economie = economyOf(spell) === 'bonus' ? 'action bonus'
    : economyOf(spell) === 'reaction' ? 'réaction'
    : economyOf(spell) === 'action' ? 'action' : spell.castingTime.toLocaleLowerCase('fr');
  return (
    <div
      // Préparé : le liseré de la classe, posé par `.card-accent` — la forme
      // ne change pas, seule la matière du bord.
      className={`card${etat.kind === 'prepare' ? ' card-accent' : ''}`}
      style={{ padding: '10px 12px', opacity: attenue ? 0.45 : 1 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={onOuvrir}
          aria-label={`${spell.name} — voir la fiche`}
          style={{
            flexGrow: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10,
            textAlign: 'left', minHeight: 40, color: 'inherit',
          }}
        >
          <DamageTypeSlot types={damageTypesOf(spell)} size={30} />
          <span style={{ flexGrow: 1, minWidth: 0 }}>
            <span
              className="ttl"
              style={{
                display: 'block', fontSize: 16, letterSpacing: '-0.01em',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              {spell.name}
            </span>
            <span
              className="lbl"
              style={{
                display: 'block', marginTop: 3, fontSize: 9, textTransform: 'none',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              {detailOf(spell)} · {economie}
            </span>
          </span>
        </button>

        {onBasculer && (
          <button
            onClick={onBasculer}
            aria-label={etat.kind === 'prepare' ? `Retirer ${spell.name}` : `Préparer ${spell.name}`}
            className="jg-rond"
            // Préparé : le jeton garde son métal, seul le glyphe s'allume et un
            // liseré à la couleur de la classe l'entoure. Rempli d'accent, il
            // faisait une colonne de gros ronds violets qui hurlait plus fort
            // que les noms des sorts.
            style={etat.kind === 'prepare'
              ? { color: 'var(--accent)', borderColor: 'var(--accent)', fontSize: 20, fontWeight: 700 }
              : { fontSize: 20, fontWeight: 700 }}
          >
            {etat.kind === 'prepare' ? '−' : '+'}
          </button>
        )}
      </div>

      {/* La nature du sort sur une seconde ligne, à la place qu'occupent les
          pastilles de paiement en combat : elle ne dispute pas sa place au nom. */}
      <div className="lbl" style={{ marginTop: 6, fontSize: 8, color: COULEUR[etat.kind] }}>
        {LIBELLE[etat.kind]}{etat.kind === 'accorde' ? ` par ${sourceLisible(etat.par)}` : ''}
        {origine ? ` · ${origine}` : ''}
      </div>
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
  const mineurs = cantripBudget(sheet, derived).find((entry) => entry.classId === classId) ?? null;
  const choixMineurs = classId ? cantripChoices(sheet, derived, classId) : [];
  const mineursPris = choixMineurs.filter((entry) => entry.state.kind === 'prepare' || entry.state.kind === 'accorde');
  const mineursLibres = choixMineurs.filter((entry) => entry.state.kind === 'disponible' || entry.state.kind === 'budget-plein');
  const mineursAccordes = grantedCantrips(sheet);
  const prets = choix.filter((entry) => entry.state.kind !== 'disponible' && entry.state.kind !== 'budget-plein');
  const reste = choix.filter((entry) => entry.state.kind === 'disponible' || entry.state.kind === 'budget-plein');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <header style={{
        flexShrink: 0, position: 'sticky', top: 0, zIndex: 5,
        // Un voile flouté plutôt qu'un aplat : l'en-tête reste collé en haut
        // pendant le défilement, il doit donc couvrir ce qui passe dessous —
        // mais la pierre du fond continue de se deviner au travers.
        background: 'rgba(22,25,29,.93)',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--line)',
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
                padding: '3px 8px', borderRadius: 999, border: '1px solid var(--gold-dim)',
                textTransform: 'none', color: slot.remaining > 0 ? 'var(--ink)' : 'var(--muted)',
              }}
            >
              {slot.pact ? 'pacte' : `rang ${slot.level}`} {slot.remaining}/{slot.max}
            </span>
          ))}
          <span className="lbl num" style={{
            padding: '3px 8px', borderRadius: 999, border: '1px solid var(--gold-dim)', textTransform: 'none',
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
        flexGrow: 1,
        // La barre d'onglets flotte au-dessus du contenu : sans cette marge,
        // le dernier sort de la liste passe dessous et devient illisible.
        padding: '12px 14px calc(76px + env(safe-area-inset-bottom))',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {/* ─── Sorts mineurs ───
            Ils vivent dans la même page que les sorts, et non dans un écran à
            part : l'écran de combat les mêle déjà aux autres cartes, et les
            séparer ici ferait chercher où sont passés les cinq sorts qu'on
            vient d'y voir. Leur quota est distinct, il est donc annoncé
            distinctement. */}
        {mineurs && (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <div className="lbl" style={{ flexGrow: 1 }}>Sorts mineurs</div>
              <div className="num lbl" style={{ color: mineurs.room ? 'var(--muted)' : 'var(--accent)' }}>
                {mineurs.known}/{mineurs.max}
              </div>
              {/* Une capacité qui augmente le quota le dit ici : sans ça, un
                  Druide Mage voyait « 3 » là où sa table de classe en annonce
                  2, sans explication nulle part. */}
              {mineurs.bonus && (
                <div className="lbl" style={{ color: 'var(--accent)', textTransform: 'none' }}>
                  dont +{mineurs.bonus.nombre} · {mineurs.bonus.de}
                </div>
              )}
              {mineurs.free > 0 && (
                <div className="lbl" style={{ color: 'var(--ok)', textTransform: 'none' }}>
                  +{mineurs.free} hors quota
                </div>
              )}
            </div>

            {mineursPris.map((entry) => (
              <Ligne
                key={entry.spell.id}
                spell={entry.spell}
                etat={entry.state}
                origine={entry.origine}
                onOuvrir={() => setOuvert(entry.spell)}
                onBasculer={onToggle && entry.state.kind === 'prepare'
                  ? () => onToggle(entry.spell.id, classId) : null}
              />
            ))}

            {mineursAccordes
              .filter((accorde) => !mineursPris.some((pris) => pris.spell.id === accorde.spell.id))
              .map(({ spell, source }) => (
                <Ligne
                  key={spell.id}
                  spell={spell}
                  etat={{ kind: 'accorde', par: source }}
                  onOuvrir={() => setOuvert(spell)}
                  onBasculer={null}
                />
              ))}

            {mineursLibres.length > 0 && (
              <details style={{ marginTop: 2 }}>
                <summary className="lbl" style={{ cursor: 'pointer', minHeight: 34, display: 'flex', alignItems: 'center' }}>
                  {mineurs.room
                    ? `En apprendre un — ${mineursLibres.length} au choix`
                    : `Quota atteint — voir les ${mineursLibres.length} autres`}
                </summary>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {mineursLibres.map((entry) => (
                    <Ligne
                      key={entry.spell.id}
                      spell={entry.spell}
                      etat={entry.state}
                      onOuvrir={() => setOuvert(entry.spell)}
                      onBasculer={onToggle && entry.state.kind === 'disponible'
                        ? () => onToggle(entry.spell.id, classId) : null}
                    />
                  ))}
                </div>
              </details>
            )}

            <div className="lbl" style={{ marginTop: 14 }}>Sorts</div>
          </>
        )}

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
                padding: '10px 12px',
                // Accordé hors budget : le vert, seule couleur que l'appli
                // associe déjà à « pas pris sur ton quota ».
                boxShadow: '0 7px 18px -7px #000, inset 0 1px 0 rgba(255,235,190,.07), 0 0 0 1px var(--ok)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => setOuvert(spell)}
                  aria-label={`${spell.name} — voir la fiche`}
                  style={{
                    flexGrow: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10,
                    textAlign: 'left', minHeight: 40, color: 'inherit',
                  }}
                >
                  {/* Même composition que partout : médaillon, nom, détail —
                      voir `Ligne` un peu plus haut dans ce fichier. */}
                  <DamageTypeSlot types={damageTypesOf(spell)} size={30} />
                  <span style={{ flexGrow: 1, minWidth: 0 }}>
                  <div className="ttl" style={{ fontSize: 16, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{spell.name}</div>
                  <div className="lbl" style={{ textTransform: 'none', marginTop: 3, fontSize: 9 }}>
                    {detailOf(spell)}
                  </div>
                  <div className="lbl" style={{ color: 'var(--ok)', marginTop: 3, fontSize: 8 }}>
                    {grant.source}
                    {ressource ? ` · ${ressource.remaining}/${ressource.max} lancement${ressource.max > 1 ? 's' : ''}` : ''}
                    {` · recharge au repos ${grant.recharge}`}
                  </div>
                  {auDessusDeSonRang && (
                    <div className="lbl" style={{ color: 'var(--accent)', marginTop: 3, textTransform: 'none', fontSize: 8 }}>
                      Rang {spell.level} — au-delà de ses emplacements : lançable par ces lancements seulement.
                    </div>
                  )}
                  </span>
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

      {ouvert && <FicheDeSort spell={ouvert} onFermer={() => setOuvert(null)} />}
    </div>
  );
}
