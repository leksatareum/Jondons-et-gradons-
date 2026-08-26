import { useMemo, useState } from 'react';
import type { AbilityScores, CharacterSheet } from '../model/character';
import { deriveCharacter, type DerivedResource, type DerivedSkill } from '../model/derive';
import { ABILITY_ABBREVIATIONS, ABILITY_NAMES, ABILITY_ORDER, type AbilityId } from '../content/character-basics';
import {
  CARD_CATEGORIES, layoutCombatCards,
  type CardCategory, type Economy, type PayableResource, type PlayableCard, type TurnContext, type TurnMode,
} from './combat-layout';
import { deBonusMarque, MARQUE_CHASSEUR_SPELL_ID, type CibleMarquee } from '../model/rodeur';
import { spellById } from '../content/spell-catalogue';
import { etatsActifs, resumeDesEtats } from '../model/etats';
import { TAB_BAR_CLEARANCE } from './TabBar';

/**
 * Écran de combat du joueur.
 *
 * Structure retenue avec l'utilisateur (« le rouleau ») :
 *  - une zone FIGÉE qui ne défile jamais : points de vie manipulables, classe
 *    d'armure, sauvegardes, économie d'action — ce qui bouge en combat, et
 *    rien de plus : l'identité vit dans la Fiche ;
 *  - un rouleau qui se RÉORDONNE selon le contexte (cf. `combat-layout.ts`) ;
 *  - une barre basse dans la zone du pouce.
 *
 * Aucun chiffre n'est stocké ici : tout vient de `deriveCharacter`. Changer une
 * règle demain change cet écran sans y toucher.
 */

const sign = (value: number) => (value >= 0 ? `+${value}` : `${value}`);

/**
 * Ce que les états actifs imposent, en une phrase.
 *
 * Seuls les effets inconditionnels : ceux d'Effrayé et d'Agrippé dépendent de
 * la situation et se lisent dans le détail de l'état, pas dans un résumé qui
 * les affirmerait toujours vrais.
 */
function resumeLisibleDesEtats(etats: string[]): string {
  const resume = resumeDesEtats(etats);
  const dits: string[] = [];
  if (resume.incapable) dits.push('ni action, ni action bonus, ni réaction');
  if (resume.vitesseNulle) dits.push('vitesse 0');
  if (resume.attaquesDesavantagees) dits.push('désavantage à tes attaques');
  if (resume.testsDesavantages) dits.push('désavantage à tes tests');
  if (resume.attaquesSubiesAvantagees) dits.push('avantage aux attaques contre toi');
  if (resume.sauvegardesRatees) dits.push('sauvegardes de FOR et DEX ratées d’office');
  if (resume.resistanceTotale) dits.push('résistance à tous les dégâts');
  return dits.length > 0
    ? `${dits.join(' · ')}.`
    : 'Effet conditionnel : voir le détail de l’état.';
}

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

/**
 * Les réserves de classe et d'espèce (Forme sauvage, Ruse magique, Arcanum,
 * Connaissance de la pierre…) : `deriveCharacter` les calcule déjà toutes
 * pour la fiche, mais rien ne les affichait nulle part — un joueur devait se
 * souvenir lui-même de son compte de Forme sauvage. Un bouton de la taille
 * d'un vrai bouton (le tap cible standard de l'appli), le compteur juste en
 * face pour le lire d'un coup d'œil — les pastilles n'ajoutaient rien à ça et
 * rendaient le bouton lui-même trop petit pour le pouce.
 */
