import { useState } from 'react';
import { AddAdversaryDialog, attaquesDuTemplate, caracteristiquesDuTemplate, competencesDuTemplate, dexModOf, maitriseDuTemplate, sauvegardesDuTemplate } from './AddAdversaryDialog';
import { PHB_CREATURES, type CreatureTemplate } from '../content/creatures';
import {
  budgetDeRencontre, creaturesHostiles, evaluerRencontre, LEVIERS_DE_SCENE,
  SENS_DIFFICULTE, suggererComposition, THEMES_RENCONTRE, xpDuFP,
  type Difficulte, type EvaluationRencontre,
} from '../domain/encounter-generator';
import type { StoredEncounterTemplate } from '../sync/campaign-sync';
import { dupliquerCombatant, withDistinctNames, type Combatant } from '../domain/encounter';
import { TAB_BAR_CLEARANCE } from './TabBar';
import { DangersDuDecor } from './DangersDuDecor';

/**
 * Rencontres préparées à l'avance.
 *
 * Composer un combat avant la table, et le déclencher d'un geste au bon
 * moment — que les joueurs soient en train de se faire écraser et méritent
 * du répit, ou l'inverse. Un sac de créatures nommé, rien de plus : ni
 * initiative ni tour, ça n'existe qu'une fois lancé (voir `GmCombatScreen`).
 *
 * Réutilise `AddAdversaryDialog` tel quel pour composer la liste — c'est le
 * même geste que d'ajouter un adversaire en pleine partie, juste rangé pour
 * plus tard plutôt qu'envoyé directement dans la rencontre en cours.
 */

