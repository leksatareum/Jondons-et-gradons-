export type CreatureTemplate = {
  id: string;
  name: string;
  ac: number;
  hp: number;
  speed: string;
  cr: string;
  kind: 'bête' | 'familier spécial' | 'mort-vivant' | 'aberration' | 'humanoïde' | 'géant' | 'monstruosité' | 'vase';
  actions?: CreatureAction[];
  traits?: string[];
  senses?: string;
  size?: 'TP' | 'P' | 'M' | 'G' | 'TG';
  /**
   * Les six caractéristiques. Pour une bête de Forme sauvage, `str`/`dex`/`con`
   * seuls suffisent : les scores mentaux restent ceux du Druide (voir
   * `BEAST_PHYSICAL` plus bas). Un adversaire (humanoïde, mort-vivant…) porte
   * ses six scores, nécessaires à une compétence ou une DD d'incantation.
   */
  abilities?: Partial<Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>>;
  saveBonuses?: Partial<Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>>;
  /** Bonus total (maîtrise incluse), tel qu'imprimé — pas le seul modificateur. Clé = nom affiché (« Discrétion », « Perception »…), pas un identifiant. */
  skillBonuses?: Record<string, number>;
  /** Étiquette(s) de thème pour la suggestion automatique de rencontre (« gobelin », « loup »…). Facultatif : sans thème, la créature n'apparaît que dans une suggestion « aléatoire ». */
  theme?: string[];
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
  { ...beast('dire-wolf', 'Loup sanguinaire', 14, 22, '15 m', '1'), theme: ['loup'] },
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
  { id: 'skeleton', name: 'Squelette', ac: 13, hp: 13, speed: '9 m', cr: '1/4', kind: 'mort-vivant', theme: ['mort-vivant'] },
  { id: 'slaad-tadpole', name: 'Têtard de slaad', ac: 12, hp: 7, speed: '9 m · fouissement 3 m', cr: '1/8', kind: 'aberration' },
  { id: 'sphinx-of-wonder', name: 'Sphinx merveilleux', ac: 13, hp: 24, speed: '6 m · vol 12 m', cr: '1', kind: 'familier spécial' },
  beast('spider', 'Araignée', 12, 1, '6 m · escalade 6 m', '0'),
  { id: 'sprite', name: 'Esprit follet', ac: 15, hp: 10, speed: '3 m · vol 12 m', cr: '1/4', kind: 'familier spécial' },
  beast('tiger', 'Tigre', 13, 22, '12 m', '1'),
  beast('venomous-snake', 'Serpent venimeux', 12, 5, '9 m · nage 9 m', '1/8'),
  beast('warhorse', 'Cheval de guerre', 11, 19, '18 m', '1/2'),
  beast('weasel', 'Belette', 13, 1, '9 m · escalade 9 m', '0'),
  { ...beast('wolf', 'Loup', 12, 11, '12 m', '1/4'), theme: ['loup'] },
  { id: 'zombie', name: 'Zombie', ac: 8, hp: 15, speed: '6 m', cr: '1/4', kind: 'mort-vivant', theme: ['mort-vivant'] },

  // Manuel des monstres 2024 — bestiaire d'aventure courant, apporté par la
  // table. Même principe que ci-dessus : un index mécanique compact, pas les
  // textes narratifs du livre.
  { id: 'gobelin-larbin', name: 'Gobelin larbin', ac: 12, hp: 7, speed: '9 m', cr: '1/8', kind: 'humanoïde', theme: ['gobelin'] },
  { id: 'gobelin-guerrier', name: 'Gobelin guerrier', ac: 15, hp: 10, speed: '9 m', cr: '1/4', kind: 'humanoïde', theme: ['gobelin'] },
  { id: 'gobelin-chef', name: 'Gobelin chef', ac: 17, hp: 21, speed: '9 m', cr: '1', kind: 'humanoïde', theme: ['gobelin'] },
  { id: 'gobelin-envouteur', name: 'Gobelin envoûteur', ac: 13, hp: 45, speed: '9 m', cr: '3', kind: 'humanoïde', theme: ['gobelin'] },
  { id: 'bandit', name: 'Bandit', ac: 12, hp: 11, speed: '9 m', cr: '1/8', kind: 'humanoïde', theme: ['bandit'] },
  { id: 'bandit-capitaine', name: 'Capitaine bandit', ac: 15, hp: 52, speed: '9 m', cr: '2', kind: 'humanoïde', theme: ['bandit'] },
  { id: 'kobold-guerrier', name: 'Kobold guerrier', ac: 14, hp: 7, speed: '9 m', cr: '1/8', kind: 'humanoïde', theme: ['kobold'] },
  { id: 'kobold-aile', name: 'Kobold ailé', ac: 15, hp: 10, speed: '9 m · vol 9 m', cr: '1/4', kind: 'humanoïde', theme: ['kobold'] },
  { id: 'ogre', name: 'Ogre', ac: 11, hp: 68, speed: '12 m', cr: '2', kind: 'géant', theme: ['ogre'] },
  { id: 'ogrillon', name: 'Ogrillon', ac: 12, hp: 52, speed: '9 m', cr: '1', kind: 'géant', theme: ['ogre'] },
  { id: 'ogre-zombie', name: 'Ogre zombie', ac: 8, hp: 85, speed: '9 m', cr: '2', kind: 'mort-vivant', theme: ['ogre', 'mort-vivant'] },
  { id: 'worg', name: 'Worg', ac: 13, hp: 26, speed: '12 m', cr: '1/2', kind: 'bête', theme: ['loup'] },
  { id: 'harpie', name: 'Harpie', ac: 11, hp: 38, speed: '6 m · vol 12 m', cr: '1', kind: 'monstruosité' },

  // Complément du bestiaire d'aventure : de quoi varier chaque thème
  // (l'orc et le gnoll n'avaient encore aucun représentant) et combler le
  // thème « Morts-vivants », jusqu'ici limité au squelette et au zombie.
  { id: 'orc-guerrier', name: 'Orc guerrier', ac: 13, hp: 15, speed: '9 m', cr: '1/2', kind: 'humanoïde', theme: ['orc'] },
  { id: 'orc-chef-de-guerre', name: 'Orc chef de guerre', ac: 16, hp: 45, speed: '9 m', cr: '2', kind: 'humanoïde', theme: ['orc'] },
  { id: 'hobgobelin-guerrier', name: 'Hobgobelin guerrier', ac: 18, hp: 11, speed: '9 m', cr: '1/2', kind: 'humanoïde', theme: ['gobelin'] },
  { id: 'malandrin', name: 'Malandrin', ac: 16, hp: 27, speed: '9 m', cr: '1', kind: 'humanoïde', theme: ['gobelin'] },
  { id: 'gnoll-guerrier', name: 'Gnoll guerrier', ac: 15, hp: 22, speed: '9 m', cr: '1/2', kind: 'humanoïde', theme: ['gnoll'] },
  { id: 'ombre', name: 'Ombre', ac: 12, hp: 16, speed: '12 m', cr: '1/2', kind: 'mort-vivant', theme: ['mort-vivant'] },
  { id: 'spectre', name: 'Spectre', ac: 12, hp: 22, speed: '0 · vol 15 m', cr: '1', kind: 'mort-vivant', theme: ['mort-vivant'] },
  { id: 'goule', name: 'Goule', ac: 12, hp: 22, speed: '9 m', cr: '1', kind: 'mort-vivant', theme: ['mort-vivant'] },
  { id: 'necrophage', name: 'Nécrophage', ac: 13, hp: 36, speed: '9 m', cr: '2', kind: 'mort-vivant', theme: ['mort-vivant'] },
  { id: 'ours-hibou', name: 'Ours-hibou', ac: 13, hp: 59, speed: '12 m', cr: '3', kind: 'monstruosité' },
  { id: 'mimique', name: 'Mimique', ac: 12, hp: 58, speed: '4,50 m', cr: '2', kind: 'monstruosité' },

  // Deuxième complément : de quoi couvrir tout le niveau 5 (le Troll est la
  // seule menace solo du lot jusqu'ici) et varier encore le tirage
  // « Aléatoire » — deux gelées et un griffon, classiques de donjon.
  { id: 'troll', name: 'Troll', ac: 15, hp: 84, speed: '9 m', cr: '5', kind: 'géant' },
  { id: 'necromancien', name: 'Nécromancien', ac: 12, hp: 18, speed: '9 m', cr: '2', kind: 'humanoïde' },
  { id: 'gelee-ocre', name: 'Gelée ocre', ac: 8, hp: 52, speed: '4,50 m · escalade 4,50 m · nage 4,50 m', cr: '2', kind: 'vase' },
  { id: 'cube-gelatineux', name: 'Cube gélatineux', ac: 6, hp: 84, speed: '4,50 m', cr: '2', kind: 'vase' },
  { id: 'griffon', name: 'Griffon', ac: 12, hp: 59, speed: '9 m · vol 24 m', cr: '2', kind: 'monstruosité' },
];

