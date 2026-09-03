import { useMemo, useState } from 'react';
import { searchSpells, type Spell } from '../content/spell-catalogue';
import { grantWarnings } from '../model/spell-grants';
import { detailOf } from './spell-cards';
import type { CharacterSheet, SpellGrant } from '../model/character';
import type { DerivedCharacter } from '../model/derive';

/**
 * Accorder un sort, en tant que MJ.
 *
 * Le dispositif entier est construit contre une seule crainte : accorder par
 * mégarde ce qu'on n'a pas voulu, et ne s'en apercevoir qu'en pleine partie.
 * D'où quatre garde-fous, dans cet ordre :
 *
 * 1. **Rien ne part d'un seul geste.** Choisir un sort ouvre un récapitulatif ;
 *    c'est lui qu'on valide, pas la ligne du catalogue.
 * 2. **Le récapitulatif nomme le personnage.** Le MJ passe d'une fiche à
 *    l'autre toute la soirée ; « Accorder Boule de feu » ne dit pas à qui.
 * 3. **Les avertissements sont affichés, jamais bloquants.** Un rang trop
 *    élevé est une récompense de scénario légitime — mais elle doit être
 *    voulue, pas subie.
 * 4. **La provenance est obligatoire.** Sans elle, « pourquoi ce rôdeur a-t-il
 *    Boule de feu » n'a plus de réponse deux séances plus tard.
 *
 * Et rien n'est définitif : un don se révoque depuis le grimoire.
 */

const RECHARGES = [
  { valeur: 'long', libelle: 'repos long' },
  { valeur: 'court', libelle: 'repos court' },
] as const;

