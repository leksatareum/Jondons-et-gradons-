import { PHB_CREATURES } from '../content/creatures';

export type WildShapeAttack = {
  id: string;
  name: string;
  toHit?: number;
  dice?: string;
  type?: string;
  props?: string;
};

export type WildShapeProfile = {
  id: string;
  name: string;
  size: 'TP' | 'P' | 'M' | 'G' | 'TG';
  cr: string;
  ac: number;
  hp: number;
  speed: string;
  abilities: { str: number; dex: number; con: number };
  saveOverrides?: Partial<Record<'str' | 'dex' | 'con', number>>;
  skillOverrides?: Record<string, number>;
  senses?: string;
  resistances?: string[];
  traits?: string[];
  attacks: WildShapeAttack[];
  attacksPerAction?: number;
};

export type WildShapeCharacter = {
  level?: number;
  classId?: string;
  subclass?: string | null;
  classLevels?: Array<{ classId?: string; id?: string; level?: number; subclass?: string | null }>;
  abilities?: Record<string, number>;
  attacks?: Array<Record<string, unknown>>;
  hpTemp?: number;
  resources?: Array<{ name: string; current: number; max: number; [key: string]: unknown }>;
  conditions?: Array<{ label: string; detail?: string; [key: string]: unknown }>;
  turn?: Record<string, unknown>;
  wildShapeKnownForms?: string[];
  wildShapeFormSwapOpen?: boolean;
  activeWildShape?: ActiveWildShape | null;
  [key: string]: unknown;
};

export type ActiveWildShape = {
  formId: string;
  formName: string;
  size: string;
  ac: number;
  speed: string;
  senses?: string;
  traits: string[];
  attacksPerAction: number;
  originalPhysical: { str: number; dex: number; con: number };
  originalAttacks: Array<Record<string, unknown>>;
  durationHours: number;
  moon: boolean;
};

const creature = (id: string) => {
  const found = PHB_CREATURES.find((entry) => entry.id === id);
  if (!found) throw new Error(`Profil de bête PHB manquant: ${id}`);
  return found;
};

const make = (
  id: string,
  size: WildShapeProfile['size'],
  abilities: WildShapeProfile['abilities'],
  attacks: WildShapeAttack[],
  extra: Partial<Omit<WildShapeProfile, 'id' | 'name' | 'size' | 'cr' | 'ac' | 'hp' | 'speed' | 'abilities' | 'attacks'>> = {},
): WildShapeProfile => {
  const base = creature(id);
  return { id, name: base.name, size, cr: base.cr, ac: base.ac, hp: base.hp, speed: base.speed, abilities, attacks, ...extra };
};

