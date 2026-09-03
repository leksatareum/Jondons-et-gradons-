/**
 * Les effets d'environnement — Guide du Maître 2024, p. 68 et 69.
 *
 * ═══ Pourquoi ═══
 *
 * Ce sont les règles du VOYAGE et du décor hostile : le froid, la chaleur,
 * l'eau glacée, le vent, la glace. Elles se cherchent toujours au mauvais
 * moment — quand le groupe décide de traverser le lac gelé — et un MJ qui ne
 * les trouve pas improvise un DD, ce qui est sans conséquence une fois mais
 * fait dériver une campagne quand ça devient l'habitude.
 *
 * ═══ Ce qui les distingue des dangers ═══
 *
 * Un danger frappe une fois et fort ; un effet d'environnement RONGE. Presque
 * tous se paient en niveaux d'Épuisement, à la fin de chaque heure ou de
 * chaque minute — d'où le champ `rythme`, qui est ce qu'un MJ doit savoir
 * avant même le DD : à quelle fréquence il redemande un jet.
 *
 * ═══ Ce qui n'y est pas ═══
 *
 * Les effets PLANAIRES liés à un plan précis (Achéron, Arcadie, Mont Céleste,
 * Géhenne, Pandémonium) sont écartés : ils appartiennent au chapitre des
 * plans, et une campagne qui y arrive n'a plus besoin d'un pense-bête. Les
 * zones de magie morte et de magie sauvage restent, elles : on les pose sur
 * le Plan Matériel sans rien expliquer.
 */

export type Rythme = 'heure' | 'minute' | 'entree' | 'permanent';

export type EffetEnvironnement = {
  id: string;
  nom: string;
  /** À quelle fréquence l'effet redemande quelque chose. */
  rythme: Rythme;
  /** Vrai quand l'effet se paie en niveaux d'Épuisement — la moitié du chapitre. */
  epuisement: boolean;
  /**
   * La sauvegarde demandée, quand il y en a une.
   *
   * `rythme` dit à quelle FRÉQUENCE le MJ doit s'en occuper ; ce champ dit
   * s'il y a un JET. Les deux ne vont pas toujours ensemble : la haute
   * altitude agit à chaque heure sans demander la moindre sauvegarde, elle
   * double simplement le temps de trajet.
   */
  sauvegarde?: { caracteristique: 'FOR' | 'DEX' | 'CON' | 'INT' | 'SAG' | 'CHA'; dd: number | 'croissant' };
  resume: string;
  effet: string;
  /** Qui y échappe d'office : le Guide le précise presque à chaque fois. */
  exemption?: string;
  page: number;
};

/** Ce que dit le rythme, en clair. */
export const LIBELLE_RYTHME: Record<Rythme, string> = {
  heure: 'à la fin de chaque heure',
  minute: 'à chaque minute',
  entree: 'en y entrant, ou en y commençant son tour',
  permanent: 'en permanence',
};

