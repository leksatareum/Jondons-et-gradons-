/**
 * La « matière » de chaque classe — ce que `theme.css` annonçait déjà
 * (« les thèmes par classe viendront plus tard ») : un accent et un métal
 * d'ornement par classe, jamais autre chose.
 *
 * Deux jetons seulement, volontairement :
 * - `accent` est ce qui vit — la lueur, le liquide de l'orbe, le reflet du
 *   bouton, la pastille active. C'est LA couleur qui change de classe en
 *   classe.
 * - `gold` est le métal du cadre — cabochons, liserés, écusson. Il varie
 *   un peu avec la classe (or chaud pour un druide, argent froid pour un
 *   occultiste) mais reste toujours un métal clair sur fond sombre : c'est
 *   lui qui porte le texte de tête (`goldBright`) et doit rester lisible
 *   quelle que soit la classe.
 *
 * Tout le reste — fond, encre, texte atténué, et surtout le rouge des
 * points de vie — reste FIXE dans `COMMON_TABLE_TOKENS` ci-dessous : la
 * lisibilité ne doit jamais dépendre de la classe qu'on regarde. C'est la
 * même règle que `--vital`, « jamais surchargé par un thème de classe »,
 * étendue à toute la table des jetons plutôt qu'au seul rouge vital.
 */

export interface ClassTheme {
  /** Nom court affiché dans les aides (« Braise et fer », etc.) — purement descriptif. */
  label: string;
  accent: string;
  accentBright: string;
  /**
   * Fond TEINTÉ MAIS OPAQUE — ce que `--accent-wash` porte partout ailleurs
   * dans l'appli (compétence maîtrisée, sort préparé, bandeau MJ…), hérité
   * tel quel de l'avant-« Braise et fer ». Ne jamais le confondre avec
   * `accentGlow` : un fond qui doit rester lisible sous du texte, une carte
   * ou une autre couche ne peut pas être translucide — c'est précisément le
   * bug qui laissait un texte transparaître à travers le bandeau du MJ.
   */
  accentWash: string;
  /** Lueur TRANSLUCIDE — halos, ombres portées, `drop-shadow` : jamais un fond. */
  accentGlow: string;
  gold: string;
  goldBright: string;
  goldDim: string;
}

/** Jetons partagés par toutes les matières : jamais recolorés par une classe. */
export const COMMON_TABLE_TOKENS = {
  bg: '#120d09', bgHi: '#1c140c', bgLow: '#090603',
  stone: '#1c150d', stoneHi: '#2b2015', stoneLo: '#100b06',
  ink: '#f4e9d4', muted: '#a99878', line: '#3c2d18',
  vital: '#d6493c', vitalBright: '#ef7a6a', vitalGlow: 'rgba(214,73,60,.4)',
};

