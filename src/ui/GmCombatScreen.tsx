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
import { FinDeCombat } from './FinDeCombat';
import { AideDuMJ } from './AideDuMJ';
import { DangersDuDecor } from './DangersDuDecor';
import { CarnetDePnj } from './CarnetDePnj';
import { Poursuite } from './Poursuite';
import { LeGuide, type OutilDuGuide } from './LeGuide';
import { creaturesHostiles, evaluerRencontre } from '../domain/encounter-generator';
import { PHB_CREATURES } from '../content/creatures';

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

/** Les mêmes mots et les mêmes couleurs que la jauge des rencontres préparées. */
const LABEL_DIFFICULTE: Record<string, string> = {
  faible: 'faible', moderee: 'modérée', elevee: 'élevée', 'au-dela': 'au-delà',
};
const COULEUR_DIFFICULTE: Record<string, string> = {
  faible: 'var(--ok)', moderee: 'var(--gold-bright)', elevee: 'var(--accent)', 'au-dela': 'var(--vital)',
};

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
    // Une rainure CREUSÉE dans la carte, pas un trait posé dessus : le fond
    // de la barre est sombre avec son ombre interne, comme l'orbe de vie du
    // joueur. En clair sur du sombre, la piste vide se lisait aussi fort que
    // le remplissage et une créature à 1 PV avait l'air pleine.
    <div style={{
      height: 5, borderRadius: 999, overflow: 'hidden', display: 'flex',
      background: 'rgba(0,0,0,.45)',
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,.8), 0 0 0 1px rgba(150,116,58,.25)',
    }}>
      <div style={{
        width: `${Math.max(0, Math.min(1, ratio)) * 100}%`, background: color,
        boxShadow: `0 0 8px -1px ${color}`,
      }} />
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
      className={`card${active ? ' card-accent' : ''}`}
      style={{
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
          className="jg-btn-hot"
          style={{
            marginTop: 11, width: '100%', minHeight: 'var(--tap)', borderRadius: 10,
            fontSize: 13, fontWeight: 700,
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
  // sur ce combattant : le pavé fonctionne aussi pour lui, mais `onApply`
  // (fourni par `GmCombatScreen`) écrit alors sur sa VRAIE fiche — jamais sur
  // la copie de la rencontre, qui n'est relue nulle part. Une première
  // version fermait ce pavé pour les joueurs plutôt que de le brancher au bon
  // endroit ; le MJ perdait ainsi le geste le plus utile en plein combat.
  const estUnJoueur = target.side === 'joueur';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10, background: 'rgb(0 0 0 / 0.55)',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      <button onClick={onClose} aria-label="Fermer" style={{ flexGrow: 1 }} />
      <div style={{
        background: 'var(--jg-voile-carte), var(--jg-ardoise)',
        borderTop: '1px solid var(--gold-dim)',
        boxShadow: '0 -12px 30px -10px #000',
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '00', '←'].map((key) => (
            <button
              key={key}
              onClick={() => press(key)}
              className="card"
              style={{ minHeight: 52, borderRadius: 10, fontSize: 18, fontWeight: 600 }}
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
              background: 'var(--vital)', color: '#2a0f03', fontSize: 14, fontWeight: 700,
              textShadow: '0 1px 0 rgba(255,220,170,.4)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.22), inset 0 -2px 2px rgba(0,0,0,.3), 0 5px 16px -5px var(--vital), 0 0 0 1px #2a1707',
            }}
          >
            Dégâts
          </button>
          <button
            onClick={() => send('soins')}
            style={{
              flexGrow: 1, minHeight: 52, borderRadius: 11,
              color: 'var(--ok)', fontSize: 14, fontWeight: 700,
              background: 'linear-gradient(180deg, rgba(255,255,255,.07), rgba(0,0,0,.25))',
              boxShadow: 'inset 0 1px 0 rgba(200,255,215,.18), inset 0 0 0 1px rgba(0,0,0,.5), 0 0 0 1px var(--ok)',
            }}
          >
            Soins
          </button>
        </div>

        {/* Pour un joueur, ce pavé écrit directement sur sa fiche — le
            rappeler évite de croire qu'il faudrait encore répercuter le geste
            ailleurs. « Fiche → » reste ouverte pour tout le reste (sorts,
            ressources, inventaire). */}
        {estUnJoueur && (
          <div className="lbl" style={{
            textTransform: 'none', textAlign: 'center', color: 'var(--muted)',
            padding: '0 0 14px', fontSize: 12, lineHeight: 1.5,
          }}>
            Écrit directement sur sa fiche, comme s'il l'avait fait lui-même.
          </div>
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
export function GmCombatScreen({ state, campaignId, groupe, onChange, onOpenSheet, onDegatsJoueur, concentrationParNom }: {
  state: EncounterState;
  /** La table en cours : le carnet de PNJ est rangé par campagne. */
  campaignId: string;
  /**
   * Le groupe réel de la campagne, calculé sur les fiches. Sert à quatre
   * choses ici : situer en direct la difficulté de ce qui est SUR LA TABLE,
   * partager les PX en fin de combat, fixer les bornes de loyauté d'un PNJ sur
   * le plus haut Charisme, et compter les Pointes d'une poursuite sur la
   * Constitution de chacun — aucun de ces chiffres n'est à saisir.
   */
  groupe: {
    niveau: number;
    taille: number;
    /** `con` est déjà le MODIFICATEUR, pas le score : c'est lui qui sert partout. */
    personnages: { nom: string; cha: number; con: number }[];
  };
  onChange: (suivant: EncounterState) => void;
  /**
   * Ouvre la fiche d'un combattant du groupe. Le MJ y a les mêmes pouvoirs que
   * le joueur — c'est la RLS qui l'y autorise, pas cet écran.
   */
  onOpenSheet?: (combatantId: string) => void;
  /**
   * Le pavé de dégâts/soins d'un JOUEUR passe par ici — vers sa vraie fiche
   * (`live.damageTaken`), jamais vers la copie de la rencontre. `combatantId`
   * EST l'id de la fiche pour un membre du groupe (voir `roster.ts`,
   * `combatantFromSheet`) — le même lien que celui d'`onOpenSheet`.
   */
  onDegatsJoueur?: (combatantId: string, delta: number) => void;
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
  const [finEnCours, setFinEnCours] = useState(false);
  const [aideEnCours, setAideEnCours] = useState(false);
  const [decorEnCours, setDecorEnCours] = useState(false);
  const [pnjEnCours, setPnjEnCours] = useState(false);
  const [poursuiteEnCours, setPoursuiteEnCours] = useState(false);
  const [menuDuGuide, setMenuDuGuide] = useState(false);

  /**
   * Le menu se referme derrière l'outil choisi : on ne le retrouve pas
   * empilé sous l'écran qu'on vient d'ouvrir, ni au retour.
   */
  const ouvrirOutil = (outil: OutilDuGuide) => {
    setMenuDuGuide(false);
    if (outil === 'dd') setAideEnCours(true);
    if (outil === 'decor') setDecorEnCours(true);
    if (outil === 'gens') setPnjEnCours(true);
    if (outil === 'poursuite') setPoursuiteEnCours(true);
  };

  /**
   * La difficulté de ce qui est SUR LA TABLE, en direct.
   *
   * Une rencontre préparée est pesée avant la séance ; mais on y ajoute des
   * renforts en cours de route, et à ce moment-là le MJ n'a plus aucun
   * repère. Seules les créatures venues du bestiaire comptent : une créature
   * tapée à la main n'a pas de facteur de puissance, donc pas de coût.
   */
  const evaluation = useMemo(() => {
    const profils = creaturesHostiles(state.combatants)
      .map((combatant) => PHB_CREATURES.find((creature) => creature.id === combatant.templateId))
      .filter((creature): creature is NonNullable<typeof creature> => Boolean(creature));
    return evaluerRencontre(profils, groupe.niveau, groupe.taille);
  }, [state.combatants, groupe.niveau, groupe.taille]);
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
    // Un joueur porte ses PV sur sa fiche, pas sur ce combattant — écrire ici
    // ne ferait qu'une copie que personne ne relit jamais (voir le
    // commentaire d'`onDegatsJoueur`).
    if (target.side === 'joueur') {
      onDegatsJoueur?.(target.id, mode === 'degats' ? -amount : amount);
      return;
    }
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
        flexShrink: 0,
        // Un voile flouté plutôt qu'un aplat : la dalle de pierre du fond se
        // devine au travers, comme sur tous les autres en-têtes de l'appli.
        background: 'rgba(22,25,29,.93)',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--gold-dim)',
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
              className="jg-rond"
              style={{ width: 44, height: 44 }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}

          <button
            onClick={() => setAjoutEnCours(true)}
            aria-label="Ajouter un adversaire"
            className="jg-rond"
            style={{ width: 44, height: 44, fontSize: 20, fontWeight: 700, color: 'var(--muted)' }}
          >
            +
          </button>

          {/* C'est ce bouton, et lui seul, qui met les joueurs en tour par tour.
              Lancer passe d'abord par la saisie des initiatives : sans elle,
              le premier round partait sur l'ordre d'ajout, joueurs à zéro. */}
          <button
            onClick={() => (running ? setFinEnCours(true) : setInitiativesEnCours(true))}
            disabled={!running && state.combatants.length === 0}
            className={running ? 'jg-btn-cold' : 'jg-btn-hot'}
            style={{ minHeight: 44, padding: '0 14px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}
          >
            {running ? 'Terminer' : 'Lancer'}
          </button>
        </div>

        {/*
          La seconde ligne : le verdict à gauche, ce qui se consulte à droite.
          Tout tenait sur une seule ligne jusqu'à trois outils ; au quatrième,
          la rangée mesurait 441 px sur un écran de 390 et le nom du combattant
          actif était écrasé à zéro. Sortir les consultations de la ligne
          d'action a rendu sa place au titre — mais aligner un rond de plus par
          pense-bête a fini par produire un mur de cercles identiques, où rien
          ne distinguait le triangle du décor de la silhouette des PNJ.

          D'où « Le Guide », une porte unique et NOMMÉE : le menu derrière
          donne à chaque outil un nom et une phrase, ce qu'un rond ne peut pas
          porter, et la rangée ne grandira plus quand il y en aura un sixième.
          Les ACTIONS, elles, restent à un appui — elles se font en plein
          combat, alors qu'une consultation se lit.
        */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 9 }}>
          {/* Ce que vaut ce qui est sur la table. Le détail vit dans l'écran
              des rencontres préparées ; ici il n'y a de place que pour le
              verdict, et c'est tout ce qu'on lit en pleine séance. */}
          <div style={{
            flexGrow: 1, minWidth: 0, display: 'flex', alignItems: 'center',
            flexWrap: 'wrap', columnGap: 7, rowGap: 0,
          }}>
            {evaluation.difficulte && evaluation.difficulte !== 'aucune' && (
              <>
                <span className="lbl" style={{ fontSize: 9, whiteSpace: 'nowrap' }}>Difficulté</span>
                <span className="ttl" style={{ fontSize: 14, whiteSpace: 'nowrap', color: COULEUR_DIFFICULTE[evaluation.difficulte] }}>
                  {LABEL_DIFFICULTE[evaluation.difficulte]}
                </span>
                <span className="num" style={{ fontSize: 11, whiteSpace: 'nowrap', color: 'var(--muted)' }}>
                  {evaluation.xp} PX
                </span>
                {evaluation.avertissements.some((a) => a.gravite === 'danger') && (
                  <span
                    title={evaluation.avertissements.find((a) => a.gravite === 'danger')?.texte}
                    style={{ fontSize: 12, color: 'var(--vital)' }}
                  >
                    ⚠
                  </span>
                )}
              </>
            )}
          </div>

          {nombreAdversaires > 0 && (
            <button
              onClick={() => setRetraitToutEnCours(true)}
              aria-label="Retirer tous les adversaires"
              className="jg-rond"
              style={{ width: 44, height: 44, flexShrink: 0, color: 'var(--muted)' }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 7h16M9 7V4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
              </svg>
            </button>
          )}

          <button
            onClick={() => setMenuDuGuide(true)}
            aria-label="Le Guide : ce qu’on cherche en pleine séance"
            style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7,
              minHeight: 44, padding: '0 13px', borderRadius: 999,
              border: '1px solid var(--gold-dim)', background: 'transparent', color: 'var(--muted)',
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 4.5h6a2.5 2.5 0 0 1 2 1 2.5 2.5 0 0 1 2-1h6v14h-6a2.5 2.5 0 0 0-2 1 2.5 2.5 0 0 0-2-1H4Z" />
              <path d="M12 5.5v13" />
            </svg>
            <span className="ttl" style={{ fontSize: 13 }}>Le Guide</span>
          </button>
        </div>

        {!running && (
          <div className="lbl" style={{ textTransform: 'none', marginTop: 9 }}>
            Les joueurs restent sur leur fiche tant que le combat n'est pas lancé.
          </div>
        )}
      </header>

      {finEnCours && (
        <FinDeCombat
          combatants={state.combatants}
          joueurs={groupe.taille}
          niveauGroupe={groupe.niveau}
          onTerminer={() => { setFinEnCours(false); setState(endEncounter); }}
          onFermer={() => setFinEnCours(false)}
        />
      )}

      {menuDuGuide && <LeGuide onChoisir={ouvrirOutil} onFermer={() => setMenuDuGuide(false)} />}

      {aideEnCours && <AideDuMJ onFermer={() => setAideEnCours(false)} />}

      {decorEnCours && <DangersDuDecor niveau={groupe.niveau} onFermer={() => setDecorEnCours(false)} />}

      {pnjEnCours && (
        <CarnetDePnj
          campaignId={campaignId}
          niveau={groupe.niveau}
          charismes={groupe.personnages.map((personnage) => personnage.cha)}
          onFermer={() => setPnjEnCours(false)}
        />
      )}

      {poursuiteEnCours && (
        <Poursuite personnages={groupe.personnages} onFermer={() => setPoursuiteEnCours(false)} />
      )}

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
