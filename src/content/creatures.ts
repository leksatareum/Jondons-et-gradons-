export type CreatureTemplate = {
  id: string;
  name: string;
  ac: number;
  hp: number;
  speed: string;
  cr: string;
  kind: 'bête' | 'familier spécial' | 'mort-vivant' | 'aberration';
  actions?: CreatureAction[];
  traits?: string[];
  senses?: string;
  size?: 'TP' | 'P' | 'M' | 'G' | 'TG';
  abilities?: { str: number; dex: number; con: number };
  saveBonuses?: Partial<Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>>;
  skillBonuses?: Record<string, number>;
};

export type CreatureAction = {
  name: string;
  kind?: 'attack' | 'save' | 'utility';
  toHit?: number;
  save?: string;
  reach?: string;
  damage?: string;
  damageType?: string;
  detail?: string;
  attacks?: number;
  sequence?: string[];
};

const beast = (id: string, name: string, ac: number, hp: number, speed: string, cr: string): CreatureTemplate =>
  ({ id, name, ac, hp, speed, cr, kind: 'bête' });

// Index mécanique original et compact de l’appendice B du Manuel 2024.
// Les descriptions propriétaires ne sont volontairement pas recopiées dans le bundle.
const RAW_PHB_CREATURES: CreatureTemplate[] = [
  beast('ape', 'Singe', 12, 19, '9 m · escalade 9 m', '1/2'),
  beast('badger', 'Blaireau', 11, 5, '6 m · fouissement 1,50 m', '0'),
  beast('bat', 'Chauve-souris', 12, 1, '1,50 m · vol 9 m', '0'),
  beast('black-bear', 'Ours noir', 11, 19, '9 m · escalade 9 m · nage 9 m', '1/2'),
  beast('boar', 'Sanglier', 11, 13, '12 m', '1/4'),
  beast('brown-bear', 'Ours brun', 11, 22, '12 m · escalade 9 m', '1'),
  beast('camel', 'Chameau', 10, 17, '15 m', '1/8'),
  beast('cat', 'Chat', 12, 2, '12 m · escalade 12 m', '0'),
  beast('constrictor-snake', 'Serpent constricteur', 13, 13, '9 m · nage 9 m', '1/4'),
  beast('crab', 'Crabe', 11, 3, '6 m · nage 6 m', '0'),
  beast('crocodile', 'Crocodile', 12, 13, '6 m · nage 9 m', '1/2'),
  beast('dire-wolf', 'Loup sanguinaire', 14, 22, '15 m', '1'),
  beast('draft-horse', 'Cheval de trait', 10, 15, '12 m', '1/4'),
  beast('elephant', 'Éléphant', 12, 76, '12 m', '4'),
  beast('elk', 'Élan', 10, 11, '15 m', '1/4'),
  beast('frog', 'Grenouille', 11, 1, '6 m · nage 6 m', '0'),
  beast('giant-badger', 'Blaireau géant', 13, 15, '9 m · fouissement 3 m', '1/4'),
  beast('giant-crab', 'Crabe géant', 15, 13, '9 m · nage 9 m', '1/8'),
  beast('giant-goat', 'Chèvre géante', 11, 19, '12 m · escalade 9 m', '1/2'),
  beast('giant-seahorse', 'Hippocampe géant', 14, 16, '1,50 m · nage 12 m', '1/2'),
  beast('giant-spider', 'Araignée géante', 14, 26, '9 m · escalade 9 m', '1'),
  beast('giant-weasel', 'Belette géante', 13, 9, '12 m · escalade 9 m', '1/8'),
  beast('goat', 'Chèvre', 10, 4, '12 m · escalade 9 m', '0'),
  beast('hawk', 'Faucon', 13, 1, '3 m · vol 18 m', '0'),
  { id: 'imp', name: 'Diablotin', ac: 13, hp: 21, speed: '6 m · vol 12 m', cr: '1', kind: 'familier spécial' },
  beast('lion', 'Lion', 12, 22, '15 m', '1'),
  beast('lizard', 'Lézard', 10, 2, '6 m · escalade 6 m', '0'),
  beast('mastiff', 'Mastiff', 12, 5, '12 m', '1/8'),
  beast('mule', 'Mule', 10, 11, '12 m', '1/8'),
  beast('octopus', 'Pieuvre', 12, 3, '1,50 m · nage 9 m', '0'),
  beast('owl', 'Chouette', 11, 1, '1,50 m · vol 18 m', '0'),
  beast('panther', 'Panthère', 12, 13, '15 m · escalade 12 m', '1/4'),
  beast('pony', 'Poney', 10, 11, '12 m', '1/8'),
  { id: 'pseudodragon', name: 'Pseudodragon', ac: 14, hp: 10, speed: '4,50 m · vol 18 m', cr: '1/4', kind: 'familier spécial' },
  { id: 'quasit', name: 'Quasit', ac: 13, hp: 25, speed: '12 m', cr: '1', kind: 'familier spécial' },
  beast('rat', 'Rat', 10, 1, '6 m · escalade 6 m', '0'),
  beast('raven', 'Corbeau', 12, 2, '3 m · vol 15 m', '0'),
  beast('reef-shark', 'Requin de récif', 12, 22, '1,50 m · nage 9 m', '1/2'),
  beast('riding-horse', 'Cheval de selle', 11, 13, '18 m', '1/4'),
  beast('scorpion', 'Scorpion', 11, 1, '3 m', '0'),
  { id: 'skeleton', name: 'Squelette', ac: 13, hp: 13, speed: '9 m', cr: '1/4', kind: 'mort-vivant' },
  { id: 'slaad-tadpole', name: 'Têtard de slaad', ac: 12, hp: 7, speed: '9 m · fouissement 3 m', cr: '1/8', kind: 'aberration' },
  { id: 'sphinx-of-wonder', name: 'Sphinx merveilleux', ac: 13, hp: 24, speed: '6 m · vol 12 m', cr: '1', kind: 'familier spécial' },
  beast('spider', 'Araignée', 12, 1, '6 m · escalade 6 m', '0'),
  { id: 'sprite', name: 'Esprit follet', ac: 15, hp: 10, speed: '3 m · vol 12 m', cr: '1/4', kind: 'familier spécial' },
  beast('tiger', 'Tigre', 13, 22, '12 m', '1'),
  beast('venomous-snake', 'Serpent venimeux', 12, 5, '9 m · nage 9 m', '1/8'),
  beast('warhorse', 'Cheval de guerre', 11, 19, '18 m', '1/2'),
  beast('weasel', 'Belette', 13, 1, '9 m · escalade 9 m', '0'),
  beast('wolf', 'Loup', 12, 11, '12 m', '1/4'),
  { id: 'zombie', name: 'Zombie', ac: 8, hp: 15, speed: '6 m', cr: '1/4', kind: 'mort-vivant' },
];

