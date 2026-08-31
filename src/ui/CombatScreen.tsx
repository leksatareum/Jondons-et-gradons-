import { useEffect, useMemo, useRef, useState } from 'react';
import type { AbilityScores, CharacterSheet } from '../model/character';
import { deriveCharacter, type DerivedResource, type DerivedSkill, type DerivedSlot } from '../model/derive';
import { ABILITY_ABBREVIATIONS, ABILITY_NAMES, ABILITY_ORDER, type AbilityId } from '../content/character-basics';
import {
  CARD_CATEGORIES, layoutCombatCards,
  type CardCategory, type Economy, type PayableResource, type PlayableCard, type TurnContext, type TurnMode,
} from './combat-layout';
import { deBonusMarque, MARQUE_CHASSEUR_SPELL_ID, type CibleMarquee } from '../model/rodeur';
import { BENEDICTION_TENEBREUX_CARD_ID } from '../model/occultiste';
import { spellById } from '../content/spell-catalogue';
import { etatsActifs, resumeDesEtats } from '../model/etats';
import { themeDeClasse } from '../content/class-themes';
import { TAB_BAR_CLEARANCE } from './TabBar';
import { DamageTypeIcons } from './damage-type-icon';
import { NombreQuiRoule } from './NombreQuiRoule';
import { DeathSavesPanel } from './DeathSavesPanel';
import type { EtatDeMort, ResultatJet } from '../model/death-state';
import type { JetDeDes } from '../domain/dice';

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

/** Une icône par onglet — étoile pour la magie, arc pour le tir, épées croisées pour le corps à corps. */
function TabIcon({ categorie, color }: { categorie: CardCategory; color: string }) {
  if (categorie === 'magie') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill={color} aria-hidden>
        <path d="M12 1.5 L14.2 8.6 L21.5 8.8 L15.6 13.2 L17.7 20.4 L12 16 L6.3 20.4 L8.4 13.2 L2.5 8.8 L9.8 8.6 Z" />
      </svg>
    );
  }
  if (categorie === 'distance') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5.5 20 Q2.5 12 5.5 4" />
        <path d="M5.5 4 L19 12 L5.5 20" />
      </svg>
    );
  }
  if (categorie === 'objets') {
    // Une fiole : goulot, bouchon, panse arrondie — potions, antitoxine,
    // parchemins et le reste des objets à raccourci de Combat.
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M10 2.5 h4 M10.5 2.5 v4.3 L6 15.4 a4.4 4.4 0 0 0 4 6.1 h4 a4.4 4.4 0 0 0 4-6.1 L13.5 6.8 V2.5" />
        <path d="M8.2 14.5 h7.6" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 4 L8 15" />
      <path d="M15.5 4 L20 4 L20 8.5" />
      <path d="M5 18 L9 14" />
      <path d="M4 21 L7 18" />
    </svg>
  );
}

