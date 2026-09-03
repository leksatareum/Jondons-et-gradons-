import { detailOf, economyOf } from './spell-cards';
import { damageTypesOf } from '../domain/spell-damage-types';
import { DamageTypeIcons } from './damage-type-icon';
import type { Spell } from '../content/spell-catalogue';

/**
 * La fiche d'un sort, en plein écran.
 *
 * Extraite du grimoire pour que l'écran de COMBAT montre exactement la même :
 * on y ouvre désormais un sort en tapant sa carte, et deux fiches écrites
 * séparément auraient divergé au premier ajout — une portée corrigée d'un
 * côté, pas de l'autre, et le joueur qui les compare ne sait plus laquelle
 * croire.
 *
 * Elle se contente de LIRE. Rien ne s'y lance : le geste qui dépense une
 * ressource reste sur la carte de combat, à un endroit qu'on ne traverse pas
 * en cherchant à relire une portée.
 */

export function FicheDeSort({ spell, onFermer }: { spell: Spell; onFermer: () => void }) {
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {/* Un seul sort ici, jamais une liste : rien à aligner d'une
                  ligne à l'autre — il garde donc sa place devant le nom. */}
              <DamageTypeIcons types={damageTypesOf(spell)} size={24} />
              <h2 className="ttl" style={{ margin: 0, fontSize: 19, lineHeight: 1.2 }}>{spell.name}</h2>
            </div>
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
            background: 'var(--accent-wash)', border: '1px solid var(--gold-dim)',
          }}>
            <div className="lbl" style={{ color: 'var(--accent)' }}>Aux rangs supérieurs</div>
            <p style={{ margin: '5px 0 0', fontSize: 14, lineHeight: 1.5 }}>{spell.upcast}</p>
          </div>
        )}
      </div>
    </div>
  );
}
