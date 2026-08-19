export type LandType = 'arid' | 'polar' | 'temperate' | 'tropical';

// Noms PHB 2024 : l’UI résout ensuite ces noms vers les identifiants du corpus.
// Cela évite de coupler la règle aux slugs internes du catalogue de sorts.
export const LAND_SPELL_NAMES: Record<LandType, Record<number, string[]>> = {
  arid: {
    3: ['Flou', 'Mains brûlantes', 'Trait de feu'],
    5: ['Boule de feu'],
    7: ['Flétrissement'],
    9: ['Mur de pierre'],
  },
  polar: {
    3: ['Nappe de brouillard', 'Immobilisation de personne', 'Rayon de givre'],
    5: ['Tempête de neige'],
    7: ['Tempête de grêle'],
    9: ['Cône de froid'],
  },
  temperate: {
    3: ['Pas brumeux', 'Poigne électrique', 'Sommeil'],
    5: ['Éclair'],
    7: ['Liberté de mouvement'],
    9: ['Foulée des arbres'],
  },
  tropical: {
    3: ['Aspersion acide', 'Rayon de maladie', 'Toile d’araignée'],
    5: ['Nuage nauséabond'],
    7: ['Métamorphose'],
    9: ["Fléau d'insectes"],
  },
};

export const LAND_WARD_RESISTANCE: Record<LandType, 'feu' | 'froid' | 'foudre' | 'poison'> = {
  arid: 'feu',
  polar: 'froid',
  temperate: 'foudre',
  tropical: 'poison',
};

export type LandStarsCharacter = {
  level?: number;
  classId?: string;
  subclass?: string | null;
  classLevels?: Array<{ classId?: string; id?: string; level?: number; subclass?: string | null }>;
  abilities?: Record<string, number>;
  circleLandType?: LandType | null;
  circleLandChoiceOpen?: boolean;
  starMapGuidingBoltUsed?: number;
  [key: string]: unknown;
};

const mod = (score: number) => Math.floor((score - 10) / 2);

const druidEntry = (character: LandStarsCharacter) => (character.classLevels || []).find((entry) => (entry.classId || entry.id) === 'druide');
export const druidLevel = (character: LandStarsCharacter) => Number(druidEntry(character)?.level || (character.classId === 'druide' ? character.level : 0) || 0);
export const druidSubclass = (character: LandStarsCharacter) => String(druidEntry(character)?.subclass || (character.classId === 'druide' ? character.subclass : '') || '');
export const isLandDruid = (character: LandStarsCharacter) => /cercle de la terre|circle of the land|\bterre\b/i.test(druidSubclass(character));
export const isStarsDruid = (character: LandStarsCharacter) => /cercle des étoiles|circle of the stars|\bétoiles?\b|\bstars?\b/i.test(druidSubclass(character));

export function landSpellNames(character: LandStarsCharacter): string[] {
  if (!isLandDruid(character) || druidLevel(character) < 3 || !character.circleLandType) return [];
  const table = LAND_SPELL_NAMES[character.circleLandType];
  return Object.entries(table).flatMap(([level, names]) => druidLevel(character) >= Number(level) ? names : []);
}

export function landWardResistance(character: LandStarsCharacter): 'feu' | 'froid' | 'foudre' | 'poison' | null {
  if (!isLandDruid(character) || druidLevel(character) < 10 || !character.circleLandType) return null;
  return LAND_WARD_RESISTANCE[character.circleLandType];
}

export function naturalRecoverySlotBudget(character: LandStarsCharacter): number {
  if (!isLandDruid(character) || druidLevel(character) < 6) return 0;
  return Math.ceil(druidLevel(character) / 2);
}

export function openLandChoiceAfterLongRest(character: LandStarsCharacter): LandStarsCharacter {
  if (!isLandDruid(character) || druidLevel(character) < 3) return character;
  return { ...character, circleLandChoiceOpen: true };
}

export function chooseLand(character: LandStarsCharacter, land: LandType): LandStarsCharacter {
  if (!isLandDruid(character) || druidLevel(character) < 3 || !character.circleLandChoiceOpen) return character;
  if (!Object.prototype.hasOwnProperty.call(LAND_SPELL_NAMES, land)) return character;
  return { ...character, circleLandType: land, circleLandChoiceOpen: false };
}

export function starMapGuidingBoltMax(character: LandStarsCharacter): number {
  if (!isStarsDruid(character) || druidLevel(character) < 3) return 0;
  return Math.max(1, mod(Number(character.abilities?.wis ?? 10)));
}

export function starMapGuidingBoltRemaining(character: LandStarsCharacter): number {
  return Math.max(0, starMapGuidingBoltMax(character) - Math.max(0, Number(character.starMapGuidingBoltUsed || 0)));
}

export function spendStarMapGuidingBolt(character: LandStarsCharacter): LandStarsCharacter {
  if (starMapGuidingBoltRemaining(character) <= 0) return character;
  return { ...character, starMapGuidingBoltUsed: Number(character.starMapGuidingBoltUsed || 0) + 1 };
}

export function resetLandStarsLongRest(character: LandStarsCharacter): LandStarsCharacter {
  let next: LandStarsCharacter = { ...character, starMapGuidingBoltUsed: 0 };
  next = openLandChoiceAfterLongRest(next);
  return next;
}
