import { EMPTY_LIVE_STATE, type CharacterSheet, type ChosenSpell, type LiveState } from './character';
import { normalizeClassLevels } from '../domain/multiclassing';
import { classById } from '../content/classes';
import { BACKGROUNDS } from '../content/backgrounds';
import { alwaysPreparedSpellsFor } from '../content/always-prepared-spells';
import { speciesMagicFor } from '../content/species';

/**
 * Import d'une fiche de `table-connectee`.
 *
 * L'ancienne fiche mélange décisions et valeurs calculées : `hpMax`, `speed`,
 * `hitDie`, `darkvision`, `resistances`, les `slots.max`, le `toHit` de chaque
 * attaque, la liste des `features` avec leur texte. L'import **jette** tout ce
 * qui est dérivable et ne garde que les décisions — c'est précisément ce qui
 * rend rétroactives les règles ajoutées ensuite.
 *
 * Les valeurs jetées ne sont pas perdues pour autant : `compareWithLegacy()`
 * les relit pour vérifier que la dérivation retombe bien dessus. C'est le test
 * d'acceptation du projet — importer les personnages réels et retrouver des
 * fiches correctes.
 */

/** Fiche telle que `table-connectee` la stocke (JSONB). Champs volontairement lâches. */
export interface LegacyCharacter {
  id?: string;
  name?: string;
  speciesId?: string;
  lineageId?: string | null;
  speciesAncestry?: string | null;
  speciesSize?: string | null;
  classId?: string;
  level?: number;
  subclass?: string | null;
  classLevels?: Array<{ classId?: string; level?: number; subclass?: string | null }> | null;
  classChoices?: Record<string, unknown> | null;
  classSelections?: Record<string, Record<string, unknown>> | null;
  background?: string | null;
  backgroundId?: string | null;
  featIds?: string[] | null;
  abilities?: Record<string, number>;
  skillProfs?: string[] | null;
  expertise?: string[] | null;
  toolProfs?: string[] | null;
  languages?: string[] | null;
  alignment?: string | null;
  armorId?: string | null;
  shield?: boolean;
  gold?: number;
  cantrips?: string[] | null;
  spells?: Array<{ id?: string; prepared?: boolean; always?: boolean; sourceClass?: string; source?: string; spellList?: string }> | null;
  inventory?: Array<Record<string, unknown>> | null;
  // Valeurs calculées de l'ancienne app — lues seulement pour vérification.
  hp?: number; hpMax?: number; hpTemp?: number; hitDiceLeft?: number;
  slots?: Array<{ level?: number; current?: number; max?: number; pact?: boolean }> | null;
  exhaustion?: number;
  deathSaves?: { success?: number; fail?: number } | null;
  inspiration?: boolean;
  conditions?: Array<{ label?: string; detail?: string }> | null;
  [key: string]: unknown;
}

export interface ImportReport {
  sheet: CharacterSheet;
  /** Ce qui n'a pas pu être repris fidèlement, à montrer au joueur. */
  warnings: string[];
}

const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const;

/** Terrain du Cercle de la Terre, choisi et rechoisi à chaque repos long. */
const terrainChoice = (legacy: LegacyCharacter, classId: string): string | null => {
  const selections = legacy.classSelections?.[classId] as Record<string, unknown> | undefined;
  const single = legacy.classId === classId ? (legacy.classChoices as Record<string, unknown> | null) : null;
  const value = selections?.terrain ?? single?.terrain;
  return typeof value === 'string' ? value : null;
};

