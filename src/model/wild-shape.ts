import {
  canCastSpellWhileWildShaped, defaultKnownWildShapeForms, eligibleWildShapeProfiles,
  isMoonDruid, wildShapeArmorClass, wildShapeKnownLimit, wildShapeMaxCr, wildShapeTempHp,
  type WildShapeCharacter, type WildShapeProfile,
} from '../domain/wild-shape';
import { grantTemporaryHp } from './damage';
import { levelInClass, subclassOf, type CharacterSheet } from './character';
import type { DerivedCharacter } from './derive';

/**
 * Forme sauvage, greffée sur `CharacterSheet`.
 *
 * `domain/wild-shape.ts` porte les tables — reconstruites en rejouant la
 * chaîne de plugins de l'ancienne app, vérifiées contre le PHB 2024 papier —
 * mais ses fonctions de transformation mutent un objet à la forme de l'ancien
 * personnage (`attacks`, `hpTemp`, `conditions` en tableaux plats). Ce module
 * réutilise ses tables et ses requêtes pures, jamais ces mutations : la
 * transformation elle-même respecte ici le principe du reste du projet — la
 * fiche ne stocke qu'une décision (les formes apprises) et un état vivant
 * (la forme active), jamais une identité recalculée.
 */

const toWildShapeCharacter = (sheet: CharacterSheet, derived: DerivedCharacter): WildShapeCharacter => ({
  level: levelInClass(sheet, 'druide'),
  classId: 'druide',
  subclass: subclassOf(sheet, 'druide'),
  abilities: derived.abilities,
});

export const druidLevel = (sheet: CharacterSheet): number => levelInClass(sheet, 'druide');

/** Rang de Forme sauvage — utile à afficher : détermine le DD moitié CA du Cercle de la Lune, la FP maximale. */
export const wildShapeAccess = (sheet: CharacterSheet, derived: DerivedCharacter) => ({
  level: druidLevel(sheet),
  moon: isMoonDruid(toWildShapeCharacter(sheet, derived)),
  maxCr: wildShapeMaxCr(toWildShapeCharacter(sheet, derived)),
  knownLimit: wildShapeKnownLimit(druidLevel(sheet)),
});

/** Les formes que ce personnage a le droit de connaître, à son niveau et son cercle. */
export const eligibleForms = (sheet: CharacterSheet, derived: DerivedCharacter): WildShapeProfile[] =>
  eligibleWildShapeProfiles(toWildShapeCharacter(sheet, derived));

/** Les formes effectivement apprises, plafonnées par le niveau même si la fiche en garde plus. */
export function knownForms(sheet: CharacterSheet, derived: DerivedCharacter): string[] {
  const adapter = toWildShapeCharacter(sheet, derived);
  const limite = wildShapeKnownLimit(druidLevel(sheet));
  const eligibles = new Set(eligibleWildShapeProfiles(adapter).map((profile) => profile.id));
  const choisies = sheet.wildShapeKnownForms?.length
    ? sheet.wildShapeKnownForms
    : defaultKnownWildShapeForms(adapter);
  return [...new Set(choisies)].filter((id) => eligibles.has(id)).slice(0, limite);
}

/** Vrai s'il reste une place pour apprendre une forme de plus. */
export const hasRoomToLearn = (sheet: CharacterSheet, derived: DerivedCharacter): boolean =>
  knownForms(sheet, derived).length < wildShapeKnownLimit(druidLevel(sheet));

/** Apprend une forme, si elle est éligible et qu'il reste de la place. Ne remplace jamais une forme déjà connue. */
export function learnForm(sheet: CharacterSheet, derived: DerivedCharacter, formId: string): CharacterSheet {
  const connues = knownForms(sheet, derived);
  if (connues.includes(formId) || !hasRoomToLearn(sheet, derived)) return sheet;
  if (!eligibleForms(sheet, derived).some((profile) => profile.id === formId)) return sheet;
  return { ...sheet, wildShapeKnownForms: [...connues, formId] };
}

