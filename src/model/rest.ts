import { restoresAllOnShortRest } from '../domain/resource-recovery';
import { companionsAfterLongRest } from './companions';
import { druidLevel } from './wild-shape';
import { levelInClass } from './character';
import { type MasteryClassId } from '../domain/weapon-mastery';
import { resilienceCeleste, resilienceCelestePourSoi } from './occultiste';
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
 * qui revient seul, ce sont les réserves dites « au repos court », les
 * emplacements de pacte que l'Occultiste retrouve à chaque pause, UNE
 * utilisation de Forme sauvage, et un cran d'épuisement pour un Rôdeur de
 * niveau 10 ou plus (Infatigable).
 */
export function shortRest(sheet: CharacterSheet, derived: DerivedCharacter): RestOutcome {
  const recovered: string[] = [];
  const resourcesSpent = { ...sheet.live.resourcesSpent };

  for (const resource of derived.resources) {
    const dues = resourcesSpent[resource.key] ?? 0;
    if (dues === 0) continue;

    if (restoresAllOnShortRest(resource.recharge)) {
      delete resourcesSpent[resource.key];
      recovered.push(resource.name);
      continue;
    }

    // ── Réserves qui n'en rendent qu'une PARTIE ─────────────────────
    // PHB 2024 : plusieurs capacités rendent une seule utilisation au repos
    // court et toute la réserve au repos long — la Forme sauvage du Druide,
    // la Rage du Barbare, le Second souffle du Guerrier. Une recharge
    // « court » rendrait tout, une recharge « long » ne rendrait rien :
    // ni l'une ni l'autre ne dit la vérité, d'où `shortRecovery`.
    const rendues = Math.min(resource.shortRecovery ?? 0, dues);
    if (rendues <= 0) continue;
    if (rendues === dues) delete resourcesSpent[resource.key];
    else resourcesSpent[resource.key] = dues - rendues;
    recovered.push(rendues === 1
      ? `Une utilisation de ${resource.name}`
      : `${rendues} utilisations de ${resource.name}`);
  }

  const pacte = derived.spellcasting.slots.some((slot) => slot.pact);
  const pactSlotsSpent = pacte ? 0 : sheet.live.pactSlotsSpent;
  if (pacte && sheet.live.pactSlotsSpent > 0) recovered.push('Emplacements de pacte');

  // ── Infatigable : Rôdeur 10+ ──────────────────────────────────────
  // PHB 2024 : chaque repos court terminé réduit l'Épuisement de 1.
  // Distinct de la réduction du repos long, et cumulable avec elle.
  const avecInfatigable = levelInClass(sheet, 'rodeur') >= 10;
  const exhaustion = avecInfatigable
    ? Math.max(0, sheet.live.exhaustion - 1)
    : sheet.live.exhaustion;
  if (exhaustion < sheet.live.exhaustion) recovered.push('Un cran d’épuisement (Infatigable)');

  // Maîtrise d'armes : le choix se fait à la fin d'un repos long, pas au fil
  // de la journée — un repos court referme la fenêtre ouverte par le dernier
  // repos long (PHB 2024 p. 120). Sans effet si elle était déjà fermée.
  const weaponMasteriesLocked = true;

  const apres: CharacterSheet = {
    ...sheet,
    live: { ...sheet.live, resourcesSpent, pactSlotsSpent, exhaustion, weaponMasteriesLocked },
  };

  // ── Résilience céleste : Occultiste Céleste 10+ ───────────────────
  // PHB 2024 : la fin d'un repos court OU long accorde des PV
  // temporaires. C'est un gain automatique, pas une case à cocher.
  const avecResilience = resilienceCeleste(apres);
  if (avecResilience !== apres) {
    recovered.push(`${resilienceCelestePourSoi(sheet)} PV temporaires (Résilience céleste)`);
  }

  return { sheet: avecResilience, recovered };
}

/**
 * Un repos long.
 *
 * Tout revient : points de vie, emplacements, réserves, et TOUS les dés de
 * vie dépensés. Seul l'épuisement fait exception — il ne descend que d'un
 * cran, ce qui fait qu'une journée difficile pèse encore le lendemain.
 *
 * Rendre la moitié des dés de vie était la règle de 2014 ; le PHB 2024 les
 * rend tous.
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

  const rendus = Object.values(live.hitDiceSpent).reduce((somme, n) => somme + n, 0);
  const hitDiceSpent: Record<string, number> = {};
  if (rendus > 0) recovered.push(`${rendus} dé(s) de vie`);
  if (live.exhaustion > 0) recovered.push('Un cran d’épuisement');

  // Une forme de bête apprise peut être échangée juste après le repos —
  // seulement maintenant, et une seule fois (PHB 2024, Forme sauvage).
  const wildShapeSwapOpen = druidLevel(sheet) >= 2 ? true : undefined;
  if (wildShapeSwapOpen) recovered.push('Une forme apprise peut être échangée');

  // Maîtrise d'armes : la fin d'un repos long rouvre le choix (PHB 2024
  // p. 120). `levelInClass` >= 1, jamais `weaponMasteryCount` directement :
  // à niveau 0, hors de la classe, elle rend quand même 2 ou 3 par
  // construction (voir le même garde dans `choix-de-classe.ts`).
  const classesAvecMaitrise: MasteryClassId[] = ['barbare', 'guerrier', 'paladin', 'rodeur', 'roublard'];
  const aLaMaitriseDArmes = classesAvecMaitrise.some((classId) => levelInClass(sheet, classId) >= 1);
  if (aLaMaitriseDArmes) recovered.push('Maîtrise d’armes à choisir');

  const avantCompagnons = sheet.companions ?? [];
  const apresRepos = companionsAfterLongRest({
    ...sheet,
    live: {
      ...live, damageTaken: 0, temporaryHp: 0, spellSlotsSpent: {}, pactSlotsSpent: 0, resourcesSpent: {},
      hitDiceSpent, exhaustion: Math.max(0, live.exhaustion - 1),
      deathSaves: { success: 0, fail: 0 }, deathStatus: null,
      concentration: null, wildShapeSwapOpen, wildResurgenceTurn: null, huntersMark: null,
      weaponMasteriesLocked: false,
    },
  });
  for (const companion of avantCompagnons) {
    if (companion.expiresOnLongRest && !apresRepos.companions?.some((c) => c.id === companion.id)) {
      recovered.push(`${companion.name} disparaît (Compagnon sauvage)`);
    }
  }

  // Résilience céleste s'applique APRÈS la remise à zéro des PV
  // temporaires du repos long : c'est le repos qui les accorde.
  const avecResilience = resilienceCeleste(apresRepos);
  if (avecResilience !== apresRepos) {
    recovered.push(`${resilienceCelestePourSoi(sheet)} PV temporaires (Résilience céleste)`);
  }

  return { sheet: avecResilience, recovered };
}

export const rest = (sheet: CharacterSheet, derived: DerivedCharacter, kind: RestKind): RestOutcome =>
  (kind === 'long' ? longRest(sheet, derived) : shortRest(sheet, derived));
