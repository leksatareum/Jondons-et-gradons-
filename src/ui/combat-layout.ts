import type { DerivedCharacter } from '../model/derive';
import type { AbilityId } from '../content/character-basics';

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

export interface PayableResource {
  key: string;
  remaining: number;
  max: number;
  label: string;
}

export interface PlayableCard {
  id: string;
  name: string;
  economy: Economy;
  /** Ligne de détail : portée, dégâts, effet — déjà dérivée. */
  detail?: string;
  toHit?: number;
  damage?: string;
  /**
   * Le DD à annoncer quand ce sort impose une sauvegarde plutôt qu'une
   * attaque (`domain/spell-roll-type.ts`) — jamais les deux en même temps
   * qu'un `toHit` sur la même carte, un sort tire l'un ou l'autre.
   * `ability` est la caractéristique lue dans le texte du sort ; `dc` est le
   * DD DU LANCEUR, calculé sur la fiche (`model/derive.ts`,
   * `SpellcastingNumbers`) — jamais extrait du texte.
   */
  spellSave?: { dc: number; ability: AbilityId };
  /**
   * Types de dégâts lus dans le texte du sort (`domain/spell-damage-types.ts`)
   * — jamais un chiffre, seulement le badge coloré qui dit « feu », « froid »…
   * Absent pour une carte d'arme : son type se lit déjà sur l'arme elle-même.
   */
  damageTypes?: string[];
  /**
   * Les paiements LÉGAUX de cette carte, du moins cher au plus cher — pas
   * un seul. Un sort de rang 1 se lance avec un emplacement de rang 1 ou
   * de n'importe quel rang supérieur ; un multiclassé Occultiste peut le
   * payer avec un emplacement de pacte ; un Rôdeur a ses lancements
   * gratuits de Marque du chasseur. Choisir d'office le moins cher, c'était
   * décider à la place du joueur.
   *
   * Absent ou vide : la carte ne coûte rien.
   */
  resources?: PayableResource[];
  /** Accordé par un don ou une invocation : hors budget de sorts préparés. */
  granted?: boolean;
  /** D'où vient ce qui a été accordé, en clair — « Génie du désert ». */
  grantedBy?: string;
  /**
   * Change l'arme en main au lieu d'attaquer ou de lancer un sort — l'id du
   * catalogue vers lequel basculer. Ne coûte ni emplacement ni ressource,
   * seulement l'Action du tour (comme n'importe quelle autre carte) : hors
   * combat, où l'économie d'action ne s'applique pas, l'équiper reste libre.
   */
  equipWeaponId?: string;
  /**
   * Utiliser un objet du sac au lieu d'attaquer ou de lancer un sort — l'id
   * de la ligne d'inventaire visée (`ui/item-cards.ts`). Comme
   * `equipWeaponId`, ne coûte que l'économie d'action de la carte ; jouer
   * la carte tire les dés s'il y en a (une potion) et consomme l'objet.
   */
  useItemId?: string;
  /**
   * Magie, à distance, corps à corps ou objets — pour trier le rouleau en
   * quatre onglets plutôt qu'un seul tas. Une carte de sort la porte
   * toujours ; une carte d'arme ou d'« Équiper » la déduit de l'arme visée ;
   * une carte d'objet vaut toujours « objets ».
   */
  category: CardCategory;
}

export type CardCategory = 'magie' | 'distance' | 'melee' | 'objets';

export const CARD_CATEGORIES: { id: CardCategory; label: string }[] = [
  { id: 'magie', label: 'Magie' },
  { id: 'distance', label: 'À distance' },
  { id: 'melee', label: 'Mêlée' },
  { id: 'objets', label: 'Objets' },
];

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
  // Épuisée seulement si AUCUN paiement légal ne reste : plus d'emplacement
  // de rang 1 mais un de rang 2 disponible, le sort se lance encore.
  if (card.resources?.length && card.resources.every((res) => res.remaining <= 0)) return false;
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
