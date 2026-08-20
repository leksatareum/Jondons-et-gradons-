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
/**
 * Classes dont le nombre de sorts préparés est lu dans une table figée, sans
 * la caractéristique d'incantation. Le PHB 2024 dit bien « sorts préparés »
 * pour elles aussi : « sorts connus » a disparu du vocabulaire.
 */
export type TabledCasterClass = 'barde' | 'ensorceleur' | 'occultiste' | 'rodeur';
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
const CANTRIPS_KNOWN_BASE: Record<FullCasterClass | TabledCasterClass, number> = {
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
 * ⚠ SOUS RÉSERVE — cette formule est probablement la règle de 2014, pas celle
 * de 2024.
 *
 * Elle vient d'un correctif appliqué à `table-connectee`, dont la table
 * `PREPARED` figée ignorait le modificateur de caractéristique. Le
 * raisonnement était que « prêts = modificateur + niveau » est la règle de
 * base, inchangée. Une relecture du PHB 2024 (tables de progression) indique
 * l'inverse : le Clerc et le Druide y liraient eux aussi leur nombre de sorts
 * préparés dans une colonne de leur table, comme les quatre classes de
 * `PREPARED_SPELLS` ci-dessous.
 *
 * Les valeurs des colonnes Clerc et Druide n'ayant pas encore été relevées,
 * rien n'est changé ici : une formule douteuse mais connue vaut mieux qu'une
 * table inventée. Dès que les deux colonnes sont disponibles, cette fonction
 * disparaît au profit de `PREPARED_SPELLS` — et le nombre de sorts préparés
 * d'un Druide cesse de dépendre de sa Sagesse.
 */
export const preparedSpellCount = (abilityModifier: number, level: number): number =>
  Math.max(1, abilityModifier + clampLevel(level));

/**
 * Sorts préparés lus dans la table de classe, du niveau 1 au niveau 20.
 *
 * Ces quatre classes ne calculent pas leur nombre de sorts : elles le lisent.
 * La caractéristique d'incantation sert au DD de sauvegarde et au jet
 * d'attaque, jamais à la taille de la liste — s'en servir ici rendrait un
 * Occultiste au Charisme élevé plus large qu'il ne doit l'être.
 *
 * Toutes relevées dans le PHB 2024, table de progression de chaque classe :
 * Barde p. 60, Ensorceleur p. 140, Rôdeur p. 120, Occultiste p. 154.
 * Occultiste et Rôdeur ont été confrontés terme à terme aux valeurs que
 * portait déjà ce module : les quarante nombres concordent.
 */
const PREPARED_SPELLS: Record<TabledCasterClass, readonly number[]> = {
  barde: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  ensorceleur: [2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  occultiste: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
  rodeur: [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15],
};

export const tabledPreparedSpellCount = (classId: TabledCasterClass, level: number): number | null => {
  const table = PREPARED_SPELLS[classId];
  return table ? table[clampLevel(level) - 1] : null;
};

/**
 * Quand la liste préparée peut-elle changer, et de combien de sorts.
 *
 * La question n'est pas décorative : elle décide si l'écran des sorts propose
 * un choix ou une consultation. Un Rôdeur rouvre sa liste à chaque repos long ;
 * un Occultiste ne la rouvre qu'en montant de niveau, et rien dans Ruse magique
 * ne l'y autorise — cette capacité ne rend que des emplacements de pacte.
 *
 * PHB 2024 : Rôdeur p. 119, Occultiste p. 154.
 */
export interface SpellSwapRule {
  /** Ce qui rouvre la liste. */
  when: 'repos-long' | 'montee-de-niveau';
  /** Nombre de sorts échangeables à cette occasion. */
  count: number;
}

const SPELL_SWAP: Partial<Record<TabledCasterClass, SpellSwapRule>> = {
  occultiste: { when: 'montee-de-niveau', count: 1 },
  rodeur: { when: 'repos-long', count: 1 },
};

export const spellSwapRule = (classId: string): SpellSwapRule | null =>
  SPELL_SWAP[classId as TabledCasterClass] ?? null;
