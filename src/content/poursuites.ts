/**
 * Les poursuites — Guide du Maître 2024, p. 52 à 54.
 *
 * ═══ Pourquoi des règles ═══
 *
 * Le Guide le dit sans détour : les règles de mouvement du combat rendent une
 * poursuite ennuyeuse et prévisible. Le plus rapide rattrape toujours le plus
 * lent ; à vitesse égale, l'écart ne bouge jamais. Ce chapitre existe pour
 * remettre du hasard là-dedans.
 *
 * ═══ Ce que l'appli apporte, et que le livre ne peut pas ═══
 *
 * Deux choses seulement se suivent mal de tête au milieu d'une course :
 *
 * 1. Le nombre de Pointes que chacun a encore avant de risquer l'Épuisement.
 *    Il vaut 3 + le modificateur de Constitution, donc il DIFFÈRE d'un
 *    personnage à l'autre — et l'appli connaît les Constitutions.
 * 2. La complication, tirée à chaque fin de tour, qui frappe le SUIVANT dans
 *    l'ordre d'initiative et pas celui qui lance le dé. C'est la règle qu'on
 *    applique de travers une fois sur deux.
 *
 * ═══ Comment ce scan a été lu ═══
 *
 * Les deux tables de complications sont imprimées côte à côte, et
 * l'océrisation les entrelace ligne à ligne en inversant les colonnes à
 * mi-chemin : la position ne dit donc pas à quelle table appartient une
 * entrée. Ce sont le CONTENU et l'arithmétique qui tranchent, et les deux
 * concordent : la nuée d'insectes, le ruisseau, le sable, la ronce-rasoir et
 * la créature du coin sont de la nature ; la charrette, la foule, les
 * tonneaux, l'huile renversée et la rixe sont de la ville. Chaque table tombe
 * ainsi sur exactement six entrées, et l'entrée de DD 15 est la cinquième des
 * deux côtés — une symétrie que le livre a bel et bien imprimée.
 *
 * Un recoupement de plus : les dégâts de la ronce-rasoir (1d10 tranchants) et
 * son DD 15 sont ceux de la fiche du même nom dans `dangers.ts`, lue à une
 * autre page.
 */

export type Complication = {
  /** Le résultat du d12 qui la déclenche. 7 à 12 ne déclenchent rien. */
  rang: number;
  texte: string;
};

export type TerrainDePoursuite = 'ville' | 'nature';

export const LIBELLE_TERRAIN: Record<TerrainDePoursuite, string> = {
  ville: 'En ville',
  nature: 'En pleine nature',
};

/** Guide p. 54, table 1d12 « Urban Chase Complications ». */
export const COMPLICATIONS_VILLE: Complication[] = [
  {
    rang: 1,
    texte: 'Une charrette, ou un autre gros obstacle, te barre le passage. Sauvegarde de Dextérité DD 10 pour le franchir. '
      + 'Échec : l’obstacle compte comme 3 m de terrain difficile pour toi.',
  },
  {
    rang: 2,
    texte: 'Une foule te barre le passage. Sauvegarde de Force, de Dextérité ou de Charisme (au choix) DD 10 pour la traverser. '
      + 'Échec : la foule compte comme 3 m de terrain difficile pour toi.',
  },
  {
    rang: 3,
    texte: 'Un dédale de tonneaux, de caisses ou d’obstacles semblables se dresse devant toi. '
      + 'Sauvegarde de Dextérité ou d’Intelligence (au choix) DD 10 pour t’y frayer un chemin. '
      + 'Échec : le dédale compte comme 3 m de terrain difficile pour toi.',
  },
  {
    rang: 4,
    texte: 'Le sol est glissant — pluie, huile renversée, un autre liquide. Sauvegarde de Dextérité DD 10. '
      + 'Échec : tu es À terre.',
  },
  {
    rang: 5,
    texte: 'Tu tombes sur une rixe. Sauvegarde de Force, de Dextérité ou de Charisme (au choix) DD 15 pour passer sans encombre. '
      + 'Échec : 2d4 dégâts contondants, et les bagarreurs comptent comme 3 m de terrain difficile pour toi.',
  },
  {
    rang: 6,
    texte: 'Un virage sec, pour éviter quelque chose d’infranchissable. Sauvegarde de Dextérité DD 10 pour le négocier. '
      + 'Échec : tu percutes quelque chose de dur et subis 1d4 dégâts contondants.',
  },
];