// Appendice B du PHB 2024, lu dans le PDF de l'utilisateur (p. 346 à 359).
//
// La liste couvrait au départ les seules bêtes d'un Druide de niveau 2 à 5,
// sans vitesse de vol. Elle laissait donc sans rien un Druide de niveau 8,
// qui a droit au vol, et un Druide du Cercle de la Lune, qui a droit à des
// FP bien plus élevées : la règle existait, les formes manquaient.
//
// L'application ne stocke que des données mécaniques compactes ; elle ne
// reproduit pas les blocs de statistiques en prose.
export const WILD_SHAPE_PROFILES: WildShapeProfile[] = [
  make('ape', 'M', { str: 16, dex: 14, con: 14 }, [
    { id: 'fist', name: 'Poing', toHit: 5, dice: '1d4+3', type: 'contondants' },
    { id: 'rock', name: 'Rocher (Recharge 6)', toHit: 5, dice: '2d6+3', type: 'contondants', props: 'distance 7,5/15 m' },
  ], { skillOverrides: { athletisme: 5, perception: 3 }, senses: 'Perception passive 13', attacksPerAction: 2 }),
  make('badger', 'TP', { str: 10, dex: 11, con: 16 }, [], { skillOverrides: { perception: 3 }, senses: 'Vision dans le noir 9 m · Perception passive 13', resistances: ['poison'] }),
  make('bat', 'TP', { str: 2, dex: 15, con: 8 }, [
    { id: 'bite', name: 'Morsure', toHit: 4, dice: '1', type: 'perforants' },
  ], { senses: 'Vision aveugle 18 m · Perception passive 11' }),
  make('black-bear', 'M', { str: 15, dex: 12, con: 14 }, [
    { id: 'rend', name: 'Lacération', toHit: 4, dice: '1d6+2', type: 'tranchants' },
  ], { skillOverrides: { perception: 5 }, senses: 'Vision dans le noir 18 m · Perception passive 15', attacksPerAction: 2 }),
  make('boar', 'M', { str: 13, dex: 11, con: 14 }, [
    { id: 'gore', name: 'Défenses', toHit: 3, dice: '1d6+1', type: 'perforants', props: 'Après 6 m en ligne droite: +1d6 et À terre si G ou moins' },
  ], { senses: 'Perception passive 9', traits: ['Furie sanglante: avantage aux attaques quand le sanglier est à la moitié de ses PV ou moins.'] }),
  make('brown-bear', 'G', { str: 17, dex: 12, con: 15 }, [
    { id: 'bite', name: 'Morsure', toHit: 5, dice: '1d8+3', type: 'perforants' },
    { id: 'claw', name: 'Griffe', toHit: 5, dice: '1d4+3', type: 'tranchants', props: 'Cible TG ou moins: À terre' },
  ], { skillOverrides: { perception: 3 }, senses: 'Vision dans le noir 18 m · Perception passive 13', attacksPerAction: 2 }),
  make('camel', 'G', { str: 15, dex: 8, con: 17 }, [
    { id: 'bite', name: 'Morsure', toHit: 4, dice: '1d4+2', type: 'contondants' },
  ], { saveOverrides: { con: 5 }, senses: 'Vision dans le noir 18 m · Perception passive 10' }),
  make('cat', 'TP', { str: 3, dex: 15, con: 10 }, [
    { id: 'scratch', name: 'Griffure', toHit: 4, dice: '1', type: 'tranchants' },
  ], { saveOverrides: { dex: 4 }, skillOverrides: { perception: 3, discretion: 4 }, senses: 'Vision dans le noir 18 m · Perception passive 13', traits: ['Sa distance de saut utilise la Dextérité à la place de la Force.'] }),
  make('constrictor-snake', 'G', { str: 15, dex: 14, con: 12 }, [
    { id: 'bite', name: 'Morsure', toHit: 4, dice: '1d8+2', type: 'perforants' },
    { id: 'constrict', name: 'Constriction', dice: '3d4', type: 'contondants', props: 'JS Force DD 12 · cible M ou moins · Agrippé, évasion DD 12' },
  ], { skillOverrides: { perception: 2, discretion: 4 }, senses: 'Vision aveugle 3 m · Perception passive 12' }),
  make('crab', 'TP', { str: 6, dex: 11, con: 12 }, [
    { id: 'claw', name: 'Pince', toHit: 2, dice: '1', type: 'contondants' },
  ], { skillOverrides: { discretion: 2 }, senses: 'Vision aveugle 9 m · Perception passive 9', traits: ['Amphibie'] }),
  make('crocodile', 'G', { str: 15, dex: 10, con: 13 }, [
    { id: 'bite', name: 'Morsure', toHit: 4, dice: '1d8+2', type: 'perforants', props: 'Cible M ou moins: Agrippé (DD 12) et Entravé tant qu’elle est agrippée' },
  ], { saveOverrides: { con: 3 }, skillOverrides: { discretion: 2 }, senses: 'Perception passive 10', traits: ['Retient son souffle 1 heure.'] }),
  make('dire-wolf', 'G', { str: 17, dex: 15, con: 15 }, [
    { id: 'bite', name: 'Morsure', toHit: 5, dice: '1d10+3', type: 'perforants', props: 'Cible TG ou moins: À terre' },
  ], { skillOverrides: { perception: 5, discretion: 4 }, senses: 'Vision dans le noir 18 m · Perception passive 15', traits: ['Tactique de meute'] }),
  make('draft-horse', 'G', { str: 18, dex: 10, con: 15 }, [
    { id: 'hooves', name: 'Sabots', toHit: 6, dice: '1d4+4', type: 'contondants' },
  ], { senses: 'Perception passive 10' }),
  make('elephant', 'TG', { str: 22, dex: 9, con: 17 }, [
    { id: 'gore', name: 'Encornement', toHit: 8, dice: '2d8+6', type: 'perforants', props: 'Après 6 m en ligne droite: À terre' },
  ], { senses: 'Perception passive 10', attacksPerAction: 2, traits: ['Piétinement (action bonus): JS Dextérité DD 16 contre une créature à terre à 1,50 m — 2d10+6 contondants, moitié en cas de réussite.'] }),
  make('elk', 'G', { str: 16, dex: 10, con: 11 }, [
    { id: 'ram', name: 'Coup de bois', toHit: 5, dice: '1d6+3', type: 'contondants', props: 'Après 6 m en ligne droite: +1d6 et À terre si TG ou moins' },
  ], { skillOverrides: { perception: 2 }, senses: 'Vision dans le noir 18 m · Perception passive 12' }),
  make('frog', 'TP', { str: 1, dex: 13, con: 8 }, [
    { id: 'bite', name: 'Morsure', toHit: 3, dice: '1', type: 'perforants' },
  ], { skillOverrides: { perception: 1, discretion: 3 }, senses: 'Vision dans le noir 9 m · Perception passive 11', traits: ['Amphibie', 'Saut en longueur 3 m et saut en hauteur 1,50 m avec ou sans élan.'] }),
  make('giant-badger', 'M', { str: 13, dex: 10, con: 17 }, [
    { id: 'bite', name: 'Morsure', toHit: 3, dice: '2d4+1', type: 'perforants' },
  ], { skillOverrides: { perception: 3 }, senses: 'Vision dans le noir 18 m · Perception passive 13', resistances: ['poison'] }),
  make('giant-crab', 'M', { str: 13, dex: 13, con: 11 }, [
    { id: 'claw', name: 'Pince', toHit: 3, dice: '1d6+1', type: 'contondants', props: 'Cible M ou moins: Agrippé, évasion DD 11 · deux pinces' },
  ], { skillOverrides: { discretion: 3 }, senses: 'Vision aveugle 9 m · Perception passive 9', traits: ['Amphibie'] }),
  make('giant-goat', 'G', { str: 17, dex: 13, con: 12 }, [
    { id: 'ram', name: 'Coup de cornes', toHit: 5, dice: '1d6+3', type: 'contondants', props: 'Après 6 m en ligne droite: +2d4 et À terre si TG ou moins' },
  ], { saveOverrides: { str: 5 }, skillOverrides: { perception: 3 }, senses: 'Vision dans le noir 18 m · Perception passive 13' }),
  make('giant-seahorse', 'G', { str: 15, dex: 12, con: 11 }, [
    { id: 'ram', name: 'Coup de tête', toHit: 4, dice: '2d6+2', type: 'contondants', props: 'Après 6 m en ligne droite: 2d8+2' },
  ], { senses: 'Perception passive 11', traits: ['Respiration aquatique uniquement.', 'Sous l’eau, action bonus: déplacement égal à la moitié de la nage sans attaque d’opportunité.'] }),
  make('giant-spider', 'G', { str: 14, dex: 16, con: 12 }, [
    { id: 'bite', name: 'Morsure', toHit: 5, dice: '1d8+3+2d6', type: 'perforants + poison' },
  ], { skillOverrides: { perception: 4, discretion: 7 }, senses: 'Vision dans le noir 18 m · Perception passive 14', traits: ['Pattes d’araignée', 'Marche sur les toiles', 'Toile (recharge 5-6): JS Dextérité DD 13 à 18 m — Entravé jusqu’à destruction de la toile (CA 10, 5 PV, vulnérable au feu, immunisée au poison et au psychique).'] }),
  make('giant-weasel', 'M', { str: 11, dex: 17, con: 10 }, [
    { id: 'bite', name: 'Morsure', toHit: 5, dice: '1d4+3', type: 'perforants' },
  ], { skillOverrides: { acrobaties: 5, perception: 3, discretion: 5 }, senses: 'Vision dans le noir 18 m · Perception passive 13' }),
  make('goat', 'M', { str: 11, dex: 10, con: 11 }, [
    { id: 'ram', name: 'Coup de cornes', toHit: 2, dice: '1', type: 'contondants', props: 'Après 6 m en ligne droite: 1d4' },
  ], { saveOverrides: { str: 2 }, skillOverrides: { perception: 2 }, senses: 'Vision dans le noir 18 m · Perception passive 12' }),
  make('hawk', 'TP', { str: 5, dex: 16, con: 8 }, [
    { id: 'talons', name: 'Serres', toHit: 5, dice: '1', type: 'tranchants' },
  ], { skillOverrides: { perception: 6 }, senses: 'Perception passive 16' }),
  make('lion', 'G', { str: 17, dex: 15, con: 11 }, [
    { id: 'rend', name: 'Lacération', toHit: 5, dice: '1d8+3', type: 'tranchants' },
  ], { skillOverrides: { perception: 3, discretion: 4 }, senses: 'Vision dans le noir 18 m · Perception passive 13', attacksPerAction: 2, traits: ['Tactique de meute', 'Bond avec élan: avec 3 m d’élan, saut en longueur jusqu’à 7,50 m.', 'Rugissement (remplace une attaque): JS Sagesse DD 11 à 4,50 m — Effrayé jusqu’au début du prochain tour du lion.'] }),
  make('lizard', 'TP', { str: 2, dex: 11, con: 10 }, [
    { id: 'bite', name: 'Morsure', toHit: 2, dice: '1', type: 'perforants' },
  ], { senses: 'Vision dans le noir 9 m · Perception passive 9', traits: ['Pattes d’araignée: grimpe sur surfaces difficiles et plafonds sans test.'] }),
  make('mastiff', 'M', { str: 13, dex: 14, con: 12 }, [
    { id: 'bite', name: 'Morsure', toHit: 3, dice: '1d6+1', type: 'perforants', props: 'Cible G ou moins: À terre' },
  ], { saveOverrides: { wis: undefined } as never, skillOverrides: { perception: 5 }, senses: 'Vision dans le noir 18 m · Perception passive 15' }),
  make('mule', 'M', { str: 14, dex: 10, con: 13 }, [
    { id: 'hooves', name: 'Sabots', toHit: 4, dice: '1d4+2', type: 'contondants' },
  ], { senses: 'Perception passive 10', traits: ['Bête de somme: compte comme une taille de plus pour la capacité de port.'] }),
  make('octopus', 'P', { str: 4, dex: 15, con: 11 }, [
    { id: 'tentacles', name: 'Tentacules', toHit: 4, dice: '1', type: 'contondants' },
  ], { skillOverrides: { perception: 2, discretion: 6 }, senses: 'Vision dans le noir 9 m · Perception passive 12', traits: ['Compression: passe dans un espace de 2,5 cm sans se faufiler.', 'Respiration aquatique uniquement.', 'Nuage d’encre 1/jour sous l’eau.'] }),
  make('owl', 'TP', { str: 3, dex: 13, con: 8 }, [
    { id: 'talons', name: 'Serres', toHit: 3, dice: '1', type: 'tranchants' },
  ], { skillOverrides: { perception: 5, discretion: 5 }, senses: 'Vision dans le noir 36 m · Perception passive 15', traits: ['Vol effleurant: ne provoque pas d’attaque d’opportunité en s’envolant hors de portée.'] }),
  make('panther', 'M', { str: 14, dex: 15, con: 10 }, [
    { id: 'pounce', name: 'Bond', toHit: 4, dice: '1d4+2', type: 'tranchants', props: 'Avec avantage: 2d4+2' },
  ], { skillOverrides: { perception: 4, discretion: 6 }, senses: 'Vision dans le noir 18 m · Perception passive 14', traits: ['Rôder: dans son Multiattaque, se déplace de la moitié de sa vitesse sans attaque d’opportunité puis peut Se cacher.'] }),
  make('pony', 'M', { str: 15, dex: 10, con: 13 }, [
    { id: 'hooves', name: 'Sabots', toHit: 4, dice: '1d4+2', type: 'contondants' },
  ], { saveOverrides: { str: 4 }, senses: 'Perception passive 10' }),
  make('rat', 'TP', { str: 2, dex: 11, con: 9 }, [
    { id: 'bite', name: 'Morsure', toHit: 2, dice: '1', type: 'perforants' },
  ], { skillOverrides: { perception: 2 }, senses: 'Vision dans le noir 9 m · Perception passive 12', traits: ['Agile: ne provoque pas d’attaque d’opportunité en quittant l’allonge ennemie.'] }),
  make('raven', 'TP', { str: 2, dex: 14, con: 10 }, [
    { id: 'beak', name: 'Bec', toHit: 4, dice: '1', type: 'perforants' },
  ], { skillOverrides: { perception: 3 }, senses: 'Perception passive 13', traits: ['Imitation: imite des sons simples ; un test de Sagesse (Perspicacité) DD 10 discerne la supercherie.'] }),
  make('reef-shark', 'M', { str: 14, dex: 15, con: 13 }, [
    { id: 'bite', name: 'Morsure', toHit: 4, dice: '2d4+2', type: 'perforants' },
  ], { skillOverrides: { perception: 2 }, senses: 'Vision aveugle 9 m · Perception passive 12', traits: ['Tactique de meute', 'Respiration aquatique uniquement.'] }),
  make('riding-horse', 'G', { str: 16, dex: 13, con: 12 }, [
    { id: 'hooves', name: 'Sabots', toHit: 5, dice: '1d8+3', type: 'contondants' },
  ], { senses: 'Perception passive 10' }),
  make('scorpion', 'TP', { str: 2, dex: 11, con: 8 }, [
    { id: 'sting', name: 'Dard', toHit: 2, dice: '1+1d6', type: 'perforants + poison' },
  ], { senses: 'Vision aveugle 3 m · Perception passive 9' }),
  make('spider', 'TP', { str: 2, dex: 14, con: 8 }, [
    { id: 'bite', name: 'Morsure', toHit: 4, dice: '1+1d4', type: 'perforants + poison' },
  ], { skillOverrides: { discretion: 4 }, senses: 'Vision dans le noir 9 m · Perception passive 10', traits: ['Pattes d’araignée', 'Marche sur les toiles'] }),
  make('tiger', 'G', { str: 17, dex: 16, con: 14 }, [
    { id: 'pounce', name: 'Bond', toHit: 5, dice: '1d6+3', type: 'tranchants', props: 'Avec avantage: +1d6 et À terre si TG ou moins' },
  ], { skillOverrides: { perception: 3, discretion: 7 }, senses: 'Vision dans le noir 18 m · Perception passive 13', traits: ['Rôder: dans son Multiattaque, se déplace de la moitié de sa vitesse sans attaque d’opportunité puis peut Se cacher.'] }),
  make('venomous-snake', 'TP', { str: 2, dex: 15, con: 11 }, [
    { id: 'bite', name: 'Morsure', toHit: 4, dice: '1d4+2+1d6', type: 'perforants + poison' },
  ], { senses: 'Vision aveugle 3 m · Perception passive 10' }),
  make('warhorse', 'G', { str: 18, dex: 12, con: 13 }, [
    { id: 'hooves', name: 'Sabots', toHit: 6, dice: '2d4+4', type: 'contondants', props: 'Après 6 m en ligne droite: +2d4 et À terre si TG ou moins' },
  ], { saveOverrides: { wis: undefined } as never, senses: 'Perception passive 11' }),
  make('weasel', 'TP', { str: 3, dex: 16, con: 8 }, [
    { id: 'bite', name: 'Morsure', toHit: 5, dice: '1', type: 'perforants' },
  ], { skillOverrides: { acrobaties: 5, perception: 3, discretion: 5 }, senses: 'Vision dans le noir 18 m · Perception passive 13' }),
  make('wolf', 'M', { str: 14, dex: 15, con: 12 }, [
    { id: 'bite', name: 'Morsure', toHit: 4, dice: '1d6+2', type: 'perforants', props: 'Cible M ou moins: À terre' },
  ], { skillOverrides: { perception: 5, discretion: 4 }, senses: 'Vision dans le noir 18 m · Perception passive 15', traits: ['Tactique de meute'] }),
];

