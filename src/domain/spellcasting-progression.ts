/**
 * Progression de magie — PHB 2024. Tout est dérivé à la lecture : niveau de
 * classe et modificateur de caractéristique sont les seules entrées, jamais
 * une valeur figée sur la fiche.
 *
 * Repêché de `table-connectee/src/App.jsx` (tables `SLOTS_FULL`, `SLOTS_HALF`,
 * `PACT`, `CANTRIPS_BASE`) et vérifié indépendamment contre le PHB 2024 —
 * voir le détail par table ci-dessous. Une correction de fond a été apportée
 * au passage : voir `preparedSpellCount`.
 */

export type FullCasterClass = 'barde' | 'clerc' | 'druide' | 'ensorceleur' | 'magicien';
export type HalfCasterClass = 'paladin' | 'rodeur';
export type KnownCasterClass = 'barde' | 'ensorceleur' | 'occultiste' | 'rodeur';
export type PrepareCasterClass = 'clerc' | 'druide' | 'paladin' | 'magicien';

const clampLevel = (level: number): number => Math.max(1, Math.min(20, Math.floor(level)));

/**
 * Emplacements de sort, lanceurs complets (Barde, Clerc, Druide, Ensorceleur,
 * Magicien). Vérifié terme à terme contre le PHB 2024 — table inchangée
 * depuis 2014. Index 0 = niveau 1.
 */
const FULL_CASTER_SLOTS: readonly number[][] = [
  [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1],
];

/**
 * Emplacements de sort, lanceurs partiels (Paladin, Rôdeur). PHB 2024 : les
 * deux gagnent la Magie dès le niveau 1 (2 emplacements de rang 1), contre le
 * niveau 2 en 2014 — la table est décalée d'un cran par rapport à l'ancienne
 * édition. Vérifié contre le PHB 2024.
 */
const HALF_CASTER_SLOTS: readonly number[][] = [
  [2], [2], [3], [3], [4, 2], [4, 2], [4, 3], [4, 3], [4, 3, 2], [4, 3, 2],
  [4, 3, 3], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 2],
  [4, 3, 3, 3, 1], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2],
];

/**
 * Magie occulte de l'Occultiste. `slots` = nombre d'emplacements, `slotLevel`
 * = rang de chacun. Table inchangée depuis 2014, vérifiée.
 */
const PACT_MAGIC: readonly { slots: number; slotLevel: number }[] = [
  { slots: 1, slotLevel: 1 }, { slots: 2, slotLevel: 1 }, { slots: 2, slotLevel: 2 }, { slots: 2, slotLevel: 2 },
  { slots: 2, slotLevel: 3 }, { slots: 2, slotLevel: 3 }, { slots: 2, slotLevel: 4 }, { slots: 2, slotLevel: 4 },
  { slots: 2, slotLevel: 5 }, { slots: 2, slotLevel: 5 }, { slots: 3, slotLevel: 5 }, { slots: 3, slotLevel: 5 },
  { slots: 3, slotLevel: 5 }, { slots: 3, slotLevel: 5 }, { slots: 3, slotLevel: 5 }, { slots: 3, slotLevel: 5 },
  { slots: 4, slotLevel: 5 }, { slots: 4, slotLevel: 5 }, { slots: 4, slotLevel: 5 }, { slots: 4, slotLevel: 5 },
];

export const fullCasterSlots = (level: number): number[] => FULL_CASTER_SLOTS[clampLevel(level) - 1];
export const halfCasterSlots = (level: number): number[] => HALF_CASTER_SLOTS[clampLevel(level) - 1];
export const pactMagicSlots = (level: number): { slots: number; slotLevel: number } => PACT_MAGIC[clampLevel(level) - 1];

/** Sorts mineurs connus au niveau 1, avant paliers. Vérifié contre le PHB 2024. */
const CANTRIPS_KNOWN_BASE: Record<FullCasterClass | KnownCasterClass, number> = {
  barde: 2, clerc: 3, druide: 2, ensorceleur: 4, magicien: 3, occultiste: 2, rodeur: 0,
};

/** +1 aux niveaux 4 et 10, pour les classes qui ont des sorts mineurs. Vérifié. */
export const cantripsKnown = (classId: keyof typeof CANTRIPS_KNOWN_BASE, level: number): number => {
  const base = CANTRIPS_KNOWN_BASE[classId] ?? 0;
  if (base === 0) return 0;
  const lv = clampLevel(level);
  return base + (lv >= 4 ? 1 : 0) + (lv >= 10 ? 1 : 0);
};

/** Taille du grimoire du Magicien : 6 sorts au niveau 1, +2 par niveau. Vérifié, inchangé depuis 2014. */
export const wizardSpellbookSize = (level: number): number => 6 + 2 * (clampLevel(level) - 1);

/**
 * Sorts préparés — Clerc, Druide, Paladin, Magicien (le Magicien prépare
 * depuis son grimoire, cf. `wizardSpellbookSize` pour sa taille).
 *
 * CORRECTIF DE FOND par rapport à `table-connectee` : l'ancienne app
 * plafonnait ce nombre avec une table `PREPARED` figée par niveau, identique
 * pour magicien/clerc/druide/barde à un facteur près — sans jamais lire le
 * modificateur de caractéristique du personnage. C'est la règle de base du
 * jeu depuis 2014, inchangée en 2024 : `prêts = modificateur + niveau de
 * classe (minimum 1)`. Deux druides de même niveau mais de Sagesse
 * différente n'ont pas le même nombre de sorts préparés — l'ancienne table
 * ne pouvait pas le représenter puisqu'elle ignorait la caractéristique.
 */
export const preparedSpellCount = (abilityModifier: number, level: number): number =>
  Math.max(1, abilityModifier + clampLevel(level));

/**
 * Sorts connus — Barde, Ensorceleur, Occultiste, Rôdeur : liste fixe, ne
 * dépend pas de la caractéristique d'incantation.
 *
 * Confiance par classe :
 * - `occultiste` : vérifié indépendamment contre le PHB 2024 (table Magie
 *   occulte, inchangée depuis 2014).
 * - `rodeur` : repris de `table-connectee` tel quel. Cohérent avec le
 *   décalage 2024 de `HALF_CASTER_SLOTS` (Magie dès le niveau 1), mais PAS
 *   vérifié indépendamment terme à terme — à confirmer contre le PHB papier.
 * - `barde`, `ensorceleur` : NON repris. Dans `table-connectee`, ces deux
 *   lignes étaient structurellement identiques à `druide`/`clerc` (une table
 *   `PREPARED` unique pour les quatre), ce qui n'a pas de sens pour des
 *   classes à sorts *connus* — signe que la table source elle-même mélangeait
 *   les deux mécaniques. À reconstruire depuis le PHB plutôt qu'à copier une
 *   valeur suspecte.
 */
const KNOWN_SPELLS: Partial<Record<KnownCasterClass, readonly number[]>> = {
  occultiste: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
  rodeur: [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15],
};

export const knownSpellCount = (classId: KnownCasterClass, level: number): number | null => {
  const table = KNOWN_SPELLS[classId];
  return table ? table[clampLevel(level) - 1] : null;
};