/**
 * Échange une forme connue contre une autre — seulement juste après un repos
 * long (PHB 2024 : « après chaque repos long, tu peux remplacer une des
 * formes que tu connais »), et une seule fois.
 */
export function swapForm(sheet: CharacterSheet, derived: DerivedCharacter, fromId: string, toId: string): CharacterSheet {
  if (!sheet.live.wildShapeSwapOpen) return sheet;
  const connues = knownForms(sheet, derived);
  if (!connues.includes(fromId) || connues.includes(toId)) return sheet;
  if (!eligibleForms(sheet, derived).some((profile) => profile.id === toId)) return sheet;
  return {
    ...sheet,
    wildShapeKnownForms: connues.map((id) => (id === fromId ? toId : id)),
    live: { ...sheet.live, wildShapeSwapOpen: false },
  };
}

export const WILD_SHAPE_RESOURCE_KEY = 'druide:forme-sauvage';

export interface WildShapeStatBlock {
  profile: WildShapeProfile;
  armorClass: number;
  temporaryHp: number;
}

/** Ce que la fiche affiche pendant la transformation, si elle est en cours. */
export function activeWildShapeStatBlock(sheet: CharacterSheet, derived: DerivedCharacter): WildShapeStatBlock | null {
  const formId = sheet.live.activeWildShape?.formId;
  if (!formId) return null;
  const profile = eligibleForms(sheet, derived).find((entry) => entry.id === formId);
  if (!profile) return null;
  const adapter = toWildShapeCharacter(sheet, derived);
  return {
    profile,
    armorClass: wildShapeArmorClass(adapter, profile),
    temporaryHp: wildShapeTempHp(adapter),
  };
}

/**
 * Se transformer : dépense une utilisation, comme n'importe quelle autre
 * ressource dérivée. Refuse en silence — jamais d'exception — si la forme
 * n'est pas connue, pas éligible à ce niveau, ou s'il n'y a plus de charge.
 */
export function transform(sheet: CharacterSheet, derived: DerivedCharacter, formId: string): CharacterSheet {
  if (!knownForms(sheet, derived).includes(formId)) return sheet;
  if (!eligibleForms(sheet, derived).some((profile) => profile.id === formId)) return sheet;
  const ressource = derived.resources.find((entry) => entry.key === WILD_SHAPE_RESOURCE_KEY);
  if (!ressource || ressource.remaining <= 0) return sheet;
  const transforme: CharacterSheet = {
    ...sheet,
    live: {
      ...sheet.live,
      activeWildShape: { formId },
      resourcesSpent: {
        ...sheet.live.resourcesSpent,
        [WILD_SHAPE_RESOURCE_KEY]: (sheet.live.resourcesSpent[WILD_SHAPE_RESOURCE_KEY] ?? 0) + 1,
      },
    },
  };
  // Les PV temporaires de la forme entrent dans le VRAI état vivant, celui
  // que le pipeline de dégâts consomme — les afficher sur une carte de forme
  // sans les écrire ici les rendait inexistants en jeu.
  return grantTemporaryHp(transforme, wildShapeTemporaryHp(sheet));
}

/**
 * PV temporaires gagnés en prenant une Forme sauvage (PHB 2024).
 *
 * Druide ordinaire : son niveau de Druide.
 * Cercle de la Lune à partir du niveau 3 : trois fois son niveau de Druide.
 */
export function wildShapeTemporaryHp(sheet: CharacterSheet): number {
  const niveau = druidLevel(sheet);
  if (niveau <= 0) return 0;
  return estCercleDeLaLune(sheet) && niveau >= 3 ? niveau * 3 : niveau;
}

/** Le Cercle de la Lune se lit sur la sous-classe déclarée du niveau de Druide. */
export function estCercleDeLaLune(sheet: CharacterSheet): boolean {
  return sheet.classLevels.some((entry) => (
    entry.classId === 'druide'
    && (entry.subclassId === 'lune' || entry.subclass === 'Cercle de la Lune')
  ));
}