const normalizeText = (value: unknown): string => String(value ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLocaleLowerCase('fr');

/** L'ancienne fiche stocke le nom affiché de l'origine ; on retrouve son id. */
const backgroundIdFrom = (legacy: LegacyCharacter): string | null => {
  if (legacy.backgroundId) return legacy.backgroundId;
  const wanted = normalizeText(legacy.background);
  if (!wanted) return null;
  return BACKGROUNDS.find((background) => normalizeText(background.name) === wanted)?.id ?? null;
};

/**
 * Les choix par classe ont connu deux formes au fil des versions de l'ancienne
 * app : `classSelections[classId]` (multiclasse) et `classChoices` (mono-classe).
 * On fusionne les deux, la forme récente ayant le dernier mot.
 */
const choicesFrom = (legacy: LegacyCharacter, classIds: string[]): CharacterSheet['classChoices'] => {
  const result: CharacterSheet['classChoices'] = {};
  for (const classId of classIds) {
    const selections = legacy.classSelections?.[classId];
    const legacySingle = legacy.classId === classId ? legacy.classChoices : null;
    const merged = { ...(legacySingle ?? {}), ...(selections ?? {}) } as CharacterSheet['classChoices'][string];
    if (Object.keys(merged).length > 0) result[classId] = merged;
  }
  return result;
};

const liveStateFrom = (legacy: LegacyCharacter, classIds: string[]): LiveState => {
  const live: LiveState = { ...EMPTY_LIVE_STATE, hitDiceSpent: {}, spellSlotsSpent: {}, resourcesSpent: {}, conditions: [] };

  if (typeof legacy.hpMax === 'number' && typeof legacy.hp === 'number') {
    live.damageTaken = Math.max(0, legacy.hpMax - legacy.hp);
  }
  live.temporaryHp = Math.max(0, legacy.hpTemp ?? 0);
  live.exhaustion = Math.max(0, legacy.exhaustion ?? 0);
  live.deathSaves = {
    success: Math.max(0, legacy.deathSaves?.success ?? 0),
    fail: Math.max(0, legacy.deathSaves?.fail ?? 0),
  };
  live.heroicInspiration = Boolean(legacy.inspiration);

  // L'ancienne app ne suivait qu'un total de dés de vie restants, sans le
  // ventiler par classe : on l'impute à la classe principale.
  const totalLevels = classIds.length;
  if (typeof legacy.hitDiceLeft === 'number' && totalLevels > 0) {
    const totalDice = (legacy.classLevels ?? []).reduce((sum, entry) => sum + (entry.level ?? 0), 0) || (legacy.level ?? 0);
    const spent = Math.max(0, totalDice - legacy.hitDiceLeft);
    if (spent > 0) live.hitDiceSpent[classIds[0]] = spent;
  }

  for (const slot of legacy.slots ?? []) {
    if (!slot?.level || typeof slot.max !== 'number' || typeof slot.current !== 'number') continue;
    const spent = Math.max(0, slot.max - slot.current);
    if (slot.pact) live.pactSlotsSpent = spent;
    else if (spent > 0) live.spellSlotsSpent[slot.level] = spent;
  }

  for (const condition of legacy.conditions ?? []) {
    if (!condition?.label) continue;
    // La Concentration n'est pas un état du jeu : c'est un suivi distinct.
    if (normalizeText(condition.label) === 'concentration') {
      live.concentration = { spellId: String(condition.detail ?? ''), note: condition.detail };
      continue;
    }
    live.conditions.push({ id: normalizeText(condition.label).replace(/\s+/g, '-'), detail: condition.detail });
  }
  return live;
};

export function importLegacyCharacter(legacy: LegacyCharacter): ImportReport {
  const warnings: string[] = [];

  const classLevels = normalizeClassLevels({
    classId: legacy.classId, level: legacy.level,
    subclass: legacy.subclass,
    classLevels: legacy.classLevels as Parameters<typeof normalizeClassLevels>[0]['classLevels'],
  });
  if (classLevels.length === 0) warnings.push('Aucune classe reconnue : la fiche est importée sans niveau de classe.');
  const classIds = classLevels.map((entry) => entry.classId);
  const totalLevel = classLevels.reduce((sum, entry) => sum + entry.level, 0);
  const mainClass = classIds[0] ?? legacy.classId ?? '';

  const backgroundId = backgroundIdFrom(legacy);
  if (!backgroundId && legacy.background) {
    warnings.push(`Origine « ${legacy.background} » inconnue du catalogue : à rechoisir sur la fiche.`);
  }

  const abilities = Object.fromEntries(
    ABILITY_KEYS.map((key) => [key, legacy.abilities?.[key] ?? 10]),
  ) as CharacterSheet['abilities'];

  // Un sort accordé d'office n'est retiré de la fiche que si la dérivation le
  // rend réellement — sinon on le perdrait. Cette prudence n'est pas
  // théorique : sur les fiches réelles, un sort d'Initié à la magie et la
  // magie innée d'un lignage Drow disparaissaient avec la version naïve.
  const derivable = new Set([
    ...classLevels.flatMap((entry) => alwaysPreparedSpellsFor({
      classId: entry.classId, subclass: entry.subclass,
      terrain: terrainChoice(legacy, entry.classId), level: entry.level,
    })),
    ...speciesMagicFor(legacy.speciesId, legacy.lineageId, totalLevel).spells,
  ]);

  const spells: ChosenSpell[] = [];
  let droppedGranted = 0;
  const keptGrants: string[] = [];
  for (const spell of legacy.spells ?? []) {
    if (!spell?.id) continue;
    if (derivable.has(spell.id)) { droppedGranted += 1; continue; }
    const grantedBy = spell.always ? String(spell.source ?? spell.sourceClass ?? 'inconnu') : null;
    if (grantedBy) keptGrants.push(spell.id);
    spells.push({
      id: spell.id,
      sourceClass: spell.sourceClass ?? mainClass,
      ...(typeof spell.prepared === 'boolean' ? { prepared: spell.prepared } : {}),
      ...(grantedBy ? { grantedBy } : {}),
    });
  }
  if (droppedGranted > 0) {
    warnings.push(`${droppedGranted} sort(s) accordé(s) d'office retiré(s) de la liste choisie : ils sont désormais dérivés et ne consomment plus le budget.`);
  }
  if (keptGrants.length > 0) {
    warnings.push(
      `${keptGrants.length} sort(s) accordé(s) par un don, une invocation ou une capacité (${keptGrants.join(', ')}) `
      + 'conservé(s) sur la fiche : le moteur ne sait pas encore les dériver, et les perdre serait pire. '
      + 'Ils ne consomment pas le budget de sorts préparés.',
    );
  }

  const armorId = legacy.armorId && legacy.armorId !== 'none' ? legacy.armorId : null;

  const sheet: CharacterSheet = {
    id: String(legacy.id ?? ''),
    name: String(legacy.name ?? 'Sans nom'),
    speciesId: String(legacy.speciesId ?? ''),
    lineageId: legacy.lineageId ?? null,
    ancestryId: legacy.speciesAncestry ?? null,
    size: legacy.speciesSize ?? null,
    backgroundId: backgroundId ?? '',
    abilities,
    alignment: legacy.alignment ?? null,
    classLevels,
    classChoices: choicesFrom(legacy, classIds),
    skillProficiencies: [...new Set(legacy.skillProfs ?? [])],
    expertise: [...new Set(legacy.expertise ?? [])],
    toolProficiencies: [...new Set(legacy.toolProfs ?? [])],
    languages: [...new Set(legacy.languages ?? [])],
    featIds: [...new Set(legacy.featIds ?? [])],
    // L'ancienne fiche ne distinguait pas les caractéristiques de base des
    // augmentations reçues : `abilities` y est déjà le total. On les reprend
    // telles quelles, sans augmentation séparée, pour ne pas les compter deux fois.
    abilityImprovements: [],
    cantrips: (legacy.cantrips ?? []).map((id) => ({ id, sourceClass: mainClass })),
    spells,
    inventory: (legacy.inventory ?? []).map((item, index) => ({
      id: String(item.id ?? `item-${index}`),
      name: String(item.name ?? 'Objet'),
      qty: Number(item.qty ?? 1),
      ...(item.desc ? { note: String(item.desc) } : {}),
    })),
    armorId,
    ...(typeof legacy.hpMax === 'number' ? { maxHpOverride: legacy.hpMax } : {}),
    shield: Boolean(legacy.shield),
    gold: Number(legacy.gold ?? 0),
    live: liveStateFrom(legacy, classIds),
    importedFrom: {
      app: 'table-connectee',
      importedAt: new Date().toISOString(),
      ...(legacy.id ? { legacyId: String(legacy.id) } : {}),
    },
  };

  if (!classById(mainClass)) warnings.push(`Classe « ${mainClass} » inconnue du catalogue.`);
  if (typeof legacy.hpMax === 'number') {
    warnings.push(
      `PV maximum repris tels quels (${legacy.hpMax}) : l'ancienne app ne gardait pas le détail des jets de dé de vie, `
      + 'irrécupérable. À la prochaine montée de niveau, saisis les jets pour que les PV redeviennent dérivés.',
    );
  }
  return { sheet, warnings };
}

/** Un écart entre la fiche héritée et la fiche dérivée. */
export interface LegacyDiff {
  field: string;
  legacy: number | string;
  derived: number | string;
}

/**
 * Compare les valeurs que l'ancienne app avait figées avec celles que la
 * dérivation recalcule. Un écart n'est pas forcément une régression — il peut
 * signaler une règle que l'ancienne app appliquait mal — mais il doit être vu.
 */
export function compareWithLegacy(
  legacy: LegacyCharacter,
  derived: { maxHp: number; armorClass: number; proficiencyBonus: number; spellcasting: { slots: { level: number; max: number; pact?: boolean }[] } },
): LegacyDiff[] {
  const diffs: LegacyDiff[] = [];
  if (typeof legacy.hpMax === 'number' && legacy.hpMax !== derived.maxHp) {
    diffs.push({ field: 'hpMax', legacy: legacy.hpMax, derived: derived.maxHp });
  }
  for (const slot of legacy.slots ?? []) {
    if (!slot?.level || typeof slot.max !== 'number') continue;
    const match = derived.spellcasting.slots.find((candidate) => candidate.level === slot.level && Boolean(candidate.pact) === Boolean(slot.pact));
    if (!match) {
      diffs.push({ field: `slots[${slot.level}]`, legacy: slot.max, derived: 'absent' });
    } else if (match.max !== slot.max) {
      diffs.push({ field: `slots[${slot.level}]`, legacy: slot.max, derived: match.max });
    }
  }
  return diffs;
}
