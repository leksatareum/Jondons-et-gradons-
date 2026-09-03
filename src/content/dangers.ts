/**
 * Les dangers du décor et les pièges — Guide du Maître 2024, p. 76 à 79
 * (dangers) et p. 100 à 102 (pièges).
 *
 * ═══ Pourquoi ═══
 *
 * Le chapitre des rencontres met exactement DEUX leviers en face du budget de
 * PX : mélanger les profils, et se servir du décor. L'éditeur de rencontre
 * affichait déjà le second sous forme de conseil — « un danger du décor : les
 * deux camps peuvent s'en servir » — sans rien derrière. Un texte qui dit d'y
 * penser sans aider à le faire.
 *
 * ═══ Ce qui rend ces entrées utilisables ═══
 *
 * Chacune porte une GRAVITÉ et une TRANCHE DE NIVEAUX. C'est ce qui permet à
 * l'appli de ne montrer que ce qui convient au groupe, au lieu d'une liste où
 * le Fleuve Styx côtoie une flaque de vase. Le Guide prévient d'ailleurs
 * qu'un danger « anodin » à une tranche devient mortel à la tranche en
 * dessous — d'où l'affichage systématique des deux.
 *
 * ═══ Provenance et méthode ═══
 *
 * Chaque bloc a été lu à sa page. Le scan abîme surtout les dés, et chaque
 * ligne imprimant sa moyenne, l'arithmétique tranche à chaque fois :
 *
 *   « 10 (346) »   → 3d6 vaut 10,5 en moyenne  → 3d6
 *   « 21 (6d) »    → 6d6 vaut 21               → 6d6
 *   « 42 (1246) »  → 12d6 vaut 42              → 12d6
 *   « 24 (746) »   → 7d6 vaut 24,5             → 7d6
 *   « 19 (Bd12) »  → 3d12 vaut 19,5            → 3d12
 *   « 143 dards »  → 1d3 dards
 *
 * ═══ Ce qui n'y est pas ═══
 *
 * Le Brasier et la Pierre roulante manquent : leur ligne de dégâts tombe dans
 * un pli du scan, et un danger sans dégâts n'est pas utilisable à la table.
 * Ils sont absents plutôt qu'inventés — même règle que la ligne « FP 17+ » du
 * trésor individuel.
 */

export type Gravite = 'anodin' | 'mortel';

/** Une tranche de niveaux, telle que le Guide la découpe. */
export type Tranche = { min: number; max: number; gravite: Gravite };

export type Danger = {
  id: string;
  nom: string;
  /** `piege` : déclenché, détectable, désamorçable. `decor` : il est simplement là. */
  genre: 'decor' | 'piege';
  /** Une ou deux tranches — un même danger change de gravité selon le niveau. */
  tranches: Tranche[];
  /** Ce qu'il fait, en une phrase : c'est ce qu'on lit en pleine scène. */
  resume: string;
  /** La mécanique complète, telle qu'on l'annonce à la table. */
  effet: string;
  /** Piège seulement : ce qui le déclenche. */
  declencheur?: string;
  /** Piège seulement : comment on le repère et on le neutralise. */
  detection?: string;
  /** Comment il monte en puissance, quand le Guide le précise. */
  echelle?: string;
  page: number;
};

const T = (min: number, max: number, gravite: Gravite): Tranche => ({ min, max, gravite });