const crValue = (cr: string): number => {
  const [a, b] = String(cr).split('/').map(Number);
  return b ? a / b : a || 0;
};

export function druidLevelOf(character: WildShapeCharacter): number {
  const entry = (character.classLevels || []).find((level) => (level.classId || level.id) === 'druide');
  return Math.max(0, Number(entry?.level ?? (character.classId === 'druide' ? character.level : 0)) || 0);
}

export function druidSubclassOf(character: WildShapeCharacter): string {
  const entry = (character.classLevels || []).find((level) => (level.classId || level.id) === 'druide');
  return String(entry?.subclass || (character.classId === 'druide' ? character.subclass : '') || '');
}

export function isMoonDruid(character: WildShapeCharacter): boolean {
  return /cercle de la lune|circle of the moon|\blune\b/i.test(druidSubclassOf(character));
}

export function wildShapeKnownLimit(level: number): number {
  if (level >= 8) return 8;
  if (level >= 4) return 6;
  return level >= 2 ? 4 : 0;
}

export function wildShapeMaxCr(character: WildShapeCharacter): number {
  const level = druidLevelOf(character);
  if (isMoonDruid(character) && level >= 3) return Math.floor(level / 3);
  if (level >= 8) return 1;
  if (level >= 4) return 0.5;
  return level >= 2 ? 0.25 : 0;
}

