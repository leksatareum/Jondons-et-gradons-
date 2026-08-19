/**
 * Petites listes de référence — PHB 2024. Repêchées de
 * `table-connectee/src/App.jsx` (`DAMAGE_TYPES`, `SCHOOLS`). Confiance
 * haute : listes standard, inchangées depuis 2014.
 */

/** Les treize types de dégâts du jeu. */
export const DAMAGE_TYPES: readonly string[] = [
  'acide', 'contondants', 'feu', 'force', 'foudre', 'froid', 'nécrotiques',
  'perforants', 'poison', 'psychiques', 'radiants', 'tonnerre', 'tranchants',
];

/** Les huit écoles de magie. */
export const SCHOOLS: readonly string[] = [
  'Abjuration', 'Invocation', 'Divination', 'Enchantement', 'Évocation', 'Illusion', 'Nécromancie', 'Transmutation',
];

/**
 * Sous-ensembles de types de dégâts et de compétences auxquels certains dons
 * ou capacités restreignent un choix. Repêchés d'`App.jsx`
 * (`FEAT_ENERGY_TYPES`, `FEAT_ELEMENTAL_TYPES`, `KNOWLEDGE_SKILLS`,
 * `OBSERVANT_SKILLS`) — identiques entre source et sortie construite.
 */

/** Types d'énergie proposés par les dons qui laissent le choix (ex. Adepte élémentaire). */
export const FEAT_ENERGY_TYPES: readonly string[] = [
  'acide', 'froid', 'feu', 'foudre', 'nécrotiques', 'poison', 'psychiques', 'radiants', 'tonnerre',
];

/** Sous-ensemble strictement élémentaire, plus restreint que `FEAT_ENERGY_TYPES`. */
export const FEAT_ELEMENTAL_TYPES: readonly string[] = ['acide', 'froid', 'feu', 'foudre', 'tonnerre'];

/** Compétences dites « de connaissance », fondées sur l'Intelligence. */
export const KNOWLEDGE_SKILLS: readonly string[] = ['arcanes', 'histoire', 'investigation', 'nature', 'religion'];

/** Compétences proposées par le don Vigilant/Observateur. */
export const OBSERVANT_SKILLS: readonly string[] = ['intuition', 'investigation', 'perception'];

/**
 * Code court de chaque classe dans le catalogue de sorts (`cl` de
 * `spells.js`) : b=barde, c=clerc, dr=druide, p=paladin, ra=rôdeur,
 * s=ensorceleur, w=occultiste, m=magicien.
 */
export const SPELL_LIST_CODE: Record<string, string> = {
  barde: 'b', clerc: 'c', druide: 'dr', paladin: 'p',
  rodeur: 'ra', ensorceleur: 's', occultiste: 'w', magicien: 'm',
};