export const DANGERS: Danger[] = [
  // ── Le décor ──────────────────────────────────────────────────────
  {
    id: 'vase-verte', nom: 'Vase verte', genre: 'decor', page: 76,
    tranches: [T(1, 4, 'anodin')],
    resume: 'Une plaque acide de 1,50 m qui tombe du plafond et ronge la chair comme le métal.',
    effet: 'Vision aveugle 9 m : elle se laisse tomber sur ce qui passe dessous. Qui la sait là l’évite par une sauvegarde de Dextérité DD 10. '
      + 'Au contact : 5 (1d10) dégâts d’acide, puis autant au début de chacun de ses tours tant qu’elle n’est pas raclée (une action) ou détruite. '
      + 'Contre le bois ou le métal : 11 (2d10) par round, et l’objet non magique qui a servi à racler est détruit. '
      + 'La lumière du soleil, ou n’importe quelle dose de froid, de feu ou de radiant, la détruit.',
  },
  {
    id: 'moisissure-brune', nom: 'Moisissure brune', genre: 'decor', page: 76,
    tranches: [T(5, 10, 'mortel'), T(11, 16, 'anodin')],
    resume: 'Un tapis pelucheux qui aspire la chaleur ; le feu la fait grandir.',
    effet: 'Couvre 3 m sur 3 m ; il gèle dans les 9 m autour. Entrer à moins de 1,50 m, ou y commencer son tour : '
      + 'sauvegarde de Constitution DD 12, 22 (4d10) dégâts de froid, moitié en cas de réussite. '
      + 'Immunisée au feu — et toute source de feu approchée à 1,50 m la fait s’étendre d’une nouvelle plaque de 3 m. '
      + 'N’importe quelle dose de froid la détruit sur le coup.',
  },
  {
    id: 'gaz-toxique', nom: 'Gaz toxique', genre: 'decor', page: 77,
    tranches: [T(1, 4, 'anodin')],
    resume: 'Une nappe transparente et fétide, dans un égout ou un tombeau scellé.',
    effet: 'Remplit jusqu’à dix cubes de 3 m. Y entrer pour la première fois du tour, ou y commencer son tour : '
      + 'sauvegarde de Constitution DD 12, 5 (1d10) dégâts de poison, moitié en cas de réussite. '
      + 'Dans le gaz, les jets de sauvegarde contre la mort sont DÉSAVANTAGÉS — c’est ça, le vrai danger. '
      + 'Un vent fort le disperse pour 1 minute.',
    echelle: 'Niveaux 5-10 : 11 (2d10). 11-16 : 22 (4d10). 17-20 : 55 (10d10), et le DD monte.',
  },
  {
    id: 'sables-mouvants', nom: 'Sables mouvants', genre: 'decor', page: 77,
    tranches: [T(1, 4, 'anodin')],
    resume: 'Une fosse de 3 m qui avale lentement ; on s’en sort, mais pas seul et pas vite.',
    effet: 'Couvre 3 m sur 3 m, profonde de 3 m. Qui y entre s’enfonce de 1d4 + 1 pieds et est Entravé, '
      + 'puis de 1d4 pieds de plus au début de chacun de ses tours. '
      + 'Tant qu’il n’est pas submergé, il peut tenter de sortir par une action : test de Force (Athlétisme) DD 10 + le nombre de pieds enfoncés. '
      + 'Un voisin peut l’extraire par une action, au même test en DD 5 + les pieds enfoncés — bien plus faisable, et c’est la bonne réponse. '
      + 'Complètement submergé : Camouflage total, Aveuglé, et il commence à suffoquer.',
    echelle: 'Niveaux 5-10 : fosse de 4,50 m, on s’enfonce de 1d6. 11-16 : 6 m et 1d8. 17-20 : 9 m et 1d10.',
  },
  {
    id: 'ronce-rasoir', nom: 'Ronce-rasoir', genre: 'decor', page: 78,
    tranches: [T(1, 4, 'anodin')],
    resume: 'Un lierre à épines coupantes, sur un mur ou en haie.',
    effet: 'Une haie de 3 m de haut sur 3 m de large et 1,50 m d’épaisseur : CA 11, 25 PV, immunisée aux dégâts contondants, perforants et psychiques. '
      + 'Au premier contact du tour : sauvegarde de Dextérité DD 10 ou 5 (1d10) dégâts tranchants.',
  },
  {
    id: 'liane-vicieuse', nom: 'Liane vicieuse', genre: 'decor', page: 78,
    tranches: [T(1, 4, 'anodin')],
    resume: 'Une liane animée, indiscernable d’une plante morte tant qu’elle n’a pas bougé.',
    effet: 'CA 11, 16 PV, immunisée aux dégâts contondants, perforants et psychiques. '
      + 'Entrer à moins de 1,50 m, ou y commencer son tour : sauvegarde de Dextérité DD 12 ou Agrippé (DD 12 pour se libérer). '
      + 'Tant qu’elle tient sa proie, 5 (1d10) dégâts nécrotiques au début de chacun des tours de celle-ci. Elle n’agrippe qu’une créature à la fois. '
      + 'Sous l’effet de Communication avec les plantes, on peut la convaincre de lâcher : test de Charisme (Persuasion) DD 10 — '
      + 'et elle n’attaquera plus cette créature pendant 24 heures.',
    echelle: 'Niveaux 5-10 : 11 (2d10). 11-16 : 22 (4d10). 17-20 : 55 (10d10), DD de sauvegarde et de libération en hausse.',
  },
  {
    id: 'eboulement', nom: 'Éboulement', genre: 'decor', page: 78,
    tranches: [T(1, 4, 'mortel')],
    resume: 'Un pan de roche qui dévale et ensevelit ceux qu’il renverse.',
    effet: 'Tous ceux sur son passage : sauvegarde de Dextérité DD 15. En cas d’échec, 11 (2d10) dégâts contondants, À terre, et emportés avec l’éboulement. '
      + 'Réussite : moitié des dégâts, rien d’autre. '
      + 'Là où il s’arrête, le terrain devient difficile et tous ceux qui y sont À terre sont ENSEVELIS : Entravés, avec Camouflage total. '
      + 'S’extraire seul demande une action et un test de Force (Athlétisme) DD 15 — échec : on reste dessous et on gagne un niveau d’Épuisement. '
      + 'Un voisin valide dégage quelqu’un en 1 minute.',
    echelle: 'Niveaux 5-10 : 22 (4d10). 11-16 : 55 (10d10). 17-20 : 99 (18d10).',
  },
  {
    id: 'toiles', nom: 'Toiles', genre: 'decor', page: 79,
    tranches: [T(1, 4, 'anodin')],
    resume: 'Des toiles d’araignée géante en travers d’un passage ou au fond d’une fosse.',
    effet: 'La zone est un terrain difficile. Y entrer pour la première fois du tour, ou y commencer son tour : '
      + 'sauvegarde de Dextérité DD 12 ou Entravé. On s’en libère par une action : test de Force (Athlétisme) OU de Dextérité (Acrobaties) DD 12. '
      + 'Chaque cube de 3 m de toile : CA 10, 15 PV, VULNÉRABLE au feu, immunisé aux dégâts perforants, de poison et psychiques — '
      + 'une torche règle le problème plus vite que n’importe quel test.',
  },
  {
    id: 'moisissure-jaune', nom: 'Moisissure jaune', genre: 'decor', page: 79,
    tranches: [T(1, 4, 'mortel'), T(5, 10, 'anodin')],
    resume: 'Une plaque qui crache un nuage de spores dès qu’on la touche.',
    effet: 'Couvre 1,50 m sur 1,50 m. Touchée, elle éjecte des spores dans un cube de 3 m. '
      + 'Chacun dedans : sauvegarde de Constitution DD 15, sinon 11 (2d10) dégâts de poison et Empoisonné pendant 1 minute. '
      + 'Tant qu’il l’est ainsi, 5 (1d10) dégâts de poison au début de chacun de ses tours ; il refait la sauvegarde à la fin de chacun de ses tours pour s’en défaire. '
      + 'La lumière du soleil ou n’importe quelle dose de feu détruit la plaque.',
  },
  {
    id: 'champignon-boule-de-feu', nom: 'Champignon boule de feu', genre: 'decor', page: 76,
    tranches: [T(5, 10, 'mortel')],
    resume: 'Un champignon qui explose comme une boule de feu quand on l’abat.',
    effet: 'CA 10, 6 PV, immunisé aux dégâts psychiques. Tombé à 0 PV, il explose comme le sort Boule de feu centré sur lui, sauvegarde DD 15. '
      + 'Le tuer à distance est donc la seule façon propre de s’en débarrasser.',
    echelle: 'Aux niveaux 11-16, ajoute un champignon de plus ; aux niveaux 17-20, trois de plus — et l’explosion de l’un fait sauter les autres pris dans la zone.',
  },
  {
    id: 'fleuve-styx', nom: 'Fleuve Styx', genre: 'decor', page: 78,
    tranches: [T(11, 16, 'anodin')],
    resume: 'Ses eaux effacent la mémoire et la capacité de lancer des sorts.',
    effet: 'En boire, y entrer, ou y commencer son tour : sauvegarde d’Intelligence DD 20. '
      + 'Échec : 19 (3d12) dégâts psychiques, et plus aucun sort ni action de Magie pendant 30 JOURS. '
      + 'Seuls Restauration supérieure, Guérison ou Souhait y mettent fin. Passé 30 jours l’effet devient définitif et la créature perd toute sa mémoire — '
      + 'il ne reste alors qu’un Souhait ou une intervention divine.',
  },

  // ── Les pièges ────────────────────────────────────────────────────
  {
    id: 'plafond-effondre', nom: 'Plafond qui s’effondre', genre: 'piege', page: 100,
    tranches: [T(1, 4, 'mortel')],
    declencheur: 'Un fil tendu à 7 cm du sol, entre deux étais fragiles.',
    resume: 'Un pan de plafond instable, retenu par deux étais et un fil.',
    effet: 'Le premier qui coupe le fil fait tomber les étais. Chacun sous la section instable : '
      + 'sauvegarde de Dextérité DD 13, 11 (2d10) dégâts contondants, moitié en cas de réussite. '
      + 'Les gravats transforment la zone en terrain difficile.',
    detection: 'Action de Fouille, test de Sagesse (Perception) DD 11 : on repère le fil et la section instable. Une fois vu, le fil se coupe ou s’enjambe sans test.',
    echelle: 'Niveaux 5-10 : 22 (4d10). 11-16 : 55 (10d10). 17-20 : 99 (18d10), et le DD monte.',
  },
  {
    id: 'statue-cracheuse', nom: 'Statue cracheuse de feu', genre: 'piege', page: 101,
    tranches: [T(1, 4, 'mortel')],
    declencheur: 'Une dalle de pression. Le piège se réarme au début du tour suivant.',
    resume: 'Une statue qui souffle un cône de flammes magiques.',
    effet: 'Cône de 4,50 m. Chacun dedans : sauvegarde de Dextérité DD 15, 11 (2d10) dégâts de feu, moitié en cas de réussite.',
    detection: 'Détection de la magie révèle une aure d’Évocation autour de la statue. Action de Fouille à 1,50 m, Sagesse (Perception) DD 10 : on trouve un minuscule glyphe. '
      + 'Action d’Étude, Intelligence (Arcanes) DD 15 : le glyphe signifie « feu ». Le rayer avec un outil tranchant désamorce le piège. '
      + 'Sur la dalle : Sagesse (Perception) DD 15, puis un piton coincé dessous l’empêche de fonctionner.',
    echelle: 'Niveaux 5-10 : 22 (4d10), cône de 9 m. 11-16 : 55 (10d10), 18 m. 17-20 : 99 (18d10), 36 m.',
  },
  {
    id: 'flechettes-empoisonnees', nom: 'Fléchettes empoisonnées', genre: 'piege', page: 101,
    tranches: [T(1, 4, 'mortel')],
    declencheur: 'Une dalle de pression. Se réarme tant qu’il s’est déclenché moins de trois fois.',
    resume: 'Des tubes cachés dans les murs, sous la poussière ou dans un bas-relief.',
    effet: 'Chacun sur la trajectoire : sauvegarde de Dextérité DD 13, sinon touché par 1d3 fléchettes, 3 (1d6) dégâts de poison chacune.',
    detection: 'Action de Fouille sur les murs, Sagesse (Perception) DD 15 : on repère les trous. Les boucher à la cire ou au tissu empêche le tir.',
    echelle: 'Par fléchette — niveaux 5-10 : 7 (2d6). 11-16 : 14 (4d6). 17-20 : 24 (7d6).',
  },
  {
    id: 'fosse-dissimulee', nom: 'Fosse dissimulée', genre: 'piege', page: 101,
    tranches: [T(1, 4, 'anodin')],
    declencheur: 'Marcher sur le couvercle, fait de la même matière que le sol.',
    resume: 'Une fosse de 3 m sous une trappe invisible.',
    effet: 'Le couvercle bascule et la créature tombe : 3 (1d6) dégâts contondants. Le couvercle reste ouvert ensuite. '
      + 'Remonter demande une vitesse d’escalade, du matériel, ou une magie comme Pas de l’araignée — les parois sont lisses.',
    detection: 'Action d’Étude sur le sol, Intelligence (Investigation) DD 15. Une fois vue, un piton coincé entre le couvercle et le sol la rend franchissable ; Verrou magique fait aussi l’affaire.',
    echelle: 'Niveaux 5-10 : 9 m, 10 (3d6). 11-16 : 18 m, 21 (6d6). 17-20 : 36 m, 42 (12d6).',
  },
  {
    id: 'aiguille-empoisonnee', nom: 'Aiguille empoisonnée', genre: 'piege', page: 102,
    tranches: [T(1, 4, 'anodin')],
    declencheur: 'Ouvrir la serrure autrement qu’avec la bonne clef, ou rater le désamorçage.',
    resume: 'Une aiguille cachée dans une serrure.',
    effet: 'Sauvegarde de Constitution DD 11 : échec, 5 (1d10) dégâts de poison et Empoisonné pendant 1 heure. Réussite, moitié des dégâts seulement. '
      + 'Le sort Déblocage — ou une magie équivalente — ouvre sans rien déclencher.',
    detection: 'Action de Fouille sur la serrure, Sagesse (Perception) DD 15. Une fois vue : une action et un test de Dextérité (Escamotage) DD 15 pour la neutraliser — un échec la déclenche.',
    echelle: 'Niveaux 5-10 : 11 (2d10). 11-16 : 22 (4d10). 17-20 : 55 (10d10), et le DD monte.',
  },
  {
    id: 'filet-tombant', nom: 'Filet qui tombe', genre: 'piege', page: 100,
    tranches: [T(1, 4, 'anodin')],
    declencheur: 'Un fil tendu.',
    resume: 'Un filet suspendu, libéré par un fil — de quoi immobiliser sans tuer.',
    // Le Guide renvoie au Manuel des joueurs pour les chiffres du Filet ; ils
    // sont recopiés ici (Manuel p. 222), sinon l'entrée ne se joue pas sans
    // ouvrir un second livre — ce que l'appli existe précisément pour éviter.
    effet: 'La cible est Entravée jusqu’à ce qu’elle se libère ; une créature de taille TG ou plus s’en dégage automatiquement. '
      + 'Pour s’en sortir, elle-même ou un voisin à 1,50 m dépense une action et réussit un test de Force (Athlétisme) DD 10. '
      + 'Détruire le filet libère aussi : CA 10, 5 PV, immunisé aux dégâts contondants, de poison et psychiques.',
    detection: 'Le fil se repère comme celui du plafond piégé.',
    echelle: 'Un personnage muni d’outils de voleur et d’un filet peut le POSER lui-même : Dextérité (Escamotage) DD 13, dix minutes par tentative. '
      + 'C’est le seul piège du lot que le groupe peut retourner à son avantage.',
  },
];

