import { useEffect, useState } from 'react';

/**
 * Un résultat de dé qui se POSE au lieu d'apparaître.
 *
 * Le tirage est déjà fait quand ce composant s'affiche (voir `domain/dice.ts`,
 * `model/inventory.ts`, `model/death-state.ts`) : ce défilé ne tire rien du
 * tout, il retarde seulement l'annonce, le temps qu'on ait l'impression
 * d'avoir lancé quelque chose. Les valeurs qui passent sont donc du DÉCOR —
 * le nombre affiché à l'arrivée est exactement celui qui a été joué, jamais
 * un autre, et rien de ce qui en découle (les PV rendus, un succès contre la
 * mort) n'attend la fin du défilé pour être vrai.
 */
export function NombreQuiRoule({ total, plage }: {
  total: number;
  /**
   * Ce qui défile avant de se poser. Par défaut, quelques valeurs autour du
   * résultat : un défilé qui passerait par 40 sur un 2d4+2 se lirait comme un
   * bug, pas comme un dé qui roule. Un d20 annonce ses 20 faces (`[1, 20]`).
   */
  plage?: { min: number; max: number };
}) {
  const [affiche, setAffiche] = useState(total);
  const min = plage?.min;
  const max = plage?.max;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setAffiche(total);
      return;
    }
    const bas = min ?? Math.max(1, total - 4);
    const haut = max ?? total + 4;
    const fin = Date.now() + 420;
    const battement = window.setInterval(() => {
      if (Date.now() >= fin) {
        window.clearInterval(battement);
        setAffiche(total);
        return;
      }
      setAffiche(bas + Math.floor(Math.random() * Math.max(1, haut - bas + 1)));
    }, 55);
    return () => window.clearInterval(battement);
  }, [total, min, max]);

  return <>{affiche}</>;
}