export function eligibleWildShapeProfiles(character: WildShapeCharacter): WildShapeProfile[] {
  const max = wildShapeMaxCr(character);
  const level = druidLevelOf(character);
  if (level < 2) return [];
  return WILD_SHAPE_PROFILES.filter((profile) => crValue(profile.cr) <= max && (level >= 8 || !/vol/i.test(profile.speed)));
}

export function defaultKnownWildShapeForms(character: WildShapeCharacter): string[] {
  if (druidLevelOf(character) < 2) return [];
  const recommended = ['rat', 'riding-horse', 'spider', 'wolf'];
  return recommended.filter((id) => eligibleWildShapeProfiles(character).some((profile) => profile.id === id))
    .slice(0, wildShapeKnownLimit(druidLevelOf(character)));
}

export function normalizedKnownWildShapeForms(character: WildShapeCharacter): string[] {
  const allowed = new Set(eligibleWildShapeProfiles(character).map((profile) => profile.id));
  const known = (character.wildShapeKnownForms?.length ? character.wildShapeKnownForms : defaultKnownWildShapeForms(character))
    .filter((id, index, all) => allowed.has(id) && all.indexOf(id) === index);
  return known.slice(0, wildShapeKnownLimit(druidLevelOf(character)));
}

export function learnWildShapeForm(character: WildShapeCharacter, formId: string): WildShapeCharacter {
  const known = normalizedKnownWildShapeForms(character);
  if (known.includes(formId) || known.length >= wildShapeKnownLimit(druidLevelOf(character))) return character;
  if (!eligibleWildShapeProfiles(character).some((profile) => profile.id === formId)) return character;
  return { ...character, wildShapeKnownForms: [...known, formId] };
}