/** Les dangers qui concernent un groupe de ce niveau, les plus graves d'abord. */
export function dangersPourNiveau(niveau: number, genre?: Danger['genre']): Danger[] {
  return DANGERS
    .filter((danger) => (genre ? danger.genre === genre : true))
    .filter((danger) => danger.tranches.some((t) => niveau >= t.min && niveau <= t.max))
    .sort((a, b) => {
      const g = (d: Danger) => (graviteAuNiveau(d, niveau) === 'mortel' ? 0 : 1);
      return g(a) - g(b) || a.nom.localeCompare(b.nom, 'fr');
    });
}

/** La gravité de ce danger POUR CE NIVEAU — le même change de camp d'une tranche à l'autre. */
export function graviteAuNiveau(danger: Danger, niveau: number): Gravite | null {
  const tranche = danger.tranches.find((t) => niveau >= t.min && niveau <= t.max);
  return tranche ? tranche.gravite : null;
}

/**
 * L'avertissement du Guide, à afficher quand on regarde une tranche au-dessus
 * de son groupe : « un danger anodin à une tranche peut être mortel à la
 * tranche du dessous » (p. 76).
 */
export const AVERTISSEMENT_TRANCHE =
  'Prudence en dessous de la tranche indiquée : ce qui est anodin pour une tranche peut être mortel pour celle d’en dessous.';
