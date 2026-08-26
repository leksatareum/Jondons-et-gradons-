/**
 * Ressources propres à chaque Patron de l'Occultiste — dérivées du niveau ou
 * de la caractéristique, jamais stockées.
 *
 * ⚠️ Repêchées de la SORTIE CONSTRUITE de `table-connectee/src/App.jsx`
 * (`SUBCLASS_RESOURCES`). Une première version de ce fichier avait été
 * extraite du texte source : le Grand Ancien et l'Archifée y étaient faux,
 * la chaîne de plugins réécrivant les deux entrées (cf.
 * `docs/legacy-rules-backlog.md`, §4nono).
 *
 * `abilityModifier` est toujours le modificateur de Charisme (caractéristique
 * d'incantation de l'Occultiste), sauf mention contraire.
 */

const clampLevel = (level: number): number => Math.max(1, Math.min(20, Math.floor(level)));

/**
 * Patron Céleste — Lumière guérisseuse (niveau 3+) : réserve de d6 dépensés
 * en action bonus pour soigner. Motif simple (niveau + 1), plausible mais
 * pas confirmé page à page.
 */
export const celestialHealingLightDice = (level: number): number => {
  const lv = clampLevel(level);
  return lv >= 3 ? lv + 1 : 0;
};

/**
 * Patron Fiélon — Chance du Ténébreux (niveau 6+) : ajoute 1d10 à un test de
 * caractéristique ou une sauvegarde. Usages = modificateur de Charisme,
 * minimum 1. Motif identique à Voile de la nature (Rôdeur) et vérifié
 * contre la règle connue (« Dark One's Own Luck »).
 */
export const fiendDarkOnesLuckUses = (level: number, charismaModifier: number): number =>
  clampLevel(level) >= 6 ? Math.max(1, charismaModifier) : 0;

/**
 * Patron Grand Ancien — Combattant clairvoyant (niveau 6+) : à la formation
 * d'Esprit éveillé, la cible fait une sauvegarde de Sagesse ; en cas d'échec,
 * tu as l'avantage à tes attaques contre elle et elle a le désavantage contre
 * toi.
 *
 * CORRIGÉ : une seule utilisation, rechargée au repos COURT (et restaurable
 * en dépensant un emplacement de pacte) — et non trois à six utilisations par
 * repos long comme l'indiquait le texte source d'App.jsx.
 */
export const greatOldOneClairvoyantCombatantUses = (level: number): number =>
  clampLevel(level) >= 6 ? 1 : 0;

export const GREAT_OLD_ONE_CLAIRVOYANT_RECHARGE = 'court' as const;

/**
 * Patron Archifée — Pas des fées (niveau 3+) : Pas brumeux sans emplacement,
 * assorti d'un effet féerique au choix.
 *
 * CORRIGÉ : utilisations égales au modificateur de Charisme (minimum 1), et
 * non une table par niveau calquée sur le bonus de maîtrise comme l'indiquait
 * le texte source d'App.jsx.
 *
 * À ne pas confondre avec le « Pas des fées » du Rôdeur Vagabond féerique,
 * qui est une capacité différente (voir `ranger-resources.ts`).
 */
export const archfeyFeyStepUses = (level: number, charismaModifier: number): number =>
  clampLevel(level) >= 3 ? Math.max(1, charismaModifier) : 0;

/** Clé de la réserve — partagée par `derive.ts` (qui la déclare) et
 *  `ui/spell-cards.ts` (qui l'offre comme paiement de Pas brumeux). */
export const PAS_DES_FEES_KEY = 'occultiste:pas-des-fees';
