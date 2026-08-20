import { restoresAllOnShortRest } from '../domain/resource-recovery';
import { companionsAfterLongRest } from './companions';
import { druidLevel } from './wild-shape';
import type { CharacterSheet } from './character';
import type { DerivedCharacter } from './derive';

/**
 * Le repos.
 *
 * Rien n'était implémenté : les ressources se dépensaient sans jamais revenir,
 * et une Forme sauvage consommée le restait pour toujours. Ce module est le
 * seul endroit qui rende quoi que ce soit.
 *
 * Il ne rend que de l'état vivant. Aucune décision de personnage n'est touchée
 * — un repos ne change ni les sorts choisis, ni les dons accordés, ni rien de
 * ce qui définit le personnage. La seule exception apparente, le droit de
 * rechoisir ses sorts au repos long, n'en est pas une : ce droit se dérive de
 * la classe (`spellManagementMode`), il n'a pas à être stocké.
 */

export type RestKind = 'court' | 'long';

export interface RestOutcome {
  sheet: CharacterSheet;
  /** Ce qui a été rendu, pour le dire au joueur plutôt que le lui faire deviner. */
  recovered: string[];
}

/**
 * Un repos court.
 *
 * Ne rend ni points de vie ni emplacements de sort ordinaires : le personnage
 * dépense des dés de vie pour se soigner, et ce geste-là lui appartient. Ce
 * qui revient seul, ce sont les réserves dites « au repos court » — et les
 * emplacements de pacte, que l'Occultiste retrouve à chaque pause.
 */
export function shortRest(sheet: CharacterSheet, derived: DerivedCharacter): RestOutcome {
  const recovered: string[] = [];
  const resourcesSpent = { ...sheet.live.resourcesSpent };

  for (const resource of derived.resources) {
    if (!restoresAllOnShortRest(resource.recharge)) continue;
    if ((resourcesSpent[resource.key] ?? 0) === 0) continue;
    delete resourcesSpent[resource.key];
    recovered.push(resource.name);
  }

  const pacte = derived.spellcasting.slots.some((slot) => slot.pact);
  const pactSlotsSpent = pacte ? 0 : sheet.live.pactSlotsSpent;
  if (pacte && sheet.live.pactSlotsSpent > 0) recovered.push('Emplacements de pacte');

  return {
    sheet: { ...sheet, live: { ...sheet.live, resourcesSpent, pactSlotsSpent } },
    recovered,
  };
}

/**
 * Dés de vie récupérés à la fin d'un repos long : la moitié du total, arrondie
 * au supérieur, jamais moins d'un. Répartis sur les classes qui en ont
 * dépensé, en commençant par la première — un multiclassé choisira lui-même
 * quand l'écran le lui permettra ; jusque-là, un ordre stable vaut mieux qu'un
 * ordre arbitraire.
 */
function recoverHitDice(
  spent: Record<string, number>,
  total: number,
): { hitDiceSpent: Record<string, number>; rendus: number } {
  const aRendre = Math.max(1, Math.ceil(total / 2));
  const hitDiceSpent = { ...spent };
  let restant = aRendre;
  let rendus = 0;
  for (const classId of Object.keys(hitDiceSpent)) {
    if (restant <= 0) break;
    const dus = hitDiceSpent[classId];
    const pris = Math.min(dus, restant);
    if (pris <= 0) continue;
    restant -= pris;
    rendus += pris;
    if (dus - pris <= 0) delete hitDiceSpent[classId];
    else hitDiceSpent[classId] = dus - pris;
  }
  return { hitDiceSpent, rendus };
}

/**
 * Un repos long.
 *
 * Tout revient, sauf les dés de vie — dont la moitié seulement — et
 * l'épuisement, qui ne descend que d'un cran. Ces deux exceptions sont ce qui
 * fait qu'une journée difficile pèse encore le lendemain ; les gommer
 * changerait l'équilibre du jeu, pas seulement l'affichage.
 */
export function longRest(sheet: CharacterSheet, derived: DerivedCharacter): RestOutcome {
  const recovered: string[] = [];
  const live = sheet.live;

  if (live.damageTaken > 0) recovered.push(`${live.damageTaken} points de vie`);
  const emplacements = Object.values(live.spellSlotsSpent).reduce((somme, n) => somme + n, 0);
  if (emplacements > 0) recovered.push(`${emplacements} emplacement(s) de sort`);
  if (live.pactSlotsSpent > 0) recovered.push('Emplacements de pacte');

  for (const resource of derived.resources) {
    if ((live.resourcesSpent[resource.key] ?? 0) > 0) recovered.push(resource.name);
  }

  const totalDes = derived.hitDice.reduce((somme, entry) => somme + entry.total, 0);
  const { hitDiceSpent, rendus } = recoverHitDice(live.hitDiceSpent, totalDes);
  if (rendus > 0) recovered.push(`${rendus} dé(s) de vie`);
  if (live.exhaustion > 0) recovered.push('Un cran d’épuisement');

  // Une forme de bête apprise peut être échangée juste après le repos —
  // seulement maintenant, et une seule fois (PHB 2024, Forme sauvage).
  const wildShapeSwapOpen = druidLevel(sheet) >= 2 ? true : undefined;
  if (wildShapeSwapOpen) recovered.push('Une forme apprise peut être échangée');

  const avantCompagnons = sheet.companions ?? [];
  const apresRepos = companionsAfterLongRest({
    ...sheet,
    live: { ...live, damageTaken: 0, temporaryHp: 0, spellSlotsSpent: {}, pactSlotsSpent: 0, resourcesSpent: {}, hitDiceSpent, exhaustion: Math.max(0, live.exhaustion - 1), deathSaves: { success: 0, fail: 0 }, concentration: null, wildShapeSwapOpen },
  });
  for (const companion of avantCompagnons) {
    if (companion.expiresOnLongRest && !apresRepos.companions?.some((c) => c.id === companion.id)) {
      recovered.push(`${companion.name} disparaît (Compagnon sauvage)`);
    }
  }

  return { sheet: apresRepos, recovered };
}

export const rest = (sheet: CharacterSheet, derived: DerivedCharacter, kind: RestKind): RestOutcome =>
  (kind === 'long' ? longRest(sheet, derived) : shortRest(sheet, derived));