/**
 * Éclat lunaire (Cercle de la Lune, niveau 6) : actif seulement transformé.
 * Le choix qu'elle ouvre — dégâts habituels ou radiants, à chaque coup — ne
 * se chiffre pas ; c'est un rappel affiché sur la forme active, pas un
 * nombre recalculé.
 */
export function eclatLunaireActif(sheet: CharacterSheet): boolean {
  return estCercleDeLaLune(sheet) && druidLevel(sheet) >= 6 && Boolean(sheet.live.activeWildShape);
}

/**
 * Le seul chiffre qu'Éclat lunaire ajoute vraiment : le modificateur de
 * Sagesse sur la sauvegarde de Constitution pour maintenir la concentration,
 * tant que la Forme sauvage dure — jamais un bonus qui traîne une fois
 * revenu à sa forme humanoïde.
 */
export function bonusConcentrationEclatLunaire(sheet: CharacterSheet, wisdomModifier: number): number {
  return eclatLunaireActif(sheet) ? wisdomModifier : 0;
}

/** Reprend forme humanoïde. Ne rend pas la charge dépensée — sortir de forme est gratuit, pas la transformation elle-même. */
export function revert(sheet: CharacterSheet): CharacterSheet {
  if (!sheet.live.activeWildShape) return sheet;
  return { ...sheet, live: { ...sheet.live, activeWildShape: null } };
}

/** Le Cercle de la Mer se lit sur la sous-classe déclarée du niveau de Druide. */
export function estCercleDeLaMer(sheet: CharacterSheet): boolean {
  return sheet.classLevels.some((entry) => (
    entry.classId === 'druide'
    && (entry.subclassId === 'mer' || entry.subclass === 'Cercle de la Mer')
  ));
}

/** Le Cercle des Étoiles se lit sur la sous-classe déclarée du niveau de Druide. */
export function estCercleDesEtoiles(sheet: CharacterSheet): boolean {
  return sheet.classLevels.some((entry) => (
    entry.classId === 'druide'
    && (entry.subclassId === 'etoiles' || entry.subclass === 'Cercle des Étoiles')
  ));
}

/**
 * Courroux de la mer (Cercle de la Mer, niveau 3 — PHB 2024 p. 87) : « Action
 * bonus : dépense une Forme sauvage pour manifester pendant 10 minutes une
 * émanation d'embruns… » — une AUTRE façon de dépenser la même réserve que la
 * transformation en bête, jamais les deux à la fois. Refuse en silence si la
 * sous-classe ne correspond pas, le niveau n'y est pas, ou la réserve est vide.
 */
export function activerCourrouxDeLaMer(sheet: CharacterSheet, derived: DerivedCharacter): CharacterSheet {
  if (!estCercleDeLaMer(sheet) || druidLevel(sheet) < 3) return sheet;
  const ressource = derived.resources.find((entry) => entry.key === WILD_SHAPE_RESOURCE_KEY);
  if (!ressource || ressource.remaining <= 0) return sheet;
  return {
    ...sheet,
    live: {
      ...sheet.live,
      activeWildShape: null,
      formeStellaire: null,
      courrouxDeLaMer: true,
      resourcesSpent: {
        ...sheet.live.resourcesSpent,
        [WILD_SHAPE_RESOURCE_KEY]: (sheet.live.resourcesSpent[WILD_SHAPE_RESOURCE_KEY] ?? 0) + 1,
      },
    },
  };
}

/** Fin volontaire — gratuite, comme reprendre forme humanoïde. */
export function finCourrouxDeLaMer(sheet: CharacterSheet): CharacterSheet {
  if (!sheet.live.courrouxDeLaMer) return sheet;
  return { ...sheet, live: { ...sheet.live, courrouxDeLaMer: false } };
}

/** Dés de dégâts de froid : modificateur de Sagesse, minimum 1 (PHB 2024 p. 87). */
export const courrouxDeLaMerDes = (wisdomModifier: number): number => Math.max(1, wisdomModifier);

export type Constellation = 'archer' | 'calice' | 'dragon';