// Caractéristiques utiles à Forme sauvage. Les scores mentaux restent ceux du
// Druide, mais les maîtrises de sauvegarde et de compétence de la bête peuvent
// fournir un meilleur bonus.
const BEAST_PHYSICAL: Record<string, Pick<CreatureTemplate, 'size' | 'abilities' | 'saveBonuses' | 'skillBonuses'>> = {
  ape: { size: 'M', abilities: { str: 16, dex: 14, con: 14 }, skillBonuses: { athletisme: 5, perception: 3 } },
  badger: { size: 'TP', abilities: { str: 10, dex: 11, con: 16 }, skillBonuses: { perception: 3 } },
  'black-bear': { size: 'M', abilities: { str: 15, dex: 12, con: 14 }, skillBonuses: { perception: 5 } },
  boar: { size: 'M', abilities: { str: 13, dex: 11, con: 14 } },
  'brown-bear': { size: 'G', abilities: { str: 17, dex: 12, con: 15 }, skillBonuses: { perception: 3 } },
  camel: { size: 'G', abilities: { str: 15, dex: 8, con: 17 }, saveBonuses: { con: 5 } },
  cat: { size: 'TP', abilities: { str: 3, dex: 15, con: 10 }, saveBonuses: { dex: 4 }, skillBonuses: { perception: 3, discretion: 4 } },
  'constrictor-snake': { size: 'G', abilities: { str: 15, dex: 14, con: 12 }, skillBonuses: { perception: 2, discretion: 4 } },
  crab: { size: 'TP', abilities: { str: 6, dex: 11, con: 12 }, skillBonuses: { discretion: 2 } },
  crocodile: { size: 'G', abilities: { str: 15, dex: 10, con: 13 }, saveBonuses: { con: 3 }, skillBonuses: { discretion: 2 } },
  'dire-wolf': { size: 'G', abilities: { str: 17, dex: 15, con: 15 }, skillBonuses: { perception: 5, discretion: 4 } },
  'draft-horse': { size: 'G', abilities: { str: 18, dex: 10, con: 15 } },
  elk: { size: 'G', abilities: { str: 16, dex: 10, con: 11 }, skillBonuses: { perception: 2 } },
  frog: { size: 'TP', abilities: { str: 1, dex: 13, con: 8 }, skillBonuses: { perception: 1, discretion: 3 } },
  'giant-badger': { size: 'M', abilities: { str: 13, dex: 10, con: 17 }, skillBonuses: { perception: 3 } },
  'giant-crab': { size: 'M', abilities: { str: 13, dex: 13, con: 11 }, skillBonuses: { discretion: 3 } },
  'giant-goat': { size: 'G', abilities: { str: 17, dex: 13, con: 12 }, saveBonuses: { str: 5 }, skillBonuses: { perception: 3 } },
  'giant-seahorse': { size: 'G', abilities: { str: 15, dex: 12, con: 11 } },
  'giant-spider': { size: 'G', abilities: { str: 14, dex: 16, con: 12 }, skillBonuses: { perception: 4, discretion: 7 } },
  'giant-weasel': { size: 'M', abilities: { str: 11, dex: 17, con: 10 }, skillBonuses: { acrobaties: 5, perception: 3, discretion: 5 } },
  goat: { size: 'M', abilities: { str: 11, dex: 10, con: 11 }, saveBonuses: { str: 2 }, skillBonuses: { perception: 2 } },
  lion: { size: 'G', abilities: { str: 17, dex: 15, con: 11 }, skillBonuses: { perception: 3, discretion: 4 } },
  lizard: { size: 'TP', abilities: { str: 2, dex: 11, con: 10 } },
  mastiff: { size: 'M', abilities: { str: 13, dex: 14, con: 12 }, saveBonuses: { wis: 3 }, skillBonuses: { perception: 5 } },
  mule: { size: 'M', abilities: { str: 14, dex: 10, con: 13 } },
  octopus: { size: 'P', abilities: { str: 4, dex: 15, con: 11 }, skillBonuses: { perception: 2, discretion: 6 } },
  panther: { size: 'M', abilities: { str: 14, dex: 15, con: 10 }, skillBonuses: { perception: 4, discretion: 6 } },
  pony: { size: 'M', abilities: { str: 15, dex: 10, con: 13 }, saveBonuses: { str: 4 } },
  rat: { size: 'TP', abilities: { str: 2, dex: 11, con: 9 }, skillBonuses: { perception: 2 } },
  'reef-shark': { size: 'M', abilities: { str: 14, dex: 15, con: 13 }, skillBonuses: { perception: 2 } },
  'riding-horse': { size: 'G', abilities: { str: 16, dex: 13, con: 12 } },
  scorpion: { size: 'TP', abilities: { str: 2, dex: 11, con: 8 } },
  spider: { size: 'TP', abilities: { str: 2, dex: 14, con: 8 }, skillBonuses: { discretion: 4 } },
  tiger: { size: 'G', abilities: { str: 17, dex: 16, con: 14 }, skillBonuses: { perception: 3, discretion: 7 } },
  'venomous-snake': { size: 'TP', abilities: { str: 2, dex: 15, con: 11 } },
  warhorse: { size: 'G', abilities: { str: 18, dex: 12, con: 13 }, saveBonuses: { con: 3, wis: 3 } },
  weasel: { size: 'TP', abilities: { str: 3, dex: 16, con: 8 }, skillBonuses: { acrobaties: 5, perception: 3, discretion: 5 } },
  wolf: { size: 'M', abilities: { str: 14, dex: 15, con: 12 }, skillBonuses: { perception: 5, discretion: 4 } },
};