// Caractéristiques utiles à Forme sauvage. Les scores mentaux restent ceux du
// Druide, mais les maîtrises de sauvegarde et de compétence de la bête peuvent
// fournir un meilleur bonus.
const BEAST_PHYSICAL: Record<string, Pick<CreatureTemplate, 'size' | 'abilities' | 'saveBonuses' | 'skillBonuses'>> = {
  ape: { size: 'M', abilities: { str: 16, dex: 14, con: 14 }, skillBonuses: { Athlétisme: 5, Perception: 3 } },
  badger: { size: 'TP', abilities: { str: 10, dex: 11, con: 16 }, skillBonuses: { Perception: 3 } },
  'black-bear': { size: 'M', abilities: { str: 15, dex: 12, con: 14 }, skillBonuses: { Perception: 5 } },
  boar: { size: 'M', abilities: { str: 13, dex: 11, con: 14 } },
  'brown-bear': { size: 'G', abilities: { str: 17, dex: 12, con: 15 }, skillBonuses: { Perception: 3 } },
  camel: { size: 'G', abilities: { str: 15, dex: 8, con: 17 }, saveBonuses: { con: 5 } },
  cat: { size: 'TP', abilities: { str: 3, dex: 15, con: 10 }, saveBonuses: { dex: 4 }, skillBonuses: { Perception: 3, Discrétion: 4 } },
  'constrictor-snake': { size: 'G', abilities: { str: 15, dex: 14, con: 12 }, skillBonuses: { Perception: 2, Discrétion: 4 } },
  crab: { size: 'TP', abilities: { str: 6, dex: 11, con: 12 }, skillBonuses: { Discrétion: 2 } },
  crocodile: { size: 'G', abilities: { str: 15, dex: 10, con: 13 }, saveBonuses: { con: 3 }, skillBonuses: { Discrétion: 2 } },
  'dire-wolf': { size: 'G', abilities: { str: 17, dex: 15, con: 15 }, skillBonuses: { Perception: 5, Discrétion: 4 } },
  'draft-horse': { size: 'G', abilities: { str: 18, dex: 10, con: 15 } },
  elk: { size: 'G', abilities: { str: 16, dex: 10, con: 11 }, skillBonuses: { Perception: 2 } },
  frog: { size: 'TP', abilities: { str: 1, dex: 13, con: 8 }, skillBonuses: { Perception: 1, Discrétion: 3 } },
  'giant-badger': { size: 'M', abilities: { str: 13, dex: 10, con: 17 }, skillBonuses: { Perception: 3 } },
  'giant-crab': { size: 'M', abilities: { str: 13, dex: 13, con: 11 }, skillBonuses: { Discrétion: 3 } },
  'giant-goat': { size: 'G', abilities: { str: 17, dex: 13, con: 12 }, saveBonuses: { str: 5 }, skillBonuses: { Perception: 3 } },
  'giant-seahorse': { size: 'G', abilities: { str: 15, dex: 12, con: 11 } },
  'giant-spider': { size: 'G', abilities: { str: 14, dex: 16, con: 12 }, skillBonuses: { Perception: 4, Discrétion: 7 } },
  'giant-weasel': { size: 'M', abilities: { str: 11, dex: 17, con: 10 }, skillBonuses: { Acrobaties: 5, Perception: 3, Discrétion: 5 } },
  goat: { size: 'M', abilities: { str: 11, dex: 10, con: 11 }, saveBonuses: { str: 2 }, skillBonuses: { Perception: 2 } },
  lion: { size: 'G', abilities: { str: 17, dex: 15, con: 11 }, skillBonuses: { Perception: 3, Discrétion: 4 } },
  lizard: { size: 'TP', abilities: { str: 2, dex: 11, con: 10 } },
  mastiff: { size: 'M', abilities: { str: 13, dex: 14, con: 12 }, saveBonuses: { wis: 3 }, skillBonuses: { Perception: 5 } },
  mule: { size: 'M', abilities: { str: 14, dex: 10, con: 13 } },
  octopus: { size: 'P', abilities: { str: 4, dex: 15, con: 11 }, skillBonuses: { Perception: 2, Discrétion: 6 } },
  panther: { size: 'M', abilities: { str: 14, dex: 15, con: 10 }, skillBonuses: { Perception: 4, Discrétion: 6 } },
  pony: { size: 'M', abilities: { str: 15, dex: 10, con: 13 }, saveBonuses: { str: 4 } },
  rat: { size: 'TP', abilities: { str: 2, dex: 11, con: 9 }, skillBonuses: { Perception: 2 } },
  'reef-shark': { size: 'M', abilities: { str: 14, dex: 15, con: 13 }, skillBonuses: { Perception: 2 } },
  'riding-horse': { size: 'G', abilities: { str: 16, dex: 13, con: 12 } },
  scorpion: { size: 'TP', abilities: { str: 2, dex: 11, con: 8 } },
  spider: { size: 'TP', abilities: { str: 2, dex: 14, con: 8 }, skillBonuses: { Discrétion: 4 } },
  tiger: { size: 'G', abilities: { str: 17, dex: 16, con: 14 }, skillBonuses: { Perception: 3, Discrétion: 7 } },
  'venomous-snake': { size: 'TP', abilities: { str: 2, dex: 15, con: 11 } },
  warhorse: { size: 'G', abilities: { str: 18, dex: 12, con: 13 }, saveBonuses: { con: 3, wis: 3 } },
  weasel: { size: 'TP', abilities: { str: 3, dex: 16, con: 8 }, skillBonuses: { Acrobaties: 5, Perception: 3, Discrétion: 5 } },
  wolf: { size: 'M', abilities: { str: 14, dex: 15, con: 12 }, skillBonuses: { Perception: 5, Discrétion: 4 } },
};

