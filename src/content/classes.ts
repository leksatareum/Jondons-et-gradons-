/**
 * Les douze classes du PHB 2024. Repêché de
 * `table-connectee/src/App.jsx` (`CLASSES`). Confiance haute sur les
 * bases (dé de vie, sauvegardes, type de lanceur, armures/bouclier —
 * inchangés depuis 2014), confiance moyenne sur les niveaux
 * d'augmentation de caractéristiques et le nombre de maîtrises d'armes
 * (spécificités 2024 que je connais mais n'ai pas revérifiées page à page)
 * — pas confirmé page à page dans l'ensemble.
 *
 * `sub` est la sous-classe pré-sélectionnée par défaut à la création dans
 * l'ancienne app, pas une donnée canonique du jeu : ne t'y fie pas comme
 * source de vérité sur « la » sous-classe d'une classe, c'est juste un
 * confort d'interface à reproduire ou non plus tard.
 */

export type CasterType = 'full' | 'half' | 'pact' | null;
export type ArmorCategory = 'Légère' | 'Intermédiaire' | 'Lourde';

export interface ClassDef {
  id: string;
  name: string;
  hitDie: number;
  saves: [string, string];
  nSkills: number;
  /** Compétences proposées au choix, ou `'any'` si les dix-huit sont ouvertes. */
  skills: string[] | 'any';
  caster: CasterType;
  /** Niveaux d'augmentation de caractéristiques (standard : 4/8/12/16/19). */
  asi: number[];
  /** Nombre de maîtrises d'armes connues à la création. */
  masteries: number;
  armor: ArmorCategory[];
  shield: boolean;
  /** Sous-classe pré-sélectionnée par défaut à la création — pas canonique, voir le commentaire du fichier. */
  sub: string;
  weaponId: string;
  desc: string;
}

