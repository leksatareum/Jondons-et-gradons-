/**
 * Le petit badge de type de dégâts sur une carte de sort.
 *
 * Treize types, treize médaillons — fournis par le joueur (voir la demande
 * « les tiens sont miches ») plutôt que dessinés à la main. Chaque badge
 * porte aussi un `title` (l'infobulle) et un `aria-label`, pour que « quel
 * type ? » ait toujours une réponse en texte, pas seulement en image.
 */

import acide from '../assets/damage-types/acide.png';
import contondants from '../assets/damage-types/contondants.png';
import feu from '../assets/damage-types/feu.png';
import force from '../assets/damage-types/force.png';
import foudre from '../assets/damage-types/foudre.png';
import froid from '../assets/damage-types/froid.png';
import necrotiques from '../assets/damage-types/necrotiques.png';
import perforants from '../assets/damage-types/perforants.png';
import poison from '../assets/damage-types/poison.png';
import psychiques from '../assets/damage-types/psychiques.png';
import radiants from '../assets/damage-types/radiants.png';
import tonnerre from '../assets/damage-types/tonnerre.png';
import tranchants from '../assets/damage-types/tranchants.png';

/** Un médaillon par type — la clef est le mot du texte de règle, en minuscules. */
const IMAGES: Record<string, string> = {
  feu, froid, foudre, tonnerre, acide, poison,
  nécrotiques: necrotiques, radiants, psychiques, force,
  contondants, perforants, tranchants,
};

/** Nom lisible, tel qu'affiché dans l'infobulle — mêmes mots que `DAMAGE_TYPES`. */
export const damageTypeLabel = (type: string): string => type;

export function DamageTypeIcon({ type, size = 16 }: { type: string; size?: number }) {
  const src = IMAGES[type.toLocaleLowerCase('fr')];
  if (!src) return null;
  return (
    <span
      title={`Dégâts ${type}`}
      aria-label={`Dégâts ${type}`}
      role="img"
      // Ni cercle de rognage ni cerne noir : les PNG sont détourés en disque,
      // avec leur propre bord de métal. Le cerne les doublait d'un halo sombre,
      // et le rognage ne servait plus qu'à masquer des coins qui n'existent
      // plus.
      style={{ display: 'inline-flex', flexShrink: 0, width: size, height: size }}
    >
      <img src={src} alt="" width={size} height={size} style={{ width: '100%', height: '100%' }} />
    </span>
  );
}

/** Une ligne de badges — l'ordre du texte, jamais réordonné. */
export function DamageTypeIcons({ types, size }: { types: string[] | undefined; size?: number }) {
  if (!types?.length) return null;
  return (
    <span style={{ display: 'inline-flex', gap: 3, flexShrink: 0 }}>
      {types.map((type) => <DamageTypeIcon key={type} type={type} size={size} />)}
    </span>
  );
}

/**
 * Les mêmes badges, dans un emplacement de LARGEUR FIXE — pour la carte de
 * combat, où le médaillon précède le nom.
 *
 * Cette largeur constante est ce qui autorise le médaillon à passer devant le
 * nom : sans elle, une carte à deux types décalerait son titre plus loin que
 * ses voisines et la colonne des noms se mettrait à zigzaguer — c'est
 * exactement le défaut qui l'avait fait reléguer derrière le nom la première
 * fois. Les cartes sans type gardent l'emplacement vide, au même titre.
 *
 * Cinq sorts du catalogue sur 389 portent deux types : ils se chevauchent
 * légèrement plutôt que d'élargir l'emplacement pour tout le monde.
 */
export function DamageTypeSlot({ types, size = 30 }: { types: string[] | undefined; size?: number }) {
  const liste = types ?? [];
  return (
    <span
      aria-hidden={liste.length === 0}
      style={{
        display: 'inline-flex', flexShrink: 0, width: size, height: size,
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      {liste.map((type, index) => (
        <span key={type} style={{ marginLeft: index > 0 ? -size * 0.42 : 0, display: 'inline-flex' }}>
          <DamageTypeIcon type={type} size={liste.length > 1 ? size * 0.78 : size} />
        </span>
      ))}
    </span>
  );
}