// Caractéristiques des adversaires (humanoïdes, morts-vivants, monstrosités…) :
// contrairement à une bête de Forme sauvage, ils portent leurs six scores —
// une compétence ou une DD d'incantation peut réclamer l'Intelligence, la
// Sagesse ou le Charisme, qu'aucune bête de la table ci-dessus n'a besoin de
// porter. Valeurs alignées sur les profils publiés quand ils existent ;
// original et prudent sinon, comme le reste de cet index.
const MONSTER_ABILITIES: Record<string, Pick<CreatureTemplate, 'abilities' | 'saveBonuses' | 'skillBonuses'>> = {
  imp: { abilities: { str: 6, dex: 17, con: 13, int: 11, wis: 12, cha: 14 }, skillBonuses: { Tromperie: 4, Intuition: 3, Persuasion: 4, Discrétion: 5 } },
  pseudodragon: { abilities: { str: 6, dex: 15, con: 13, int: 10, wis: 13, cha: 10 }, skillBonuses: { Perception: 5, Discrétion: 3 } },
  quasit: { abilities: { str: 5, dex: 17, con: 13, int: 11, wis: 12, cha: 14 }, skillBonuses: { Discrétion: 5 } },
  skeleton: { abilities: { str: 10, dex: 14, con: 15, int: 6, wis: 8, cha: 5 } },
  'slaad-tadpole': { abilities: { str: 8, dex: 15, con: 11, int: 2, wis: 10, cha: 3 } },
  'sphinx-of-wonder': { abilities: { str: 10, dex: 15, con: 13, int: 13, wis: 13, cha: 11 }, skillBonuses: { Perception: 3 } },
  sprite: { abilities: { str: 3, dex: 18, con: 10, int: 14, wis: 13, cha: 11 }, skillBonuses: { Perception: 3, Discrétion: 8 } },
  zombie: { abilities: { str: 13, dex: 6, con: 16, int: 3, wis: 6, cha: 5 } },

  'gobelin-larbin': { abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 }, skillBonuses: { Discrétion: 6 } },
  'gobelin-guerrier': { abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 }, skillBonuses: { Discrétion: 6 } },
  'gobelin-chef': { abilities: { str: 10, dex: 14, con: 10, int: 10, wis: 8, cha: 10 }, skillBonuses: { Discrétion: 5 } },
  'gobelin-envouteur': { abilities: { str: 8, dex: 14, con: 10, int: 14, wis: 10, cha: 10 }, skillBonuses: { Escamotage: 5, Discrétion: 7 } },
  bandit: { abilities: { str: 11, dex: 12, con: 12, int: 10, wis: 10, cha: 10 } },
  'bandit-capitaine': { abilities: { str: 15, dex: 16, con: 14, int: 14, wis: 11, cha: 14 }, skillBonuses: { Athlétisme: 4, Tromperie: 4 } },
  'kobold-guerrier': { abilities: { str: 7, dex: 15, con: 9, int: 8, wis: 7, cha: 8 } },
  'kobold-aile': { abilities: { str: 8, dex: 16, con: 10, int: 8, wis: 9, cha: 8 } },
  ogre: { abilities: { str: 19, dex: 8, con: 16, int: 5, wis: 7, cha: 7 } },
  ogrillon: { abilities: { str: 17, dex: 8, con: 15, int: 6, wis: 8, cha: 7 } },
  'ogre-zombie': { abilities: { str: 19, dex: 6, con: 18, int: 3, wis: 6, cha: 5 } },
  worg: { abilities: { str: 16, dex: 13, con: 13, int: 7, wis: 11, cha: 8 }, skillBonuses: { Perception: 4 } },
  harpie: { abilities: { str: 12, dex: 13, con: 12, int: 7, wis: 10, cha: 13 } },

  'orc-guerrier': { abilities: { str: 16, dex: 12, con: 16, int: 7, wis: 11, cha: 10 } },
  'orc-chef-de-guerre': { abilities: { str: 18, dex: 12, con: 18, int: 9, wis: 12, cha: 14 }, skillBonuses: { Intimidation: 4 } },
  'hobgobelin-guerrier': { abilities: { str: 13, dex: 12, con: 12, int: 10, wis: 10, cha: 9 } },
  malandrin: { abilities: { str: 15, dex: 14, con: 13, int: 8, wis: 11, cha: 9 }, skillBonuses: { Discrétion: 6, Survie: 2 } },
  'gnoll-guerrier': { abilities: { str: 14, dex: 12, con: 11, int: 6, wis: 10, cha: 7 } },
  ombre: { abilities: { str: 6, dex: 14, con: 13, int: 6, wis: 10, cha: 8 }, skillBonuses: { Discrétion: 4 } },
  spectre: { abilities: { str: 1, dex: 14, con: 11, int: 10, wis: 10, cha: 11 } },
  goule: { abilities: { str: 13, dex: 15, con: 10, int: 7, wis: 10, cha: 6 } },
  necrophage: { abilities: { str: 16, dex: 17, con: 10, int: 11, wis: 10, cha: 8 }, skillBonuses: { Perception: 2 } },
  'ours-hibou': { abilities: { str: 20, dex: 12, con: 17, int: 3, wis: 12, cha: 7 }, skillBonuses: { Perception: 3 } },
  mimique: { abilities: { str: 17, dex: 12, con: 15, int: 5, wis: 13, cha: 8 }, skillBonuses: { Discrétion: 5 } },

  troll: { abilities: { str: 18, dex: 13, con: 20, int: 7, wis: 9, cha: 7 }, skillBonuses: { Perception: 2 } },
  necromancien: { abilities: { str: 9, dex: 13, con: 12, int: 16, wis: 11, cha: 11 }, skillBonuses: { Arcanes: 5, Histoire: 5 } },
  'gelee-ocre': { abilities: { str: 15, dex: 6, con: 14, int: 2, wis: 6, cha: 1 } },
  'cube-gelatineux': { abilities: { str: 14, dex: 3, con: 20, int: 1, wis: 6, cha: 1 } },
  griffon: { abilities: { str: 18, dex: 15, con: 16, int: 2, wis: 13, cha: 8 }, skillBonuses: { Perception: 5 } },
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

  // La Robustesse des morts-vivants (Undead Fortitude) revient sur tous les
  // morts-vivants sans magie de lanceur — dont le squelette et le zombie déjà
  // présents dans l'index d'origine, jamais complétés jusqu'ici.
  zombie: { senses: 'Vision dans le noir 18 m · perception passive 8', traits: ['Immunité au poison, à Empoisonné et à l’Épuisement', 'Robustesse des morts-vivants : à 0 PV, sauvegarde de Constitution DD 5 + dégâts subis (sauf dégâts radiants ou critique) — succès : tombe à 1 PV au lieu de 0.'], actions: [
    { name: 'Gifle', kind: 'attack', toHit: 3, reach: '1,50 m', damage: '1d8+1', damageType: 'contondants' },
  ] },

  'gobelin-larbin': { senses: 'Vision dans le noir 18 m · perception passive 9', actions: [
    { name: 'Dague', kind: 'attack', toHit: 4, reach: '1,50 m ou 6/18 m', damage: '1d4+2', damageType: 'perforants' },
    { name: 'Fuite preste', kind: 'utility', detail: 'Action bonus : Se dégager ou Se cacher.' },
  ] },
  'gobelin-guerrier': { senses: 'Vision dans le noir 18 m · perception passive 9', actions: [
    { name: 'Cimeterre', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '1d6+2', damageType: 'tranchants', detail: '+1d4 tranchants supplémentaires si le jet d’attaque avait l’avantage.' },
    { name: 'Arc court', kind: 'attack', toHit: 4, reach: '24/96 m', damage: '1d6+2', damageType: 'perforants', detail: '+1d4 perforants supplémentaires si le jet d’attaque avait l’avantage.' },
    { name: 'Fuite preste', kind: 'utility', detail: 'Action bonus : Se dégager ou Se cacher.' },
  ] },
  'gobelin-chef': { senses: 'Vision dans le noir 18 m · perception passive 9', actions: [
    { name: 'Multiattaque', kind: 'utility', attacks: 2, detail: 'Deux attaques, Cimeterre ou Arc court en combinaison libre.' },
    { name: 'Cimeterre', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '1d6+2', damageType: 'tranchants', detail: '+1d4 tranchants supplémentaires si le jet d’attaque avait l’avantage.' },
    { name: 'Arc court', kind: 'attack', toHit: 4, reach: '24/96 m', damage: '1d6+2', damageType: 'perforants', detail: '+1d4 perforants supplémentaires si le jet d’attaque avait l’avantage.' },
    { name: 'Fuite preste', kind: 'utility', detail: 'Action bonus : Se dégager ou Se cacher.' },
    { name: 'Attaque déviée', kind: 'utility', detail: 'Réaction, quand une créature visible fait un jet d’attaque contre le gobelin : il choisit un allié P ou M à 1,50 m, ils échangent leur place et l’allié devient la cible.' },
  ] },
  'gobelin-envouteur': { senses: 'Vision dans le noir 18 m · perception passive 10', actions: [
    { name: 'Multiattaque', kind: 'utility', attacks: 2, detail: 'Deux attaques de Bâton maléfique ; l’une peut être remplacée par Incantation.' },
    { name: 'Bâton maléfique', kind: 'attack', toHit: 5, reach: '1,50 m ou 18 m', damage: '2d8+3', damageType: 'psychiques' },
    { name: 'Incantation', kind: 'utility', detail: 'DD 13, Intelligence. À volonté : Illusion mineure. 1/jour chacun : Cécité/Surdité, Feu de fée, Graisse.' },
    { name: 'Malédiction', kind: 'utility', detail: 'Réaction, quand une créature visible touche le gobelin par une attaque : sauvegarde de Sagesse DD 13 pour cette créature — échec : l’attaque rate au lieu de toucher.' },
  ] },

  bandit: { senses: 'Perception passive 10', actions: [
    { name: 'Cimeterre', kind: 'attack', toHit: 3, reach: '1,50 m', damage: '1d6+1', damageType: 'tranchants' },
    { name: 'Arbalète légère', kind: 'attack', toHit: 3, reach: '24/96 m', damage: '1d8+1', damageType: 'perforants' },
  ] },
  'bandit-capitaine': { senses: 'Perception passive 10', actions: [
    { name: 'Multiattaque', kind: 'utility', attacks: 2, detail: 'Deux attaques, Cimeterre ou Pistolet en combinaison libre.' },
    { name: 'Cimeterre', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d6+3', damageType: 'tranchants' },
    { name: 'Pistolet', kind: 'attack', toHit: 5, reach: '9/27 m', damage: '1d10+3', damageType: 'perforants' },
    { name: 'Parade', kind: 'utility', detail: 'Réaction, quand touché par une attaque de mêlée en tenant une arme : +2 à la CA contre cette attaque.' },
  ] },

  'kobold-guerrier': { senses: 'Vision dans le noir 18 m · perception passive 8', traits: ['Tactique de meute : avantage aux attaques si un allié non Incapable d’agir est à 1,50 m de la cible.', 'Sensibilité à la lumière du soleil : désavantage aux tests et jets d’attaque en plein soleil.'], actions: [
    { name: 'Dague', kind: 'attack', toHit: 4, reach: '1,50 m ou 6/18 m', damage: '1d4+2', damageType: 'perforants' },
  ] },
  'kobold-aile': { senses: 'Vision dans le noir 18 m · perception passive 8', traits: ['Tactique de meute : avantage aux attaques si un allié non Incapable d’agir est à 1,50 m de la cible.', 'Sensibilité à la lumière du soleil : désavantage aux tests et jets d’attaque en plein soleil.'], actions: [
    { name: 'Lame dents-de-dragon', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d6+3', damageType: 'perforants' },
    { name: 'Crachat chromatique', kind: 'attack', toHit: 5, reach: '9 m', damage: '1d6+3', damageType: 'au choix : acide, froid, feu, foudre ou poison' },
  ] },

  ogre: { senses: 'Vision dans le noir 18 m · perception passive 8', actions: [
    { name: 'Massue', kind: 'attack', toHit: 6, reach: '1,50 m', damage: '2d8+4', damageType: 'contondants' },
    { name: 'Javeline', kind: 'attack', toHit: 6, reach: '1,50 m ou 9/36 m', damage: '2d6+4', damageType: 'perforants' },
  ] },
  ogrillon: { senses: 'Vision dans le noir 18 m · perception passive 9', actions: [
    { name: 'Hache d’armes', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d8+3', damageType: 'tranchants' },
    { name: 'Javeline', kind: 'attack', toHit: 5, reach: '1,50 m ou 9/36 m', damage: '1d6+3', damageType: 'perforants' },
  ] },
  'ogre-zombie': { senses: 'Vision dans le noir 18 m · perception passive 8', traits: ['Immunité au poison, à Empoisonné et à l’Épuisement', 'Robustesse des morts-vivants : à 0 PV, sauvegarde de Constitution DD 5 + dégâts subis (sauf dégâts radiants ou critique) — succès : tombe à 1 PV au lieu de 0.'], actions: [
    { name: 'Gifle', kind: 'attack', toHit: 6, reach: '1,50 m', damage: '2d8+4', damageType: 'contondants' },
  ] },

  worg: { senses: 'Vision dans le noir 18 m · perception passive 14', actions: [
    { name: 'Morsure', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d8+3', damageType: 'perforants', detail: 'La prochaine attaque contre la cible avant le début du prochain tour du worg a l’avantage.' },
  ] },

  harpie: { senses: 'Perception passive 10', actions: [
    { name: 'Griffe', kind: 'attack', toHit: 3, reach: '1,50 m', damage: '2d4+1', damageType: 'tranchants' },
    { name: 'Chant enjôleur', kind: 'save', save: 'SAG DD 11', reach: '90 m', detail: 'Toute créature Humanoïde ou Géante entendant le chant — Charmée tant qu’il dure (nouvelle sauvegarde à la fin de chaque tour), et Incapable d’agir tant qu’elle l’est ; se rapproche de la harpie par le chemin le plus direct, sans éviter les attaques d’opportunité mais en refaisant le jet avant un terrain dangereux ou en cas de dégâts d’une autre source. Dure jusqu’à la fin de la concentration de la harpie. Succès : immunisée à ce chant pendant 24 h.' },
  ] },

  'orc-guerrier': { senses: 'Vision dans le noir 18 m · perception passive 10', traits: ['Agressivité : action bonus pour se déplacer vers un ennemi visible.'], actions: [
    { name: 'Hache d’armes', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d12+3', damageType: 'tranchants' },
    { name: 'Javeline', kind: 'attack', toHit: 5, reach: '1,50 m ou 9/36 m', damage: '1d6+3', damageType: 'perforants' },
  ] },
  'orc-chef-de-guerre': { senses: 'Vision dans le noir 18 m · perception passive 10', traits: ['Agressivité : action bonus pour se déplacer vers un ennemi visible.'], actions: [
    { name: 'Multiattaque', kind: 'utility', attacks: 2, sequence: ['Hache d’armes', 'Hache d’armes'], detail: 'Deux attaques de Hache d’armes.' },
    { name: 'Hache d’armes', kind: 'attack', toHit: 6, reach: '1,50 m', damage: '1d12+4', damageType: 'tranchants' },
    { name: 'Cri de guerre', kind: 'utility', detail: 'Action bonus, 1/jour : chaque orc allié à 9 m qui l’entend a l’avantage à sa prochaine attaque avant le début du prochain tour du chef.' },
  ] },

  'hobgobelin-guerrier': { senses: 'Vision dans le noir 18 m · perception passive 10', traits: ['Tactique de meute : avantage aux attaques si un allié non Incapable d’agir est à 1,50 m de la cible.'], actions: [
    { name: 'Épée longue', kind: 'attack', toHit: 3, reach: '1,50 m', damage: '1d8+1', damageType: 'tranchants', detail: 'À deux mains : 1d10+1.' },
    { name: 'Arc long', kind: 'attack', toHit: 3, reach: '45/180 m', damage: '1d8+1', damageType: 'perforants' },
  ] },
  malandrin: { senses: 'Vision dans le noir 18 m · perception passive 10', actions: [
    { name: 'Fléau d’armes', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '2d8+2', damageType: 'perforants', detail: 'Avec avantage (surprise) : +2d6 supplémentaires.' },
    { name: 'Javeline', kind: 'attack', toHit: 4, reach: '1,50 m ou 9/36 m', damage: '2d6+2', damageType: 'perforants' },
  ] },

  'gnoll-guerrier': { senses: 'Vision dans le noir 18 m · perception passive 10', actions: [
    { name: 'Morsure', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '1d4+2', damageType: 'perforants' },
    { name: 'Lance', kind: 'attack', toHit: 4, reach: '1,50 m ou 6/18 m', damage: '1d6+2', damageType: 'perforants', detail: 'À deux mains : 1d8+2.' },
    { name: 'Arc long', kind: 'attack', toHit: 3, reach: '45/180 m', damage: '1d8+1', damageType: 'perforants' },
  ] },

  ombre: { senses: 'Vision dans le noir 12 m · perception passive 10', traits: [
    'Amorphe : peut se faufiler dans un espace de 2,5 cm de large sans se serrer.',
    'Résistance aux dégâts non magiques, sauf radiants ; vulnérabilité aux dégâts radiants.',
    'Faiblesse à la lumière du soleil : désavantage aux jets d’attaque en plein soleil.',
  ], actions: [
    { name: 'Griffe d’ombre', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '2d6', damageType: 'nécrotiques', detail: 'La cible touchée : Force réduite de 1d4 (magique) jusqu’à un repos court ou long ; à Force 0, elle meurt et se relève en ombre.' },
  ] },
  spectre: { senses: 'Vision dans le noir 18 m · perception passive 10', traits: [
    'Incorporel : peut traverser objets et créatures comme un terrain difficile ; 1d10 dégâts de force s’il termine son tour dans un objet.',
    'Résistance aux dégâts contondants, perforants et tranchants non magiques.',
    'Immunité au poison, à Empoisonné, à À terre, à Agrippé, à Entravé et à Paralysé.',
  ], actions: [
    { name: 'Vie drainante', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '3d6', damageType: 'nécrotiques', detail: 'Le maximum de PV de la cible diminue d’autant jusqu’à un repos long ; elle meurt si son maximum tombe à 0.' },
  ] },
  goule: { senses: 'Vision dans le noir 18 m · perception passive 10', traits: ['Immunité au poison et à Empoisonné.'], actions: [
    { name: 'Griffes', kind: 'attack', toHit: 2, reach: '1,50 m', damage: '2d4', damageType: 'tranchants' },
    { name: 'Morsure', kind: 'attack', toHit: 2, reach: '1,50 m', damage: '2d6', damageType: 'perforants', detail: 'Cible non Élfe ni Morte-vivante : sauvegarde de Constitution DD 10, échec — Paralysée 1 minute (nouveau jet à la fin de chaque tour).' },
  ] },
  necrophage: { senses: 'Vision dans le noir 18 m · perception passive 10', traits: [
    'Puanteur : toute créature non immunisée au poison qui commence son tour à 1,50 m fait une sauvegarde de Constitution DD 10, échec — Nauséeuse jusqu’au début de son prochain tour.',
    'Immunité au poison et à Empoisonné.',
  ], actions: [
    { name: 'Griffes', kind: 'attack', toHit: 3, reach: '1,50 m', damage: '2d6+2', damageType: 'tranchants', detail: 'Cible non Élfe ni Morte-vivante : sauvegarde de Constitution DD 10, échec — Paralysée 1 minute (nouveau jet à la fin de chaque tour).' },
  ] },

  'ours-hibou': { senses: 'Vision dans le noir 18 m · perception passive 13', actions: [
    { name: 'Multiattaque', kind: 'utility', attacks: 2, sequence: ['Bec', 'Griffes'], detail: 'Un Bec et une attaque de Griffes.' },
    { name: 'Bec', kind: 'attack', toHit: 7, reach: '1,50 m', damage: '1d10+5', damageType: 'perforants' },
    { name: 'Griffes', kind: 'attack', toHit: 7, reach: '1,50 m', damage: '2d8+5', damageType: 'tranchants' },
  ] },
  mimique: { senses: 'Vision dans le noir 18 m · perception passive 12', traits: [
    'Adhésif : une créature touchée par Pseudopode est Agrippée (fuite DD 13) ; se libérer en infligeant 5 dégâts tranchants à la mimique la détache aussi.',
    'Métamorphe : peut prendre l’apparence d’un objet de taille M ou moins, ou reprendre sa forme neutre ; désavantage à la Discrétion sous sa forme neutre.',
    'Faux-semblant : avantage à l’initiative si elle n’a pas agi sous sa forme d’objet.',
  ], actions: [
    { name: 'Pseudopode', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d8+3', damageType: 'contondants' },
    { name: 'Morsure', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d8+3 perforants + 1d8 acides', damageType: 'perforants et acides' },
  ] },

  troll: { senses: 'Vision dans le noir 18 m · perception passive 12', traits: [
    'Régénération : regagne 10 PV au début de son tour, sauf s’il a subi des dégâts de feu ou d’acide depuis son dernier tour.',
  ], actions: [
    { name: 'Multiattaque', kind: 'utility', attacks: 3, sequence: ['Morsure', 'Griffe', 'Griffe'], detail: 'Une Morsure et deux Griffes.' },
    { name: 'Morsure', kind: 'attack', toHit: 9, reach: '1,50 m', damage: '1d6+4', damageType: 'perforants' },
    { name: 'Griffe', kind: 'attack', toHit: 9, reach: '1,50 m', damage: '2d6+4', damageType: 'tranchants' },
  ] },
  necromancien: { senses: 'Perception passive 10', traits: ['Incantation : DD 13, Intelligence.'], actions: [
    { name: 'Dague', kind: 'attack', toHit: 3, reach: '1,50 m ou 6/18 m', damage: '1d4+1', damageType: 'perforants' },
    { name: 'Rayon nécrotique', kind: 'attack', toHit: 5, reach: '36 m', damage: '2d8', damageType: 'nécrotiques' },
    { name: 'Serviteur relevé (1/jour)', kind: 'utility', detail: 'Anime un cadavre à 3 m en Squelette ou Zombie sous son contrôle, pour 1 heure.' },
  ] },
  'gelee-ocre': { senses: 'Vision aveugle 18 m · perception passive 8', traits: [
    'Amorphe : peut se faufiler dans un espace de 2,5 cm de large sans se serrer.',
    'Résistance aux dégâts acides.',
    'Immunité au poison, à Empoisonné, à Étourdi et à À terre.',
  ], actions: [
    { name: 'Pseudopode', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '2d6+2 contondants + 3d6 acides', damageType: 'contondants et acides', detail: 'Une arme non magique en métal qui la touche en mêlée subit 1d6 dégâts de corrosion.' },
  ] },
  'cube-gelatineux': { senses: 'Vision aveugle 18 m · perception passive 8', traits: [
    'Transparent : sauvegarde de Sagesse (Perception) DD 15 pour la repérer à distance ; une créature qui ne l’a pas repérée et la heurte ou entre dans son espace est touchée automatiquement par Pseudopode et engloutie si possible.',
    'Amorphe : peut se faufiler dans un espace de 2,5 cm de large sans se serrer.',
    'Immunité au poison, à Empoisonné, à Étourdi et à À terre.',
  ], actions: [
    { name: 'Pseudopode', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '3d6', damageType: 'acides', detail: 'Cible M ou moins : Engloutie (occupe l’espace du cube, aveuglée, retenue, ne respire pas, subit les mêmes dégâts au début de chaque tour du cube ; libérée si le cube meurt ou se déplace hors d’elle).' },
  ] },
  griffon: { senses: 'Perception passive 15', actions: [
    { name: 'Multiattaque', kind: 'utility', attacks: 2, sequence: ['Bec', 'Griffes'], detail: 'Un Bec et une attaque de Griffes.' },
    { name: 'Bec', kind: 'attack', toHit: 6, reach: '1,50 m', damage: '1d8+4', damageType: 'perforants' },
    { name: 'Griffes', kind: 'attack', toHit: 6, reach: '1,50 m', damage: '2d6+4', damageType: 'tranchants' },
  ] },
};

export const PHB_CREATURES: CreatureTemplate[] = RAW_PHB_CREATURES.map((creature) => ({
  ...creature,
  ...(BEAST_PHYSICAL[creature.id] || {}),
  ...(MONSTER_ABILITIES[creature.id] || {}),
  ...(BEAST_COMBAT[creature.id] || {}),
}));
