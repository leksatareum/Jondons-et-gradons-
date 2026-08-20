import { useMemo, useState } from 'react';
import { PHB_CREATURES, type CreatureTemplate } from '../content/creatures';
import { WILD_SHAPE_PROFILES } from '../domain/wild-shape';
import { abilityModifier } from '../model/character';
import type { Combatant, CombatantAttack } from '../domain/encounter';

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

const nouvelId = () => `att-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/** Les attaques d'un modèle du bestiaire — le reste de son bloc (sauvegardes, utilitaires) ne se lit pas comme une attaque. */
export const attaquesDuTemplate = (template: CreatureTemplate): CombatantAttack[] =>
  (template.actions ?? [])
    .filter((action) => action.kind === 'attack')
    .map((action) => ({
      id: nouvelId(), name: action.name, toHit: action.toHit,
      damage: action.damage, damageType: action.damageType, detail: action.detail,
    }));

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
  const [attaques, setAttaques] = useState<CombatantAttack[]>([]);

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
    // Reprend les attaques du modèle plutôt que d'ajouter aux éventuelles
    // lignes déjà saisies à la main : choisir un autre modèle ne doit pas les
    // empiler avec le précédent.
    setAttaques(attaquesDuTemplate(template));
    setRecherche('');
  };

  const ajouterAttaque = () => setAttaques((liste) => [...liste, { id: nouvelId(), name: '' }]);
  const modifierAttaque = (id: string, patch: Partial<CombatantAttack>) =>
    setAttaques((liste) => liste.map((attaque) => (attaque.id === id ? { ...attaque, ...patch } : attaque)));
  const retirerAttaque = (id: string) => setAttaques((liste) => liste.filter((attaque) => attaque.id !== id));

  const nomValide = nom.trim().length > 0;
  const pvValide = Number(pv) > 0;
  const pret = nomValide && pvValide;

  const valider = () => {
    if (!pret) return;
    // Une ligne d'attaque ouverte sans nom n'est pas une attaque : elle ne
    // part pas avec le reste, plutôt que d'afficher une carte muette au MJ
    // en pleine partie.
    const attaquesNommees = attaques.filter((attaque) => attaque.name.trim().length > 0);
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
      ...(attaquesNommees.length > 0 ? { attacks: attaquesNommees } : {}),
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

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 18 }}>
          <label className="lbl" style={{ flexGrow: 1 }}>Attaques (facultatif)</label>
          <button
            onClick={ajouterAttaque}
            className="lbl"
            style={{
              minHeight: 32, padding: '0 10px', borderRadius: 999,
              border: '1px solid var(--accent)', color: 'var(--accent)', fontWeight: 700,
            }}
          >
            + Ajouter
          </button>
        </div>
        <div className="lbl" style={{ textTransform: 'none', marginTop: 3, color: 'var(--muted)' }}>
          À lire à la table, jamais à jouer pour toi : les dégâts restent une
          formule, tu les jettes toi-même.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          {attaques.map((attaque) => (
            <div key={attaque.id} className="card" style={{
              padding: '10px 12px', borderRadius: 'var(--radius)',
              border: '1px solid var(--line)', background: 'var(--surface)',
            }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={attaque.name}
                  onChange={(event) => modifierAttaque(attaque.id, { name: event.target.value })}
                  placeholder="Morsure, Griffe, Coup de bec…"
                  autoComplete="off"
                  style={{ ...champ, flexGrow: 1, marginTop: 0 }}
                />
                <button
                  onClick={() => retirerAttaque(attaque.id)}
                  aria-label={`Retirer l’attaque ${attaque.name || 'sans nom'}`}
                  style={{
                    flexShrink: 0, width: 'var(--tap)', height: 'var(--tap)', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--line)', color: 'var(--muted)', fontSize: 16,
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  type="number" inputMode="numeric"
                  value={attaque.toHit ?? ''}
                  onChange={(event) => modifierAttaque(attaque.id, {
                    toHit: event.target.value === '' ? undefined : Number(event.target.value),
                  })}
                  placeholder="+ toucher"
                  style={{ ...champ, marginTop: 0, width: 90 }}
                />
                <input
                  value={attaque.damage ?? ''}
                  onChange={(event) => modifierAttaque(attaque.id, { damage: event.target.value })}
                  placeholder="Dégâts, ex. 1d6+2"
                  autoComplete="off"
                  style={{ ...champ, marginTop: 0, flexGrow: 1 }}
                />
                <input
                  value={attaque.damageType ?? ''}
                  onChange={(event) => modifierAttaque(attaque.id, { damageType: event.target.value })}
                  placeholder="Type"
                  autoComplete="off"
                  style={{ ...champ, marginTop: 0, width: 110 }}
                />
              </div>
              <input
                value={attaque.detail ?? ''}
                onChange={(event) => modifierAttaque(attaque.id, { detail: event.target.value })}
                placeholder="Effet annexe (facultatif) — « cible M ou moins à terre »…"
                autoComplete="off"
                style={{ ...champ, marginTop: 8 }}
              />
            </div>
          ))}
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
