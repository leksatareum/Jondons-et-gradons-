import type { CharacterSheet } from './character';

/**
 * Dépenser ce qui paie une carte jouée sur l'écran de combat.
 *
 * Jusqu'ici, appuyer sur « Utiliser » ne faisait que cocher l'économie
 * d'action en mémoire locale de l'écran — rien n'était écrit sur la fiche.
 * Un sort avec emplacement se relançait donc à l'identique après un
 * rechargement, la pastille jamais entamée : ce n'est pas que rien ne se
 * passait à l'écran, c'est que rien ne se passait du tout.
 *
 * La clé vient telle quelle de `PlayableCard.resource.key` (voir
 * `spell-cards.ts`) : `emplacement-<rang>` pour un sort payé par un
 * emplacement, `pacte` pour la réserve de Magie de pacte, ou la clé d'une
 * ressource nommée (don accordé…) pour le reste. Ce module ne connaît pas
 * `PlayableCard` — seulement des chaînes — pour ne pas faire dépendre le
 * modèle de l'écran.
 */
export function spendResource(sheet: CharacterSheet, resourceKey: string): CharacterSheet {
  const rangEmplacement = /^emplacement-(\d+)$/.exec(resourceKey);
  if (rangEmplacement) {
    const rang = Number(rangEmplacement[1]);
    return {
      ...sheet,
      live: {
        ...sheet.live,
        spellSlotsSpent: {
          ...sheet.live.spellSlotsSpent,
          [rang]: (sheet.live.spellSlotsSpent[rang] ?? 0) + 1,
        },
      },
    };
  }

  if (resourceKey === 'pacte') {
    return { ...sheet, live: { ...sheet.live, pactSlotsSpent: (sheet.live.pactSlotsSpent ?? 0) + 1 } };
  }

  return {
    ...sheet,
    live: {
      ...sheet.live,
      resourcesSpent: {
        ...sheet.live.resourcesSpent,
        [resourceKey]: (sheet.live.resourcesSpent[resourceKey] ?? 0) + 1,
      },
    },
  };
}
