import { abilityModifier, type AbilityScores } from '../model/character';

/**
 * Les réserves chiffrées du tronc commun de chaque classe.
 *
 * ═══ Pourquoi ce fichier existe ═══
 *
 * Le moteur savait déjà tout faire : afficher une réserve, la dépenser d'une
 * pastille, la rendre au bon repos. Mais seuls le Druide, le Rôdeur et
 * l'Occultiste en déclaraient — écrits à la main, un par un, dans
 * `derivedResources`. Les neuf autres classes avaient leurs textes de règles
 * et leurs sorts, et rien de vivant : un Paladin sans compteur d'Imposition
 * des mains, un Barbare qui compte ses rages sur ses doigts. Refaire un
 * personnage, ou accueillir un joueur, faisait tomber dans une application
 * bien plus pauvre sans que rien ne le dise.
 *
 * Ici, une réserve est une DONNÉE, pas du code : une ligne par capacité, avec
 * sa formule. Corriger un chiffre est une modification d'une ligne, et chaque
 * valeur est épinglée par un test — un changement se voit.
 *
 * ═══ Degré de confiance ═══
 *
 * Ces valeurs viennent du PHB 2024 et sont écrites de mémoire : aucun texte du
 * livre ne vit dans ce dépôt (voir `rules-compendium.ts`). Chaque entrée porte
 * donc un champ `confiance` :
 *
 * · `haute`   — chiffre que je tiens pour sûr.
 * · `moyenne` — la capacité et son ordre de grandeur sont sûrs, mais le palier
 *               exact ou le repos qui la rend méritent une vérification au
 *               livre avant de s'y fier en partie.
 *
 * Ce champ n'est pas décoratif : `RESSOURCES_A_VERIFIER` le rend lisible d'un
 * coup, et l'écart entre « je crois » et « je sais » ne doit pas se perdre
 * entre ici et la table.
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
  recharge: Recharge;
  /**
   * Utilisations rendues par un repos court, quand ce n'est pas toute la
   * réserve. Le cas de plusieurs capacités 2024 : « une utilisation au repos
   * court, toutes au repos long ». Sans ce champ, il faudrait choisir entre
   * trop rendre et trop peu.
   */
  shortRecovery?: number;
  confiance: 'haute' | 'moyenne';
  /** Ce qui mérite d'être revu, en clair. Affiché nulle part, lu par qui corrige. */
  note?: string;
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
    max: parPaliers([[1, 2], [3, 3], [6, 4], [12, 5], [17, 6]]),
    recharge: 'long', shortRecovery: 1, confiance: 'moyenne',
    note: 'Table 2/3/4/5/6 sûre. À vérifier : le repos court rend bien UNE rage, '
      + 'et le niveau 20 les rend illimitées (plafonné à 6 ici).',
  },

  // ── Barde ──────────────────────────────────────────────────────────
  {
    classId: 'barde', key: 'barde:inspiration', name: 'Inspiration bardique', since: 1,
    max: (_niveau, abilities) => Math.max(1, abilityModifier(abilities.cha)),
    recharge: 'court_ou_long', confiance: 'moyenne',
    note: 'Nombre (mod. Charisme, minimum 1) sûr. À vérifier : en 2024 les '
      + 'utilisations reviennent dès le repos court, et ce dès le niveau 1.',
  },

  // ── Clerc ──────────────────────────────────────────────────────────
  {
    classId: 'clerc', key: 'clerc:conduit-divin', name: 'Conduit divin', since: 2,
    max: parPaliers([[2, 2], [6, 3], [18, 4]]),
    recharge: 'court_ou_long', confiance: 'moyenne',
    note: 'À vérifier : les paliers 2/6/18 et si le repos court rend TOUT ou une seule utilisation.',
  },

  // ── Guerrier ───────────────────────────────────────────────────────
  {
    classId: 'guerrier', key: 'guerrier:second-souffle', name: 'Second souffle', since: 1,
    max: parPaliers([[1, 2], [4, 3], [10, 4]]),
    recharge: 'long', shortRecovery: 1, confiance: 'moyenne',
    note: 'À vérifier : les paliers 2/3/4 aux niveaux 1/4/10. Esprit tactique dépense '
      + 'cette même réserve, il n’en a donc pas d’autre.',
  },
  {
    classId: 'guerrier', key: 'guerrier:fougue-guerriere', name: 'Fougue guerrière', since: 2,
    max: parPaliers([[2, 1], [17, 2]]),
    recharge: 'court_ou_long', confiance: 'haute',
  },
  {
    classId: 'guerrier', key: 'guerrier:indomptable', name: 'Indomptable', since: 9,
    max: parPaliers([[9, 1], [13, 2], [17, 3]]),
    recharge: 'long', confiance: 'moyenne',
    note: 'À vérifier : les paliers 1/2/3 aux niveaux 9/13/17.',
  },

  // ── Magicien ───────────────────────────────────────────────────────
  {
    classId: 'magicien', key: 'magicien:recuperation-arcanique', name: 'Récupération arcanique', since: 1,
    max: () => 1, recharge: 'long', confiance: 'haute',
  },

  // ── Moine ──────────────────────────────────────────────────────────
  {
    classId: 'moine', key: 'moine:concentration', name: 'Points de concentration', since: 2,
    // Égal au niveau de Moine : la réserve la plus dépensée du jeu, et celle
    // qu'on suit le plus mal de tête.
    max: (niveau) => niveau,
    recharge: 'court_ou_long', confiance: 'haute',
  },

  // ── Paladin ────────────────────────────────────────────────────────
  {
    classId: 'paladin', key: 'paladin:imposition-des-mains', name: 'Imposition des mains (PV)', since: 1,
    // Une réserve de POINTS DE VIE, pas d'utilisations : on y puise ce qu'on
    // veut. D'où un maximum qui grimpe vite — c'est normal.
    max: (niveau) => niveau * 5,
    recharge: 'long', confiance: 'haute',
  },
  {
    classId: 'paladin', key: 'paladin:conduit-divin', name: 'Conduit divin', since: 3,
    max: parPaliers([[3, 2], [11, 3]]),
    recharge: 'long', shortRecovery: 1, confiance: 'moyenne',
    note: 'À vérifier : 2 utilisations au niveau 3, 3 au niveau 11, et le repos court '
      + 'qui en rend une seule.',
  },

  // ── Ensorceleur ────────────────────────────────────────────────────
  {
    classId: 'ensorceleur', key: 'ensorceleur:points-sorcellerie', name: 'Points de sorcellerie', since: 2,
    max: (niveau) => niveau,
    recharge: 'long', confiance: 'haute',
  },

  // ── Roublard ───────────────────────────────────────────────────────
  // Le tronc commun du Roublard ne porte aucune réserve avant le niveau 20 :
  // l'Attaque sournoise n'est pas une réserve, et Frappe rusée se paie avec
  // ses dés. Ce n'est pas un oubli.
  {
    classId: 'roublard', key: 'roublard:coup-de-chance', name: 'Coup de chance', since: 20,
    max: () => 1, recharge: 'court_ou_long', confiance: 'moyenne',
    note: 'À vérifier : niveau 20, et le repos qui la rend.',
  },
];

/** Ce qui mérite un coup d'œil au livre avant de s'y fier en partie. */
export const RESSOURCES_A_VERIFIER = CLASS_RESOURCES.filter((r) => r.confiance === 'moyenne');

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
      recharge: definition.recharge, shortRecovery: definition.shortRecovery,
      classId: definition.classId,
    });
  }
  return out;
}