// Données de résolution indispensables aux formes accessibles aux Druides 1-5.
// Il s'agit d'un index mécanique compact : aucun texte narratif du livre n'est recopié.
const BEAST_COMBAT: Record<string, Pick<CreatureTemplate, 'actions' | 'traits' | 'senses'>> = {
  ape: { senses: 'Perception passive 13', actions: [
    { name: 'Multiattaque', kind: 'utility', attacks: 2, sequence: ['Poing', 'Poing'], detail: 'Deux attaques de Poing.' },
    { name: 'Poing', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d4+3', damageType: 'contondants' },
    { name: 'Rocher (recharge 6)', kind: 'attack', toHit: 5, reach: '7,50/15 m', damage: '2d6+3', damageType: 'contondants' },
  ] },
  badger: { senses: 'Vision dans le noir 9 m · perception passive 13', traits: ['Résistance au poison'], actions: [
    { name: 'Morsure', kind: 'attack', toHit: 2, reach: '1,50 m', damage: '1', damageType: 'perforants' },
  ] },
  'black-bear': { senses: 'Vision dans le noir 18 m · perception passive 15', actions: [
    { name: 'Multiattaque', kind: 'utility', attacks: 2, sequence: ['Lacération', 'Lacération'], detail: 'Deux attaques de Lacération.' },
    { name: 'Lacération', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '1d6+2', damageType: 'tranchants' },
  ] },
  boar: { senses: 'Perception passive 9', traits: ['Fureur sanglante : avantage aux attaques lorsque la bête est à la moitié de ses PV ou moins.'], actions: [
    { name: 'Défense', kind: 'attack', toHit: 3, reach: '1,50 m', damage: '1d6+1', damageType: 'perforants', detail: 'Après 6 m en ligne droite : +1d6 et cible G ou moins À terre.' },
  ] },
  'brown-bear': { senses: 'Vision dans le noir 18 m · perception passive 13', actions: [
    { name: 'Multiattaque', kind: 'utility', attacks: 2, sequence: ['Morsure', 'Griffe'], detail: 'Une Morsure et une Griffe.' },
    { name: 'Morsure', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d8+3', damageType: 'perforants' },
    { name: 'Griffe', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d4+3', damageType: 'tranchants', detail: 'La cible TG ou moins est À terre.' },
  ] },
  camel: { senses: 'Vision dans le noir 18 m · perception passive 10', actions: [
    { name: 'Morsure', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '1d4+2', damageType: 'contondants' },
  ] },
  cat: { senses: 'Vision dans le noir 18 m · perception passive 13', traits: ['Sauts calculés avec la Dextérité plutôt que la Force.'], actions: [
    { name: 'Griffure', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '1', damageType: 'tranchants' },
  ] },
  'constrictor-snake': { senses: 'Vision aveugle 3 m · perception passive 12', actions: [
    { name: 'Morsure', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '1d8+2', damageType: 'perforants' },
    { name: 'Constriction', kind: 'save', save: 'FOR DD 12', reach: '1,50 m', damage: '3d4', damageType: 'contondants', detail: 'Une cible M ou plus petite est Agrippée (fuite DD 12).' },
  ] },
  crab: { senses: 'Vision aveugle 9 m · perception passive 9', traits: ['Amphibie'], actions: [
    { name: 'Pince', kind: 'attack', toHit: 2, reach: '1,50 m', damage: '1', damageType: 'contondants' },
  ] },
  crocodile: { senses: 'Perception passive 10', traits: ['Retient son souffle pendant 1 heure.'], actions: [
    { name: 'Morsure', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '1d8+2', damageType: 'perforants', detail: 'Une cible M ou plus petite est Agrippée (fuite DD 12) et Entravée.' },
  ] },
  'dire-wolf': { senses: 'Vision dans le noir 18 m · perception passive 15', traits: ['Tactique de meute'], actions: [
    { name: 'Morsure', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d10+3', damageType: 'perforants', detail: 'La cible TG ou moins est À terre.' },
  ] },
  'draft-horse': { senses: 'Perception passive 10', actions: [
    { name: 'Sabots', kind: 'attack', toHit: 6, reach: '1,50 m', damage: '1d4+4', damageType: 'contondants' },
  ] },
  elk: { senses: 'Vision dans le noir 18 m · perception passive 12', actions: [
    { name: 'Ramure', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d6+3', damageType: 'contondants', detail: 'Après 6 m en ligne droite : +1d6 et cible TG ou moins À terre.' },
  ] },
  frog: { senses: 'Vision dans le noir 9 m · perception passive 11', traits: ['Amphibie', 'Saut sans élan : longueur 3 m, hauteur 1,50 m.'], actions: [
    { name: 'Morsure', kind: 'attack', toHit: 3, reach: '1,50 m', damage: '1', damageType: 'perforants' },
  ] },
  'giant-badger': { senses: 'Vision dans le noir 18 m · perception passive 13', traits: ['Résistance au poison'], actions: [
    { name: 'Morsure', kind: 'attack', toHit: 3, reach: '1,50 m', damage: '2d4+1', damageType: 'perforants' },
  ] },
  'giant-crab': { senses: 'Vision aveugle 9 m · perception passive 9', traits: ['Amphibie'], actions: [
    { name: 'Pince', kind: 'attack', toHit: 3, reach: '1,50 m', damage: '1d6+1', damageType: 'contondants', detail: 'Une cible M ou plus petite est Agrippée (fuite DD 11) ; une cible par pince.' },
  ] },
  'giant-goat': { senses: 'Vision dans le noir 18 m · perception passive 13', actions: [
    { name: 'Cornes', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d6+3', damageType: 'contondants', detail: 'Après 6 m en ligne droite : +2d4 et cible TG ou moins À terre.' },
  ] },
  'giant-seahorse': { senses: 'Perception passive 11', traits: ['Respiration aquatique'], actions: [
    { name: 'Percussion', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '2d6+2', damageType: 'contondants', detail: 'Après 6 m en ligne droite : 2d8+2 à la place.' },
    { name: 'Ruée de bulles', kind: 'utility', detail: 'Action bonus sous l’eau : demi-vitesse de nage sans attaque d’opportunité.' },
  ] },
  'giant-spider': { senses: 'Vision dans le noir 18 m · perception passive 14', traits: ['Pattes d’araignée', 'Marche dans les toiles'], actions: [
    { name: 'Morsure', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d8+3 perforants + 2d6 poison', damageType: 'perforants et poison' },
    { name: 'Toile (recharge 5-6)', kind: 'save', save: 'DEX DD 13', reach: '18 m', detail: 'La cible est Entravée jusqu’à destruction de la toile (CA 10, 5 PV, vulnérable au feu).' },
  ] },
  'giant-weasel': { senses: 'Vision dans le noir 18 m · perception passive 13', actions: [
    { name: 'Morsure', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d4+3', damageType: 'perforants' },
  ] },
  goat: { senses: 'Vision dans le noir 18 m · perception passive 12', actions: [
    { name: 'Cornes', kind: 'attack', toHit: 2, reach: '1,50 m', damage: '1', damageType: 'contondants', detail: 'Après 6 m en ligne droite : 1d4 à la place.' },
  ] },
  imp: { senses: 'Vision dans le noir 36 m · perception passive 11', traits: ['Résistance au froid', 'Immunité au feu et au poison', 'Vision du diable', 'Résistance à la magie'], actions: [
    { name: 'Dard', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d6+3 perforants + 2d6 poison', damageType: 'perforants et poison' },
    { name: 'Invisibilité', kind: 'utility', detail: 'Lance Invisibilité sur lui-même sans composante.' },
    { name: 'Métamorphose', kind: 'utility', detail: 'Rat, corbeau ou araignée ; seules ses vitesses changent.' },
  ] },
  lizard: { senses: 'Vision dans le noir 9 m · perception passive 9', traits: ['Pattes d’araignée'], actions: [
    { name: 'Morsure', kind: 'attack', toHit: 2, reach: '1,50 m', damage: '1', damageType: 'perforants' },
  ] },
  lion: { senses: 'Vision dans le noir 18 m · perception passive 13', traits: ['Tactique de meute', 'Saut avec élan : longueur jusqu’à 7,50 m.'], actions: [
    { name: 'Multiattaque', kind: 'utility', attacks: 2, detail: 'Deux Lacérations ; l’une peut être remplacée par Rugissement.' },
    { name: 'Lacération', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d8+3', damageType: 'tranchants' },
    { name: 'Rugissement', kind: 'save', save: 'SAG DD 11', reach: '4,50 m', detail: 'Effrayé jusqu’au début du prochain tour du lion.' },
  ] },
  mastiff: { senses: 'Vision dans le noir 18 m · perception passive 15', actions: [
    { name: 'Morsure', kind: 'attack', toHit: 3, reach: '1,50 m', damage: '1d6+1', damageType: 'perforants', detail: 'La cible G ou moins est À terre.' },
  ] },
  mule: { senses: 'Perception passive 10', traits: ['Bête de somme : taille supérieure pour la capacité de charge.'], actions: [
    { name: 'Sabots', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '1d4+2', damageType: 'contondants' },
  ] },
  octopus: { senses: 'Vision dans le noir 9 m · perception passive 12', traits: ['Compression', 'Respiration aquatique'], actions: [
    { name: 'Tentacules', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '1', damageType: 'contondants' },
    { name: 'Nuage d’encre (1/jour)', kind: 'utility', detail: 'Réaction sous l’eau : cube de 1,50 m très obscurci pendant 1 minute, puis nage jusqu’à sa vitesse.' },
  ] },
  panther: { senses: 'Vision dans le noir 18 m · perception passive 14', actions: [
    { name: 'Multiattaque', kind: 'utility', attacks: 1, sequence: ['Bond'], detail: 'Une attaque Bond puis utilise Rôder.' },
    { name: 'Bond', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '1d4+2', damageType: 'tranchants', detail: 'Avec avantage : 2d4+2.' },
    { name: 'Rôder', kind: 'utility', detail: 'Demi-vitesse sans attaque d’opportunité, puis peut Se cacher.' },
  ] },
  pseudodragon: { senses: 'Vision aveugle 3 m · vision dans le noir 18 m · perception passive 15', traits: ['Résistance à la magie'], actions: [
    { name: 'Multiattaque', kind: 'utility', attacks: 2, sequence: ['Morsure', 'Morsure'], detail: 'Deux attaques de Morsure.' },
    { name: 'Morsure', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '1d4+2', damageType: 'perforants' },
    { name: 'Dard', kind: 'save', save: 'CON DD 12', reach: '1,50 m', damage: '2d4+2', damageType: 'poison', detail: 'Empoisonné 1 h ; échec de 5 ou plus : aussi Inconscient jusqu’aux dégâts ou au réveil par une action.' },
  ] },
  quasit: { senses: 'Vision dans le noir 36 m · perception passive 10', traits: ['Résistance au froid, feu et foudre', 'Immunité au poison', 'Résistance à la magie'], actions: [
    { name: 'Lacération', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d4+3', damageType: 'tranchants', detail: 'Empoisonné jusqu’au début du prochain tour du quasit.' },
    { name: 'Invisibilité', kind: 'utility', detail: 'Lance Invisibilité sur lui-même sans composante.' },
    { name: 'Effroi (1/jour)', kind: 'save', save: 'SAG DD 10', reach: '6 m', detail: 'Effrayé, nouvelle sauvegarde à chaque fin de tour ; réussite automatique après 1 minute.' },
    { name: 'Métamorphose', kind: 'utility', detail: 'Chauve-souris, mille-pattes ou crapaud ; seules ses vitesses changent.' },
  ] },
  pony: { senses: 'Perception passive 10', actions: [
    { name: 'Sabots', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '1d4+2', damageType: 'contondants' },
  ] },
  rat: { senses: 'Vision dans le noir 9 m · perception passive 12', traits: ['Agile : ne provoque pas en quittant l’allonge.'], actions: [
    { name: 'Morsure', kind: 'attack', toHit: 2, reach: '1,50 m', damage: '1', damageType: 'perforants' },
  ] },
  'reef-shark': { senses: 'Vision aveugle 9 m · perception passive 12', traits: ['Tactique de meute', 'Respiration aquatique'], actions: [
    { name: 'Morsure', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '2d4+2', damageType: 'perforants' },
  ] },
  'riding-horse': { senses: 'Perception passive 10', actions: [
    { name: 'Sabots', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d8+3', damageType: 'contondants' },
  ] },
  scorpion: { senses: 'Vision aveugle 3 m · perception passive 9', actions: [
    { name: 'Dard', kind: 'attack', toHit: 2, reach: '1,50 m', damage: '1 perforant + 1d6 poison', damageType: 'perforants et poison' },
  ] },
  skeleton: { senses: 'Vision dans le noir 18 m · perception passive 9', traits: ['Vulnérabilité aux dégâts contondants', 'Immunité au poison, à Empoisonné et à l’Épuisement'], actions: [
    { name: 'Épée courte', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d6+3', damageType: 'perforants' },
    { name: 'Arc court', kind: 'attack', toHit: 5, reach: '24/96 m', damage: '1d6+3', damageType: 'perforants' },
  ] },
  'slaad-tadpole': { senses: 'Vision dans le noir 18 m · perception passive 7', traits: ['Résistance à acide, froid, feu, foudre et tonnerre', 'Résistance à la magie'], actions: [
    { name: 'Morsure', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '1d6+2', damageType: 'perforants' },
  ] },
  'sphinx-of-wonder': { senses: 'Vision dans le noir 18 m · perception passive 11', traits: ['Résistance nécrotique, psychique et radiante', 'Résistance à la magie'], actions: [
    { name: 'Lacération', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d4+3 tranchants + 2d6 radiants', damageType: 'tranchants et radiants' },
    { name: 'Éclair de génie (2/jour)', kind: 'utility', detail: 'Réaction : +2 au test de caractéristique ou à la sauvegarde d’une créature à 9 m.' },
  ] },
  spider: { senses: 'Vision dans le noir 9 m · perception passive 10', traits: ['Pattes d’araignée', 'Marche dans les toiles'], actions: [
    { name: 'Morsure', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '1 perforant + 1d4 poison', damageType: 'perforants et poison' },
  ] },
  sprite: { senses: 'Perception passive 13', actions: [
    { name: 'Épée-aiguille', kind: 'attack', toHit: 6, reach: '1,50 m', damage: '1d4+4', damageType: 'perforants' },
    { name: 'Arc enchanteur', kind: 'attack', toHit: 6, reach: '12/48 m', damage: '1', damageType: 'perforants', detail: 'Charmé jusqu’au début du prochain tour de l’esprit follet.' },
    { name: 'Lire le cœur', kind: 'save', save: 'CHA DD 10', reach: '1,50 m', detail: 'Révèle émotions et alignement ; célestes, fiélons et morts-vivants échouent automatiquement.' },
    { name: 'Invisibilité', kind: 'utility', detail: 'Lance Invisibilité sur lui-même sans composante.' },
  ] },
  tiger: { senses: 'Vision dans le noir 18 m · perception passive 13', actions: [
    { name: 'Multiattaque', kind: 'utility', attacks: 1, sequence: ['Bond'], detail: 'Une attaque Bond puis utilise Rôder.' },
    { name: 'Bond', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d6+3', damageType: 'tranchants', detail: 'Avec avantage : +1d6 et cible TG ou moins À terre.' },
    { name: 'Rôder', kind: 'utility', detail: 'Demi-vitesse sans attaque d’opportunité, puis peut Se cacher.' },
  ] },
  'venomous-snake': { senses: 'Vision aveugle 3 m · perception passive 10', actions: [
    { name: 'Morsure', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '1d4+2 perforants + 1d6 poison', damageType: 'perforants et poison' },
  ] },
  warhorse: { senses: 'Perception passive 11', actions: [
    { name: 'Sabots', kind: 'attack', toHit: 6, reach: '1,50 m', damage: '2d4+4', damageType: 'contondants', detail: 'Après 6 m en ligne droite : +2d4 et cible TG ou moins À terre.' },
  ] },
  weasel: { senses: 'Vision dans le noir 18 m · perception passive 13', actions: [
    { name: 'Morsure', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1', damageType: 'perforants' },
  ] },
  wolf: { senses: 'Vision dans le noir 18 m · perception passive 15', traits: ['Tactique de meute'], actions: [
    { name: 'Morsure', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '1d6+2', damageType: 'perforants', detail: 'La cible M ou moins est À terre.' },
  ] },
};

export const PHB_CREATURES: CreatureTemplate[] = RAW_PHB_CREATURES.map((creature) => ({
  ...creature,
  ...(BEAST_PHYSICAL[creature.id] || {}),
  ...(BEAST_COMBAT[creature.id] || {}),
}));
