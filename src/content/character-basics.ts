/**
 * Constantes de base pour la création de personnage — PHB 2024. Repêchées
 * de `table-connectee/src/App.jsx` (`ABIL`, `ABIL_ORDER`, `STANDARD_ARRAY`,
 * `STANDARD_LANGUAGES`, `ALIGNMENTS`, `SKILLS`). Confiance haute : listes
 * standard, inchangées depuis la sortie du PHB 2024 (`Langue des signes
 * commune` est l'ajout 2024 par rapport à 2014).
 */

export type AbilityId = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export const ABILITY_NAMES: Record<AbilityId, string> = {
  str: 'Force', dex: 'Dextérité', con: 'Constitution', int: 'Intelligence', wis: 'Sagesse', cha: 'Charisme',
};

export const ABILITY_ORDER: AbilityId[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

/**
 * Abréviations françaises, pour l'affichage. Les identifiants restent en
 * anglais (`str`, `wis`) parce qu'ils sont des clés de données ; les mettre à
 * l'écran tels quels affichait « STR » et « WIS » à des joueurs francophones.
 */
export const ABILITY_ABBREVIATIONS: Record<AbilityId, string> = {
  str: 'FOR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'SAG', cha: 'CHA',
};

/** Tableau standard de répartition des caractéristiques. */
export const STANDARD_ARRAY: readonly number[] = [15, 14, 13, 12, 10, 8];

/** Langues standard, hors Commun (que tout le monde connaît déjà). */
export const STANDARD_LANGUAGES: readonly string[] = [
  'Langue des signes commune', 'Draconique', 'Nain', 'Elfique', 'Géant', 'Gnome', 'Gobelin', 'Halfelin', 'Orc',
];

export const ALIGNMENTS: readonly [code: string, name: string][] = [
  ['LB', 'Loyal bon'], ['NB', 'Neutre bon'], ['CB', 'Chaotique bon'],
  ['LN', 'Loyal neutre'], ['N', 'Neutre'], ['CN', 'Chaotique neutre'],
  ['LM', 'Loyal mauvais'], ['NM', 'Neutre mauvais'], ['CM', 'Chaotique mauvais'],
];

export interface SkillDef {
  id: string;
  name: string;
  ability: AbilityId;
}

export const SKILLS: SkillDef[] = [
  { id: 'acrobaties', name: 'Acrobaties', ability: 'dex' },
  { id: 'arcanes', name: 'Arcanes', ability: 'int' },
  { id: 'athletisme', name: 'Athlétisme', ability: 'str' },
  { id: 'discretion', name: 'Discrétion', ability: 'dex' },
  { id: 'dressage', name: 'Dressage', ability: 'wis' },
  { id: 'escamotage', name: 'Escamotage', ability: 'dex' },
  { id: 'histoire', name: 'Histoire', ability: 'int' },
  { id: 'intimidation', name: 'Intimidation', ability: 'cha' },
  { id: 'intuition', name: 'Intuition', ability: 'wis' },
  { id: 'investigation', name: 'Investigation', ability: 'int' },
  { id: 'medecine', name: 'Médecine', ability: 'wis' },
  { id: 'nature', name: 'Nature', ability: 'int' },
  { id: 'perception', name: 'Perception', ability: 'wis' },
  { id: 'persuasion', name: 'Persuasion', ability: 'cha' },
  { id: 'religion', name: 'Religion', ability: 'int' },
  { id: 'representation', name: 'Représentation', ability: 'cha' },
  { id: 'survie', name: 'Survie', ability: 'wis' },
  { id: 'tromperie', name: 'Tromperie', ability: 'cha' },
];

export const skillName = (id: string): string => SKILLS.find((skill) => skill.id === id)?.name ?? id;
