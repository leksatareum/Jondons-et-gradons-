import { useMemo, useState } from 'react';
import type { CharacterSheet } from '../model/character';
import { deriveCharacter } from '../model/derive';
import { ABILITY_ABBREVIATIONS, ABILITY_NAMES, ABILITY_ORDER, type AbilityId } from '../content/character-basics';
import { layoutCombatCards, type Economy, type PlayableCard, type TurnContext } from './combat-layout';

/**
 * Écran de combat du joueur.
 *
 * Structure retenue avec l'utilisateur (« le rouleau ») :
 *  - une zone FIGÉE qui ne défile jamais : identité, points de vie
 *    manipulables, classe d'armure, sauvegardes, économie d'action ;
 *  - un rouleau qui se RÉORDONNE selon le contexte (cf. `combat-layout.ts`) ;
 *  - une barre basse dans la zone du pouce.
 *
 * Aucun chiffre n'est stocké ici : tout vient de `deriveCharacter`. Changer une
 * règle demain change cet écran sans y toucher.
 */

const sign = (value: number) => (value >= 0 ? `+${value}` : `${value}`);

const ECONOMY_LABEL: Record<Economy, string> = {
  action: 'Action', bonus: 'Bonus', reaction: 'Réaction', libre: 'Libre',
};

function Pip({ filled }: { filled: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        width: 11, height: 11, borderRadius: '50%',
        background: filled ? 'var(--accent)' : 'transparent',
        border: filled ? 'none' : '1.5px solid var(--line)',
        display: 'inline-block',
      }}
    />
  );
}

