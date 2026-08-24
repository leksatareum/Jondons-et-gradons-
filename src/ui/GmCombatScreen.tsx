import { useMemo, useState } from 'react';
import {
  activeCombatant, addCombatant, applyDamage, applyHealing, beginEncounter, endEncounter, isDown,
  isRunning, nextTurn, orderedCombatants, previousTurn, remainingHp, replaceCombatant,
  type Combatant, type EncounterState,
} from '../domain/encounter';
import { basculerEtat, etatsActifs, etatsDe } from '../model/etats';
import { InitiativeDialog } from './InitiativeDialog';
import { AddAdversaryDialog } from './AddAdversaryDialog';
import { ABILITY_ABBREVIATIONS, ABILITY_ORDER } from '../content/character-basics';

/**
 * Écran de combat du MJ.
 *
 * Le joueur consulte une fiche ; le MJ pilote une liste. La structure est donc
 * délibérément différente de `CombatScreen` — seul le langage visuel est
 * partagé.
 *
 * Trois partis pris, contre les frictions classiques de la gestion de combat :
 *
 * 1. **La liste d'initiative EST l'écran.** Le combattant actif se déplie sur
 *    place, avec ce qu'il faut pour le jouer. Pas de fiche monstre à ouvrir,
 *    pas d'onglet : « suivant » est un seul geste.
 * 2. **Les dégâts se donnent depuis n'importe quelle ligne**, par un pavé qui
 *    remonte sous le pouce, pré-ciblé et portant le nom de la cible — parce
 *    que taper sur le mauvais gobelin est l'erreur la plus courante.
 * 3. **Joueurs et créatures dans la même liste**, comme l'initiative les
 *    ordonne, mais visuellement distincts. Le MJ voit les points de vie des
 *    joueurs en direct : c'est ce qu'un écran connecté apporte de plus qu'une
 *    feuille de papier.
 *
 * Le tour par tour ne s'enclenche QUE lorsque le MJ lance le combat. Tant
 * qu'il ne l'a pas fait, la liste sert de préparation : on ajuste les points
 * de vie, on voit le groupe, mais aucun tour n'est actif et les écrans des
 * joueurs restent en mode fiche.
 */

function HpBar({ combatant }: { combatant: Combatant }) {
  const ratio = combatant.maxHp > 0 ? remainingHp(combatant) / combatant.maxHp : 0;
  // Les PV temporaires prolongent la barre au-delà du plein : ils absorbent
  // avant les PV, donc les masquer sous-estime la marge réelle.
  const tempRatio = combatant.maxHp > 0
    ? Math.min(1 - Math.min(1, ratio), combatant.temporaryHp / combatant.maxHp)
    : 0;
  // Le rouge n'apparaît qu'en dessous de la moitié : il garde son sens d'alerte.
  const color = ratio > 0.5 ? 'var(--ok)' : ratio > 0 ? 'var(--accent)' : 'var(--vital)';
  return (
    <div style={{ height: 4, borderRadius: 3, background: 'var(--line)', overflow: 'hidden', display: 'flex' }}>
      <div style={{ width: `${Math.max(0, Math.min(1, ratio)) * 100}%`, background: color }} />
      {tempRatio > 0 && (
        <div style={{ width: `${tempRatio * 100}%`, background: 'var(--ok)', opacity: 0.55 }} />
      )}
    </div>
  );
}

/** Bonus signé, à la française : « +5 », « −2 », jamais un nu « 0 » ambigu. */
const avecSigne = (bonus: number): string => (bonus >= 0 ? `+${bonus}` : `−${Math.abs(bonus)}`);