/** Guide p. 54, table 1d12 « Wilderness Chase Complications ». */
export const COMPLICATIONS_NATURE: Complication[] = [
  {
    rang: 1,
    texte: 'Tu traverses une Nuée d’insectes — au MJ de choisir l’espèce la plus logique. '
      + 'La nuée utilise une de ses actions en te prenant pour cible.',
  },
  {
    rang: 2,
    texte: 'Un ruisseau ou un ravin te barre la route. Sauvegarde de Force ou de Dextérité (au choix) DD 10 pour le franchir. '
      + 'Échec : l’obstacle compte comme 3 m de terrain difficile pour toi.',
  },
  {
    rang: 3,
    texte: 'Sauvegarde de Constitution DD 10. Échec : du sable, de la poussière, de la cendre, de la neige ou du pollen '
      + 'te rend Aveuglé jusqu’à la fin de ton tour. Tant que tu l’es ainsi, ta vitesse est divisée par deux.',
  },
  {
    rang: 4,
    texte: 'Une dénivellation brutale te surprend. Sauvegarde de Dextérité DD 10 pour la négocier. Échec : tu tombes de 3 m.',
  },
  {
    rang: 5,
    texte: 'Ton chemin longe un massif de ronce-rasoir. Sauvegarde de Dextérité DD 15, ou dépense 3 m de mouvement (au choix), pour l’éviter. '
      + 'Échec : 1d10 dégâts tranchants.',
  },
  {
    rang: 6,
    texte: 'Une créature du coin te remarque — au MJ d’en choisir une adaptée au terrain. '
      + 'Sauvegarde de Sagesse ou de Charisme (au choix) DD 10. Échec : elle rejoint la poursuite, avec toi pour proie.',
  },
];

export const COMPLICATIONS: Record<TerrainDePoursuite, Complication[]> = {
  ville: COMPLICATIONS_VILLE,
  nature: COMPLICATIONS_NATURE,
};

/** Le d12 de fin de tour. Rend `null` sur 7 à 12 : le Guide n'y met rien. */
export function tirerComplication(
  terrain: TerrainDePoursuite,
  hasard: () => number,
): { de: number; complication: Complication | null } {
  const de = 1 + Math.floor(hasard() * 12);
  return { de, complication: COMPLICATIONS[terrain].find((c) => c.rang === de) ?? null };
}

/**
 * Le nombre de Pointes qu'une créature peut prendre sans rien risquer :
 * 3 + son modificateur de Constitution, au minimum une (Guide p. 52).
 *
 * C'est le seul chiffre de la poursuite qui change d'un personnage à l'autre,
 * et le seul qu'on ne peut pas retenir de tête pour cinq combattants.
 */
export const pointesGratuites = (modificateurConstitution: number): number =>
  Math.max(1, 3 + modificateurConstitution);

export const REGLE_POINTE_SUPPLEMENTAIRE =
  'Chaque Pointe au-delà demande une sauvegarde de Constitution DD 10 à la fin du tour, '
  + 'sinon 1 niveau d’Épuisement. Une créature dont la vitesse tombe à 0 quitte la poursuite.';

/** Ce qu'il faut poser avant de lancer les dés — Guide p. 52. */
export const POUR_COMMENCER: string[] = [
  'Il faut au moins une proie et au moins un poursuivant.',
  'Tous ceux qui ne sont pas déjà dans l’ordre d’initiative en lancent une.',
  'Fixe la distance de départ entre la proie et les poursuivants, et suis-la.',
  'Le poursuivant le plus proche est le MENEUR. Ça peut changer à chaque round.',
];

/** Ce qui se joue pendant — Guide p. 52 et 53. */
export const PENDANT_LA_COURSE: string[] = [
  'Chacun a une action et un mouvement par tour, comme en combat.',
  'On peut attaquer et lancer des sorts normalement, mais s’arrêter pour le faire, c’est risquer de perdre sa proie.',
  'Pas d’attaques d’opportunité entre participants : tout le monde court dans le même sens. '
    + 'Ceux qui NE courent PAS, eux, en font — traverser une bande de brutes coûte cher.',
];

/**
 * Le jet d'évasion, à l'initiative 0 — Guide p. 53.
 *
 * C'est la règle qui décide de la fin, et son piège tient en une phrase : si
 * la proie n'est jamais sortie du champ de vision du meneur, le jet est un
 * échec automatique, quel que soit le résultat du dé.
 */
export const REGLE_EVASION =
  'À l’initiative 0, une fois que tout le monde a joué, chaque proie fait un test de Dextérité (Discrétion) '
  + 'contre la meilleure Perception passive des poursuivants. Si elle n’est jamais sortie du champ de vision du meneur, '
  + 'le test échoue automatiquement. Réussi, elle s’échappe — ce qui ne veut pas dire qu’elle a pris de l’avance : '
  + 'en ville, ça peut être un coin de rue ou une foule.';

export const FACTEURS_DE_FUITE: { sens: 'avantage' | 'desavantage'; texte: string }[] = [
  { sens: 'avantage', texte: 'Beaucoup d’endroits où se cacher' },
  { sens: 'avantage', texte: 'Un lieu très fréquenté' },
  { sens: 'desavantage', texte: 'Peu d’endroits où se cacher' },
  { sens: 'desavantage', texte: 'Un lieu désert' },
];

export const REGLE_COMPLICATION_SUIVANT =
  'Chaque participant lance 1d12 à la fin de son tour. La complication ne le touche pas LUI : '
  + 'elle touche le suivant dans l’ordre d’initiative.';

export const REGLE_SEPARATION =
  'Une proie peut se scinder pour forcer les poursuivants à se diviser ou à en laisser filer une partie. '
  + 'Chaque poursuite se résout alors à part, avec sa propre distance, tout le monde restant dans le même ordre d’initiative.';

export const AVERTISSEMENT_SORTS =
  'Regarde ce que ton groupe sait faire avant de bâtir une scène sur une poursuite : '
  + 'une grande vitesse, ou un Porte dimensionnelle, un Vol, un Immobilisation de monstre, y met fin avant qu’elle commence.';
