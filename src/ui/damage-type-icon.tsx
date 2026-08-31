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
      style={{
        display: 'inline-flex', flexShrink: 0, width: size, height: size, borderRadius: '50%',
        boxShadow: '0 0 0 1px rgba(0,0,0,.35)', overflow: 'hidden',
      }}
    >
      {/* `object-fit: cover` inscrit le médaillon carré dans le cercle — les
          quatre coins (fond noir hors du cadre bronze) se retrouvent hors
          cadrage, comme prévu par le recadrage circulaire des images sources. */}
      <img src={src} alt="" width={size} height={size} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