/** Une pastille de paiement — une gemme taillée, dans l'esprit « Braise et fer ». */
function Pip({ filled }: { filled: boolean }) {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden style={{ filter: filled ? 'drop-shadow(0 0 4px var(--accent-glow))' : undefined }}>
      <path
        d="M6 0.5 L11.5 6 L6 11.5 L0.5 6 Z"
        fill={filled ? 'var(--accent)' : 'rgba(0,0,0,.5)'}
        stroke={filled ? 'var(--gold-bright)' : 'var(--gold-dim)'}
        strokeWidth="1"
      />
    </svg>
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
    <div className="jg-tile" style={{ marginBottom: 5, borderRadius: 9, padding: '6px 10px 7px' }}>
      <span className="jg-stud" style={{ top: 5, left: 5 }} />
      <span className="jg-stud" style={{ top: 5, right: 5 }} />
      <div className="lbl" style={{ marginBottom: 4, fontSize: 10, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 5 }}>
        <svg width="6" height="6" viewBox="0 0 10 10" style={{ transform: 'rotate(45deg)', flexShrink: 0 }} aria-hidden>
          <rect width="10" height="10" fill="var(--gold)" />
        </svg>
        Ressources
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {resources.map((res) => (
          <div key={res.key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <button
              onClick={() => onDepenser?.(res.key)}
              disabled={res.remaining <= 0}
              style={{
                flexGrow: 1, minWidth: 0, minHeight: 30, padding: '0 10px',
                borderRadius: 7, border: '1px solid var(--gold-dim)',
                background: 'linear-gradient(180deg, var(--surface-raised), var(--surface))',
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
              color: res.remaining > 0 ? 'var(--gold-bright)' : 'var(--muted)',
            }}>
              {res.remaining}/{res.max}
            </div>
            {res.spent > 0 && (
              <button
                onClick={() => onRestaurer?.(res.key)}
                aria-label={`Rendre une utilisation de ${res.name}`}
                style={{
                  flexShrink: 0, minHeight: 30, minWidth: 30,
                  borderRadius: 7, border: '1px solid var(--gold-dim)', color: 'var(--gold)', fontSize: 14, fontWeight: 700,
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

/**
 * Le récapitulatif des emplacements de sorts restants, tous rangs confondus.
 *
 * Chaque carte de sort rappelle déjà CE QU'ELLE coûterait (`ActionCard`,
 * les pastilles en bas de carte) — mais recompter ce qui reste au rang 2
 * demandait de rouvrir chaque sort de rang 2 un par un. Une ligne de pastilles
 * compactes, dans la zone figée, répond à « il me reste quoi ? » d'un coup
 * d'œil, sans dupliquer la logique de paiement (elle reste sur la carte).
 *
 * Rien à afficher pour un personnage sans magie : `slots` est vide, ou ne
 * contient que des rangs à `max: 0` (progression de multiclassé pas encore
 * arrivée à ce rang) — les deux sont filtrés.
 */
function SpellSlotsSummary({ slots }: { slots: DerivedSlot[] }) {
  const visibles = slots.filter((slot) => slot.max > 0);
  if (visibles.length === 0) return null;
  return (
    <div style={{ marginBottom: 5 }}>
      <div className="lbl" style={{ marginBottom: 2, fontSize: 10 }}>Emplacements de sorts</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {visibles.map((slot) => (
          <div
            key={`${slot.pact ? 'pacte' : 'rang'}-${slot.level}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px',
              borderRadius: 999, border: '1px solid var(--gold-dim)',
              background: 'rgba(0,0,0,.25)', opacity: slot.remaining > 0 ? 1 : 0.55,
            }}
          >
            <span className="lbl" style={{ fontSize: 9 }}>{slot.pact ? 'Pacte' : `Rang ${slot.level}`}</span>
            <span className="num" style={{
              fontSize: 12, fontWeight: 700,
              color: slot.remaining > 0 ? 'var(--gold-bright)' : 'var(--muted)',
            }}>
              {slot.remaining}/{slot.max}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * L'orbe de vie, avec l'écusson de CA accroché dessus.
 *
 * Les deux vivaient en deux boîtes côte à côte ; ils partagent maintenant un
 * seul repère visuel — l'écusson EST accroché à l'orbe, pas juste posé à
 * côté — parce que « combien de PV, quelle CA » est la première paire de
 * chiffres qu'on relit à chaque coup encaissé. Le niveau du liquide suit
 * `current / max` en direct ; `onChange` et les cibles tactiles des boutons
 * n'ont pas changé.
 */
function HitPoints({ current, max, armorClass, temporary, onChange }: {
  current: number; max: number; armorClass: number; temporary: number; onChange: (delta: number) => void;
}) {
  const hauteur = max > 0 ? Math.max(0, Math.min(100, Math.round((current / max) * 100))) : 0;

  /**
   * Le chiffre qui s'échappe de l'orbe à chaque coup encaissé ou soigné.
   *
   * Il ne vient PAS du bouton « − » : les PV changent aussi quand le MJ
   * frappe à distance, quand une potion soigne, quand le temps réel rattrape
   * un autre écran. C'est donc la valeur elle-même qu'on surveille — le seul
   * endroit qui les voit tous passer.
   *
   * `cle` force un nouvel élément à chaque coup : deux dégâts d'affilée
   * doivent rejouer l'animation, or React garderait le même nœud (et donc la
   * même animation déjà terminée) si rien ne le distinguait du précédent.
   */
  const [effet, setEffet] = useState<{ delta: number; cle: number } | null>(null);
  const precedent = useRef(current);
  const orbe = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const delta = current - precedent.current;
    precedent.current = current;
    if (delta === 0) return;
    setEffet({ delta, cle: Date.now() });
    // Le recul de l'orbe part d'ici plutôt que d'une classe CSS : deux coups
    // d'affilée doivent le rejouer, or une classe déjà posée ne redémarre
    // pas toute seule — et remonter l'orbe pour l'y forcer ferait SAUTER le
    // niveau du liquide au lieu de le laisser glisser (`transition` de
    // `.jg-orb-fill`, perdue à chaque remontage).
    if (delta < 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      orbe.current?.animate([
        { transform: 'translateX(0)' }, { transform: 'translateX(-5px)' },
        { transform: 'translateX(4px)' }, { transform: 'translateX(-2px)' },
        { transform: 'translateX(0)' },
      ], { duration: 340, easing: 'ease-out' });
    }
    const minuteur = window.setTimeout(() => setEffet(null), 1000);
    return () => window.clearTimeout(minuteur);
  }, [current]);

  const step = (delta: number, label: string, side: 'left' | 'right') => (
    <button
      onClick={() => onChange(delta)}
      aria-label={label}
      // La taille ne coûte rien en hauteur (le bouton reste dans l'empreinte
      // verticale de l'orbe) : pas de raison de descendre sous une cible
      // tactile correcte pour le geste le plus répété de tout l'écran.
      style={{
        position: 'absolute', top: '50%', [side]: -34, marginTop: -17,
        width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center',
        background: 'radial-gradient(circle at 35% 28%, var(--surface-raised), #150e09)',
        boxShadow: '0 0 0 1.5px var(--gold-dim), inset 0 1px 0 rgba(255,235,190,.18), 0 3px 8px rgba(0,0,0,.6)',
        color: 'var(--gold)',
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden>
        {delta < 0 ? <path d="M5 12h14" /> : <path d="M12 5v14M5 12h14" />}
      </svg>
    </button>
  );

  return (
    <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
      <div style={{ position: 'relative' }}>
        <div className="jg-orb-ring">
          <div ref={orbe} className="jg-orb" style={{ width: 76, height: 76 }}>
            <div className="jg-orb-fill" style={{ height: `${hauteur}%` }}>
              <div className="jg-wave jg-wave-a" />
              <div className="jg-wave jg-wave-b" />
            </div>
            <div className="jg-orb-glass" />
          </div>
        </div>

        {/* Le chiffre qui s'échappe : rouge quand ça fait mal, vert quand ça
            soigne — les deux seules couleurs que l'appli associe déjà aux PV
            (`--vital`, `--ok`), jamais l'accent de classe.
            Il monte À CÔTÉ de l'orbe, jamais dessus : au centre il couvrait
            précisément le nombre de PV qu'on venait de changer, c'est-à-dire
            le seul chiffre qu'on cherchait à lire. Et il se range du côté
            OPPOSÉ au bouton qui vient d'être touché — un dégât monte à
            droite, loin du « − » ; un soin à gauche, loin du « + » — pour ne
            jamais éclore sous le doigt qui appuie. Le contour noir n'est pas
            décoratif : le chiffre rase le liquide rouge de l'orbe, où un
            rouge sans contour ne se lirait plus. */}
        {effet && (
          <div
            key={effet.cle}
            aria-hidden
            className="num jg-anim-float-away"
            style={{
              position: 'absolute', top: 34, zIndex: 2, pointerEvents: 'none',
              ...(effet.delta < 0 ? { left: 'calc(100% + 4px)' } : { left: -4 }),
              fontSize: 21, fontWeight: 800, whiteSpace: 'nowrap',
              color: effet.delta < 0 ? 'var(--vital-bright, var(--vital))' : 'var(--ok)',
              textShadow: '0 0 3px #000, 0 1px 2px #000, 0 -1px 2px #000, 1px 0 2px #000, -1px 0 2px #000',
            }}
          >
            {effet.delta < 0 ? `−${Math.abs(effet.delta)}` : `+${effet.delta}`}
          </div>
        )}

        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
          <div style={{ textAlign: 'center', marginTop: -2 }}>
            <div className="num" style={{
              fontSize: 25, fontWeight: 800, lineHeight: .9, color: '#fff',
              textShadow: '0 2px 4px rgba(0,0,0,.95), 0 0 20px rgba(255,120,90,.9)',
            }}>
              {current}
            </div>
            <div className="lbl" style={{ marginTop: 2, color: 'rgba(255,225,215,.8)', fontSize: 7.5 }}>
              {temporary > 0 ? `+${temporary} temp. · ${max} PV` : `sur ${max} PV`}
            </div>
          </div>
        </div>

        {step(-1, 'Retirer un point de vie', 'left')}
        {step(+1, 'Rendre un point de vie', 'right')}

        {/* Le blason de CA doit rester à gauche du bouton « + », qui commence
            pile au bord droit de l'orbe (right: -34, largeur 34) : un blason
            qui déborde à droite comme avant (right: -13) mordait dessus,
            visible et cliquable au même endroit. */}
        <div style={{ position: 'absolute', right: 3, bottom: -6, width: 40, height: 45 }}>
          <div style={{
            position: 'absolute', inset: 0,
            clipPath: 'polygon(50% 0%, 100% 15%, 100% 60%, 50% 100%, 0% 60%, 0% 15%)',
            background: 'conic-gradient(from 200deg, #4a3413, var(--gold-bright) 24%, #3a280f 48%, var(--gold) 72%, #4a3413)',
            filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.85))',
          }} />
          <div style={{
            position: 'absolute', inset: 2,
            clipPath: 'polygon(50% 0%, 100% 15%, 100% 60%, 50% 100%, 0% 60%, 0% 15%)',
            background: 'linear-gradient(180deg, #3b2c1a, #17100a)',
            display: 'grid', placeItems: 'center', boxShadow: 'inset 0 2px 7px rgba(0,0,0,.9)',
          }}>
            <div style={{ marginTop: -4, textAlign: 'center' }}>
              <div className="num" style={{ fontSize: 15, fontWeight: 800, lineHeight: 1, color: 'var(--gold-bright)', textShadow: '0 1px 3px #000' }}>
                {armorClass}
              </div>
              <div className="lbl" style={{ fontSize: 6, color: 'var(--muted)' }}>CA</div>
            </div>
          </div>
        </div>
      </div>
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
            className="jg-rune"
            title={`Sauvegarde de ${ABILITY_NAMES[ability]}`}
            style={{
              border: isProficient ? '1.5px solid var(--accent)' : '1px solid var(--gold-dim)',
              background: isProficient
                ? 'linear-gradient(180deg, var(--accent-wash), rgba(0,0,0,.45))'
                : 'linear-gradient(180deg, rgba(255,255,255,.04), rgba(0,0,0,.42))',
              boxShadow: isProficient
                ? '0 0 9px -1px var(--accent-glow), inset 0 1px 2px rgba(0,0,0,.4)'
                : 'inset 0 1px 2px rgba(0,0,0,.4)',
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
          style={{ textAlign: 'center', padding: '5px 0', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gold-dim)' }}
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

function ActionCard({ card, playable, retard = 0, onPlay }: {
  card: PlayableCard;
  /** Jouable maintenant : pleinement lisible et actionnable. */
  playable: boolean;
  /** Décalage d'entrée, en ms — le rang de la carte dans la pile. */
  retard?: number;
  onPlay: (card: PlayableCard) => void;
}) {
  const hasNumbers = card.toHit !== undefined || card.damage || card.spellSave;
  // Les pastilles montrent le paiement PROPOSÉ — le premier qui reste
  // disponible. Quand il y en a plusieurs, le joueur tranchera.
  const paiementAffiche = card.resources?.find((res) => res.remaining > 0) ?? card.resources?.[0];
  const boutonLabel = card.equipWeaponId ? 'Équiper' : card.toHit !== undefined ? 'Attaquer' : 'Utiliser';
  return (
    <div
      // Les cartes jouables se déroulent une à une à l'ouverture de l'onglet.
      // Rien pour celles qui ne le sont pas : elles sont rangées, pas
      // annoncées — et leur estompage (`opacity: .42`) se ferait de toute
      // façon écraser par la fin d'une animation d'entrée.
      className={`card jg-tile${playable ? ' jg-anim-rise' : ''}`}
      style={{
        animationDelay: playable ? `${retard}ms` : undefined,
        // AUCUNE carte n'est mise en avant. La première jouable avait
        // longtemps une bordure claire, un titre plus grand et ses chiffres
        // en gros : ça la faisait lire comme une recommandation de l'appli,
        // alors que ce n'est qu'un tri par économie d'action — l'ordre suffit
        // à le dire. Ses chiffres n'ont pas disparu pour autant, ils sont
        // passés sur TOUTES les cartes qui en ont (voir plus bas) : les
        // enlever avec la mise en avant aurait fait perdre les dégâts d'une
        // arme, qui ne s'affichent nulle part ailleurs.
        borderColor: 'var(--gold-dim)',
        borderWidth: 1,
        borderStyle: card.granted ? 'dashed' : 'solid',
        borderRadius: 12,
        padding: playable ? 14 : '12px 14px',
        // Seul ce qui n'est PAS jouable est atténué. Une carte jouable reste
        // pleinement lisible, même quand elle n'est pas la première.
        opacity: playable ? 1 : 0.42,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Presque le double de l'ancienne taille (15 px), à la demande :
            à 15 px les médaillons se lisaient mal en pleine partie. */}
        <DamageTypeIcons types={card.damageTypes} size={28} />
        <div
          className="ttl"
          style={{
            fontSize: 15, flexGrow: 1, minWidth: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {card.name}
        </div>
        {playable && paiementAffiche && (
          // Le rappel d'emplacement rejoint la ligne du nom — à côté du
          // bouton, plutôt qu'en dessous : c'est ce qui gardait ces cartes
          // larges quand toutes les autres avaient déjà rétréci.
          <div style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3,
            padding: '4px 6px', borderRadius: 999,
            border: '1px solid var(--gold-dim)', background: 'rgba(0,0,0,.4)',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,.75)',
          }}>
            {/* Au-delà de six pastilles on ne compte plus : on chiffre. */}
            {paiementAffiche.max > 6 ? (
              <span className="num" style={{ fontSize: 12, fontWeight: 700 }}>
                {paiementAffiche.remaining}/{paiementAffiche.max}
              </span>
            ) : Array.from({ length: paiementAffiche.max }, (_, index) => (
              <Pip key={index} filled={index < paiementAffiche.remaining} />
            ))}
          </div>
        )}
        {playable && (
          // Le bouton vit sur la ligne du nom, en petit — « Clair de lune
          // (Utiliser) » — plutôt qu'en pleine largeur tout en bas de la
          // carte : c'est ce qui la faisait paraître si haute.
          <button
            onClick={() => onPlay(card)}
            className="jg-btn-cold"
            style={{
              flexShrink: 0, minHeight: 30, padding: '0 12px', borderRadius: 999,
              border: '1.5px solid var(--accent)', fontSize: 11, fontWeight: 700,
            }}
          >
            {boutonLabel}
          </button>
        )}
      </div>

      <div className="lbl" style={{ marginTop: 3 }}>
        <span>{ECONOMY_LABEL[card.economy]}</span>
        {card.detail && (
          <span style={{ textTransform: 'none', color: 'var(--muted)' }}> · {card.detail}</span>
        )}
        {playable && (card.resources?.length ?? 0) > 1 && (
          // Plusieurs ressources peuvent payer ce sort (multiclasse,
          // lancements gratuits d'un Rôdeur…) : le choix se fait à l'appui
          // sur « Utiliser », cette mention rappelle juste qu'il existe.
          <span style={{ textTransform: 'none', color: 'var(--accent)' }}> · au choix</span>
        )}
      </div>

      {card.granted && (
        <div className="lbl" style={{ textTransform: 'none', marginTop: 2, color: 'var(--accent)' }}>
          {/* La provenance vient de la carte quand elle en a une : « accordé
              par ton don » ne dit pas d'où, et c'est précisément ce que le
              joueur cherchera à la séance suivante. */}
          {card.grantedBy ? `accordé par ${card.grantedBy} · hors budget` : 'accordé · hors budget'}
        </div>
      )}

      {hasNumbers && (
        // Plus petits qu'au temps de la carte mise en avant (27 px) : ils
        // informent, ils ne proclament plus.
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, margin: '8px 0 2px' }}>
          {card.toHit !== undefined && (
            <div>
              <div className="num" style={{ fontSize: 19, fontWeight: 700, lineHeight: 1, color: 'var(--accent)' }}>
                {sign(card.toHit)}
              </div>
              <div className="lbl" style={{ marginTop: 3 }}>touche</div>
            </div>
          )}
          {card.damage && (
            <div>
              <div className="num" style={{ fontSize: 19, fontWeight: 700, lineHeight: 1 }}>{card.damage}</div>
              <div className="lbl" style={{ marginTop: 3 }}>dégâts</div>
            </div>
          )}
          {card.spellSave && (
            <div>
              <div className="num" style={{ fontSize: 19, fontWeight: 700, lineHeight: 1, color: 'var(--accent)' }}>
                {card.spellSave.dc}
              </div>
              <div className="lbl" style={{ marginTop: 3 }}>
                {/* Le DD, puis QUI doit sauver — sans ça « DD 15 » ne dit pas
                    à quel jet de sauvegarde de la cible il faut le comparer. */}
                DD sauvegarde {ABILITY_ABBREVIATIONS[card.spellSave.ability]}
              </div>
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
  onUtiliserObjet,
  etatDeMort,
  onLancerJetContreLaMort,
  onNoterJetContreLaMort,
  onStabiliser,
  onReinitialiserJetsContreLaMort,
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
  /**
   * Une carte d'objet vient d'être jouée (`card.useItemId`) : tire les dés
   * s'il y en a et consomme l'objet, en un seul geste
   * (`model/inventory.ts`, `useActionItem`). Synchrone, pour que cet écran
   * affiche le résultat dès l'appui, sans attendre l'aller-retour réseau.
   */
  onUtiliserObjet?: (itemId: string) => { itemName: string; jet: JetDeDes | null } | null;
  /** Où en est le personnage tombé à 0 PV — voir `model/death-state.ts`. */
  etatDeMort?: EtatDeMort;
  /** Lance un d20 contre la mort et applique le résultat ; rend le dé tiré. */
  onLancerJetContreLaMort?: () => { de: number; resultat: ResultatJet } | null;
  /** Enregistre un jet fait avec un dé de la table. */
  onNoterJetContreLaMort?: (resultat: ResultatJet) => void;
  onStabiliser?: () => void;
  onReinitialiserJetsContreLaMort?: () => void;
}) {
  const [spent, setSpent] = useState<TurnContext['spent']>({});
  const [tourSuivi, setTourSuivi] = useState(turnId);
  // Comme pour le Sac : l'objet joué peut disparaître de `cards` au même
  // geste (dernière unité) — le résultat vit donc ici, jamais dans la carte
  // qui l'a déclenché, sinon il disparaîtrait avec elle.
  const [dernierObjet, setDernierObjet] = useState<{ nom: string; jet: JetDeDes | null } | null>(null);
  // Le dernier d20 contre la mort, gardé ici pour être MONTRÉ : la fiche ne
  // retient que ses conséquences (un succès de plus), jamais le dé lui-même.
  const [dernierDeMort, setDernierDeMort] = useState<
    { de: number; resultat: ResultatJet; cle: number } | null
  >(null);
  // Narrow d'un coup : `aTerre` porte l'état quand il y en a un, `null`
  // sinon — ce qui évite de retester `etatDeMort` à chaque usage.
  const aTerre = etatDeMort?.aTerre ? etatDeMort : null;

  // Remise à zéro pendant le rendu, sans effet différé : l'écran ne doit
  // jamais afficher, même un instant, l'économie du tour précédent.
  if (turnId !== tourSuivi) {
    setTourSuivi(turnId);
    setSpent({});
  }
  const derived = useMemo(() => deriveCharacter(sheet), [sheet]);
  // La matière de « Braise et fer » : l'accent et le métal d'ornement
  // changent avec la classe, jamais le reste — voir `class-themes.ts`. Un
  // multiclassé prend la matière de sa classe au plus haut niveau.
  const theme = useMemo(() => themeDeClasse(sheet.classLevels), [sheet.classLevels]);
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
    const comptes: Record<CardCategory, number> = { magie: 0, distance: 0, melee: 0, objets: 0 };
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
    else if (card.useItemId) {
      const resultat = onUtiliserObjet?.(card.useItemId);
      if (resultat) setDernierObjet({ nom: resultat.itemName, jet: resultat.jet });
    }
    // Bénédiction du Ténébreux ne paie rien (« Libre », sans `resources`) :
    // sans ce cas, une carte sans paiement ne prévenait jamais l'écran
    // parent, comme un sort mineur qu'on relance sans rien à retenir. Elle,
    // en revanche, doit vraiment écrire les PV temporaires sur la fiche.
    else if (paiement || card.id === BENEDICTION_TENEBREUX_CARD_ID) onPlayCard?.(card, paiement?.key ?? '', cible);
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
      // Surcharge la matière socle par celle de la classe — seuls ces jetons
      // bougent (voir `theme.css`) : la structure et le rouge vital restent
      // fixes, quelle que soit la classe regardée. `--accent-wash` reste
      // OPAQUE (comme partout ailleurs dans l'appli, bandeau MJ compris) —
      // `--accent-glow`, translucide, est le seul jeton fait pour les halos.
      ...{
        '--accent': theme.accent,
        '--accent-wash': theme.accentWash,
        '--accent-glow': theme.accentGlow,
        '--gold': theme.gold,
        '--gold-bright': theme.goldBright,
        '--gold-dim': theme.goldDim,
      } as React.CSSProperties,
    }}>

      {/* ───── Zone figée : ne défile jamais ───── */}
      <header style={{
        flexShrink: 0, background: 'var(--surface)', borderBottom: '1px solid var(--line)',
        boxShadow: 'var(--raise)', padding: '8px 14px 8px',
        paddingTop: 'calc(8px + env(safe-area-inset-top))',
      }}>
        {/*
          Pas de nom ni de classe ici : la Fiche les porte désormais en tête,
          et le MJ a le bandeau « Tu modifies la fiche de X » juste au-dessus.
          Dans un en-tête qui ne défile jamais, une ligne purement décorative
          se paie sur toute la hauteur restante.

          L'en-tête entier est resserré au maximum : c'est le rouleau de
          cartes en dessous qui doit gagner la hauteur, pas l'orbe.
        */}
        <div style={{ display: 'flex', alignItems: 'stretch', marginBottom: 4 }}>
          <HitPoints
            current={derived.currentHp}
            max={derived.maxHp}
            armorClass={derived.armorClass}
            temporary={derived.temporaryHp}
            onChange={(delta) => onSpendHp?.(delta)}
          />
        </div>

        <div style={{ marginBottom: 5 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
            <div className="lbl" style={{ flexGrow: 1, fontSize: 10 }}>Jets de sauvegarde</div>
            {/* Le modificateur d'initiative n'apparaissait nulle part sur
                l'écran de combat — seulement déductible de la case DEX de la
                Fiche. Sur la ligne des sauvegardes plutôt qu'une ligne à lui
                seul : l'en-tête n'a plus de hauteur à céder. */}
            <div className="lbl" style={{ fontSize: 10 }}>Initiative {sign(derived.modifiers.dex)}</div>
          </div>
          <SaveStrip
            modifiers={derived.modifiers}
            proficient={derived.saveProficiencies}
            bonus={derived.proficiencyBonus}
            malusD20={derived.exhaustion.d20Penalty}
          />
        </div>

        {/*
          Le rappel par carte dit ce QU'UN sort précis coûterait ; celui-ci dit
          ce qu'il RESTE, tous rangs confondus, sans avoir à ouvrir chaque
          carte pour le recompter. Une seule ligne de pastilles compactes —
          l'en-tête est déjà tendu au maximum, pas question de lui reprendre
          la hauteur qu'on vient de lui rendre.
        */}
        <SpellSlotsSummary slots={derived.spellcasting.slots} />

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
        flexShrink: 0, background: 'var(--surface)', borderBottom: '1.5px solid var(--gold-dim)',
        padding: '6px 14px 6px', display: 'flex', gap: 6,
      }}>
        {CARD_CATEGORIES.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setOnglet(id)}
            style={{
              flexGrow: 1, minHeight: 34, borderRadius: '8px 8px 4px 4px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 5,
              background: onglet === id
                ? 'linear-gradient(180deg, var(--accent-wash), rgba(0,0,0,.3))'
                : 'linear-gradient(180deg, rgba(255,255,255,.035), rgba(0,0,0,.3))',
              boxShadow: onglet === id
                ? '0 0 0 1.5px var(--gold), inset 0 1px 0 rgba(255,235,190,.3), 0 0 16px -4px var(--accent-glow)'
                : '0 0 0 1px var(--gold-dim), inset 0 1px 0 rgba(255,235,190,.08)',
              color: onglet === id ? 'var(--gold-bright)' : 'var(--muted)',
              fontSize: 12, fontWeight: 700,
            }}
          >
            <TabIcon categorie={id} color={onglet === id ? 'var(--gold-bright)' : 'var(--muted)'} />
            <span className="ttl" style={{ fontSize: 11, letterSpacing: '.03em' }}>
              {label}{comptesParCategorie[id] > 0 ? ` ${comptesParCategorie[id]}` : ''}
            </span>
          </button>
        ))}
      </div>

      {/* ───── Rouleau réordonné ───── */}
      <main style={{
        flexGrow: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: 11,
      }}>
        {dernierObjet && (
          <div
            className="jg-tile jg-anim-pop"
            style={{
              padding: '10px 12px', borderRadius: 'var(--radius)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              border: '1px solid var(--ok)',
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ok)' }}>
                {dernierObjet.nom}
                {dernierObjet.jet ? <> — <NombreQuiRoule total={dernierObjet.jet.total} /> PV</> : ' — utilisé'}
              </div>
              {dernierObjet.jet && (
                <div className="lbl" style={{ textTransform: 'none', marginTop: 2, color: 'var(--muted)' }}>
                  {dernierObjet.jet.des.join(' + ')}
                  {dernierObjet.jet.bonus ? ` ${dernierObjet.jet.bonus > 0 ? '+' : '−'} ${Math.abs(dernierObjet.jet.bonus)}` : ''}
                </div>
              )}
            </div>
            <button
              onClick={() => setDernierObjet(null)}
              aria-label="Fermer"
              style={{ flexShrink: 0, width: 32, height: 32, color: 'var(--muted)', fontSize: 16 }}
            >
              ✕
            </button>
          </div>
        )}
        {/* À terre, les cartes n'ont plus lieu d'être : un personnage
            inconscient ne lance pas un sort. L'écran ne montre donc que ce
            qu'il lui reste à faire — ses jets contre la mort — au lieu d'un
            rouleau de boutons qu'aucune règle ne l'autorise à toucher. */}
        {aTerre ? (
          <DeathSavesPanel
            etat={aTerre}
            dernierDe={dernierDeMort}
            onNoter={(resultat) => { setDernierDeMort(null); onNoterJetContreLaMort?.(resultat); }}
            onLancer={() => {
              const jet = onLancerJetContreLaMort?.();
              if (jet) setDernierDeMort({ ...jet, cle: Date.now() });
            }}
            onStabiliser={() => { setDernierDeMort(null); onStabiliser?.(); }}
            onReinitialiser={() => { setDernierDeMort(null); onReinitialiserJetsContreLaMort?.(); }}
          />
        ) : featured.map((card, index) => (
          // Le décalage s'arrête à la sixième : au-delà, la dernière carte
          // attendrait plus longtemps que le temps qu'on met à la lire.
          <ActionCard
            key={card.id} card={card} playable
            retard={Math.min(index, 5) * 55} onPlay={play}
          />
        ))}

        {!aTerre && muted.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '2px 2px 0' }}>
            <div className="lbl">
              {!inCombat ? 'indisponible' : isYourTurn ? 'plus tard dans le tour' : 'rangé pour l’instant'}
            </div>
            <div style={{ flexGrow: 1, height: 1, background: 'var(--line)' }} />
          </div>
        )}
        {!aTerre && muted.map((card) => (
          <ActionCard key={card.id} card={card} playable={false} onPlay={play} />
        ))}

        {!aTerre && featured.length === 0 && muted.length === 0 && (
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