export const CLASSES: ClassDef[] = [
  { masteries: 2, id: 'barbare', name: 'Barbare', hitDie: 12, saves: ['str', 'con'], nSkills: 2, caster: null, asi: [4, 8, 12, 16, 19], sub: 'Voie du Berserker',
    armor: ['Légère', 'Intermédiaire'], shield: true,
    skills: ['dressage', 'athletisme', 'intimidation', 'nature', 'perception', 'survie'],
    weaponId: 'grandehache', desc: 'Rage brute, résistance hors normes, le plus gros dé de vie du jeu.' },
  { masteries: 0, id: 'barde', name: 'Barde', hitDie: 8, saves: ['dex', 'cha'], nSkills: 3, caster: 'full', asi: [4, 8, 12, 16, 19], sub: 'Collège du Savoir',
    armor: ['Légère'], shield: false, skills: 'any',
    weaponId: 'rapiere', desc: 'Magie, musique et polyvalence — compétences choisies parmi les dix-huit.' },
  { masteries: 0, id: 'clerc', name: 'Clerc', hitDie: 8, saves: ['wis', 'cha'], nSkills: 2, caster: 'full', asi: [4, 8, 12, 16, 19], sub: 'Domaine de la Vie',
    armor: ['Légère', 'Intermédiaire'], shield: true,
    skills: ['histoire', 'intuition', 'medecine', 'persuasion', 'religion'],
    weaponId: 'masse', desc: 'Magie divine, soins et soutien du groupe.' },
  { masteries: 0, id: 'druide', name: 'Druide', hitDie: 8, saves: ['int', 'wis'], nSkills: 2, caster: 'full', asi: [4, 8, 12, 16, 19], sub: 'Cercle de la Terre',
    // Légère et bouclier seulement : les armures intermédiaires viennent de
    // l'Ordre du Gardien (choix de niveau 1), jamais de la classe de base.
    armor: ['Légère'], shield: true,
    skills: ['dressage', 'arcanes', 'intuition', 'medecine', 'nature', 'perception', 'religion', 'survie'],
    weaponId: 'baton', desc: 'Magie de la nature et Forme sauvage.' },
  { masteries: 3, id: 'guerrier', name: 'Guerrier', hitDie: 10, saves: ['str', 'con'], nSkills: 2, caster: null, asi: [4, 6, 8, 12, 14, 16, 19], sub: 'Champion',
    armor: ['Légère', 'Intermédiaire', 'Lourde'], shield: true,
    skills: ['acrobaties', 'dressage', 'athletisme', 'histoire', 'intuition', 'intimidation', 'persuasion', 'perception', 'survie'],
    weaponId: 'epeelongue', desc: "Maîtrise martiale polyvalente, le plus grand nombre d'attaques du jeu." },
  { masteries: 0, id: 'moine', name: 'Moine', hitDie: 8, saves: ['str', 'dex'], nSkills: 2, caster: null, asi: [4, 8, 12, 16, 19], sub: 'Guerrier de la Main ouverte',
    armor: [], shield: false,
    skills: ['acrobaties', 'athletisme', 'histoire', 'intuition', 'religion', 'discretion'],
    weaponId: 'baton', desc: 'Arts martiaux, déplacement accru et perfection intérieure.' },
  { masteries: 2, id: 'paladin', name: 'Paladin', hitDie: 10, saves: ['wis', 'cha'], nSkills: 2, caster: 'half', asi: [4, 8, 12, 16, 19], sub: 'Serment de Dévotion',
    armor: ['Légère', 'Intermédiaire', 'Lourde'], shield: true,
    skills: ['athletisme', 'intuition', 'intimidation', 'medecine', 'persuasion', 'religion'],
    weaponId: 'epeelongue', desc: 'Serments sacrés, châtiment divin et soins.' },
  { masteries: 2, id: 'rodeur', name: 'Rôdeur', hitDie: 10, saves: ['str', 'dex'], nSkills: 3, caster: 'half', asi: [4, 8, 12, 16, 19], sub: 'Chasseur',
    armor: ['Légère', 'Intermédiaire'], shield: true,
    skills: ['dressage', 'athletisme', 'intuition', 'investigation', 'nature', 'perception', 'discretion', 'survie'],
    weaponId: 'arclong', desc: "Chasseur polyvalent, à l'arc ou aux lames, avec un peu de magie." },
  { masteries: 2, id: 'roublard', name: 'Roublard', hitDie: 8, saves: ['dex', 'int'], nSkills: 4, caster: null, asi: [4, 8, 10, 12, 16, 19], sub: 'Voleur',
    armor: ['Légère'], shield: false,
    skills: ['acrobaties', 'athletisme', 'tromperie', 'intuition', 'intimidation', 'investigation', 'perception', 'persuasion', 'escamotage', 'discretion'],
    weaponId: 'dague', desc: 'Furtivité, attaque sournoise et expertise en compétences.' },
  { masteries: 0, id: 'ensorceleur', name: 'Ensorceleur', hitDie: 6, saves: ['con', 'cha'], nSkills: 2, caster: 'full', asi: [4, 8, 12, 16, 19], sub: 'Sorcellerie draconique',
    armor: [], shield: false,
    skills: ['arcanes', 'tromperie', 'intuition', 'intimidation', 'persuasion', 'religion'],
    weaponId: 'dague', desc: 'Magie innée et puissance brute, modelable à volonté.' },
  { masteries: 0, id: 'occultiste', name: 'Occultiste', hitDie: 8, saves: ['wis', 'cha'], nSkills: 2, caster: 'pact', asi: [4, 8, 12, 16, 19], sub: 'Patron Fiélon',
    armor: ['Légère'], shield: false,
    skills: ['arcanes', 'tromperie', 'histoire', 'intimidation', 'investigation', 'nature', 'religion'],
    weaponId: 'dague', desc: "Pacte extraplanaire : peu d'emplacements, mais toujours au niveau maximal." },
  { masteries: 0, id: 'magicien', name: 'Magicien', hitDie: 6, saves: ['int', 'wis'], nSkills: 2, caster: 'full', asi: [4, 8, 12, 16, 19], sub: 'Évocateur',
    armor: [], shield: false,
    skills: ['arcanes', 'histoire', 'intuition', 'investigation', 'medecine', 'nature', 'religion'],
    weaponId: 'baton', desc: 'Magie savante et le plus vaste répertoire de sorts du jeu.' },
];

export const classById = (id: string | null | undefined): ClassDef | undefined =>
  CLASSES.find((klass) => klass.id === id);