export const CONSTELLATIONS: { id: Constellation; name: string; desc: string }[] = [
  {
    id: 'archer', name: 'Archer',
    desc: 'À l’activation puis en action bonus à tes tours suivants : attaque de sort à distance (18 m), 1d8 + Sagesse dégâts radiants.',
  },
  {
    id: 'calice', name: 'Calice',
    desc: 'Quand un sort lancé avec un emplacement rend des PV, toi ou une créature visible à 9 m en récupérez 1d8 + Sagesse de plus.',
  },
  {
    id: 'dragon', name: 'Dragon',
    desc: 'Tests d’Intelligence, de Sagesse et sauvegardes de concentration : un 9 ou moins compte comme un 10.',
  },
];

/**
 * Forme stellaire (Cercle des Étoiles, niveau 3 — PHB 2024 p. 88-89) : dépense
 * une Forme sauvage « plutôt que de te métamorphoser » — tu gardes tes
 * statistiques, seule la constellation choisie change ce qu'elle ajoute.
 */
export function activerFormeStellaire(
  sheet: CharacterSheet, derived: DerivedCharacter, constellation: Constellation,
): CharacterSheet {
  if (!estCercleDesEtoiles(sheet) || druidLevel(sheet) < 3) return sheet;
  const ressource = derived.resources.find((entry) => entry.key === WILD_SHAPE_RESOURCE_KEY);
  if (!ressource || ressource.remaining <= 0) return sheet;
  return {
    ...sheet,
    live: {
      ...sheet.live,
      activeWildShape: null,
      courrouxDeLaMer: false,
      formeStellaire: { constellation },
      resourcesSpent: {
        ...sheet.live.resourcesSpent,
        [WILD_SHAPE_RESOURCE_KEY]: (sheet.live.resourcesSpent[WILD_SHAPE_RESOURCE_KEY] ?? 0) + 1,
      },
    },
  };
}

/** Fin volontaire — gratuite. */
export function finFormeStellaire(sheet: CharacterSheet): CharacterSheet {
  if (!sheet.live.formeStellaire) return sheet;
  return { ...sheet, live: { ...sheet.live, formeStellaire: null } };
}

/**
 * Changer de constellation SANS dépenser de nouvelle utilisation — réservé au
 * niveau 10+ (« Constellations scintillantes », PHB 2024 p. 89 : « au début
 * de chacun de tes tours en Forme stellaire »). Avant ce niveau, la
 * constellation choisie à l'activation tient jusqu'à la fin de la forme.
 */
export function changerConstellation(sheet: CharacterSheet, constellation: Constellation): CharacterSheet {
  if (!sheet.live.formeStellaire || druidLevel(sheet) < 10) return sheet;
  return { ...sheet, live: { ...sheet.live, formeStellaire: { constellation } } };
}

/** Dé de l'Archer et du Calice : d8, ou 2d8 au niveau 10 (« Constellations scintillantes »). */
export const formeStellaireDes = (sheet: CharacterSheet): number => (druidLevel(sheet) >= 10 ? 2 : 1);

/**
 * Au niveau 18, un Druide lance ses sorts en forme de bête sans restriction ;
 * avant, seul le Cercle de la Lune le peut, et seulement pour une poignée de
 * sorts de soin (PHB 2024 p. 82). Un sort hors de cette liste, en forme de
 * bête, avant le niveau 18, ne part pas.
 */
export function canCastWhileShaped(sheet: CharacterSheet, derived: DerivedCharacter, spellName: string, components: string | null): boolean {
  if (!sheet.live.activeWildShape) return true;
  // La fonction ne lit que la présence d'une forme active, jamais son détail :
  // un jeton suffit, il n'y a pas de vraie `ActiveWildShape` à reconstruire ici.
  const adapter: WildShapeCharacter = {
    ...toWildShapeCharacter(sheet, derived),
    activeWildShape: { formId: sheet.live.activeWildShape.formId } as WildShapeCharacter['activeWildShape'],
  };
  return canCastSpellWhileWildShaped(adapter, spellName, components);
}