export const EFFETS_ENVIRONNEMENT: EffetEnvironnement[] = [
  {
    id: 'froid-extreme', nom: 'Froid extrême', rythme: 'heure', epuisement: true, page: 68,
    sauvegarde: { caracteristique: 'CON', dd: 10 },
    resume: 'Moins de −18 °C.',
    effet: 'Sauvegarde de Constitution DD 10 à la fin de chaque heure, sinon 1 niveau d’Épuisement.',
    exemption: 'Résistance ou immunité au froid : réussite automatique.',
  },
  {
    id: 'chaleur-extreme', nom: 'Chaleur extrême', rythme: 'heure', epuisement: true, page: 68,
    sauvegarde: { caracteristique: 'CON', dd: 'croissant' },
    resume: 'Plus de 38 °C, sans eau potable.',
    effet: 'Sauvegarde de Constitution à la fin de chaque heure, sinon 1 niveau d’Épuisement. '
      + 'Le DD est de 5 la première heure et MONTE DE 1 à chaque heure suivante — c’est le seul effet du chapitre qui s’aggrave tout seul, '
      + 'et ce qui rend une traversée de désert dangereuse par sa durée plutôt que par son DD de départ. '
      + 'Armure intermédiaire ou lourde : désavantage.',
    exemption: 'Résistance ou immunité au feu : réussite automatique.',
  },
  {
    id: 'eau-glacee', nom: 'Eau glacée', rythme: 'minute', epuisement: true, page: 68,
    sauvegarde: { caracteristique: 'CON', dd: 10 },
    resume: 'Immersion dans une eau glaciale.',
    effet: 'Une créature tient un nombre de minutes égal à son SCORE de Constitution sans rien subir. '
      + 'Chaque minute au-delà : sauvegarde de Constitution DD 10, sinon 1 niveau d’Épuisement. '
      + 'Un score de 14 donne donc quatorze minutes de marge — puis la note tombe vite.',
    exemption: 'Résistance ou immunité au froid, et créatures naturellement adaptées à l’eau glaciale : réussite automatique.',
  },
  {
    id: 'eau-profonde', nom: 'Eau profonde', rythme: 'heure', epuisement: true, page: 68,
    sauvegarde: { caracteristique: 'CON', dd: 10 },
    resume: 'Plus de 30 m de fond : la pression et la température s’ajoutent.',
    effet: 'Après chaque heure de nage, une créature sans vitesse de nage fait une sauvegarde de Constitution DD 10, '
      + 'sinon 1 niveau d’Épuisement.',
  },
  {
    id: 'glace-glissante', nom: 'Glace glissante', rythme: 'entree', epuisement: false, page: 69,
    sauvegarde: { caracteristique: 'DEX', dd: 10 },
    resume: 'Terrain difficile, et on y tombe.',
    effet: 'La zone est un terrain difficile. Y entrer pour la première fois du tour, ou y commencer son tour : '
      + 'sauvegarde de Dextérité DD 10 ou À terre.',
  },
  {
    id: 'glace-fine', nom: 'Glace fine', rythme: 'permanent', epuisement: false, page: 69,
    resume: 'Elle cède sous le poids, et dessous il y a l’eau glacée.',
    effet: 'Chaque carré de 3 m supporte un poids limité, exprimé en dés de dix multipliés par dix livres. '
      + 'Dépassé, la glace de cette zone se brise et TOUT CE QUI EST DESSUS TOMBE — dans de l’eau glacée, dont les règles sont juste au-dessus. '
      + 'Le nombre de dés est illisible dans notre exemplaire : fixe-le toi-même selon l’épaisseur que tu décris, '
      + 'plutôt que de te fier à un chiffre que je n’ai pas pu lire.',
  },
  {
    id: 'vent-fort', nom: 'Vent fort', rythme: 'permanent', epuisement: false, page: 69,
    resume: 'Il gêne le tir, souffle les flammes et fait tomber ce qui vole.',
    effet: 'Désavantage aux jets d’attaque à distance avec une arme. Éteint les flammes nues et disperse le brouillard. '
      + 'Une créature volante doit se poser à la fin de son tour, sinon elle tombe. '
      + 'Dans un désert, il lève une tempête de sable : désavantage aux tests de Sagesse (Perception).',
  },
  {
    id: 'fortes-precipitations', nom: 'Fortes précipitations', rythme: 'permanent', epuisement: false, page: 69,
    resume: 'Pluie ou neige drue.',
    effet: 'Toute la zone est Légèrement obscurcie, et les tests de Sagesse (Perception) y sont désavantagés. '
      + 'La pluie drue éteint aussi les flammes nues.',
  },
  {
    id: 'haute-altitude', nom: 'Haute altitude', rythme: 'heure', epuisement: false, page: 69,
    resume: 'Au-dessus de 3 000 m : on avance deux fois moins loin.',
    effet: 'Chaque heure de voyage en compte DEUX pour le rythme de déplacement. '
      + 'On s’acclimate en passant 30 jours ou plus à cette altitude. '
      + 'Au-dessus de 6 000 m, seules les créatures natives de ces milieux peuvent s’acclimater.',
  },
  {
    id: 'zone-magie-morte', nom: 'Zone de magie morte', rythme: 'permanent', epuisement: false, page: 68,
    resume: 'La magie n’y opère plus du tout.',
    effet: 'Même effet que le sort Champ antimagie, mais permanent, sur une zone de 90 m de diamètre au plus.',
  },
  {
    id: 'zone-magie-sauvage', nom: 'Zone de magie sauvage', rythme: 'permanent', epuisement: false, page: 69,
    resume: 'Un désastre magique ancien y a déchiré la trame : la magie y dérape.',
    effet: 'Zone de 90 m de diamètre au plus. Chaque fois qu’une créature dépense un emplacement de sort pour lancer un sort, lance 1d20. '
      + 'Sur un 20, tire sur la table de Poussée de magie sauvage du Manuel des joueurs.',
  },
];

/** Ceux qui coûtent de l'Épuisement d'abord : c'est ce qui use un groupe en voyage. */
export const effetsParUsure = (): EffetEnvironnement[] =>
  [...EFFETS_ENVIRONNEMENT].sort((a, b) =>
    Number(b.epuisement) - Number(a.epuisement) || a.nom.localeCompare(b.nom, 'fr'));
