import { useMemo, useState } from 'react';
import { PHB_CREATURES, type CreatureTemplate } from '../content/creatures';
import { WILD_SHAPE_PROFILES } from '../domain/wild-shape';
import { abilityModifier } from '../model/character';
import type { Combatant } from '../domain/encounter';

/**
 * Ajouter un adversaire.
 *
 * Un stat-bloc à remplir, pas un générateur : le MJ connaît son monstre mieux
 * que ce catalogue, qui ne couvre qu'une poignée de bêtes du PHB. Piocher dans
 * le bestiaire ne fait que pré-remplir les champs — rien n'empêche de les
 * corriger ensuite, et un adversaire inventé de toutes pièces se saisit tout
 * aussi bien.
 *
 * Volontairement minimal : nom, CA, PV, modificateur de Dextérité (pour
 * départager l'initiative), et l'initiative elle-même — que le MJ a déjà
 * jetée à la table. L'app ne lance pas de dés à la place de qui que ce soit.
 */

const dexModOf = (template: CreatureTemplate): number | null => {
  if (template.abilities) return abilityModifier(template.abilities.dex);
  const profil = WILD_SHAPE_PROFILES.find((entry) => entry.id === template.id);
  return profil ? abilityModifier(profil.abilities.dex) : null;
};

const champ: React.CSSProperties = {
  width: '100%', minHeight: 'var(--tap)', marginTop: 6,
  padding: '0 12px', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--line)', background: 'var(--surface)',
  color: 'var(--ink)', fontSize: 16,
};

export function AddAdversaryDialog({ onAjouter, onFermer }: {
  onAjouter: (combatant: Omit<Combatant, 'id'>) => void;
  onFermer: () => void;
}) {
  const [recherche, setRecherche] = useState('');
  const [nom, setNom] = useState('');
  const [ca, setCa] = useState('');
  const [pv, setPv] = useState('');
  const [dex, setDex] = useState('');
  const [initiative, setInitiative] = useState('');

  const resultats = useMemo(() => {
    const q = recherche.trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('fr');
    if (q.length < 2) return [];
    return PHB_CREATURES.filter((creature) => creature.name.normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLocaleLowerCase('fr').includes(q)).slice(0, 20);
  }, [recherche]);

  const choisir = (template: CreatureTemplate) => {
    setNom(template.name);
    setCa(String(template.ac));
    setPv(String(template.hp));
    const mod = dexModOf(template);
    if (mod !== null) setDex(String(mod));
    setRecherche('');
  };

  const nomValide = nom.trim().length > 0;
  const pvValide = Number(pv) > 0;
  const pret = nomValide && pvValide;

  const valider = () => {
    if (!pret) return;
    onAjouter({
      name: nom.trim(),
      side: 'creature',
      initiative: Number(initiative) || 0,
      dexterity: Number(dex) || 0,
      maxHp: Math.max(1, Math.floor(Number(pv))),
      damageTaken: 0,
      temporaryHp: 0,
      armorClass: Number(ca) || 10,
      conditions: [],
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 30, background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
    }}>
      <header style={{
        flexShrink: 0, padding: '13px 16px 12px',
        paddingTop: 'calc(13px + env(safe-area-inset-top))',
        borderBottom: '1px solid var(--line)', background: 'var(--surface)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <h2 className="ttl" style={{ margin: 0, fontSize: 18, flexGrow: 1 }}>Ajouter un adversaire</h2>
        <button
          onClick={onFermer}
          aria-label="Annuler"
          style={{
            flexShrink: 0, width: 40, height: 40, borderRadius: 10,
            border: '1px solid var(--line)', color: 'var(--muted)', fontSize: 18,
          }}
        >
          ✕
        </button>
      </header>

      <div style={{
        flexGrow: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '14px 16px calc(20px + env(safe-area-inset-bottom))',
      }}>
        <label className="lbl" htmlFor="recherche-bestiaire">Depuis le bestiaire (facultatif)</label>
        <input
          id="recherche-bestiaire"
          value={recherche}
          onChange={(event) => setRecherche(event.target.value)}
          placeholder="Nom d’une bête du PHB…"
          autoComplete="off"
          style={champ}
        />
        {resultats.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {resultats.map((template) => (
              <button
                key={template.id}
                onClick={() => choisir(template)}
                className="card"
                style={{
                  textAlign: 'left', padding: '9px 12px', minHeight: 'var(--tap)',
                  borderRadius: 'var(--radius)', border: '1px solid var(--line)', background: 'var(--surface)',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600 }}>{template.name}</div>
                <div className="lbl" style={{ textTransform: 'none', marginTop: 2 }}>
                  FP {template.cr} · CA {template.ac} · {template.hp} PV · {template.speed}
                </div>
              </button>
            ))}
          </div>
        )}

        <label className="lbl" htmlFor="nom-adversaire" style={{ display: 'block', marginTop: 18 }}>Nom</label>
        <input
          id="nom-adversaire" value={nom} onChange={(event) => setNom(event.target.value)}
          placeholder="Gobelin, Loup, Bandit…" autoComplete="off" style={champ}
        />

        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <div style={{ flex: 1 }}>
            <label className="lbl" htmlFor="ca-adversaire">CA</label>
            <input id="ca-adversaire" type="number" inputMode="numeric" value={ca}
              onChange={(event) => setCa(event.target.value)} style={champ} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="lbl" htmlFor="pv-adversaire">PV max</label>
            <input id="pv-adversaire" type="number" inputMode="numeric" value={pv}
              onChange={(event) => setPv(event.target.value)} style={champ} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <div style={{ flex: 1 }}>
            <label className="lbl" htmlFor="dex-adversaire">Modificateur de Dextérité</label>
            <input id="dex-adversaire" type="number" inputMode="numeric" value={dex}
              onChange={(event) => setDex(event.target.value)} style={champ} />
            <div className="lbl" style={{ textTransform: 'none', marginTop: 4, color: 'var(--muted)' }}>
              Départage l’initiative à égalité.
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label className="lbl" htmlFor="initiative-adversaire">Initiative jetée</label>
            <input id="initiative-adversaire" type="number" inputMode="numeric" value={initiative}
              onChange={(event) => setInitiative(event.target.value)} style={champ} />
            <div className="lbl" style={{ textTransform: 'none', marginTop: 4, color: 'var(--muted)' }}>
              Le jet se fait à la table, pas ici.
            </div>
          </div>
        </div>

        <button
          onClick={valider}
          disabled={!pret}
          style={{
            width: '100%', minHeight: 52, marginTop: 20, borderRadius: 'var(--radius-sm)',
            background: pret ? 'var(--accent)' : 'var(--surface)',
            color: pret ? 'var(--accent-ink)' : 'var(--muted)',
            border: pret ? 'none' : '1px solid var(--line)',
            fontSize: 15, fontWeight: 700, cursor: pret ? 'pointer' : 'not-allowed',
          }}
        >
          {!nomValide ? 'Donne-lui un nom' : !pvValide ? 'Indique ses points de vie' : `Ajouter ${nom.trim()}`}
        </button>
      </div>
    </div>
  );
}