export function GrantSpellDialog({ sheet, derived, onAccorder, onFermer }: {
  sheet: CharacterSheet;
  derived: DerivedCharacter;
  onAccorder: (grant: SpellGrant) => void;
  onFermer: () => void;
}) {
  const [recherche, setRecherche] = useState('');
  const [choisi, setChoisi] = useState<Spell | null>(null);
  const [source, setSource] = useState('');
  const [uses, setUses] = useState(1);
  const [recharge, setRecharge] = useState<'court' | 'long'>('long');

  const resultats = useMemo(() => searchSpells(recherche), [recherche]);

  const avertissements = useMemo(
    () => (choisi ? grantWarnings(sheet, derived, { spellId: choisi.id, source }) : []),
    [sheet, derived, choisi, source],
  );
  const sourceManquante = avertissements.some((a) => a.kind === 'source-vide');

  const valider = () => {
    if (!choisi || sourceManquante) return;
    onAccorder({
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      spellId: choisi.id,
      source: source.trim(),
      uses: Math.max(1, uses),
      recharge,
      grantedAt: new Date().toISOString(),
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 30, background: 'rgba(13,15,18,.95)',
      display: 'flex', flexDirection: 'column',
    }}>
      <header style={{
        flexShrink: 0, padding: '13px 16px 12px',
        paddingTop: 'calc(13px + env(safe-area-inset-top))',
        borderBottom: '1px solid var(--gold-dim)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <h2 className="ttl" style={{ margin: 0, fontSize: 18 }}>Accorder un sort</h2>
          <div className="lbl" style={{ marginTop: 3, textTransform: 'none' }}>
            à <strong>{sheet.name}</strong>
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
      }}>
        {!choisi ? (
          <>
            <label className="lbl" htmlFor="recherche-sort">Quel sort</label>
            <input
              id="recherche-sort"
              value={recherche}
              onChange={(event) => setRecherche(event.target.value)}
              placeholder="Nom du sort…"
              autoComplete="off"
              style={champ}
            />
            <div className="lbl" style={{ textTransform: 'none', marginTop: 8, color: 'var(--muted)' }}>
              {recherche.trim().length < 2
                ? 'Le catalogue entier, sans filtre de classe : un don n’a pas à respecter la liste du personnage.'
                : `${resultats.length} sort${resultats.length > 1 ? 's' : ''} trouvé${resultats.length > 1 ? 's' : ''}`}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 12 }}>
              {resultats.map((spell) => (
                <button
                  key={spell.id}
                  onClick={() => setChoisi(spell)}
                  className="card"
                  style={{
                    textAlign: 'left', padding: '10px 12px', minHeight: 'var(--tap)',
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{spell.name}</div>
                  <div className="lbl" style={{ textTransform: 'none', marginTop: 2 }}>
                    {detailOf(spell)} · {spell.school}
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* ─── Récapitulatif : c'est lui qu'on valide ─── */}
            <div style={{
              padding: '12px 14px', borderRadius: 'var(--radius)',
              border: '1px solid var(--accent)', background: 'var(--accent-wash)',
            }}>
              <div className="ttl" style={{ fontSize: 17 }}>{choisi.name}</div>
              <div className="lbl" style={{ textTransform: 'none', marginTop: 3 }}>
                {detailOf(choisi)} · {choisi.castingTime}
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.5, margin: '9px 0 0', color: 'var(--muted)' }}>
                {choisi.text}
              </p>
            </div>

            <button
              onClick={() => setChoisi(null)}
              className="lbl"
              style={{ marginTop: 10, minHeight: 36, color: 'var(--muted)' }}
            >
              ← Choisir un autre sort
            </button>

            <label className="lbl" htmlFor="source-don" style={{ display: 'block', marginTop: 16 }}>
              D’où ça vient
            </label>
            <input
              id="source-don"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder="Génie du désert, parchemin de la crypte…"
              autoComplete="off"
              style={{ ...champ, borderColor: sourceManquante ? 'var(--vital)' : 'var(--gold-dim)' }}
            />

            <div style={{ display: 'flex', gap: 12, marginTop: 14, alignItems: 'flex-end' }}>
              <div>
                <label className="lbl" htmlFor="uses-don">Lancements</label>
                <input
                  id="uses-don"
                  type="number"
                  min={1}
                  max={99}
                  value={uses}
                  onChange={(event) => setUses(Number(event.target.value))}
                  style={{ ...champ, width: 84 }}
                />
              </div>
              <div style={{ flexGrow: 1 }}>
                <div className="lbl">Rechargés à chaque</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  {RECHARGES.map((option) => (
                    <button
                      key={option.valeur}
                      onClick={() => setRecharge(option.valeur)}
                      className="lbl"
                      style={{
                        minHeight: 44, padding: '0 12px', borderRadius: 10,
                        border: `1px solid ${recharge === option.valeur ? 'var(--accent)' : 'var(--gold-dim)'}`,
                        color: recharge === option.valeur ? 'var(--accent)' : 'var(--muted)',
                      }}
                    >
                      {option.libelle}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {avertissements.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {avertissements.map((avertissement) => (
                  <div
                    key={avertissement.kind}
                    role="alert"
                    style={{
                      padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${avertissement.kind === 'source-vide' ? 'var(--vital)' : 'var(--gold-dim)'}`,
                      background: avertissement.kind === 'source-vide' ? 'var(--vital-wash)' : 'var(--surface)',
                      fontSize: 13, lineHeight: 1.45,
                    }}
                  >
                    {avertissement.detail}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={valider}
              disabled={sourceManquante}
              style={{
                width: '100%', minHeight: 52, marginTop: 18, borderRadius: 'var(--radius-sm)',
                background: sourceManquante ? 'var(--surface)' : 'var(--accent)',
                color: sourceManquante ? 'var(--muted)' : 'var(--accent-ink)',
                border: sourceManquante ? '1px solid var(--gold-dim)' : 'none',
                fontSize: 15, fontWeight: 700,
                cursor: sourceManquante ? 'not-allowed' : 'pointer',
              }}
            >
              {sourceManquante
                ? 'Indique d’où vient ce sort'
                : `Accorder ${choisi.name} à ${sheet.name}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const champ: React.CSSProperties = {
  width: '100%', minHeight: 'var(--tap)', marginTop: 6,
  padding: '0 12px', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--gold-dim)', background: 'var(--surface)',
  color: 'var(--ink)', fontSize: 16,
};