function RessourcesTracker({ resources, onDepenser, onRestaurer }: {
  resources: DerivedResource[];
  onDepenser?: (key: string) => void;
  onRestaurer?: (key: string) => void;
}) {
  if (resources.length === 0) return null;
  return (
    <div style={{
      marginBottom: 7, border: '1px solid var(--line)',
      borderRadius: 'var(--radius-sm)', padding: '6px 9px',
    }}>
      <div className="lbl" style={{ marginBottom: 4, fontSize: 10 }}>Ressources</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {resources.map((res) => (
          <div key={res.key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <button
              onClick={() => onDepenser?.(res.key)}
              disabled={res.remaining <= 0}
              style={{
                flexGrow: 1, minWidth: 0, minHeight: 32, padding: '0 10px',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)',
                textAlign: 'left', fontSize: 13, fontWeight: 700,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                opacity: res.remaining <= 0 ? 0.4 : 1,
              }}
            >
              {res.name}
            </button>
            {/* Le compteur, juste en face du bouton : ce qu'il reste, sans avoir à compter des pastilles. */}
            <div className="num" style={{
              minWidth: 38, textAlign: 'center', fontSize: 15, fontWeight: 700,
              color: res.remaining > 0 ? 'var(--ink)' : 'var(--muted)',
            }}>
              {res.remaining}/{res.max}
            </div>
            {res.spent > 0 && (
              <button
                onClick={() => onRestaurer?.(res.key)}
                aria-label={`Rendre une utilisation de ${res.name}`}
                style={{
                  flexShrink: 0, minHeight: 32, minWidth: 32,
                  borderRadius: 'var(--radius-sm)', color: 'var(--muted)', fontSize: 14, fontWeight: 700,
                }}
              >
                ↺
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
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

function SaveStrip({ modifiers, proficient, bonus, malusD20 = 0 }: {
  modifiers: Record<AbilityId, number>; proficient: string[]; bonus: number;
  /** Pénalité d'Épuisement : une sauvegarde est un test d20 comme un autre. */
  malusD20?: number;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 4 }}>
      {ABILITY_ORDER.map((ability) => {
        const isProficient = proficient.includes(ability);
        const total = modifiers[ability] + (isProficient ? bonus : 0) - malusD20;
        return (
          <div
            key={ability}
            title={`Sauvegarde de ${ABILITY_NAMES[ability]}`}
            style={{
              textAlign: 'center', padding: '3px 0', borderRadius: 'var(--radius-sm)',
              border: isProficient ? '1.5px solid var(--accent)' : '1px solid var(--line)',
              background: isProficient ? 'var(--accent-wash)' : 'transparent',
            }}
          >
            <div className="lbl" style={{ fontSize: 8, color: isProficient ? 'var(--accent)' : undefined }}>
              {ABILITY_ABBREVIATIONS[ability]}
            </div>
            <div className="num" style={{
              fontSize: 12, fontWeight: isProficient ? 700 : 600,
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

/** Caractéristiques brutes : score et modificateur, pour qui veut vérifier plutôt que se fier au calcul. */
export function AbilityScoresStrip({ abilities, modifiers }: {
  abilities: AbilityScores; modifiers: Record<AbilityId, number>;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 4 }}>
      {ABILITY_ORDER.map((ability) => (
        <div
          key={ability}
          title={ABILITY_NAMES[ability]}
          style={{ textAlign: 'center', padding: '5px 0', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }}
        >
          <div className="lbl" style={{ fontSize: 9 }}>{ABILITY_ABBREVIATIONS[ability]}</div>
          <div className="num" style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{abilities[ability]}</div>
          <div className="lbl" style={{ fontSize: 9 }}>{sign(modifiers[ability])}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * Les 18 compétences du PHB, bonus déjà calculé par `deriveCharacter` — cet
 * écran n'additionne rien. Maîtrisée : fond accentué. Avec Expertise : le ✦
 * en plus, plutôt qu'une seconde couleur qu'il faudrait deviner.
 */
export function SkillsGrid({ skills }: { skills: DerivedSkill[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 8px' }}>
      {skills.map((skill) => (
        <div
          key={skill.id}
          title={ABILITY_NAMES[skill.ability]}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '4px 7px', borderRadius: 8,
            background: skill.proficient ? 'var(--accent-wash)' : 'transparent',
          }}
        >
          <span
            className="lbl"
            style={{ fontSize: 9, width: 22, flexShrink: 0, color: skill.proficient ? 'var(--accent)' : undefined }}
          >
            {ABILITY_ABBREVIATIONS[skill.ability]}
          </span>
          <span style={{
            fontSize: 12.5, flexGrow: 1, fontWeight: skill.proficient ? 600 : 400,
            color: skill.proficient ? 'var(--accent)' : undefined,
          }}>
            {skill.name}{skill.expertise ? ' ✦' : ''}
          </span>
          <span
            className="num"
            style={{ fontSize: 13, fontWeight: skill.proficient ? 700 : 600, color: skill.proficient ? 'var(--accent)' : undefined }}
          >
            {sign(skill.bonus)}
          </span>
        </div>
      ))}
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
  // Les pastilles montrent le paiement PROPOSÉ — le premier qui reste
  // disponible. Quand il y en a plusieurs, le joueur tranchera.
  const paiementAffiche = card.resources?.find((res) => res.remaining > 0) ?? card.resources?.[0];
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

      {card.detail && (
        <div className="lbl" style={{ textTransform: 'none', marginTop: 2 }}>{card.detail}</div>
      )}
      {card.granted && (
        <div className="lbl" style={{ textTransform: 'none', marginTop: 2, color: 'var(--accent)' }}>
          {/* La provenance vient de la carte quand elle en a une : « accordé
              par ton don » ne dit pas d'où, et c'est précisément ce que le
              joueur cherchera à la séance suivante. */}
          {card.grantedBy ? `accordé par ${card.grantedBy} · hors budget` : 'accordé · hors budget'}
        </div>
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
          {/*
            Bouton cerné, pas plein : l'accent plein signifie « l'action de
            cet écran », et un rouleau de sorts n'en a pas une seule — quatre
            barres pleines côte à côte se disputaient l'œil sans que rien ne
            prime. Cerné, il reste évidemment cliquable (c'est la plainte
            qu'on ne veut pas rejouer) sans crier plus fort que son voisin.
            La mise en avant de la première carte passe par sa bordure et ses
            grands chiffres — jamais par une recommandation déguisée.
          */}
          <button
            onClick={() => onPlay(card)}
            style={{
              flexGrow: 1, minHeight: 'var(--tap)', borderRadius: 10,
              border: '1.5px solid var(--accent)', color: 'var(--accent)',
              fontSize: 13, fontWeight: 700,
            }}
          >
            {card.equipWeaponId ? 'Équiper' : card.toHit !== undefined ? 'Attaquer' : 'Utiliser'}
          </button>
          {paiementAffiche && (
            <div style={{
              minWidth: 74, minHeight: 'var(--tap)', borderRadius: 10,
              border: '1px solid var(--line)', display: 'grid', placeItems: 'center', gap: 3,
              padding: '0 8px',
            }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {/* Au-delà de six pastilles on ne compte plus : on chiffre. */}
                {paiementAffiche.max > 6 ? (
                  <span className="num" style={{ fontSize: 13, fontWeight: 700 }}>
                    {paiementAffiche.remaining}/{paiementAffiche.max}
                  </span>
                ) : Array.from({ length: paiementAffiche.max }, (_, index) => (
                  <Pip key={index} filled={index < paiementAffiche.remaining} />
                ))}
              </div>
              {(card.resources?.length ?? 0) > 1 && (
                <div className="lbl" style={{ fontSize: 8.5 }}>au choix</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * La feuille de choix : ce qui paie, puis — pour Marque du chasseur — qui
 * est marqué.
 *
 * L'application ne choisit plus à la place du joueur. Un sort de rang 1 peut
 * partir sur un emplacement de rang 3, un Rôdeur peut préférer garder ses
 * lancements gratuits, un multiclassé Occultiste peut payer un sort de druide
 * avec un emplacement de pacte : ce sont trois décisions de joueur, et le
 * défaut le moins cher en escamotait deux.
 */
function FeuilleDeChoix({ titre, sousTitre, options, onChoisir, onFermer }: {
  titre: string;
  sousTitre?: string;
  options: { key: string; label: string; detail?: string; disabled?: boolean }[];
  onChoisir: (key: string) => void;
  onFermer: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label={titre}
      style={{
        position: 'fixed', inset: 0, zIndex: 40, display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-end', background: 'rgba(0,0,0,.45)',
      }}
      onClick={onFermer}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          background: 'var(--surface-raised)', borderTopLeftRadius: 18, borderTopRightRadius: 18,
          padding: '16px 14px calc(16px + env(safe-area-inset-bottom))',
          display: 'flex', flexDirection: 'column', gap: 9,
          maxHeight: '76dvh', overflowY: 'auto',
        }}
      >
        <div className="ttl" style={{ fontSize: 16 }}>{titre}</div>
        {sousTitre && (
          <div className="lbl" style={{ textTransform: 'none', marginTop: -4 }}>{sousTitre}</div>
        )}
        {options.map((option) => (
          <button
            key={option.key}
            disabled={option.disabled}
            onClick={() => onChoisir(option.key)}
            style={{
              minHeight: 'var(--tap)', borderRadius: 11, padding: '10px 13px', textAlign: 'left',
              border: '1px solid var(--line)', background: 'var(--surface)',
              color: option.disabled ? 'var(--muted)' : 'var(--ink)',
              opacity: option.disabled ? 0.5 : 1,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700 }}>{option.label}</div>
            {option.detail && (
              <div className="lbl" style={{ textTransform: 'none', marginTop: 2 }}>{option.detail}</div>
            )}
          </button>
        ))}
        <button
          onClick={onFermer}
          style={{ minHeight: 'var(--tap)', borderRadius: 11, color: 'var(--muted)', fontSize: 13, fontWeight: 700 }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

export function CombatScreen({
  sheet, cards, turn, onSpendHp, onPlayCard, onEquiperArme, turnId, cibles = [], etats = [],
  onFinMarque, onTransfererMarque, onDepenserRessource, onRestaurerRessource, onRompreConcentration,
}: {
  sheet: CharacterSheet;
  cards: PlayableCard[];
  /**
   * Décidé par le MJ, jamais par cet écran : hors combat, ni économie
   * d'action, ni réordonnancement, ni « Fin du tour ».
   */
  turn: TurnMode;
  onSpendHp?: (delta: number) => void;
  /**
   * Une carte payante vient d'être jouée : à la fiche de dépenser
   * l'emplacement ou la ressource. L'économie d'action, elle, reste locale à
   * cet écran (`spent`) — elle n'a de sens que le temps du tour, pas au-delà.
   */
  onPlayCard?: (card: PlayableCard, resourceKey: string, cible?: CibleMarquee) => void;
  /** Une carte « Équiper » vient d'être jouée : bascule l'arme en main, hors du paiement par ressource. */
  onEquiperArme?: (weaponId: string) => void;
  /**
   * Les créatures que le MJ a mises en jeu, pour Marque du chasseur. Vide
   * hors combat : on ne marque pas une cible qui n'existe pas.
   */
  cibles?: CibleMarquee[];
  /**
   * Les états posés par le MJ sur ce combattant. Ils vivent sur la rencontre,
   * pas sur la fiche : c'est le MJ qui les attribue, et la rencontre se
   * synchronise déjà en temps réel.
   */
  etats?: string[];
  /** La marque tombe : sort dissipé, cible morte, concentration perdue. */
  onFinMarque?: () => void;
  /** La cible marquée est tombée à 0 PV : une action bonus déplace la marque. */
  onTransfererMarque?: (cible: CibleMarquee) => void;
  /** Une réserve de classe ou d'espèce vient d'être entamée (Forme sauvage, Ruse magique…). */
  onDepenserRessource?: (key: string) => void;
  /** Correction manuelle : rendre une utilisation sans attendre le repos. */
  onRestaurerRessource?: (key: string) => void;
  /**
   * Rompt la concentration en cours — hors Marque du chasseur, qui a déjà son
   * propre bouton « Fin » (`onFinMarque`) dans son bloc dédié.
   */
  onRompreConcentration?: () => void;
  /**
   * Identité du tour en cours (`turnIdentity`). Les économies d'action
   * appartiennent au tour où elles ont été dépensées : quand cette valeur
   * change, elles sont oubliées. Sans elle, une Action dépensée restait
   * barrée pour tout le reste du combat.
   */
  turnId?: string;
}) {
  const [spent, setSpent] = useState<TurnContext['spent']>({});
  const [tourSuivi, setTourSuivi] = useState(turnId);

  // Remise à zéro pendant le rendu, sans effet différé : l'écran ne doit
  // jamais afficher, même un instant, l'économie du tour précédent.
  if (turnId !== tourSuivi) {
    setTourSuivi(turnId);
    setSpent({});
  }
  const derived = useMemo(() => deriveCharacter(sheet), [sheet]);
  const layout = useMemo(() => layoutCombatCards(cards, { turn, spent }), [cards, turn, spent]);
  const inCombat = turn.mode === 'combat';
  const isYourTurn = turn.mode === 'combat' && turn.isYourTurn;

  /**
   * Magie / à distance / mêlée : trois onglets plutôt qu'un seul tas — un
   * personnage qui porte une arme ET des sorts voyait tout mélangé dans le
   * même rouleau, vite illisible. L'économie d'action, elle, reste PARTAGÉE
   * entre les trois : `layout` se calcule sur `cards` en entier, l'onglet ne
   * fait que filtrer ce qui s'affiche, jamais ce qui est jouable.
   */
  const comptesParCategorie = useMemo(() => {
    const comptes: Record<CardCategory, number> = { magie: 0, distance: 0, melee: 0 };
    for (const card of cards) comptes[card.category] += 1;
    return comptes;
  }, [cards]);
  const [onglet, setOnglet] = useState<CardCategory>(
    () => CARD_CATEGORIES.find((categorie) => comptesParCategorie[categorie.id] > 0)?.id ?? 'magie',
  );
  const featured = layout.featured.filter((card) => card.category === onglet);
  const muted = layout.muted.filter((card) => card.category === onglet);

  /**
   * Jouer une carte, en deux temps quand il y a une décision à prendre :
   * quelle ressource paie, puis — pour Marque du chasseur — qui est marqué.
   * L'économie d'action n'est cochée qu'une fois le choix confirmé : ouvrir
   * une feuille puis l'annuler ne doit rien coûter.
   */
  const [choix, setChoix] = useState<
    { card: PlayableCard; etape: 'paiement' | 'cible'; paiement?: PayableResource } | null
  >(null);
  const [transfert, setTransfert] = useState(false);

  const confirmer = (card: PlayableCard, paiement?: PayableResource, cible?: CibleMarquee) => {
    setSpent((current) => ({ ...current, [card.economy]: true }));
    if (card.equipWeaponId) onEquiperArme?.(card.equipWeaponId);
    else if (paiement) onPlayCard?.(card, paiement.key, cible);
    setChoix(null);
  };

  const play = (card: PlayableCard) => {
    const disponibles = (card.resources ?? []).filter((res) => res.remaining > 0);
    const demandeUneCible = card.id === MARQUE_CHASSEUR_SPELL_ID && cibles.length > 0;
    if (disponibles.length > 1) {
      setChoix({ card, etape: 'paiement' });
      return;
    }
    if (demandeUneCible && disponibles.length === 1) {
      setChoix({ card, etape: 'cible', paiement: disponibles[0] });
      return;
    }
    confirmer(card, disponibles[0]);
  };

  const marque = sheet.live.huntersMark ?? null;
  // La Marque du chasseur EST une concentration, mais elle a déjà son propre
  // bloc plus riche (cible, transfert…) juste en dessous : ne pas la montrer
  // deux fois.
  const concentrationAutre = sheet.live.concentration && sheet.live.concentration.spellId !== MARQUE_CHASSEUR_SPELL_ID
    ? sheet.live.concentration
    : null;

  return (
    <div style={{
      height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      paddingBottom: TAB_BAR_CLEARANCE, boxSizing: 'border-box',
    }}>

      {/* ───── Zone figée : ne défile jamais ───── */}
      <header style={{
        flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--line)',
        boxShadow: 'var(--raise)', padding: '11px 14px 12px',
        paddingTop: 'calc(11px + env(safe-area-inset-top))',
      }}>
        {/*
          Pas de nom ni de classe ici : la Fiche les porte désormais en tête,
          et le MJ a le bandeau « Tu modifies la fiche de X » juste au-dessus.
          Dans un en-tête qui ne défile jamais, une ligne purement décorative
          se paie sur toute la hauteur restante.
        */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 9, marginBottom: 10 }}>
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

        <div style={{ marginBottom: 7 }}>
          <div className="lbl" style={{ marginBottom: 3, fontSize: 10 }}>Jets de sauvegarde</div>
          <SaveStrip
            modifiers={derived.modifiers}
            proficient={derived.saveProficiencies}
            bonus={derived.proficiencyBonus}
            malusD20={derived.exhaustion.d20Penalty}
          />
        </div>

        {/* ───── États ─────
            Posés par le MJ, lus ici. Ce qu'ils imposent est rappelé sous
            eux : un joueur ne doit pas avoir à se souvenir qu'« Entravé »
            veut dire désavantage aux attaques ET avantage à celles qu'il
            subit. */}
        {etatsActifs(etats).length > 0 && (
          <div style={{
            marginBottom: 10, border: '1px solid var(--accent)',
            borderRadius: 'var(--radius-sm)', padding: '7px 10px',
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {etatsActifs(etats).map((etat) => (
                <span
                  key={etat.id}
                  className="lbl"
                  style={{
                    textTransform: 'none', color: 'var(--accent)', fontWeight: 700,
                    border: '1px solid var(--accent)', borderRadius: 999, padding: '2px 8px',
                  }}
                >
                  {etat.name}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 6, lineHeight: 1.45 }}>
              {resumeLisibleDesEtats(etats)}
            </div>
          </div>
        )}

        <RessourcesTracker
          resources={derived.resources}
          onDepenser={onDepenserRessource}
          onRestaurer={onRestaurerRessource}
        />

        {/*
          L'Épuisement pénalise CHAQUE test d20. Il doit donc se lire au
          moment du jet, pas seulement dans un écran de repos : l'application
          le comptait sans jamais l'appliquer ni l'afficher.
        */}
        {derived.exhaustion.level > 0 && (
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10,
            border: `1px solid ${derived.exhaustion.fatal ? 'var(--vital)' : 'var(--line)'}`,
            borderRadius: 'var(--radius-sm)', padding: '7px 10px',
            background: derived.exhaustion.fatal ? 'var(--vital-wash)' : 'transparent',
          }}>
            <div className="lbl" style={{ color: derived.exhaustion.fatal ? 'var(--vital)' : 'var(--muted)' }}>
              Épuisement {derived.exhaustion.level}
            </div>
            <div style={{ flexGrow: 1, fontSize: 12.5, color: 'var(--muted)' }}>
              {derived.exhaustion.fatal
                ? 'Sixième cran : le personnage meurt.'
                : `−${derived.exhaustion.d20Penalty} à tous les tests d20 · −${derived.exhaustion.speedPenaltyMeters.toLocaleString('fr')} m de vitesse`}
            </div>
          </div>
        )}

        {/*
          La marque, dans la zone figée : c'est l'information qu'on relit à
          chaque jet d'attaque. Le dé vient du niveau — il passe au d10 au
          niveau 20 sans qu'on ait à retoucher quoi que ce soit ici.
        */}
        {marque && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
            border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)', padding: '7px 10px',
          }}>
            <div style={{ flexGrow: 1, minWidth: 0 }}>
              <div className="lbl" style={{ color: 'var(--accent)' }}>
                Marque · +{deBonusMarque(sheet)} force
              </div>
              {/* Le nom sur sa propre ligne : « Gobelin porte-étendard » et le
                  dé sur la même ligne débordaient sur deux lignes à 390px. */}
              <div style={{
                fontSize: 13, fontWeight: 700, marginTop: 1,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {marque.targetName}
              </div>
            </div>
            {cibles.length > 0 && (
              <button
                onClick={() => setTransfert(true)}
                style={{ minHeight: 34, padding: '0 10px', borderRadius: 9, border: '1px solid var(--line)', fontSize: 12, fontWeight: 700 }}
              >
                Déplacer
              </button>
            )}
            <button
              onClick={() => onFinMarque?.()}
              style={{ minHeight: 34, padding: '0 10px', borderRadius: 9, color: 'var(--muted)', fontSize: 12, fontWeight: 700 }}
            >
              Fin
            </button>
          </div>
        )}

        {/*
          La concentration active : personne ne la voyait nulle part, ni le
          joueur ni le MJ. « Rompre » ne fait que l'effacer ici — l'état
          qu'elle soutenait éventuellement (Invisible…) reste géré par le MJ
          via la liste d'états, qui sait déjà le poser et le retirer.
        */}
        {concentrationAutre && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
            border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)', padding: '7px 10px',
          }}>
            <div style={{ flexGrow: 1, minWidth: 0 }}>
              <div className="lbl" style={{ color: 'var(--accent)' }}>Concentration</div>
              <div style={{
                fontSize: 13, fontWeight: 700, marginTop: 1,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {spellById(concentrationAutre.spellId)?.name ?? concentrationAutre.spellId}
              </div>
            </div>
            <button
              onClick={() => onRompreConcentration?.()}
              style={{ minHeight: 34, padding: '0 10px', borderRadius: 9, color: 'var(--muted)', fontSize: 12, fontWeight: 700 }}
            >
              Rompre
            </button>
          </div>
        )}

        {layout.showEconomy && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ flexGrow: 1 }}>
              {isYourTurn ? (
                <div className="ttl" style={{ fontSize: 13, color: 'var(--accent)' }}>À toi de jouer</div>
              ) : (
                <>
                  <div className="ttl" style={{ fontSize: 13 }}>
                    Tour de {turn.mode === 'combat' ? turn.holder ?? '…' : '…'}
                  </div>
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
        )}
      </header>

      {/*
        Les onglets : figés eux aussi, juste sous l'en-tête — pas de
        `position: sticky` à l'intérieur du rouleau qui défile. Sur iOS,
        un sticky imbriqué dans un conteneur à défilement propre se met à
        clignoter et laisser passer un bout de carte au-dessus de lui
        pendant le défilement ; le sortir du rouleau règle le problème à
        la racine, et garde les onglets visibles en permanence — un
        avantage, pas une concession.
      */}
      <div style={{
        flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--line)',
        padding: '8px 14px 8px', display: 'flex', gap: 6,
      }}>
        {CARD_CATEGORIES.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setOnglet(id)}
            style={{
              flexGrow: 1, minHeight: 36, borderRadius: 999,
              border: `1px solid ${onglet === id ? 'var(--accent)' : 'var(--line)'}`,
              background: onglet === id ? 'var(--accent-wash)' : 'transparent',
              color: onglet === id ? 'var(--accent)' : 'var(--muted)',
              fontSize: 13, fontWeight: 700,
            }}
          >
            {label}{comptesParCategorie[id] > 0 ? ` · ${comptesParCategorie[id]}` : ''}
          </button>
        ))}
      </div>

      {/* ───── Rouleau réordonné ───── */}
      <main style={{
        flexGrow: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: 11,
      }}>
        {featured.map((card, index) => (
          <ActionCard key={card.id} card={card} playable hero={index === 0} onPlay={play} />
        ))}

        {muted.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '2px 2px 0' }}>
            <div className="lbl">
              {!inCombat ? 'indisponible' : isYourTurn ? 'plus tard dans le tour' : 'rangé pour l’instant'}
            </div>
            <div style={{ flexGrow: 1, height: 1, background: 'var(--line)' }} />
          </div>
        )}
        {muted.map((card) => (
          <ActionCard key={card.id} card={card} playable={false} hero={false} onPlay={play} />
        ))}

        {featured.length === 0 && muted.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '6px 2px' }}>
            Rien dans « {CARD_CATEGORIES.find((categorie) => categorie.id === onglet)?.label} » pour l’instant.
          </p>
        )}
      </main>

      {/*
        Zone du pouce — seulement en combat : « Fin du tour » ou « Ordre du
        combat » à suivre. Hors combat, le repos vit maintenant dans son
        propre onglet (voir `TabBar`), pas dans un bouton de cet écran.
      */}
      {inCombat && (
        <footer style={{
          flexShrink: 0, padding: '11px 14px 14px', display: 'flex', gap: 9,
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
        </footer>
      )}

      {choix?.etape === 'paiement' && (
        <FeuilleDeChoix
          titre={`${choix.card.name} — avec quoi ?`}
          sousTitre="Monter en rang, garder un lancement gratuit : c’est ton choix."
          options={(choix.card.resources ?? []).map((res) => ({
            key: res.key,
            label: res.label,
            detail: `${res.remaining} sur ${res.max}`,
            disabled: res.remaining <= 0,
          }))}
          onChoisir={(key) => {
            const paiement = (choix.card.resources ?? []).find((res) => res.key === key);
            if (!paiement) return;
            if (choix.card.id === MARQUE_CHASSEUR_SPELL_ID && cibles.length > 0) {
              setChoix({ ...choix, etape: 'cible', paiement });
              return;
            }
            confirmer(choix.card, paiement);
          }}
          onFermer={() => setChoix(null)}
        />
      )}

      {choix?.etape === 'cible' && (
        <FeuilleDeChoix
          titre="Qui marques-tu ?"
          sousTitre={choix.paiement?.label}
          options={cibles.map((cible) => ({ key: cible.id, label: cible.name }))}
          onChoisir={(id) => {
            const cible = cibles.find((candidat) => candidat.id === id);
            if (!cible) return;
            confirmer(choix.card, choix.paiement, cible);
          }}
          onFermer={() => setChoix(null)}
        />
      )}

      {transfert && (
        <FeuilleDeChoix
          titre="Déplacer la marque"
          sousTitre="La cible est tombée : une action bonus, sans relancer le sort."
          options={cibles.map((cible) => ({ key: cible.id, label: cible.name }))}
          onChoisir={(id) => {
            const cible = cibles.find((candidat) => candidat.id === id);
            setTransfert(false);
            if (cible) onTransfererMarque?.(cible);
          }}
          onFermer={() => setTransfert(false)}
        />
      )}
    </div>
  );
}