function HitPoints({ current, max, temporary, onChange }: {
  current: number; max: number; temporary: number; onChange: (delta: number) => void;
}) {
  const step = (delta: number, label: string) => (
    <button
      onClick={() => onChange(delta)}
      aria-label={label}
      style={{
        width: 52, height: 56, display: 'grid', placeItems: 'center',
        color: 'var(--ink)',
        [delta < 0 ? 'borderRight' : 'borderLeft']: '1px solid var(--line)',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
        {delta < 0 ? <path d="M5 12h14" /> : <path d="M12 5v14M5 12h14" />}
      </svg>
    </button>
  );

  return (
    <div style={{
      flexGrow: 1, display: 'flex', alignItems: 'center',
      border: '1.5px solid var(--vital)', borderRadius: 'var(--radius)', overflow: 'hidden',
    }}>
      {step(-1, 'Retirer un point de vie')}
      <div style={{ flexGrow: 1, textAlign: 'center' }}>
        <div className="num" style={{ fontSize: 29, fontWeight: 700, lineHeight: 1, color: 'var(--vital)' }}>
          {current}
          <span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}>/{max}</span>
          {temporary > 0 && (
            <span style={{ fontSize: 15, color: 'var(--ok)', fontWeight: 600 }}> +{temporary}</span>
          )}
        </div>
        <div className="lbl" style={{ marginTop: 2 }}>
          {temporary > 0 ? 'pv · temporaires' : 'points de vie'}
        </div>
      </div>
      {step(+1, 'Rendre un point de vie')}
    </div>
  );
}

function SaveStrip({ modifiers, proficient, bonus }: {
  modifiers: Record<AbilityId, number>; proficient: string[]; bonus: number;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 4 }}>
      {ABILITY_ORDER.map((ability) => {
        const isProficient = proficient.includes(ability);
        const total = modifiers[ability] + (isProficient ? bonus : 0);
        return (
          <div
            key={ability}
            title={`Sauvegarde de ${ABILITY_NAMES[ability]}`}
            style={{
              textAlign: 'center', padding: '5px 0', borderRadius: 'var(--radius-sm)',
              border: isProficient ? '1.5px solid var(--accent)' : '1px solid var(--line)',
              background: isProficient ? 'var(--accent-wash)' : 'transparent',
            }}
          >
            <div className="lbl" style={{ fontSize: 9, color: isProficient ? 'var(--accent)' : undefined }}>
              {ABILITY_ABBREVIATIONS[ability]}
            </div>
            <div className="num" style={{
              fontSize: 14, fontWeight: isProficient ? 700 : 600,
              color: isProficient ? 'var(--accent)' : undefined,
            }}>
              {sign(total)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActionCard({ card, playable, hero, onPlay }: {
  card: PlayableCard;
  /** Jouable maintenant : pleinement lisible et actionnable. */
  playable: boolean;
  /** Première carte jouable : ses chiffres passent en grand. */
  hero: boolean;
  onPlay: (card: PlayableCard) => void;
}) {
  const hasNumbers = card.toHit !== undefined || card.damage;
  return (
    <div
      className="card"
      style={{
        background: 'var(--surface)',
        border: hero ? '1.5px solid var(--accent)' : '1px solid var(--line)',
        borderStyle: card.granted ? 'dashed' : 'solid',
        borderRadius: 'var(--radius)',
        padding: playable ? 14 : '12px 14px',
        // Seul ce qui n'est PAS jouable est atténué. Une carte jouable reste
        // pleinement lisible, même quand elle n'est pas la première.
        opacity: playable ? 1 : 0.42,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div className="ttl" style={{ fontSize: hero ? 17 : 15, flexGrow: 1 }}>{card.name}</div>
        <div className="lbl" style={{ color: hero ? 'var(--accent)' : undefined }}>
          {ECONOMY_LABEL[card.economy]}
        </div>
      </div>

      {card.granted && (
        <div className="lbl" style={{ textTransform: 'none', marginTop: 2, color: 'var(--accent)' }}>
          accordé par ton don · hors budget
        </div>
      )}
      {card.detail && !card.granted && (
        <div className="lbl" style={{ textTransform: 'none', marginTop: 2 }}>{card.detail}</div>
      )}

      {hero && hasNumbers && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, margin: '11px 0 13px' }}>
          {card.toHit !== undefined && (
            <div>
              <div className="num" style={{ fontSize: 27, fontWeight: 700, lineHeight: 1, color: 'var(--accent)' }}>
                {sign(card.toHit)}
              </div>
              <div className="lbl" style={{ marginTop: 3 }}>touche</div>
            </div>
          )}
          {card.damage && (
            <div>
              <div className="num" style={{ fontSize: 27, fontWeight: 700, lineHeight: 1 }}>{card.damage}</div>
              <div className="lbl" style={{ marginTop: 3 }}>dégâts</div>
            </div>
          )}
        </div>
      )}

      {playable && (
        <div style={{ display: 'flex', gap: 8, marginTop: hero && hasNumbers ? 0 : 12 }}>
          <button
            onClick={() => onPlay(card)}
            style={{
              flexGrow: 1, minHeight: 'var(--tap)', borderRadius: 10,
              background: 'var(--accent)', color: 'var(--accent-ink)', fontSize: 13, fontWeight: 700,
            }}
          >
            {card.toHit !== undefined ? 'Attaquer' : 'Utiliser'}
          </button>
          {card.resource && (
            <div style={{
              minWidth: 74, minHeight: 'var(--tap)', borderRadius: 10,
              border: '1px solid var(--line)', display: 'grid', placeItems: 'center', gap: 3,
            }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: card.resource.max }, (_, index) => (
                  <Pip key={index} filled={index < card.resource!.remaining} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CombatScreen({ sheet, cards, isYourTurn, turnHolder, onSpendHp }: {
  sheet: CharacterSheet;
  cards: PlayableCard[];
  isYourTurn: boolean;
  /** Nom de qui joue, quand ce n'est pas toi. */
  turnHolder?: string;
  onSpendHp?: (delta: number) => void;
}) {
  const [spent, setSpent] = useState<TurnContext['spent']>({});
  const derived = useMemo(() => deriveCharacter(sheet), [sheet]);
  const layout = useMemo(
    () => layoutCombatCards(cards, { isYourTurn, spent }),
    [cards, isYourTurn, spent],
  );

  const play = (card: PlayableCard) => setSpent((current) => ({ ...current, [card.economy]: true }));
  const className = sheet.classLevels[0]?.classId ?? '';

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ───── Zone figée : ne défile jamais ───── */}
      <header style={{
        flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--line)',
        boxShadow: 'var(--raise)', padding: '11px 14px 12px',
        paddingTop: 'calc(11px + env(safe-area-inset-top))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
          <div className="ttl" style={{ fontSize: 16 }}>{sheet.name}</div>
          <div className="lbl" style={{ flexGrow: 1 }}>
            {className} {derived.level}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'stretch', gap: 9, marginBottom: 11 }}>
          <HitPoints
            current={derived.currentHp}
            max={derived.maxHp}
            temporary={derived.temporaryHp}
            onChange={(delta) => onSpendHp?.(delta)}
          />
          <div style={{
            width: 66, border: '1px solid var(--line)', borderRadius: 'var(--radius)',
            display: 'grid', placeItems: 'center',
          }}>
            <div>
              <div className="num" style={{ fontSize: 23, fontWeight: 700, lineHeight: 1, textAlign: 'center' }}>
                {derived.armorClass}
              </div>
              <div className="lbl" style={{ marginTop: 3 }}>CA</div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 11 }}>
          <SaveStrip
            modifiers={derived.modifiers}
            proficient={derived.saveProficiencies}
            bonus={derived.proficiencyBonus}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ flexGrow: 1 }}>
            {isYourTurn ? (
              <div className="ttl" style={{ fontSize: 13, color: 'var(--accent)' }}>À toi de jouer</div>
            ) : (
              <>
                <div className="ttl" style={{ fontSize: 13 }}>Tour de {turnHolder ?? '…'}</div>
                <div className="lbl" style={{ textTransform: 'none', marginTop: 1 }}>ta réaction reste disponible</div>
              </>
            )}
          </div>
          {(['action', 'bonus', 'reaction'] as const).map((economy) => (
            <div
              key={economy}
              style={{
                padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: layout.available[economy] ? 'var(--accent)' : 'transparent',
                color: layout.available[economy] ? 'var(--accent-ink)' : 'var(--muted)',
                border: layout.available[economy] ? 'none' : '1px solid var(--line)',
                textDecoration: layout.available[economy] ? 'none' : 'line-through',
              }}
            >
              {ECONOMY_LABEL[economy]}
            </div>
          ))}
        </div>
      </header>

      {/* ───── Rouleau réordonné ───── */}
      <main style={{
        flexGrow: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: 11,
      }}>
        {layout.featured.map((card, index) => (
          <ActionCard key={card.id} card={card} playable hero={index === 0} onPlay={play} />
        ))}

        {layout.muted.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '2px 2px 0' }}>
            <div className="lbl">{isYourTurn ? 'plus tard dans le tour' : 'rangé pour l’instant'}</div>
            <div style={{ flexGrow: 1, height: 1, background: 'var(--line)' }} />
          </div>
        )}
        {layout.muted.map((card) => (
          <ActionCard key={card.id} card={card} playable={false} hero={false} onPlay={play} />
        ))}
      </main>

      {/* ───── Zone du pouce ───── */}
      <footer style={{
        flexShrink: 0, padding: '11px 14px 14px',
        paddingBottom: 'calc(14px + env(safe-area-inset-bottom))',
        display: 'flex', gap: 9,
      }}>
        <button
          disabled={!isYourTurn}
          style={{
            flexGrow: 1, minHeight: 'var(--tap)', borderRadius: 11, fontSize: 13, fontWeight: 700,
            background: isYourTurn ? 'var(--ink)' : 'transparent',
            color: isYourTurn ? 'var(--bg)' : 'var(--muted)',
            border: isYourTurn ? 'none' : '1px solid var(--line)',
          }}
        >
          {isYourTurn ? 'Fin du tour' : 'Ordre du combat'}
        </button>
        <button style={{
          width: 92, minHeight: 'var(--tap)', borderRadius: 11,
          border: '1.5px solid var(--ink)', fontSize: 13, fontWeight: 700,
        }}>
          Fiche
        </button>
      </footer>
    </div>
  );
}