export function swapWildShapeForm(character: WildShapeCharacter, fromId: string, toId: string): WildShapeCharacter {
  if (!character.wildShapeFormSwapOpen) return character;
  const known = normalizedKnownWildShapeForms(character);
  if (!known.includes(fromId) || known.includes(toId) || !eligibleWildShapeProfiles(character).some((profile) => profile.id === toId)) return character;
  return { ...character, wildShapeKnownForms: known.map((id) => id === fromId ? toId : id), wildShapeFormSwapOpen: false };
}

export function wildShapeTempHp(character: WildShapeCharacter): number {
  const level = druidLevelOf(character);
  return isMoonDruid(character) && level >= 3 ? level * 3 : level;
}

export function wildShapeArmorClass(character: WildShapeCharacter, profile: WildShapeProfile): number {
  if (!isMoonDruid(character) || druidLevelOf(character) < 3) return profile.ac;
  const wis = Number(character.abilities?.wis || 10);
  const wisMod = Math.floor((wis - 10) / 2);
  return Math.max(profile.ac, 13 + wisMod);
}

export function canCastSpellWhileWildShaped(character: WildShapeCharacter, spellName: string | null | undefined, spellComponents: string | null | undefined = null): boolean {
  if (!character.activeWildShape) return true;
  const level = druidLevelOf(character);
  if (level >= 18) {
    const components = String(spellComponents || '');
    const materialDetail = components.match(/\bM\s*\(([^)]*)\)/i)?.[1] || '';
    const restrictedMaterial = /\b(?:po|pa|pc|pp)\b|consum|consomm/i.test(materialDetail);
    return !restrictedMaterial;
  }
  if (!isMoonDruid(character) || level < 3) return false;
  return /^(Soins|Rayon de lune|Étincelle stellaire|Invocation d['’]animaux|Source de clair de lune|Soins de groupe)$/i.test(String(spellName || '').trim());
}

export function applyWildShape(character: WildShapeCharacter, formId: string): WildShapeCharacter {
  const profile = eligibleWildShapeProfiles(character).find((entry) => entry.id === formId);
  const known = normalizedKnownWildShapeForms(character);
  const resource = (character.resources || []).find((entry) => entry.name === 'Forme sauvage');
  if (!profile || !known.includes(formId) || !resource || resource.current <= 0) return character;
  const basePhysical = character.activeWildShape?.originalPhysical || {
    str: Number(character.abilities?.str || 10), dex: Number(character.abilities?.dex || 10), con: Number(character.abilities?.con || 10),
  };
  const baseAttacks = character.activeWildShape?.originalAttacks || [...(character.attacks || [])];
  const level = druidLevelOf(character);
  const moon = isMoonDruid(character) && level >= 3;
  const active: ActiveWildShape = {
    formId: profile.id,
    formName: profile.name,
    size: profile.size,
    ac: wildShapeArmorClass(character, profile),
    speed: profile.speed,
    senses: profile.senses,
    traits: [...(profile.traits || [])],
    attacksPerAction: Math.max(1, profile.attacksPerAction || 1),
    originalPhysical: basePhysical,
    originalAttacks: baseAttacks,
    durationHours: level / 2,
    moon,
  };
  return {
    ...character,
    abilities: { ...(character.abilities || {}), ...profile.abilities },
    attacks: profile.attacks.map((attack) => ({ ...attack, id: `wild-${profile.id}-${attack.id}`, abMod: attack.toHit ?? 0, known: true, wildShape: true })),
    hpTemp: Math.max(Number(character.hpTemp || 0), wildShapeTempHp(character)),
    activeWildShape: active,
    resources: (character.resources || []).map((entry) => entry === resource ? { ...entry, current: entry.current - 1 } : entry),
    conditions: [
      ...(character.conditions || []).filter((condition) => condition.label !== 'Forme sauvage'),
      { label: 'Forme sauvage', detail: `${profile.name} · ${active.durationHours} h · CA ${active.ac} · ${profile.speed}` },
    ],
  };
}

export function endWildShape(character: WildShapeCharacter): WildShapeCharacter {
  const active = character.activeWildShape;
  if (!active) return character;
  return {
    ...character,
    abilities: { ...(character.abilities || {}), ...active.originalPhysical },
    attacks: active.originalAttacks,
    activeWildShape: null,
    conditions: (character.conditions || []).filter((condition) => condition.label !== 'Forme sauvage'),
  };
}

export function openWildShapeSwapAfterLongRest(character: WildShapeCharacter): WildShapeCharacter {
  if (druidLevelOf(character) < 2) return character;
  return { ...character, wildShapeKnownForms: normalizedKnownWildShapeForms(character), wildShapeFormSwapOpen: true };
}
