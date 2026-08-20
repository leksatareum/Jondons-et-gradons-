/**
 * Progression de magie — PHB 2024. Tout est dérivé à la lecture : le niveau de
 * classe est la seule entrée, jamais une valeur figée sur la fiche.
 *
 * Repêché de `table-connectee/src/App.jsx` (tables `SLOTS_FULL`, `SLOTS_HALF`,
 * `PACT`, `CANTRIPS_BASE`) et vérifié table par table contre le PHB 2024.
 *
 * Ce module a porté un temps une formule `modificateur + niveau` pour le
 * nombre de sorts préparés du Clerc, du Druide, du Paladin et du Magicien.
 * C'était la règle de 2014 : en 2024 ces quatre classes lisent leur nombre
 * dans leur table, comme les autres. La formule a été retirée, et avec elle
 * la dernière dépendance du répertoire de sorts à la caractéristique
 * d'incantation.
 */

export type FullCasterClass = 'barde' | 'clerc' | 'druide' | 'ensorceleur' | 'magicien';
export type HalfCasterClass = 'paladin' | 'rodeur';
/**
 * Toutes les classes lanceuses de sorts.
 *
 * En 2024 il n'y a plus de distinction à faire : chacune lit son nombre de
 * sorts préparés dans la colonne « Prepared Spells » de sa propre table. Ni
 * « sorts connus », ni formule à base de caractéristique — les deux
 * mécaniques que le PHB 2014 opposait ont fusionné en une seule.
 */
export type TabledCasterClass =
  | 'barde' | 'clerc' | 'druide' | 'ensorceleur'
  | 'magicien' | 'occultiste' | 'paladin' | 'rodeur';

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

/**
 * Sorts mineurs connus au niveau 1, avant paliers. Vérifié contre le PHB 2024.
 *
 * Sa propre liste de classes, et non l'union des lanceurs : le Paladin lance
 * des sorts sans jamais avoir de sort mineur, et le lui faire déclarer un
 * nombre — fût-il zéro — laisserait croire que la question se pose.
 */
const CANTRIPS_KNOWN_BASE = {
  barde: 2, clerc: 3, druide: 2, ensorceleur: 4, magicien: 3, occultiste: 2, rodeur: 0,
} as const satisfies Partial<Record<TabledCasterClass, number>>;

/** +1 aux niveaux 4 et 10, pour les classes qui ont des sorts mineurs. Vérifié. */
export const cantripsKnown = (classId: keyof typeof CANTRIPS_KNOWN_BASE, level: number): number => {
  const base = CANTRIPS_KNOWN_BASE[classId] ?? 0;
  if (base === 0) return 0;
  const lv = clampLevel(level);
  return base + (lv >= 4 ? 1 : 0) + (lv >= 10 ? 1 : 0);
};

/**
 * Sorts inscrits au grimoire du Magicien par sa progression : 6 au niveau 1,
 * +2 par niveau ensuite (PHB 2024 p. 165).
 *
 * À ne jamais confondre avec le nombre de sorts préparés, qui se lit dans
 * `PREPARED_SPELLS` : le grimoire est le répertoire où le Magicien puise, la
 * liste préparée est ce qu'il en a tiré aujourd'hui. Au niveau 20 le premier
 * contient au moins 44 sorts quand la seconde en compte 25.
 *
 * « Au moins » : ce n'est pas un plafond. Un Magicien recopie les sorts
 * trouvés en aventure, et son grimoire dépasse alors cette progression.
 */
export const wizardSpellbookSize = (level: number): number => 6 + 2 * (clampLevel(level) - 1);

/**
 * Sorts préparés, lus dans la table de progression de chaque classe.
 *
 * Une classe ne calcule pas son nombre de sorts : elle le lit. La
 * caractéristique d'incantation sert au DD de sauvegarde et au jet d'attaque,
 * jamais à la taille de la liste — deux Druides de même niveau préparent
 * autant de sorts, quelle que soit leur Sagesse.
 *
 * Relevées dans le PHB 2024, table de progression de chaque classe :
 * Barde p. 60, Clerc p. 70, Druide p. 80, Paladin p. 110, Rôdeur p. 120,
 * Ensorceleur p. 140, Occultiste p. 154, Magicien p. 166.
 *
 * Trois progressions seulement, pour huit classes : les lanceurs complets
 * partagent la même (le Magicien s'en écarte à partir du niveau 14), et les
 * demi-lanceurs Paladin et Rôdeur sont identiques. L'Occultiste est le seul
 * cas à part.
 */
const PREPARED_SPELLS: Record<TabledCasterClass, readonly number[]> = {
  barde: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  clerc: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  druide: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  ensorceleur: [2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  magicien: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 18, 19, 21, 22, 23, 24, 25],
  occultiste: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
  paladin: [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15],
  rodeur: [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15],
};

export const tabledPreparedSpellCount = (classId: TabledCasterClass, level: number): number | null => {
  const table = PREPARED_SPELLS[classId];
  return table ? table[clampLevel(level) - 1] : null;
};

