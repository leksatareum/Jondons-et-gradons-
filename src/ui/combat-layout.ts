import type { DerivedCharacter } from '../model/derive';

/**
 * Ordonnancement des cartes de l'écran de combat.
 *
 * L'idée qui distingue cet écran : le rouleau se réordonne selon le contexte.
 * À ton tour, tes actions passent devant. Quand ce n'est PAS ton tour, ce sont
 * tes réactions — parce que c'est précisément le moment où tu en as besoin, et
 * c'est l'ordre inverse de ce qu'affichent la plupart des fiches.
 *
 * Rien n'est jamais masqué : ce qui n'est pas jouable tout de suite est
 * relégué et atténué, pas retiré. Un joueur doit pouvoir vérifier ce qu'il
 * aura au tour suivant sans changer d'écran.
 *
 * Logique pure, sans React : c'est la règle d'affichage, elle se teste.
 */

export type Economy = 'action' | 'bonus' | 'reaction' | 'libre';

export interface PlayableCard {
  id: string;
  name: string;
  economy: Economy;
  /** Ligne de détail : portée, dégâts, effet — déjà dérivée. */
  detail?: string;
  toHit?: number;
  damage?: string;
  /** Ressource consommée, affichée en pastilles. */
  resource?: { key: string; remaining: number; max: number; label: string };
  /** Accordé par un don ou une invocation : hors budget de sorts préparés. */
  granted?: boolean;
}

/**
 * Le tour par tour n'existe QUE lorsque le MJ l'a lancé.
 *
 * Hors combat, un personnage n'a ni action, ni action bonus, ni réaction à
 * suivre : ces notions n'ont de sens que dans l'ordre d'initiative. Afficher
 * une économie d'action en exploration, c'est inventer une contrainte que le
 * jeu ne pose pas — et c'est ce que faisait la première version de cet écran.
 *
 * La source de vérité est la rencontre du MJ, qui se synchronise. L'écran du
 * joueur ne fait que la refléter : il ne décide jamais d'entrer en combat.
 */
export type TurnMode =
  | { mode: 'libre' }
  | { mode: 'combat'; isYourTurn: boolean; holder?: string };

export interface TurnContext {
  turn: TurnMode;
  /** Économies déjà dépensées ce tour. Sans objet hors combat. */
  spent?: Partial<Record<Economy, boolean>>;
}

export interface CombatLayout {
  /** Jouable maintenant, dans l'ordre. La première est mise en avant. */
  featured: PlayableCard[];
  /** Le reste, présent mais atténué. */
  muted: PlayableCard[];
  available: Record<Economy, boolean>;
  /** Faux hors combat : il n'y a alors pas d'économie d'action à montrer. */
  showEconomy: boolean;
}

const priority = (isYourTurn: boolean): Economy[] =>
  isYourTurn ? ['action', 'bonus', 'libre', 'reaction'] : ['reaction', 'libre', 'action', 'bonus'];

export function isPlayableNow(card: PlayableCard, context: TurnContext): boolean {
  if (card.resource && card.resource.remaining <= 0) return false;
  // Hors combat, rien n'est contraint : seule une ressource épuisée bloque.
  if (context.turn.mode === 'libre') return true;
  if (context.spent?.[card.economy]) return false;
  return context.turn.isYourTurn ? card.economy !== 'reaction' : card.economy === 'reaction';
}

export function layoutCombatCards(cards: PlayableCard[], context: TurnContext): CombatLayout {
  // Hors combat, aucun réordonnancement : l'ordre naturel des cartes suffit,
  // il n'y a pas de « moment » qui rendrait l'une plus pertinente qu'une autre.
  if (context.turn.mode !== 'combat') {
    const featured: PlayableCard[] = [];
    const muted: PlayableCard[] = [];
    for (const card of cards) (isPlayableNow(card, context) ? featured : muted).push(card);
    return {
      featured,
      muted,
      available: { action: true, bonus: true, reaction: true, libre: true },
      showEconomy: false,
    };
  }

  const { isYourTurn } = context.turn;
  const order = priority(isYourTurn);
  const rank = (card: PlayableCard) => order.indexOf(card.economy);
  const byRank = (a: PlayableCard, b: PlayableCard) => rank(a) - rank(b);

  const featured: PlayableCard[] = [];
  const muted: PlayableCard[] = [];
  for (const card of cards) (isPlayableNow(card, context) ? featured : muted).push(card);
  featured.sort(byRank);
  muted.sort(byRank);

  return {
    featured,
    muted,
    showEconomy: true,
    available: {
      action: isYourTurn && !context.spent?.action,
      bonus: isYourTurn && !context.spent?.bonus,
      // La réaction se garde d'un tour à l'autre : elle reste disponible hors
      // de ton tour, contrairement à l'action et à l'action bonus.
      reaction: !context.spent?.reaction,
      libre: isYourTurn,
    },
  };
}

/**
 * Ressources dérivées converties en pastilles. Les épuisées ne disparaissent
 * pas — savoir qu'on n'a plus de Forme sauvage est une information, pas un vide.
 */
export const resourcePips = (derived: DerivedCharacter) =>
  derived.resources.map((resource) => ({
    key: resource.key,
    label: resource.name,
    remaining: resource.remaining,
    max: resource.max,
    recharge: resource.recharge,
  }));
