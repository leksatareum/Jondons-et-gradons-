import { useMemo, useState } from 'react';
import { RULE_CATEGORIES, RULES_COMPENDIUM, type RuleCategory } from '../content/rules-compendium';
import { TAB_BAR_CLEARANCE } from './TabBar';

/**
 * Le résumé des règles, consultable en pleine partie.
 *
 * L'ancienne appli avait cet écran ; celle-ci avait déjà toutes les données
 * (`rules-compendium.ts`, 65 entrées) mais aucun écran ne les montrait. Une
 * recherche et des catégories, rien de plus : ce sont des résumés
 * opérationnels écrits pour l'appli, pas le texte du livre.
 */

const normalise = (texte: string) => texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('fr');

export function RulesScreen({ onRetour }: { onRetour: () => void }) {
  const [recherche, setRecherche] = useState('');
  const [categorie, setCategorie] = useState<RuleCategory | null>(null);

  const resultats = useMemo(() => {
    const q = normalise(recherche.trim());
    return RULES_COMPENDIUM.filter((regle) => {
      if (categorie && regle.category !== categorie) return false;
      if (q.length === 0) return true;
      return normalise(regle.title).includes(q)
        || normalise(regle.summary).includes(q)
        || regle.keywords.some((mot) => normalise(mot).includes(q));
    });
  }, [recherche, categorie]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 20, background: 'rgba(13,15,18,.95)',
      display: 'flex', flexDirection: 'column',
    }}>
      <header style={{
        flexShrink: 0, padding: '13px 16px 12px',
        paddingTop: 'calc(13px + env(safe-area-inset-top))',
        borderBottom: '1px solid var(--gold-dim)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <h2 className="ttl" style={{ margin: 0, fontSize: 18, flexGrow: 1 }}>Règles</h2>
        <button
          onClick={onRetour}
          aria-label="Retour"
          style={{
            flexShrink: 0, width: 40, height: 40, borderRadius: 10,
            border: '1px solid var(--gold-dim)', color: 'var(--muted)', fontSize: 18,
          }}
        >
          ✕
        </button>
      </header>

      <div style={{ flexShrink: 0, padding: '12px 16px 0', background: 'var(--surface)' }}>
        <input
          value={recherche}
          onChange={(event) => setRecherche(event.target.value)}
          placeholder="Chercher une règle — attaque d’opportunité, couvert…"
          autoComplete="off"
          style={{
            width: '100%', minHeight: 'var(--tap)',
            padding: '0 12px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--gold-dim)', background: 'var(--bg)',
            color: 'var(--ink)', fontSize: 16,
          }}
        />
        <div style={{
          display: 'flex', gap: 6, marginTop: 10, paddingBottom: 12,
          overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        }}>
          <button
            onClick={() => setCategorie(null)}
            className="lbl"
            style={{
              flexShrink: 0, minHeight: 32, padding: '0 12px', borderRadius: 999,
              background: categorie === null ? 'var(--accent)' : 'transparent',
              color: categorie === null ? 'var(--accent-ink)' : 'var(--muted)',
              border: categorie === null ? 'none' : '1px solid var(--gold-dim)', fontWeight: 700,
            }}
          >
            Tout
          </button>
          {RULE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategorie((current) => (current === cat ? null : cat))}
              className="lbl"
              style={{
                flexShrink: 0, minHeight: 32, padding: '0 12px', borderRadius: 999,
                background: categorie === cat ? 'var(--accent)' : 'transparent',
                color: categorie === cat ? 'var(--accent-ink)' : 'var(--muted)',
                border: categorie === cat ? 'none' : '1px solid var(--gold-dim)', fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        flexGrow: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: `14px 16px calc(${TAB_BAR_CLEARANCE} + 8px)`,
      }}>
        {resultats.length === 0 ? (
          <div className="lbl" style={{ textTransform: 'none', color: 'var(--muted)' }}>
            Rien ne correspond. Essaie un autre mot, ou une autre catégorie.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {resultats.map((regle) => (
              <div key={regle.id} className="card" style={{
                padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div className="ttl" style={{ fontSize: 15, flexGrow: 1 }}>{regle.title}</div>
                  <div className="lbl" style={{ fontSize: 9, color: 'var(--muted)' }}>{regle.category}</div>
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.5, marginTop: 5, color: 'var(--ink)' }}>
                  {regle.summary}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