export const CLASS_THEMES: Record<string, ClassTheme> = {
  // Le socle historique de l'app : personne d'autre n'y touche.
  rodeur: {
    label: 'Braise et fer', accent: '#f08a2e', accentBright: '#ffb15c', accentWash: '#2a2119', accentGlow: 'rgba(240,138,46,.34)',
    gold: '#d4ab5c', goldBright: '#f6e0a8', goldDim: 'rgba(150,116,58,.55)',
  },
  druide: {
    label: 'Sève et mousse', accent: '#7fae4f', accentBright: '#a8d67a', accentWash: '#1f2a18', accentGlow: 'rgba(127,174,79,.34)',
    gold: '#c3a05a', goldBright: '#eddba0', goldDim: 'rgba(140,113,58,.55)',
  },
  occultiste: {
    label: 'Arcane et argent', accent: '#9b6fd6', accentBright: '#c6a3f2', accentWash: '#241f2e', accentGlow: 'rgba(155,111,214,.36)',
    gold: '#b9c3d6', goldBright: '#eef3fb', goldDim: 'rgba(120,128,148,.55)',
  },
  magicien: {
    label: 'Saphir et rune', accent: '#5a93d6', accentBright: '#9dc3f0', accentWash: '#1a232e', accentGlow: 'rgba(90,147,214,.34)',
    gold: '#b3c2d4', goldBright: '#e6eefa', goldDim: 'rgba(110,126,148,.55)',
  },
  ensorceleur: {
    label: 'Pourpre et or rouge', accent: '#d64560', accentBright: '#f28aa0', accentWash: '#2a1820', accentGlow: 'rgba(214,69,96,.34)',
    gold: '#c7895a', goldBright: '#f0c99a', goldDim: 'rgba(150,100,58,.55)',
  },
  clerc: {
    label: 'Aube et or sacré', accent: '#e8b13a', accentBright: '#f8d888', accentWash: '#2a2416', accentGlow: 'rgba(232,177,58,.36)',
    gold: '#d8c48a', goldBright: '#f8edc9', goldDim: 'rgba(150,132,80,.55)',
  },
  paladin: {
    label: 'Serment et lumière', accent: '#e0a83a', accentBright: '#f6cf80', accentWash: '#2a2317', accentGlow: 'rgba(224,168,58,.36)',
    gold: '#e6c67a', goldBright: '#faeab3', goldDim: 'rgba(160,132,60,.55)',
  },
  barbare: {
    label: 'Sang et fer battu', accent: '#d4432f', accentBright: '#f28a70', accentWash: '#2a1815', accentGlow: 'rgba(212,67,47,.36)',
    gold: '#9a8f82', goldBright: '#e3dbcf', goldDim: 'rgba(110,102,90,.55)',
  },
  guerrier: {
    label: 'Acier et poudre', accent: '#6f93b8', accentBright: '#a8c6e2', accentWash: '#1e232a', accentGlow: 'rgba(111,147,184,.32)',
    gold: '#a8a8ac', goldBright: '#e2e2e6', goldDim: 'rgba(110,110,116,.55)',
  },
  moine: {
    label: 'Jade et bambou', accent: '#4fae8a', accentBright: '#8ad6ba', accentWash: '#182a22', accentGlow: 'rgba(79,174,138,.34)',
    gold: '#c7ad78', goldBright: '#eee0bf', goldDim: 'rgba(130,110,70,.55)',
  },
  roublard: {
    label: 'Prune et étain', accent: '#9a5fc2', accentBright: '#c99ce8', accentWash: '#241a2a', accentGlow: 'rgba(154,95,194,.34)',
    gold: '#8f8578', goldBright: '#d9d0c2', goldDim: 'rgba(100,92,80,.55)',
  },
  barde: {
    label: 'Rose et bronze', accent: '#d6598f', accentBright: '#f2a0c2', accentWash: '#2a1a22', accentGlow: 'rgba(214,89,143,.34)',
    gold: '#caa06b', goldBright: '#f0dbb0', goldDim: 'rgba(140,110,64,.55)',
  },
};

/** Matière par défaut — avant tout choix de classe, ou classe inconnue. */
export const DEFAULT_CLASS_THEME: ClassTheme = CLASS_THEMES.rodeur;

/**
 * La classe « principale » d'une fiche : celle du plus haut niveau, la
 * première déclarée en cas d'égalité — un multiclassé doit se voir
 * attribuer UNE matière stable, pas une qui change de tour en tour selon
 * l'ordre de calcul.
 */
export function classeThematique(classLevels: { classId: string; level: number }[]): string | null {
  if (classLevels.length === 0) return null;
  return classLevels.reduce((meilleure, courante) =>
    courante.level > meilleure.level ? courante : meilleure,
  ).classId;
}

export function themeDeClasse(classLevels: { classId: string; level: number }[]): ClassTheme {
  const id = classeThematique(classLevels);
  return (id && CLASS_THEMES[id]) || DEFAULT_CLASS_THEME;
}
