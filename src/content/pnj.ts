/**
 * Les personnages non-joueurs — Guide du Maître 2024, p. 84 à 89.
 *
 * ═══ Ce qui a été retenu, et pourquoi ═══
 *
 * Le Guide décrit un PNJ par six éléments : nom, alignement, bloc de stats,
 * apparence, personnalité, secret. Trois seulement méritaient d'entrer ici —
 * l'apparence, le secret, et la LOYAUTÉ, qui est la seule vraie mécanique du
 * chapitre. Le reste (l'alignement, le bloc de stats) se choisit déjà
 * ailleurs dans l'appli, ou n'est pas chiffré.
 *
 * ═══ Les noms manquent, et c'est délibéré ═══
 *
 * Le livre donne six tables de noms par style — courants, gutturaux,
 * lyriques, monosyllabiques, sinistres, fantasques. Sur le scan, DEUX tables
 * se partagent chaque colonne avec des numéros de ligne indépendants : rien
 * ne permet de dire si « Chen » appartient aux noms courants ou aux
 * monosyllabiques. Les recopier reviendrait à ranger des noms sinistres parmi
 * les fantasques.
 *
 * Un nom mal rangé ne blesse personne à la table — contrairement à un DD faux
 * — mais c'est justement la partie qu'un MJ improvise le mieux tout seul. Les
 * six STYLES sont donc rappelés comme aide-mémoire, sans la liste.
 */

/** Ce qui saute aux yeux chez un PNJ — Guide p. 86, table 1d12. */
export const APPARENCES: string[] = [
  'Un bijou remarquable',
  'Des vêtements voyants, extravagants, très formels ou en loques',
  'Se déplace avec une aide élégante — fauteuil, attelle ou canne',
  'Une cicatrice marquée',
  'Une couleur d’yeux inhabituelle, ou deux yeux de couleurs différentes',
  'Des tatouages ou des perçages',
  'Une tache de naissance',
  'Une couleur de cheveux inhabituelle',
  'Chauve, ou barbe et cheveux tressés',
  'Un nez remarquable — grand, bulbeux, anguleux, minuscule',
  'Une posture remarquable, voûtée ou raide',
  'D’une beauté ou d’une laideur exceptionnelle',
];

/** Ce qu'il cache — Guide p. 88, table 1d10. */
export const SECRETS: string[] = [
  'Il est déguisé : il dissimule son identité, ou quelque chose de son apparence.',
  'Il prépare un crime, il est en train de le commettre, ou il l’étouffe.',
  'Lui ou sa famille ont été menacés s’il ne fait pas quelque chose.',
  'Une contrainte magique le force à se comporter ainsi — un Quête impérieuse, ou une malédiction.',
  'Il est gravement malade, ou il souffre atrocement.',
  'Il se sent responsable de la mort ou du malheur de quelqu’un.',
  'Il est au bord de la ruine.',
  'Il est désespérément seul, ou il nourrit un amour sans retour.',
  'Il couve une ambition dévorante.',
  'Il est profondément insatisfait, ou malheureux.',
];

/** Les six styles de nom du Guide — l'idée à retenir, à défaut des listes. */
export const STYLES_DE_NOM: { nom: string; exemple: string }[] = [
  { nom: 'Courant', exemple: 'sonne comme chez soi, deux syllabes, rien qui accroche' },
  { nom: 'Guttural', exemple: 'des consonnes dures, des sons qui raclent' },
  { nom: 'Lyrique', exemple: 'des voyelles longues, ça chante' },
  { nom: 'Monosyllabique', exemple: 'une seule syllabe, sec' },
  { nom: 'Sinistre', exemple: 'ça sent la menace avant même qu’il parle' },
  { nom: 'Fantasque', exemple: 'un nom qui fait sourire, souvent composé' },
];

/**
 * ═══ La loyauté ═══
 *
 * La seule mécanique chiffrée du chapitre (Guide p. 89), et la seule qui
 * répond à une vraie question de table : « il les suit jusqu'où, celui-là ? »
 *
 * Elle se calcule sur le CHARISME du groupe, que l'appli connaît déjà : le
 * maximum est le plus haut score de Charisme parmi les aventuriers, et un PNJ
 * démarre à la moitié. Aucun chiffre à saisir.
 *
 * Le Guide insiste sur un point qui n'est pas une décoration : la loyauté se
 * tient EN SECRET. Un joueur qui voit le nombre joue le nombre.
 */
export type Loyaute = { maximum: number; depart: number };

export function loyauteDuGroupe(charismes: number[]): Loyaute | null {
  const valides = charismes.filter((score) => Number.isFinite(score) && score > 0);
  if (valides.length === 0) return null;
  const maximum = Math.max(...valides);
  return { maximum, depart: Math.floor(maximum / 2) };
}

/** Ce que vaut un score de loyauté, dans les mots du Guide. */
export function sensDeLaLoyaute(score: number): string {
  if (score <= 0) {
    return 'Il n’agit plus dans l’intérêt du groupe : soit il part — en attaquant qui tente de l’en empêcher — '
      + 'soit il œuvre en secret à sa perte.';
  }
  if (score < 10) return 'Fidèle, mais ça ne tient qu’à un fil.';
  return 'Il risque n’importe quoi pour aider ses compagnons.';
}

/** Ce qui fait monter ou descendre la loyauté — Guide p. 89. */
export const MOUVEMENTS_DE_LOYAUTE: { sens: 'hausse' | 'baisse'; des: string; quand: string }[] = [
  { sens: 'hausse', des: '1d4', quand: 'Le groupe l’aide à atteindre ses buts, le sauve, ou lui fait un vrai cadeau.' },
  { sens: 'baisse', des: '1d4', quand: 'Le groupe agit à l’encontre de son alignement ou de sa personnalité.' },
  { sens: 'baisse', des: '2d4', quand: 'Le groupe le maltraite, le trompe, ou le met en danger par pur égoïsme.' },
];

export const REGLE_LOYAUTE_BORNES =
  'La loyauté ne monte jamais au-dessus de son maximum ni ne descend en dessous de 0. '
  + 'Si le plus haut Charisme du groupe change — un personnage meurt ou s’en va — le maximum bouge avec lui.';

export const REGLE_LOYAUTE_SECRET =
  'Tiens ce score pour toi. Le Guide est formel : les joueurs ne doivent pas savoir si le PNJ est loyal ou non.';

/**
 * Le plafond de puissance d'un PNJ qui accompagne le groupe — Guide p. 88.
 *
 * « Use a stat block whose Challenge Rating is no higher than half the
 * characters' level. » C'est la règle qui empêche l'allié de voler la vedette,
 * et celle qu'on oublie en cherchant un profil intéressant dans le bestiaire.
 */
export const fpMaximalPourAllie = (niveauGroupe: number): number =>
  Math.max(0, niveauGroupe / 2);

export const REGLE_ALLIE_PROGRESSION =
  'Un PNJ compagnon n’accumule pas de points d’expérience et ne monte pas en puissance.';
