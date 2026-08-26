import { useMemo, useState } from 'react';
import {
  activeCombatant, addCombatant, applyDamage, applyHealing, beginEncounter, dupliquerCombatant, endEncounter, isDown,
  isRunning, nextTurn, orderedCombatants, previousTurn, remainingHp, removeAllCreatures, removeCombatant, replaceCombatant,
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

const nouvelId = () => `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

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
    <div style={{ height: 4, borderRadius: 3, background: 'var(--gold-dim)', overflow: 'hidden', display: 'flex' }}>
      <div style={{ width: `${Math.max(0, Math.min(1, ratio)) * 100}%`, background: color }} />
      {tempRatio > 0 && (
        <div style={{ width: `${tempRatio * 100}%`, background: 'var(--ok)', opacity: 0.55 }} />
      )}
    </div>
  );
}

/** Bonus signé, à la française : « +5 », « −2 », jamais un nu « 0 » ambigu. */
const avecSigne = (bonus: number): string => (bonus >= 0 ? `+${bonus}` : `−${Math.abs(bonus)}`);

function CombatantRow({ combatant, active, running, onTarget, onNext, onOpenSheet, concentration }: {
  combatant: Combatant;
  /** Vrai seulement quand le combat tourne ET que c'est son tour. */
  active: boolean;
  /** Le tour par tour est lancé — sans quoi l'initiative n'a rien à ordonner. */
  running: boolean;
  onTarget: (combatant: Combatant) => void;
  onNext: () => void;
  /** Absent pour une créature : elle n'a pas de fiche à ouvrir. */
  onOpenSheet: (() => void) | null;
  /** Le sort en cours de concentration, lu sur la fiche. Absent pour une créature. */
  concentration?: string;
}) {
  const down = isDown(combatant);
  const isPlayer = combatant.side === 'joueur';

  return (
    <div
      className="card"
      style={{
        background: active ? 'var(--surface-raised)' : 'var(--surface)',
        border: active ? '1.5px solid var(--accent)' : '1px solid var(--gold-dim)',
        borderRadius: 'var(--radius)',
        padding: active ? '13px 14px' : '10px 12px',
        opacity: down ? 0.45 : 1,
      }}
    >
      <button
        onClick={() => onTarget(combatant)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', minHeight: 44 }}
      >
        {/* L'initiative n'ordonne rien tant que le tour par tour n'est pas
            lancé — l'afficher hors combat (ou une fois « Terminer » pressé)
            montrerait un chiffre qui n'a plus aucun rôle, restant de la
            dernière bagarre ou de la saisie à l'ajout de l'adversaire. */}
        {running && (
          <div className="num" style={{
            width: 30, textAlign: 'center', fontSize: 15, fontWeight: 700,
            color: active ? 'var(--accent)' : 'var(--muted)',
          }}>
            {combatant.initiative}
          </div>
        )}

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
          {/*
            La concentration, lue sur la fiche : de quoi voir d'un coup d'œil
            que Bec est concentré sur Invisibilité sans avoir à ouvrir sa
            fiche pour le vérifier — utile dès que quelqu'un lui inflige des
            dégâts et qu'il faut se souvenir qu'un jet est en jeu.
          */}
          {concentration && (
            <div className="lbl" style={{ textTransform: 'none', marginTop: 2, color: 'var(--muted)' }}>
              Concentration : {concentration}
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
              border: '1px solid var(--gold-dim)', color: 'var(--muted)',
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

/**
 * Retirer un adversaire, en deux temps : un premier appui l'annonce, un
 * second dans les deux secondes le confirme. Contrairement aux autres
 * suppressions de l'app (un message, une note), celle-ci se passe en pleine
 * bagarre — un appui perdu dans la précipitation ne doit pas faire
 * disparaître le bon adversaire.
 */
function SupprimerCombattant({ nom, onConfirmer }: { nom: string; onConfirmer: () => void }) {
  const [arme, setArme] = useState(false);

  // Un texte gris discret se perdait dans le pavé — repéré par personne. Un
  // vrai bouton, bordé et coloré comme les autres actions destructrices de
  // l'appli, avec la même hauteur de tap que le reste.
  if (!arme) {
    return (
      <button
        onClick={() => setArme(true)}
        style={{
          width: '100%', minHeight: 'var(--tap)', marginBottom: 12,
          borderRadius: 'var(--radius-sm)', border: '1px solid var(--vital)',
          color: 'var(--vital)', fontSize: 14, fontWeight: 700,
        }}
      >
        Retirer {nom} de la rencontre
      </button>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <button
        onClick={onConfirmer}
        style={{
          flexGrow: 1, minHeight: 'var(--tap)', fontWeight: 700, fontSize: 14,
          borderRadius: 'var(--radius-sm)', border: 'none',
          background: 'var(--vital)', color: 'var(--accent-ink)',
        }}
      >
        Confirmer le retrait
      </button>
      <button
        onClick={() => setArme(false)}
        style={{
          minHeight: 'var(--tap)', padding: '0 14px',
          borderRadius: 'var(--radius-sm)', border: '1px solid var(--gold-dim)', color: 'var(--muted)', fontSize: 14,
        }}
      >
        Annuler
      </button>
    </div>
  );
}

/**
 * Bandeau de confirmation pour « Retirer tous les adversaires » : un geste
 * qu'on ne veut surtout pas déclencher par erreur en visant le mauvais
 * bouton d'en-tête — d'où la même mécanique en deux temps que
 * `SupprimerCombattant`, mais en bandeau plutôt qu'en pavé, puisqu'il n'y a
 * pas de cible unique à montrer.
 */
function ConfirmerRetraitTout({ nombre, onConfirmer, onAnnuler }: {
  nombre: number;
  onConfirmer: () => void;
  onAnnuler: () => void;
}) {
  return (
    <div style={{
      flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 14px', background: 'var(--vital)',
    }}>
      <div style={{ flexGrow: 1, fontSize: 13, fontWeight: 700, color: 'var(--accent-ink)' }}>
        Retirer {nombre} adversaire{nombre > 1 ? 's' : ''} ?
      </div>
      <button
        onClick={onConfirmer}
        style={{
          minHeight: 34, padding: '0 14px', borderRadius: 999,
          background: 'var(--accent-ink)', color: 'var(--vital)', fontSize: 13, fontWeight: 700,
        }}
      >
        Confirmer
      </button>
      <button
        onClick={onAnnuler}
        style={{
          minHeight: 34, padding: '0 14px', borderRadius: 999,
          border: '1px solid var(--accent-ink)', color: 'var(--accent-ink)', fontSize: 13, fontWeight: 700,
        }}
      >
        Annuler
      </button>
    </div>
  );
}

function DamagePad({ target, onApply, onBasculerEtat, onDupliquer, onSupprimer, onClose }: {
  target: Combatant;
  onApply: (amount: number, mode: 'degats' | 'soins') => void;
  /** Pose ou retire un état, sans confirmation : c'est un aller-retour. */
  onBasculerEtat: (id: string) => void;
  /** Absent pour un joueur : on ne clone jamais un joueur, seulement un stat-bloc de créature. */
  onDupliquer?: () => void;
  /** Absent pour un joueur : on ne retire jamais un joueur du combat. */
  onSupprimer?: () => void;
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

  // Un joueur porte SES points de vie sur sa fiche (`live.damageTaken`), pas
  // sur ce combattant : `apply()` n'écrirait que sur la copie de la
  // rencontre, sans jamais toucher ce que sa propre fiche affiche — un pavé
  // silencieusement inopérant. « Fiche → » ouvre la fiche, où le MJ a « les
  // mêmes pouvoirs que le joueur » (voir le commentaire d'`onOpenSheet`) :
  // c'est le seul chemin qui écrit au bon endroit.
  const estUnJoueur = target.side === 'joueur';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10, background: 'rgb(0 0 0 / 0.55)',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      <button onClick={onClose} aria-label="Fermer" style={{ flexGrow: 1 }} />
      <div style={{
        background: 'var(--surface)', borderTop: '1px solid var(--gold-dim)',
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

        {onDupliquer && (
          <button
            onClick={() => { onDupliquer(); onClose(); }}
            style={{
              width: '100%', minHeight: 'var(--tap)', marginBottom: 10,
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent)',
              color: 'var(--accent)', fontSize: 14, fontWeight: 700,
            }}
          >
            Dupliquer {target.name}
          </button>
        )}

        {onSupprimer && <SupprimerCombattant nom={target.name} onConfirmer={onSupprimer} />}

        {!estUnJoueur && (
          <div style={{
            textAlign: 'center', padding: '9px 0 13px',
            fontSize: 34, fontWeight: 700, lineHeight: 1,
            color: entry ? 'var(--ink)' : 'var(--muted)',
          }} className="num">
            {entry || '0'}
          </div>
        )}

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
                border: `1px solid ${etat.actif ? 'var(--accent)' : 'var(--gold-dim)'}`,
                background: etat.actif ? 'var(--accent-wash)' : 'transparent',
                color: etat.actif ? 'var(--accent)' : 'var(--muted)',
                fontWeight: etat.actif ? 700 : 600,
              }}
            >
              {etat.name}
            </button>
          ))}
        </div>

        {estUnJoueur ? (
          <div className="lbl" style={{
            textTransform: 'none', textAlign: 'center', color: 'var(--muted)',
            padding: '10px 0 16px', fontSize: 13, lineHeight: 1.5,
          }}>
            Ses points de vie se gèrent depuis sa fiche (« Fiche → » sur sa carte) : lui seul écrit sa propre feuille, le MJ y a les mêmes pouvoirs que lui.
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '00', '←'].map((key) => (
                <button
                  key={key}
                  onClick={() => press(key)}
                  style={{
                    minHeight: 52, borderRadius: 10, background: 'var(--surface-raised)',
                    border: '1px solid var(--gold-dim)', fontSize: 18, fontWeight: 600,
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
          </>
        )}
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
export function GmCombatScreen({ state, onChange, onOpenSheet, concentrationParNom }: {
  state: EncounterState;
  onChange: (suivant: EncounterState) => void;
  /**
   * Ouvre la fiche d'un combattant du groupe. Le MJ y a les mêmes pouvoirs que
   * le joueur — c'est la RLS qui l'y autorise, pas cet écran.
   */
  onOpenSheet?: (combatantId: string) => void;
  /**
   * Le nom du sort en cours de concentration, par nom de personnage — lu sur
   * chaque fiche, jamais sur le combattant : `live.concentration` du joueur,
   * pas un état de la rencontre. Absent pour une créature, qui n'a pas de
   * fiche.
   */
  concentrationParNom?: Record<string, string>;
}) {
  const [targetId, setTargetId] = useState<string | null>(null);
  const [ajoutEnCours, setAjoutEnCours] = useState(false);
  const [initiativesEnCours, setInitiativesEnCours] = useState(false);
  const [retraitToutEnCours, setRetraitToutEnCours] = useState(false);
  const setState = (suivant: EncounterState | ((courant: EncounterState) => EncounterState)) =>
    onChange(typeof suivant === 'function' ? suivant(state) : suivant);

  const ajouterAdversaire = (combatant: Omit<Combatant, 'id'>) => {
    setState((current) => addCombatant(current, { ...combatant, id: nouvelId() }));
    setAjoutEnCours(false);
  };

  const ordered = useMemo(() => orderedCombatants(state), [state]);
  const running = isRunning(state);
  const active = activeCombatant(state);
  const target = ordered.find((combatant) => combatant.id === targetId) ?? null;
  const nombreAdversaires = useMemo(
    () => state.combatants.filter((combatant) => combatant.side === 'creature').length,
    [state.combatants],
  );

  /**
   * Retire tous les adversaires d'un coup — l'antidote à un « Déclencher »
   * appuyé plusieurs fois par erreur, qui obligeait jusqu'ici à retirer
   * chaque créature une à une.
   */
  const retirerTout = () => {
    setState(removeAllCreatures);
    setRetraitToutEnCours(false);
  };

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

  /** Jamais pour un joueur : on ne retire pas un joueur du combat, seulement un adversaire. */
  const retirer = () => {
    if (!target || target.side !== 'creature') return;
    setState((current) => removeCombatant(current, target.id));
    setTargetId(null);
  };

  /**
   * Clone le stat-bloc de la cible en un nouvel individu, PV au complet et
   * sans état — pour composer vite un groupe (« encore un bandit ») sans
   * ressaisir CA, attaques, sauvegardes… Jamais pour un joueur.
   */
  const dupliquer = () => {
    if (!target || target.side !== 'creature') return;
    setState((current) => addCombatant(current, { ...dupliquerCombatant(target), id: nouvelId() }));
  };

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header style={{
        flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--gold-dim)',
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
                width: 44, height: 44, borderRadius: 10, border: '1px solid var(--gold-dim)',
                display: 'grid', placeItems: 'center',
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}

          {nombreAdversaires > 0 && (
            <button
              onClick={() => setRetraitToutEnCours(true)}
              aria-label="Retirer tous les adversaires"
              style={{
                width: 44, height: 44, borderRadius: 10, border: '1px solid var(--gold-dim)',
                display: 'grid', placeItems: 'center', color: 'var(--muted)',
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 7h16M9 7V4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
              </svg>
            </button>
          )}

          <button
            onClick={() => setAjoutEnCours(true)}
            aria-label="Ajouter un adversaire"
            style={{
              width: 44, height: 44, borderRadius: 10, border: '1px solid var(--gold-dim)',
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
              border: running ? '1px solid var(--gold-dim)' : 'none',
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

      {retraitToutEnCours && (
        <ConfirmerRetraitTout
          nombre={nombreAdversaires}
          onConfirmer={retirerTout}
          onAnnuler={() => setRetraitToutEnCours(false)}
        />
      )}

      <main style={{
        flexGrow: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {ordered.map((combatant) => (
          <CombatantRow
            key={combatant.id}
            combatant={combatant}
            active={active?.id === combatant.id}
            running={running}
            onTarget={(picked) => setTargetId(picked.id)}
            onNext={() => setState(nextTurn)}
            onOpenSheet={onOpenSheet && combatant.side === 'joueur'
              ? () => onOpenSheet(combatant.id) : null}
            concentration={concentrationParNom?.[combatant.name]}
          />
        ))}
      </main>

      {target && (
        <DamagePad
          target={target}
          onApply={apply}
          onBasculerEtat={basculerEtatDeLaCible}
          onDupliquer={target.side === 'creature' ? dupliquer : undefined}
          onSupprimer={target.side === 'creature' ? retirer : undefined}
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
