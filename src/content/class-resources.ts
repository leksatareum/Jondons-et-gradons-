import { abilityModifier, type AbilityScores } from '../model/character';

/**
 * Les réserves chiffrées du tronc commun de chaque classe.
 *
 * ═══ Pourquoi ce fichier existe ═══
 *
 * Le moteur savait déjà tout faire — afficher une réserve, la dépenser d'un
 * appui, la rendre au bon repos. Mais seuls le Druide, le Rôdeur et
 * l'Occultiste en déclaraient, écrits à la main un par un dans
 * `derivedResources`. Les neuf autres classes avaient leurs textes de règles
 * et leurs sorts, et rien de vivant : un Paladin sans compteur d'Imposition
 * des mains, un Barbare qui compte ses rages sur ses doigts.
 *
 * Ici, une réserve est une DONNÉE, pas du code : une ligne par capacité, avec
 * sa formule et son repos. Chaque valeur est épinglée par un test — un
 * changement se voit.
 *
 * ═══ Provenance des chiffres ═══
 *
 * Chaque entrée porte le numéro de page du PHB 2024 où la règle a été LUE,
 * table de progression comprise. Aucun texte du livre ne vit dans ce dépôt
 * (voir `rules-compendium.ts`) : ces pages sont là pour retrouver la source en
 * un coup d'œil, pas pour s'en passer.
 *
 * Trois choses relevées à cette lecture, contre ce qu'on suppose volontiers :
 *
 * · L'Inspiration bardique ne revient PAS au repos court avant le niveau 5 —
 *   c'est Source d'inspiration qui l'ouvre (p. 61). D'où une recharge qui
 *   dépend du niveau.
 * · Le Conduit divin, du Clerc comme du Paladin, rend UNE utilisation au repos
 *   court, jamais toute la réserve.
 * · Le Barbare de niveau 20 a six rages, pas un nombre illimité.
 *
 * ═══ Ce qui n'est pas ici ═══
 *
 * Les sous-classes (Conduit divin d'un domaine, manœuvres d'un archétype…) et
 * les trois classes déjà écrites à la main. Les emplacements de sorts n'en
 * sont pas non plus : ils se dérivent déjà pour toutes les classes.
 */

export type Recharge = 'court' | 'long' | 'court_ou_long';

export interface ClassResourceDef {
  /** Classe qui l'apporte, telle que `classLevels[].classId`. */
  classId: string;
  /** Clé de stockage. Préfixée par la classe : deux classes ne se marchent pas dessus. */
  key: string;
  name: string;
  /** Premier niveau DANS CETTE CLASSE où la réserve existe. */
  since: number;
  /** Taille de la réserve, au niveau atteint dans cette classe. */
  max: (niveau: number, abilities: AbilityScores) => number;
  /**
   * Le repos qui la rend. Une fonction quand le niveau change la règle —
   * l'Inspiration bardique est le seul cas du tronc commun, mais un seul
   * suffit à interdire une valeur figée.
   */
  recharge: Recharge | ((niveau: number) => Recharge);
  /**
   * Utilisations rendues par un repos court quand ce n'est PAS toute la
   * réserve. Le cas de plusieurs capacités 2024 : « une utilisation au repos
   * court, toutes au repos long ». Sans ce champ il faudrait choisir entre
   * trop rendre et ne rien rendre.
   */
  shortRecovery?: number;
  /** Page du PHB 2024 où la règle et sa table ont été lues. */
  page: number;
}

/** Par paliers : le dernier seuil atteint gagne. Plus court à lire qu'une cascade de ternaires. */
const parPaliers = (paliers: [niveau: number, valeur: number][]) => (niveau: number): number => {
  let valeur = 0;
  for (const [seuil, v] of paliers) if (niveau >= seuil) valeur = v;
  return valeur;
};