function CombatantRow({ combatant, active, onTarget, onNext, onOpenSheet }: {
  combatant: Combatant;
  /** Vrai seulement quand le combat tourne ET que c'est son tour. */
  active: boolean;
  onTarget: (combatant: Combatant) => void;
  onNext: () => void;
  /** Absent pour une créature : elle n'a pas de fiche à ouvrir. */
  onOpenSheet: (() => void) | null;
}) {
  const down = isDown(combatant);
  const isPlayer = combatant.side === 'joueur';

  return (
    <div
      className="card"
      style={{
        background: active ? 'var(--surface-raised)' : 'var(--surface)',
        border: active ? '1.5px solid var(--accent)' : '1px solid var(--line)',
        borderRadius: 'var(--radius)',
        padding: active ? '13px 14px' : '10px 12px',
        opacity: down ? 0.45 : 1,
      }}
    >
      <button
        onClick={() => onTarget(combatant)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', minHeight: 44 }}
      >
        <div className="num" style={{
          width: 30, textAlign: 'center', fontSize: 15, fontWeight: 700,
          color: active ? 'var(--accent)' : 'var(--muted)',
        }}>
          {combatant.initiative}
        </div>

        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
            <div className="ttl" style={{
              fontSize: active ? 16 : 14,
              textDecoration: down ? 'line-through' : 'none',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {combatant.name}
            </div>
            {isPlayer && <div className="lbl" style={{ fontSize: 9 }}>joueur</div>}
          </div>
          {/* Les noms du livre, pas les identifiants de stockage : « À terre »
              se lit d'un coup d'œil, « a-terre » se déchiffre. */}
          {etatsActifs(combatant.conditions).length > 0 && (
            <div className="lbl" style={{ textTransform: 'none', marginTop: 2, color: 'var(--accent)' }}>
              {etatsActifs(combatant.conditions).map((etat) => etat.name).join(' · ')}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'right', minWidth: 62 }}>
          <div className="num" style={{ fontSize: active ? 19 : 16, fontWeight: 700, lineHeight: 1 }}>
            {remainingHp(combatant)}
            <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>/{combatant.maxHp}</span>
            {combatant.temporaryHp > 0 && (
              <span style={{ fontSize: 12, color: 'var(--ok)', fontWeight: 600 }}> +{combatant.temporaryHp}</span>
            )}
          </div>
          <div className="lbl" style={{ fontSize: 9, marginTop: 2 }}>CA {combatant.armorClass}</div>
        </div>
      </button>

      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flexGrow: 1 }}><HpBar combatant={combatant} /></div>
        {onOpenSheet && (
          <button
            onClick={onOpenSheet}
            aria-label={`Ouvrir la fiche de ${combatant.name}`}
            className="lbl"
            style={{
              flexShrink: 0, minHeight: 32, padding: '0 10px', borderRadius: 999,
              border: '1px solid var(--line)', color: 'var(--muted)',
            }}
          >
            Fiche →
          </button>
        )}
      </div>

      {/*
        Les attaques d'une créature, à lire quand vient son tour — jamais à
        jouer pour elle. Une ligne compacte tout le temps, pour repérer d'un
        coup d'œil qui frappe fort ; le détail (type de dégâts, effet annexe)
        n'apparaît que sur la ligne active, pour ne pas noyer la liste.
      */}
      {combatant.attacks && combatant.attacks.length > 0 && (
        <div style={{ marginTop: active ? 8 : 4, display: 'flex', flexDirection: 'column', gap: active ? 4 : 0 }}>
          {combatant.attacks.map((attaque) => (
            <div key={attaque.id} className="lbl" style={{ textTransform: 'none', color: 'var(--muted)' }}>
              <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{attaque.name}</strong>
              {attaque.toHit !== undefined && ` +${attaque.toHit}`}
              {attaque.damage && ` · ${attaque.damage}${attaque.damageType ? ` ${attaque.damageType}` : ''}`}
              {active && attaque.detail && <span> — {attaque.detail}</span>}
            </div>
          ))}
        </div>
      )}

      {/*
        Sauvegardes et compétences : ce qu'on lit quand un joueur force un
        test sur la créature, pas seulement quand elle agit — donc affiché en
        permanence, pas réservé à la ligne active, contrairement aux
        caractéristiques brutes (rarement nécessaires) ci-dessous.
      */}
      {((combatant.savingThrows && Object.keys(combatant.savingThrows).length > 0)
        || (combatant.skills && Object.keys(combatant.skills).length > 0)) && (
        <div className="lbl" style={{ textTransform: 'none', color: 'var(--muted)', marginTop: 4 }}>
          {combatant.savingThrows && Object.keys(combatant.savingThrows).length > 0 && (
            <div>
              Sauvegardes : {ABILITY_ORDER
                .filter((ability) => combatant.savingThrows?.[ability] !== undefined)
                .map((ability) => `${ABILITY_ABBREVIATIONS[ability]} ${avecSigne(combatant.savingThrows![ability]!)}`)
                .join(', ')}
            </div>
          )}
          {combatant.skills && Object.keys(combatant.skills).length > 0 && (
            <div>
              Compétences : {Object.entries(combatant.skills)
                .map(([nom, bonus]) => `${nom} ${avecSigne(bonus)}`)
                .join(', ')}
            </div>
          )}
        </div>
      )}

      {active && (combatant.abilities || combatant.proficiencyBonus !== undefined) && (
        <div className="lbl" style={{ textTransform: 'none', color: 'var(--muted)', marginTop: 4 }}>
          {combatant.abilities && ABILITY_ORDER
            .filter((ability) => combatant.abilities?.[ability] !== undefined)
            .map((ability) => `${ABILITY_ABBREVIATIONS[ability]} ${combatant.abilities![ability]}`)
            .join(' · ')}
          {combatant.proficiencyBonus !== undefined && (combatant.abilities ? ' — ' : '')}
          {combatant.proficiencyBonus !== undefined && `Maîtrise ${avecSigne(combatant.proficiencyBonus)}`}
        </div>
      )}

      {active && (
        <button
          onClick={onNext}
          style={{
            marginTop: 11, width: '100%', minHeight: 'var(--tap)', borderRadius: 10,
            background: 'var(--accent)', color: 'var(--accent-ink)', fontSize: 13, fontWeight: 700,
          }}
        >
          Suivant
        </button>
      )}
    </div>
  );
}

function DamagePad({ target, onApply, onBasculerEtat, onClose }: {
  target: Combatant;
  onApply: (amount: number, mode: 'degats' | 'soins') => void;
  /** Pose ou retire un état, sans confirmation : c'est un aller-retour. */
  onBasculerEtat: (id: string) => void;
  onClose: () => void;
}) {
  const [entry, setEntry] = useState('');
  const amount = Number(entry || 0);
  const press = (key: string) =>
    setEntry((current) => (key === '←' ? current.slice(0, -1) : (current + key).slice(0, 3)));

  const send = (mode: 'degats' | 'soins') => {
    if (amount > 0) onApply(amount, mode);
    setEntry('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10, background: 'rgb(0 0 0 / 0.55)',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      <button onClick={onClose} aria-label="Fermer" style={{ flexGrow: 1 }} />
      <div style={{
        background: 'var(--surface)', borderTop: '1px solid var(--line)',
        borderRadius: '16px 16px 0 0', padding: '14px 14px 0',
        paddingBottom: 'calc(14px + env(safe-area-inset-bottom))',
      }}>
        {/* Le nom de la cible reste sous les yeux : se tromper de gobelin est
            l'erreur la plus fréquente, et la plus pénible à défaire. */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <div className="ttl" style={{ fontSize: 16, flexGrow: 1 }}>{target.name}</div>
          <div className="num" style={{ fontSize: 15, color: 'var(--muted)' }}>
            {remainingHp(target)}/{target.maxHp}
          </div>
        </div>

        <div style={{
          textAlign: 'center', padding: '9px 0 13px',
          fontSize: 34, fontWeight: 700, lineHeight: 1,
          color: entry ? 'var(--ink)' : 'var(--muted)',
        }} className="num">
          {entry || '0'}
        </div>

        {/* ───── États ─────
            Au-dessus du pavé : un état se pose d'un appui, sans nombre à
            taper. Les poser sur le COMBATTANT plutôt que sur la fiche du
            joueur, c'est passer par la rencontre — déjà synchronisée en temps
            réel vers tous les écrans. */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
          {etatsDe(target.conditions).map((etat) => (
            <button
              key={etat.id}
              onClick={() => onBasculerEtat(etat.id)}
              title={etat.effet.note}
              aria-pressed={etat.actif}
              className="lbl"
              style={{
                minHeight: 32, padding: '0 10px', borderRadius: 999, textTransform: 'none',
                border: `1px solid ${etat.actif ? 'var(--accent)' : 'var(--line)'}`,
                background: etat.actif ? 'var(--accent-wash)' : 'transparent',
                color: etat.actif ? 'var(--accent)' : 'var(--muted)',
                fontWeight: etat.actif ? 700 : 600,
              }}
            >
              {etat.name}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '00', '←'].map((key) => (
            <button
              key={key}
              onClick={() => press(key)}
              style={{
                minHeight: 52, borderRadius: 10, background: 'var(--surface-raised)',
                border: '1px solid var(--line)', fontSize: 18, fontWeight: 600,
              }}
            >
              {key}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, margin: '11px 0 14px' }}>
          <button
            onClick={() => send('degats')}
            style={{
              flexGrow: 1, minHeight: 52, borderRadius: 11,
              background: 'var(--vital)', color: 'var(--bg)', fontSize: 14, fontWeight: 700,
            }}
          >
            Dégâts
          </button>
          <button
            onClick={() => send('soins')}
            style={{
              flexGrow: 1, minHeight: 52, borderRadius: 11,
              border: '1.5px solid var(--ok)', color: 'var(--ok)', fontSize: 14, fontWeight: 700,
            }}
          >
            Soins
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * L'écran ne détient pas la rencontre : il la reçoit et signale ce que le MJ
 * en fait. C'est ce qui permet à `App` de l'écrire en base — un `useState`
 * local gardait le geste du MJ dans l'onglet du MJ, et les écrans des joueurs
 * ne basculaient jamais.
 */
export function GmCombatScreen({ state, onChange, onOpenSheet }: {
  state: EncounterState;
  onChange: (suivant: EncounterState) => void;
  /**
   * Ouvre la fiche d'un combattant du groupe. Le MJ y a les mêmes pouvoirs que
   * le joueur — c'est la RLS qui l'y autorise, pas cet écran.
   */
  onOpenSheet?: (combatantId: string) => void;
}) {
  const [targetId, setTargetId] = useState<string | null>(null);
  const [ajoutEnCours, setAjoutEnCours] = useState(false);
  const [initiativesEnCours, setInitiativesEnCours] = useState(false);
  const setState = (suivant: EncounterState | ((courant: EncounterState) => EncounterState)) =>
    onChange(typeof suivant === 'function' ? suivant(state) : suivant);

  const ajouterAdversaire = (combatant: Omit<Combatant, 'id'>) => {
    setState((current) => addCombatant(current, {
      ...combatant,
      id: `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    }));
    setAjoutEnCours(false);
  };

  const ordered = useMemo(() => orderedCombatants(state), [state]);
  const running = isRunning(state);
  const active = activeCombatant(state);
  const target = ordered.find((combatant) => combatant.id === targetId) ?? null;

  /**
   * Un état se pose et se retire d'un appui, sans confirmation : c'est un
   * aller-retour, et se tromper d'état coûte le même geste que le corriger.
   */
  const basculerEtatDeLaCible = (id: string) => {
    if (!target) return;
    setState((current) => replaceCombatant(current, {
      ...target, conditions: basculerEtat(target.conditions, id),
    }));
  };

  /**
   * Les initiatives saisies partent avec le lancement : une seule écriture,
   * donc un seul aller-retour de synchronisation vers les joueurs.
   */
  const lancerAvecInitiatives = (initiatives: Record<string, number>) => {
    setState((current) => beginEncounter({
      ...current,
      combatants: current.combatants.map((combatant) => ({
        ...combatant,
        initiative: initiatives[combatant.id] ?? combatant.initiative,
      })),
    }));
    setInitiativesEnCours(false);
  };

  const apply = (amount: number, mode: 'degats' | 'soins') => {
    if (!target) return;
    const updated = mode === 'degats'
      ? applyDamage(target, amount).combatant
      : applyHealing(target, amount);
    setState((current) => replaceCombatant(current, updated));
  };

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header style={{
        flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--line)',
        boxShadow: 'var(--raise)', padding: '11px 14px 12px',
        paddingTop: 'calc(11px + env(safe-area-inset-top))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            {running ? (
              <>
                <div className="lbl">Round {state.round}</div>
                <div className="ttl" style={{ fontSize: 17, marginTop: 1 }}>{active?.name}</div>
              </>
            ) : (
              <>
                <div className="lbl">Préparation</div>
                <div className="ttl" style={{ fontSize: 17, marginTop: 1 }}>
                  {state.combatants.length} combattants
                </div>
              </>
            )}
          </div>

          {running && (
            <button
              onClick={() => setState(previousTurn)}
              aria-label="Tour précédent"
              style={{
                width: 44, height: 44, borderRadius: 10, border: '1px solid var(--line)',
                display: 'grid', placeItems: 'center',
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}

          <button
            onClick={() => setAjoutEnCours(true)}
            aria-label="Ajouter un adversaire"
            style={{
              width: 44, height: 44, borderRadius: 10, border: '1px solid var(--line)',
              display: 'grid', placeItems: 'center', fontSize: 20, fontWeight: 700,
              color: 'var(--muted)',
            }}
          >
            +
          </button>

          {/* C'est ce bouton, et lui seul, qui met les joueurs en tour par tour.
              Lancer passe d'abord par la saisie des initiatives : sans elle,
              le premier round partait sur l'ordre d'ajout, joueurs à zéro. */}
          <button
            onClick={() => (running ? setState(endEncounter) : setInitiativesEnCours(true))}
            disabled={!running && state.combatants.length === 0}
            style={{
              minHeight: 44, padding: '0 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              background: running ? 'transparent' : 'var(--accent)',
              color: running ? 'var(--muted)' : 'var(--accent-ink)',
              border: running ? '1px solid var(--line)' : 'none',
            }}
          >
            {running ? 'Terminer' : 'Lancer'}
          </button>
        </div>

        {!running && (
          <div className="lbl" style={{ textTransform: 'none', marginTop: 9 }}>
            Les joueurs restent sur leur fiche tant que le combat n'est pas lancé.
          </div>
        )}
      </header>

      <main style={{
        flexGrow: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {ordered.map((combatant) => (
          <CombatantRow
            key={combatant.id}
            combatant={combatant}
            active={active?.id === combatant.id}
            onTarget={(picked) => setTargetId(picked.id)}
            onNext={() => setState(nextTurn)}
            onOpenSheet={onOpenSheet && combatant.side === 'joueur'
              ? () => onOpenSheet(combatant.id) : null}
          />
        ))}
      </main>

      {target && (
        <DamagePad
          target={target}
          onApply={apply}
          onBasculerEtat={basculerEtatDeLaCible}
          onClose={() => setTargetId(null)}
        />
      )}
      {ajoutEnCours && (
        <AddAdversaryDialog onAjouter={ajouterAdversaire} onFermer={() => setAjoutEnCours(false)} />
      )}
      {initiativesEnCours && (
        <InitiativeDialog
          state={state}
          onLancer={lancerAvecInitiatives}
          onFermer={() => setInitiativesEnCours(false)}
        />
      )}
    </div>
  );
}