const nouvelId = () => `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function ResumeCombattants({ combatants }: { combatants: Combatant[] }) {
  // Regroupe les homonymes en un seul mot : « 3 Gobelin » se lit d'un coup
  // d'œil, « Gobelin, Gobelin, Gobelin » se compte.
  const comptes = new Map<string, number>();
  for (const combatant of combatants) {
    const base = combatant.name.replace(/ \d+$/, '');
    comptes.set(base, (comptes.get(base) ?? 0) + 1);
  }
  const resume = [...comptes.entries()].map(([nom, n]) => (n > 1 ? `${n} ${nom}` : nom)).join(' · ');
  return (
    <div className="lbl" style={{ textTransform: 'none', color: 'var(--muted)', marginTop: 3 }}>
      {resume || 'Aucune créature'}
    </div>
  );
}

/** Même conversion modèle → combattant que « Ajouter un adversaire », pour un lot généré d'un coup. */
const combattantDepuisTemplate = (template: CreatureTemplate): Combatant => ({
  id: nouvelId(),
  name: template.name,
  side: 'creature',
  initiative: 0,
  dexterity: dexModOf(template) ?? 0,
  maxHp: template.hp,
  damageTaken: 0,
  temporaryHp: 0,
  armorClass: template.ac,
  conditions: [],
  ...(attaquesDuTemplate(template).length > 0 ? { attacks: attaquesDuTemplate(template) } : {}),
  ...(Object.keys(caracteristiquesDuTemplate(template)).length > 0 ? { abilities: caracteristiquesDuTemplate(template) } : {}),
  proficiencyBonus: maitriseDuTemplate(template),
  ...(Object.keys(sauvegardesDuTemplate(template)).length > 0 ? { savingThrows: sauvegardesDuTemplate(template) } : {}),
  ...(Object.keys(competencesDuTemplate(template)).length > 0 ? { skills: competencesDuTemplate(template) } : {}),
});

const DIFFICULTES: [Difficulte, string][] = [['faible', 'Faible'], ['moderee', 'Modérée'], ['elevee', 'Élevée']];

/**
 * Suggère une composition homogène dans le budget du DMG 2024 (niveaux 1 à
 * 20, toute la table du Guide). Ajoute au lot en cours — n'y touche jamais tant
 * que le MJ n'a pas cliqué : la répartition fine (chef + sbires, embuscade…)
 * reste à lui, une case à cocher ne sait pas lire une scène.
 */
function SuggestionAutomatique({ groupe, onGenerer }: {
  /**
   * Le vrai groupe, en valeur de départ. Les deux cases restent MODIFIABLES —
   * un MJ prépare parfois pour un joueur de plus, ou pour trois niveaux plus
   * tard — mais elles ne partent plus d'un « 4 personnages de niveau 2 »
   * inventé, qui contredisait la jauge de difficulté juste en dessous.
   */
  groupe: { niveau: number; taille: number };
  onGenerer: (combatants: Combatant[]) => void;
}) {
  const [niveau, setNiveau] = useState(String(groupe.niveau || 2));
  const [taille, setTaille] = useState(String(groupe.taille || 4));
  const [difficulte, setDifficulte] = useState<Difficulte>('moderee');
  const [theme, setTheme] = useState<string | null>(null);

  const budget = budgetDeRencontre(Number(niveau), Number(taille), difficulte);
  const themeIntrouvable = theme !== null && !PHB_CREATURES.some((creature) => creature.theme?.includes(theme));

  const generer = () => {
    if (!budget) return;
    const composition = suggererComposition(budget, PHB_CREATURES, Math.random, theme);
    if (composition.length === 0) return;
    onGenerer(withDistinctNames(composition.map(combattantDepuisTemplate)));
  };

  return (
    <div style={{
      marginTop: 14, padding: '11px 12px', borderRadius: 'var(--radius)',
      border: '1px dashed var(--gold-dim)',
    }}>
      <div className="lbl" style={{ marginBottom: 8 }}>Suggestion automatique (facultatif)</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label className="lbl" htmlFor="niveau-groupe">Niveau du groupe</label>
          <input
            id="niveau-groupe" type="number" inputMode="numeric" min={1} max={5}
            value={niveau} onChange={(event) => setNiveau(event.target.value)}
            style={{
              width: '100%', minHeight: 'var(--tap)', marginTop: 4, padding: '0 10px',
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--gold-dim)',
              // 16px ou plus : en dessous, iOS zoome sur le champ à la mise
              // au point, et l'écran reste zoomé après.
              background: 'var(--surface)', color: 'var(--ink)', fontSize: 16,
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className="lbl" htmlFor="taille-groupe">Taille du groupe</label>
          <input
            id="taille-groupe" type="number" inputMode="numeric" min={1} max={8}
            value={taille} onChange={(event) => setTaille(event.target.value)}
            style={{
              width: '100%', minHeight: 'var(--tap)', marginTop: 4, padding: '0 10px',
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--gold-dim)',
              // 16px ou plus : en dessous, iOS zoome sur le champ à la mise
              // au point, et l'écran reste zoomé après.
              background: 'var(--surface)', color: 'var(--ink)', fontSize: 16,
            }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        {DIFFICULTES.map(([clef, libelle]) => (
          <button
            key={clef}
            onClick={() => setDifficulte(clef)}
            className="lbl"
            style={{
              flex: 1, minHeight: 32, borderRadius: 999,
              background: difficulte === clef ? 'var(--accent)' : 'transparent',
              color: difficulte === clef ? 'var(--accent-ink)' : 'var(--muted)',
              border: difficulte === clef ? 'none' : '1px solid var(--gold-dim)', fontWeight: 700,
            }}
          >
            {libelle}
          </button>
        ))}
      </div>

      <label className="lbl" style={{ display: 'block', marginTop: 10 }}>Genre de rencontre</label>
      <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
        {[[null, 'Aléatoire'] as [null, string], ...THEMES_RENCONTRE].map(([clef, libelle]) => (
          <button
            key={clef ?? 'aleatoire'}
            onClick={() => setTheme(clef)}
            className="lbl"
            style={{
              minHeight: 30, padding: '0 10px', borderRadius: 999,
              background: theme === clef ? 'var(--accent)' : 'transparent',
              color: theme === clef ? 'var(--accent-ink)' : 'var(--muted)',
              border: theme === clef ? 'none' : '1px solid var(--gold-dim)', fontWeight: 700,
            }}
          >
            {libelle}
          </button>
        ))}
      </div>

      {budget === null ? (
        <div className="lbl" style={{ textTransform: 'none', color: 'var(--muted)', marginTop: 8 }}>
          Le Guide s’arrête au niveau 20.
        </div>
      ) : themeIntrouvable ? (
        <div className="lbl" style={{ textTransform: 'none', color: 'var(--muted)', marginTop: 8 }}>
          Aucune créature de ce genre dans le bestiaire.
        </div>
      ) : (
        <div className="lbl" style={{ textTransform: 'none', color: 'var(--muted)', marginTop: 8 }}>
          Budget : {budget} PX
        </div>
      )}
      <button
        onClick={generer}
        disabled={budget === null || themeIntrouvable}
        style={{
          width: '100%', minHeight: 'var(--tap)', marginTop: 10, borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--accent)', color: 'var(--accent)', fontSize: 13, fontWeight: 700,
          opacity: budget === null || themeIntrouvable ? 0.4 : 1,
        }}
      >
        Générer
      </button>
    </div>
  );
}

/** L'étiquette et la couleur d'une bande de difficulté. */
const BANDE: Record<Difficulte | 'au-dela' | 'aucune', { label: string; couleur: string }> = {
  aucune: { label: 'vide', couleur: 'var(--muted)' },
  faible: { label: 'faible', couleur: 'var(--ok)' },
  moderee: { label: 'modérée', couleur: 'var(--gold-bright)' },
  elevee: { label: 'élevée', couleur: 'var(--accent)' },
  'au-dela': { label: 'au-delà', couleur: 'var(--vital)' },
};

/**
 * La difficulté de ce qu'on est en train de composer, en direct.
 *
 * C'est le geste que fait vraiment un MJ : il pose trois gobelins et un chef
 * parce que la scène le demande, PUIS il se demande si ça va tuer quelqu'un.
 * Le générateur automatique répond à l'autre question, plus rare — et il
 * obligeait à choisir sa difficulté AVANT de savoir ce qu'on allait mettre.
 *
 * Le niveau et la taille du groupe ne se saisissent pas : l'appli connaît les
 * fiches. Un MJ qui doit retaper « 3 joueurs de niveau 2 » à chaque rencontre
 * finit par ne plus s'en servir.
 */
function JaugeDeDifficulte({ evaluation, niveau, taille, sansProfil }: {
  evaluation: EvaluationRencontre;
  niveau: number;
  taille: number;
  /** Créatures saisies à la main, sans modèle du bestiaire : leur FP est inconnu. */
  sansProfil: number;
}) {
  const { xp, budgets, difficulte, avertissements } = evaluation;
  const bande = difficulte ? BANDE[difficulte] : null;

  return (
    <div className="card" style={{ marginTop: 14, padding: '11px 13px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div className="lbl" style={{ flexGrow: 1, fontSize: 9 }}>
          Difficulté · {taille} joueur{taille > 1 ? 's' : ''} de niveau {niveau}
        </div>
        <div className="num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold-bright)' }}>
          {xp} PX
        </div>
      </div>

      {budgets && bande ? (
        <>
          <div className="ttl" style={{ marginTop: 4, fontSize: 18, color: bande.couleur }}>
            {bande.label}
          </div>

          {/* Les trois seuils, à l'échelle : c'est la POSITION dans la bande
              qui dit s'il reste de la marge, pas le seul nom de la bande. */}
          <div style={{ marginTop: 9 }}>
            <div style={{
              height: 6, borderRadius: 999, overflow: 'hidden', display: 'flex',
              background: 'rgba(0,0,0,.45)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,.8), 0 0 0 1px rgba(150,116,58,.25)',
            }}>
              <div style={{
                width: `${Math.min(100, (xp / budgets.elevee) * 100)}%`,
                background: bande.couleur, boxShadow: `0 0 8px -1px ${bande.couleur}`,
              }} />
            </div>
            <div style={{ display: 'flex', marginTop: 4 }}>
              {(['faible', 'moderee', 'elevee'] as const).map((clef) => (
                <div key={clef} style={{ flex: 1, textAlign: clef === 'faible' ? 'left' : clef === 'elevee' ? 'right' : 'center' }}>
                  <span className="lbl" style={{ fontSize: 8 }}>{BANDE[clef].label} </span>
                  <span className="num" style={{ fontSize: 10, color: 'var(--muted)' }}>{budgets[clef]}</span>
                </div>
              ))}
            </div>
          </div>

          {difficulte !== 'aucune' && (
            <p style={{ margin: '9px 0 0', fontSize: 12, lineHeight: 1.45, color: 'var(--muted)' }}>
              {SENS_DIFFICULTE[difficulte === 'au-dela' || difficulte === null ? 'elevee' : difficulte]}
            </p>
          )}
        </>
      ) : (
        <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--muted)' }}>
          Aucune fiche de joueur dans la campagne : impossible de calculer un budget.
        </p>
      )}

      {sansProfil > 0 && (
        <p style={{ margin: '8px 0 0', fontSize: 11.5, lineHeight: 1.45, color: 'var(--muted)' }}>
          {sansProfil} créature{sansProfil > 1 ? 's' : ''} saisie{sansProfil > 1 ? 's' : ''} à la main,
          sans profil du bestiaire : son facteur de puissance est inconnu, elle ne compte pas dans le total.
        </p>
      )}

      {avertissements.map((avertissement) => (
        <div
          key={avertissement.texte}
          style={{
            marginTop: 9, padding: '7px 9px', borderRadius: 8,
            background: 'rgba(0,0,0,.3)',
            boxShadow: `0 0 0 1px ${avertissement.gravite === 'danger' ? 'var(--vital)' : 'var(--gold-dim)'}`,
            fontSize: 11.5, lineHeight: 1.45,
            color: avertissement.gravite === 'danger' ? 'var(--vital)' : 'var(--muted)',
          }}
        >
          {avertissement.texte}
        </div>
      ))}
    </div>
  );
}

/**
 * Les leviers de scène du Guide du Maître, dépliables sous la jauge.
 *
 * Ils sont là parce que c'est le seul autre levier que le livre met en face
 * du budget : deux gobelins sur un balcon coûtent exactement le même nombre
 * de PX que deux gobelins dans un couloir vide, et ne jouent pas pareil. Au
 * moment où on compose, pas rangés dans un écran de règles qu'on n'ouvre
 * jamais.
 */
function LeviersDeScene({ niveau }: { niveau: number }) {
  const [ouvert, setOuvert] = useState(false);
  const [dangersOuverts, setDangersOuverts] = useState(false);
  return (
    <div style={{ marginTop: 10 }}>
      <button
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
        style={{ display: 'flex', alignItems: 'center', gap: 7, minHeight: 34, color: 'var(--gold)' }}
      >
        <span className="lbl" style={{ fontSize: 9, color: 'inherit' }}>
          Rendre la scène intéressante
        </span>
        <span aria-hidden style={{ fontSize: 10 }}>{ouvert ? '▲' : '▼'}</span>
      </button>
      {ouvert && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 4 }}>
          {LEVIERS_DE_SCENE.map((levier) => (
            <div key={levier.titre} className="card" style={{ padding: '8px 11px' }}>
              <div className="ttl" style={{ fontSize: 13 }}>{levier.titre}</div>
              <div style={{ fontSize: 11.5, lineHeight: 1.45, color: 'var(--muted)', marginTop: 2 }}>
                {levier.texte}
              </div>
              {/* Le levier « danger du décor » était le seul du lot à ne
                  renvoyer à rien : un conseil qui dit d'y penser sans aider à
                  le faire. Il ouvre maintenant les dangers du Guide, filtrés
                  sur le niveau du groupe. */}
              {levier.titre === 'Un danger du décor' && (
                <button
                  onClick={() => setDangersOuverts(true)}
                  className="jg-btn-cold"
                  style={{ marginTop: 8, minHeight: 34, padding: '0 12px', borderRadius: 9, fontSize: 12, fontWeight: 700 }}
                >
                  Voir les dangers et les pièges
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {dangersOuverts && <DangersDuDecor niveau={niveau} onFermer={() => setDangersOuverts(false)} />}
    </div>
  );
}

function NouvelleRencontre({ modele, groupe, onEnregistrer, onFermer }: {
  /** Présent en édition : préremplit le formulaire avec une rencontre déjà enregistrée. */
  modele?: StoredEncounterTemplate;
  /** Le vrai groupe de la campagne — jamais saisi à la main (voir `JaugeDeDifficulte`). */
  groupe: { niveau: number; taille: number };
  onEnregistrer: (name: string, combatants: Combatant[]) => void;
  onFermer: () => void;
}) {
  const [nom, setNom] = useState(modele?.name ?? '');
  const [combatants, setCombatants] = useState<Combatant[]>(modele?.combatants ?? []);
  const [ajoutEnCours, setAjoutEnCours] = useState(false);

  /**
   * Ce qui compte dans le budget : les créatures hostiles QUI VIENNENT DU
   * BESTIAIRE. Une créature tapée à la main n'a pas de facteur de puissance,
   * donc pas de coût en PX — on ne l'invente pas, on dit qu'elle manque.
   */
  const hostiles = creaturesHostiles(combatants);
  const profils = hostiles
    .map((combatant) => PHB_CREATURES.find((creature) => creature.id === combatant.templateId))
    .filter((creature): creature is CreatureTemplate => Boolean(creature));
  const sansProfil = hostiles.length - profils.length;
  const evaluation = evaluerRencontre(profils, groupe.niveau, groupe.taille);

  const ajouter = (combatant: Omit<Combatant, 'id'>) => {
    setCombatants((liste) => withDistinctNames([...liste, { ...combatant, id: nouvelId() }]));
    setAjoutEnCours(false);
  };
  const retirer = (id: string) => setCombatants((liste) => liste.filter((c) => c.id !== id));
  const dupliquer = (combatant: Combatant) =>
    setCombatants((liste) => withDistinctNames([...liste, { ...dupliquerCombatant(combatant), id: nouvelId() }]));

  const nomValide = nom.trim().length > 0;
  const pret = nomValide && combatants.length > 0;

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
        <h2 className="ttl" style={{ margin: 0, fontSize: 18, flexGrow: 1 }}>
          {modele ? 'Modifier la rencontre' : 'Nouvelle rencontre'}
        </h2>
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
        <label className="lbl" htmlFor="nom-rencontre">Nom</label>
        <input
          id="nom-rencontre" value={nom} onChange={(event) => setNom(event.target.value)}
          placeholder="Embuscade du pont, Repaire gobelin…" autoComplete="off"
          style={{
            width: '100%', minHeight: 'var(--tap)', marginTop: 6,
            padding: '0 12px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--gold-dim)', background: 'var(--surface)',
            color: 'var(--ink)', fontSize: 16,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 18 }}>
          <label className="lbl" style={{ flexGrow: 1 }}>Créatures</label>
          <button
            onClick={() => setAjoutEnCours(true)}
            className="lbl"
            style={{
              minHeight: 32, padding: '0 10px', borderRadius: 999,
              border: '1px solid var(--accent)', color: 'var(--accent)', fontWeight: 700,
            }}
          >
            + Ajouter
          </button>
        </div>

        <SuggestionAutomatique
          groupe={groupe}
          onGenerer={(suggestion) => setCombatants((liste) => withDistinctNames([...liste, ...suggestion]))}
        />

        <JaugeDeDifficulte
          evaluation={evaluation}
          niveau={groupe.niveau}
          taille={groupe.taille}
          sansProfil={sansProfil}
        />
        <LeviersDeScene niveau={groupe.niveau} />

        {combatants.length === 0 ? (
          <div className="lbl" style={{ textTransform: 'none', color: 'var(--muted)', marginTop: 8 }}>
            Aucune pour l’instant — ajoute-en depuis le bestiaire ou à la main.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {combatants.map((combatant) => (
              <div key={combatant.id} className="card" style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
              }}>
                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{combatant.name}</div>
                  <div className="lbl" style={{ textTransform: 'none', marginTop: 2, color: 'var(--muted)' }}>
                    CA {combatant.armorClass} · {combatant.maxHp} PV
                  </div>
                </div>
                <button
                  onClick={() => dupliquer(combatant)}
                  aria-label={`Dupliquer ${combatant.name}`}
                  title="Dupliquer"
                  style={{
                    flexShrink: 0, width: 'var(--tap)', height: 'var(--tap)', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--gold-dim)', color: 'var(--muted)', fontSize: 16,
                  }}
                >
                  ⧉
                </button>
                <button
                  onClick={() => retirer(combatant.id)}
                  aria-label={`Retirer ${combatant.name}`}
                  style={{
                    flexShrink: 0, width: 'var(--tap)', height: 'var(--tap)', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--gold-dim)', color: 'var(--muted)', fontSize: 16,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => pret && onEnregistrer(nom.trim(), combatants)}
          disabled={!pret}
          style={{
            width: '100%', minHeight: 52, marginTop: 20, borderRadius: 'var(--radius-sm)',
            background: pret ? 'var(--accent)' : 'var(--surface)',
            color: pret ? 'var(--accent-ink)' : 'var(--muted)',
            border: pret ? 'none' : '1px solid var(--gold-dim)',
            fontSize: 15, fontWeight: 700, cursor: pret ? 'pointer' : 'not-allowed',
          }}
        >
          {!nomValide ? 'Donne-lui un nom' : combatants.length === 0 ? 'Ajoute au moins une créature'
            : modele ? 'Enregistrer les modifications' : 'Enregistrer la rencontre'}
        </button>
      </div>

      {ajoutEnCours && <AddAdversaryDialog onAjouter={ajouter} onFermer={() => setAjoutEnCours(false)} />}
    </div>
  );
}

export function PreparedEncountersScreen({ templates, groupe, onCreer, onModifier, onSupprimer, onDeclencher }: {
  /**
   * Le groupe réel de la campagne, calculé sur les fiches (voir `App`) : son
   * niveau moyen et son effectif. C'est ce qui permet à la jauge de
   * difficulté de ne rien demander au MJ — il connaît déjà sa table, l'appli
   * aussi, et le lui faire retaper à chaque rencontre est le meilleur moyen
   * qu'il cesse de s'en servir.
   */
  groupe: { niveau: number; taille: number };
  templates: StoredEncounterTemplate[];
  onCreer: (name: string, combatants: Combatant[]) => void;
  onModifier: (id: string, name: string, combatants: Combatant[]) => void;
  onSupprimer: (id: string) => void;
  /** Copie les créatures du modèle dans la rencontre en cours. */
  onDeclencher: (combatants: Combatant[]) => void;
}) {
  // `'nouvelle'` pour une création, une rencontre existante pour l'édition, `null` pour rien d'ouvert.
  const [edition, setEdition] = useState<StoredEncounterTemplate | 'nouvelle' | null>(null);

  return (
    <div style={{ paddingBottom: TAB_BAR_CLEARANCE }}>
      <div style={{ padding: '14px 16px 0' }}>
        <button
          onClick={() => setEdition('nouvelle')}
          style={{
            width: '100%', minHeight: 'var(--tap)', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--accent)', color: 'var(--accent)', fontSize: 14, fontWeight: 700,
          }}
        >
          + Nouvelle rencontre
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="lbl" style={{ textTransform: 'none', color: 'var(--muted)', padding: '18px 16px' }}>
          Aucune rencontre préparée. Compose-en une à l’avance, tu la déclencheras d’un geste le moment venu.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 16px' }}>
          {templates.map((template) => (
            <div key={template.id} className="card" style={{
              padding: '12px 14px',
            }}>
              <div className="ttl" style={{ fontSize: 15 }}>{template.name}</div>
              <ResumeCombattants combatants={template.combatants} />
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  onClick={() => onDeclencher(template.combatants.map((combatant) => ({ ...combatant, id: nouvelId() })))}
                  disabled={template.combatants.length === 0}
                  style={{
                    flexGrow: 1, minHeight: 'var(--tap)', borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent)', color: 'var(--accent-ink)', fontSize: 14, fontWeight: 700,
                    opacity: template.combatants.length === 0 ? 0.4 : 1,
                  }}
                >
                  Déclencher
                </button>
                <button
                  onClick={() => setEdition(template)}
                  aria-label={`Modifier la rencontre ${template.name}`}
                  style={{
                    flexShrink: 0, minHeight: 'var(--tap)', padding: '0 14px',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--gold-dim)', color: 'var(--muted)', fontSize: 13,
                  }}
                >
                  Modifier
                </button>
                <button
                  onClick={() => onSupprimer(template.id)}
                  aria-label={`Supprimer la rencontre ${template.name}`}
                  style={{
                    flexShrink: 0, minHeight: 'var(--tap)', padding: '0 14px',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--gold-dim)', color: 'var(--muted)', fontSize: 13,
                  }}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {edition && (
        <NouvelleRencontre
          modele={edition === 'nouvelle' ? undefined : edition}
          groupe={groupe}
          onEnregistrer={(name, combatants) => {
            if (edition === 'nouvelle') onCreer(name, combatants);
            else onModifier(edition.id, name, combatants);
            setEdition(null);
          }}
          onFermer={() => setEdition(null)}
        />
      )}
    </div>
  );
}