export const CLASS_RESOURCES: ClassResourceDef[] = [
  // ── Barbare ────────────────────────────────────────────────────────
  {
    classId: 'barbare', key: 'barbare:rage', name: 'Rage', since: 1,
    // Table des Rages, p. 52 : 2 · 3 (niv. 3) · 4 (6) · 5 (12) · 6 (17), et
    // six encore au niveau 20 — la table ne dit nulle part « illimité ».
    max: parPaliers([[1, 2], [3, 3], [6, 4], [12, 5], [17, 6]]),
    recharge: 'long', shortRecovery: 1, page: 51,
  },
  {
    classId: 'barbare', key: 'barbare:rage-persistante', name: 'Rage persistante', since: 15,
    // « Quand tu roules l'initiative, tu peux récupérer toutes tes rages
    // dépensées » — une fois par repos long. C'est bien une réserve.
    max: () => 1, recharge: 'long', page: 53,
  },

  // ── Barde ──────────────────────────────────────────────────────────
  {
    classId: 'barde', key: 'barde:inspiration', name: 'Inspiration bardique', since: 1,
    max: (_niveau, abilities) => Math.max(1, abilityModifier(abilities.cha)),
    // p. 59 : repos LONG. Puis Source d'inspiration (p. 61) ouvre le repos
    // court à partir du niveau 5. Se tromper ici offrirait au barde de
    // niveau 1 des inspirations qu'il n'a pas.
    recharge: (niveau) => (niveau >= 5 ? 'court_ou_long' : 'long'), page: 59,
  },

  // ── Clerc ──────────────────────────────────────────────────────────
  {
    classId: 'clerc', key: 'clerc:conduit-divin', name: 'Conduit divin', since: 2,
    max: parPaliers([[2, 2], [6, 3], [18, 4]]),
    recharge: 'long', shortRecovery: 1, page: 70,
  },
  {
    classId: 'clerc', key: 'clerc:intervention-divine', name: 'Intervention divine', since: 10,
    max: () => 1, recharge: 'long', page: 71,
  },

  // ── Guerrier ───────────────────────────────────────────────────────
  {
    classId: 'guerrier', key: 'guerrier:second-souffle', name: 'Second souffle', since: 1,
    max: parPaliers([[1, 2], [4, 3], [10, 4]]),
    recharge: 'long', shortRecovery: 1, page: 91,
  },
  {
    classId: 'guerrier', key: 'guerrier:fougue-guerriere', name: 'Fougue guerrière', since: 2,
    max: parPaliers([[2, 1], [17, 2]]),
    recharge: 'court_ou_long', page: 91,
  },
  {
    classId: 'guerrier', key: 'guerrier:indomptable', name: 'Indomptable', since: 9,
    max: parPaliers([[9, 1], [13, 2], [17, 3]]),
    recharge: 'long', page: 92,
  },

  // ── Magicien ───────────────────────────────────────────────────────
  {
    classId: 'magicien', key: 'magicien:recuperation-arcanique', name: 'Récupération arcanique', since: 1,
    // Se dépense AU repos court, mais ne revient qu'au repos long : c'est
    // bien « long », et non « court ».
    max: () => 1, recharge: 'long', page: 166,
  },

  // ── Moine ──────────────────────────────────────────────────────────
  {
    classId: 'moine', key: 'moine:concentration', name: 'Points de concentration', since: 2,
    // « Ton niveau de Moine détermine le nombre de points » (p. 101).
    max: (niveau) => niveau,
    recharge: 'court_ou_long', page: 102,
  },
  {
    classId: 'moine', key: 'moine:metabolisme', name: 'Métabolisme surnaturel', since: 2,
    max: () => 1, recharge: 'long', page: 102,
  },

  // ── Paladin ────────────────────────────────────────────────────────
  {
    classId: 'paladin', key: 'paladin:imposition-des-mains', name: 'Imposition des mains (PV)', since: 1,
    // Une réserve de POINTS DE VIE, pas d'utilisations : on y puise ce qu'on
    // veut. D'où un maximum qui grimpe vite — c'est normal.
    max: (niveau) => niveau * 5,
    recharge: 'long', page: 109,
  },
  {
    classId: 'paladin', key: 'paladin:conduit-divin', name: 'Conduit divin', since: 3,
    max: parPaliers([[3, 2], [11, 3]]),
    recharge: 'long', shortRecovery: 1, page: 110,
  },

  // ── Ensorceleur ────────────────────────────────────────────────────
  {
    classId: 'ensorceleur', key: 'ensorceleur:sorcellerie-innee', name: 'Sorcellerie innée', since: 1,
    max: () => 2, recharge: 'long', page: 140,
  },
  {
    classId: 'ensorceleur', key: 'ensorceleur:points-sorcellerie', name: 'Points de sorcellerie', since: 2,
    max: (niveau) => niveau,
    recharge: 'long', page: 141,
  },
  {
    classId: 'ensorceleur', key: 'ensorceleur:restauration', name: 'Restauration sorcelière', since: 5,
    max: () => 1, recharge: 'long', page: 141,
  },

  // ── Roublard ───────────────────────────────────────────────────────
  // Le tronc commun du Roublard ne porte aucune réserve avant le niveau 20 :
  // l'Attaque sournoise n'en est pas une, et Frappe rusée se paie avec ses
  // dés. Ce n'est pas un oubli.
  {
    classId: 'roublard', key: 'roublard:coup-de-chance', name: 'Coup de chance', since: 20,
    max: () => 1, recharge: 'court_ou_long', page: 131,
  },
];

/**
 * Les réserves d'un personnage, tous ses niveaux de classe confondus.
 *
 * Le multiclassage tombe juste sans effort : chaque définition lit le niveau
 * DANS SA classe, jamais le niveau total. Un Paladin 6 / Guerrier 2 a bien
 * 30 points d'Imposition des mains, pas 40.
 */
export function classResourcesFor(
  classLevels: { classId: string; level: number }[],
  abilities: AbilityScores,
): { key: string; name: string; max: number; recharge: Recharge; shortRecovery?: number; classId: string }[] {
  const out = [];
  for (const definition of CLASS_RESOURCES) {
    const niveau = classLevels
      .filter((entry) => entry.classId === definition.classId)
      .reduce((total, entry) => total + entry.level, 0);
    if (niveau < definition.since) continue;
    const max = definition.max(niveau, abilities);
    if (max <= 0) continue;
    out.push({
      key: definition.key, name: definition.name, max,
      recharge: typeof definition.recharge === 'function'
        ? definition.recharge(niveau)
        : definition.recharge,
      shortRecovery: definition.shortRecovery,
      classId: definition.classId,
    });
  }
  return out;
}
