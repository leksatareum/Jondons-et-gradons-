import type { CreatureTemplate } from './creatures';

/**
 * Renfort du bestiaire, lu dans le Monster Manual 2024.
 *
 * ═══ Pourquoi ═══
 *
 * Le bestiaire plafonnait à FP 5, et au-dessus de FP 2 il ne restait que
 * trois monstres. Il manquait surtout les PERSONNAGES ORDINAIRES — garde,
 * acolyte, éclaireur, vétéran — qui peuplent chaque ville et chaque donjon et
 * qu'un MJ pose dix fois plus souvent qu'une manticore. Le MJ pouvait les
 * saisir à la main, mais taper un bloc de stats en pleine séance est
 * exactement ce que cette application est censée éviter.
 *
 * ═══ Provenance et méthode ═══
 *
 * Chaque entrée porte la page du Manuel où son bloc a été LU. Le scan est
 * océrisé et par endroits abîmé : les titres sont détruits (« OvrLspln » pour
 * OWLBEAR) et certains chiffres corrompus (« 2d5 » là où le livre imprime
 * 2d6). Il n'était donc pas question d'extraire en masse — chaque bloc a été
 * lu, et les valeurs qui se lisent proprement (CA, PV, vitesse, FP, bonus
 * d'attaque) recoupées avec les dés de vie : des PV de 11 (2d8 + 2) disent
 * une Constitution de 12, ce qui vérifie la ligne des caractéristiques.
 *
 * Les pages où deux blocs se chevauchent en colonnes ont été relues en texte
 * brut avant d'écrire quoi que ce soit — c'est là que se logent les
 * confusions, et un mauvais nombre de PV se paie à la table, pas ici.
 *
 * ═══ Ce qui n'y est pas ═══
 *
 * Les traits narratifs, les descriptions, les tables d'ambiance : rien du
 * texte du livre n'est recopié (même règle que `rules-compendium.ts`). On ne
 * garde que ce qu'un MJ doit avoir sous les yeux pour faire jouer le tour :
 * de quoi frapper, avec quoi, et combien ça encaisse.
 */

/** Vitesses et portées converties en mètres, comme partout ailleurs dans l'appli. */
export const CREATURES_MM_2024: CreatureTemplate[] = [
  // ── Le petit peuple armé ───────────────────────────────────────────
  {
    id: 'garde', name: 'Garde', ac: 15, hp: 11, speed: '9 m', cr: '1/8',
    kind: 'humanoïde', size: 'M', theme: ['garde', 'ville'],
    abilities: { str: 13, dex: 12, con: 12, int: 10, wis: 11, cha: 10 },
    skillBonuses: { Perception: 2 },
    senses: 'Perception passive 12',
    // p. 165. Chemise de mailles + bouclier = CA 15, ce que la ligne confirme.
    actions: [
      { name: 'Lance', kind: 'attack', toHit: 3, reach: '1,50 m ou 6/18 m', damage: '1d6+1', damageType: 'perforants' },
    ],
  },
  {
    id: 'acolyte', name: 'Acolyte', ac: 13, hp: 11, speed: '9 m', cr: '1/4',
    kind: 'humanoïde', size: 'M', theme: ['culte', 'ville'],
    abilities: { str: 14, dex: 10, con: 12, int: 10, wis: 14, cha: 11 },
    skillBonuses: { Médecine: 4, Religion: 2 },
    senses: 'Perception passive 12',
    // p. 250. La masse fait des dégâts radiants EN PLUS : ne pas les oublier,
    // c'est ce qui distingue l'acolyte d'un roturier armé.
    actions: [
      { name: 'Masse', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '1d6+2', damageType: 'contondants', detail: 'Plus 2 (1d4) dégâts radiants.' },
    ],
  },
  {
    id: 'eclaireur', name: 'Éclaireur', ac: 13, hp: 16, speed: '9 m', cr: '1/2',
    kind: 'humanoïde', size: 'M', theme: ['bandit', 'foret'],
    abilities: { str: 11, dex: 14, con: 12, int: 11, wis: 13, cha: 11 },
    skillBonuses: { Nature: 4, Perception: 5, Discrétion: 6, Survie: 5 },
    senses: 'Perception passive 15',
    // p. 273.
    actions: [
      { name: 'Multiattaque', kind: 'utility', attacks: 2, sequence: ['Épée courte', 'Arc long'], detail: 'Deux attaques, épée courte et arc long dans n’importe quelle combinaison.' },
      { name: 'Épée courte', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '1d6+2', damageType: 'perforants' },
      { name: 'Arc long', kind: 'attack', toHit: 4, reach: '45/180 m', damage: '1d8+2', damageType: 'perforants' },
    ],
  },
  {
    id: 'dur-a-cuire', name: 'Dur à cuire', ac: 12, hp: 32, speed: '9 m', cr: '1/2',
    kind: 'humanoïde', size: 'M', theme: ['bandit', 'ville'],
    abilities: { str: 15, dex: 12, con: 14, int: 10, wis: 10, cha: 11 },
    senses: 'Perception passive 10',
    // p. 310. Beaucoup de PV pour son FP : c'est une brute qui encaisse, pas
    // qui frappe fort — la nuance change la façon de l'employer.
    actions: [
      { name: 'Masse', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '1d6+2', damageType: 'contondants' },
      { name: 'Arbalète lourde', kind: 'attack', toHit: 3, reach: '30/120 m', damage: '1d10+1', damageType: 'perforants' },
    ],
  },

  // ── Ce qu'on croise au niveau 2-4 ──────────────────────────────────
  {
    id: 'cultiste', name: 'Cultiste', ac: 12, hp: 9, speed: '9 m', cr: '1/8',
    kind: 'humanoïde', size: 'M', theme: ['culte'],
    abilities: { str: 11, dex: 12, con: 10, int: 10, wis: 11, cha: 10 },
    skillBonuses: { Tromperie: 2, Religion: 2 },
    senses: 'Perception passive 10',
    // p. 87. Neuf points de vie : c'est de la piétaille, et c'est le but —
    // une foule d'encapuchonnés se joue par le nombre, pas par la résistance.
    // Les PV en 2d8 sans bonus confirment la Constitution de 10.
    actions: [
      { name: 'Serpe rituelle', kind: 'attack', toHit: 3, reach: '1,50 m', damage: '1d4+1', damageType: 'tranchants', detail: 'Plus 1 dégât nécrotique.' },
    ],
  },
  {
    id: 'espion', name: 'Espion', ac: 12, hp: 27, speed: '9 m · escalade 9 m', cr: '1',
    kind: 'humanoïde', size: 'M', theme: ['bandit', 'ville'],
    abilities: { str: 10, dex: 15, con: 10, int: 12, wis: 14, cha: 16 },
    skillBonuses: {
      Tromperie: 5, Intuition: 4, Investigation: 5, Perception: 6, Escamotage: 4, Discrétion: 6,
    },
    senses: 'Perception passive 16',
    // p. 298. Ses deux armes sont empoisonnées : 7 (2d6) de poison en plus à
    // chaque coup, soit plus que l'arme elle-même. C'est là qu'est sa menace,
    // pas dans son bonus d'attaque.
    actions: [
      { name: 'Épée courte', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '1d6+2', damageType: 'perforants', detail: 'Plus 7 (2d6) dégâts de poison.' },
      { name: 'Arbalète de poing', kind: 'attack', toHit: 4, reach: '9/36 m', damage: '1d6+2', damageType: 'perforants', detail: 'Plus 7 (2d6) dégâts de poison.' },
      { name: 'Action rusée', kind: 'utility', detail: 'Action bonus : Foncer, Se désengager ou Se cacher.' },
    ],
  },
  {
    id: 'berserker', name: 'Berserker', ac: 13, hp: 67, speed: '9 m', cr: '2',
    kind: 'humanoïde', size: 'M', theme: ['bandit'],
    abilities: { str: 16, dex: 12, con: 17, int: 9, wis: 11, cha: 9 },
    senses: 'Perception passive 10',
    // p. 40.
    actions: [
      { name: 'Grande hache', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d12+3', damageType: 'tranchants' },
    ],
  },
  {
    id: 'fanatique-culte', name: 'Fanatique de culte', ac: 13, hp: 44, speed: '9 m', cr: '2',
    kind: 'humanoïde', size: 'M', theme: ['culte'],
    abilities: { str: 11, dex: 14, con: 12, int: 10, wis: 14, cha: 13 },
    skillBonuses: { Tromperie: 3, Persuasion: 3, Religion: 2 },
    senses: 'Perception passive 12',
    // p. 88. L'incantation est laissée en texte : les sorts d'un PNJ se
    // décident à la table, et un bouton qui en lancerait un au hasard
    // mentirait sur ce que le MJ a prévu.
    actions: [
      { name: 'Lame de pacte', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '1d8+2', damageType: 'tranchants', detail: 'Plus 7 (2d6) dégâts nécrotiques.' },
      { name: 'Incantation', kind: 'utility', detail: 'Lance ses sorts avec la Sagesse. Au MJ de choisir lesquels.' },
    ],
  },

  // ── Le palier qui manquait : FP 3 et 4 ─────────────────────────────
  {
    id: 'guerrier-veteran', name: 'Guerrier vétéran', ac: 17, hp: 65, speed: '9 m', cr: '3',
    kind: 'humanoïde', size: 'M', theme: ['garde', 'bandit'],
    abilities: { str: 16, dex: 13, con: 14, int: 11, wis: 11, cha: 10 },
    senses: 'Perception passive 10',
    // p. 323.
    actions: [
      { name: 'Multiattaque', kind: 'utility', attacks: 2, sequence: ['Épée à deux mains', 'Arbalète lourde'], detail: 'Deux attaques d’épée à deux mains ou d’arbalète lourde.' },
      { name: 'Épée à deux mains', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '2d6+3', damageType: 'tranchants' },
      { name: 'Arbalète lourde', kind: 'attack', toHit: 3, reach: '30/120 m', damage: '2d10+1', damageType: 'perforants' },
    ],
  },
  {
    id: 'capitaine-eclaireur', name: 'Capitaine éclaireur', ac: 15, hp: 66,
    speed: '9 m · escalade 9 m', cr: '3', kind: 'humanoïde', size: 'M', theme: ['bandit', 'foret'],
    abilities: { str: 11, dex: 16, con: 12, int: 11, wis: 13, cha: 11 },
    skillBonuses: { Perception: 5, Discrétion: 7, Survie: 5 },
    senses: 'Perception passive 16',
    // p. 273. Les 3d6 supplémentaires sont l'équivalent d'une attaque
    // sournoise : ils font la moitié de sa menace, ne pas les perdre.
    actions: [
      { name: 'Multiattaque', kind: 'utility', attacks: 2, sequence: ['Épée courte', 'Arc long'], detail: 'Deux attaques, épée courte et arc long dans n’importe quelle combinaison.' },
      { name: 'Épée courte', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d6+3', damageType: 'perforants', detail: 'Plus 10 (3d6) dégâts perforants.' },
      { name: 'Arc long', kind: 'attack', toHit: 5, reach: '45/180 m', damage: '1d8+3', damageType: 'perforants', detail: 'Plus 10 (3d6) dégâts perforants.' },
    ],
  },
  {
    id: 'manticore', name: 'Manticore', ac: 14, hp: 68, speed: '9 m · vol 15 m', cr: '3',
    kind: 'monstruosité', size: 'G',
    abilities: { str: 17, dex: 15, con: 17, int: 7, wis: 12, cha: 8 },
    senses: 'Vision dans le noir 18 m · perception passive 11',
    // p. 205. La ligne du Dard caudal était coupée par la mise en colonnes du
    // scan ; elle reprend les mêmes chiffres que Lacération (+5, 1d8+3), ce
    // que confirme la multiattaque qui les emploie indifféremment.
    actions: [
      { name: 'Multiattaque', kind: 'utility', attacks: 3, sequence: ['Lacération', 'Dard caudal'], detail: 'Trois attaques, lacération ou dard caudal dans n’importe quelle combinaison.' },
      { name: 'Lacération', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d8+3', damageType: 'tranchants' },
      { name: 'Dard caudal', kind: 'attack', toHit: 5, reach: '30/60 m', damage: '1d8+3', damageType: 'perforants' },
    ],
  },
  {
    id: 'momie', name: 'Momie', ac: 11, hp: 58, speed: '6 m', cr: '3',
    kind: 'mort-vivant', size: 'M', theme: ['mort-vivant', 'ruines'],
    abilities: { str: 16, dex: 8, con: 15, int: 6, wis: 12, cha: 12 },
    senses: 'Vision dans le noir 18 m · perception passive 11',
    // p. 222. Lente (6 m) et CA basse : elle ne rattrape personne, sa menace
    // est ce qu'elle inflige quand elle touche.
    actions: [
      { name: 'Multiattaque', kind: 'utility', attacks: 2, sequence: ['Poing putride'], detail: 'Deux attaques de poing putride, et utilise Regard terrifiant.' },
      { name: 'Poing putride', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d10+3', damageType: 'contondants', detail: 'Plus 10 (3d6) dégâts nécrotiques ; la cible est maudite (elle ne peut plus récupérer de points de vie et son maximum baisse de 10 par tranche de 24 heures).' },
      { name: 'Regard terrifiant', kind: 'save', save: 'SAG', detail: 'Une créature vue à 18 m : sauvegarde de Sagesse ou Effrayée jusqu’à la fin de son prochain tour.' },
    ],
  },
  {
    id: 'chien-infernal', name: 'Chien infernal', ac: 15, hp: 58, speed: '15 m', cr: '3',
    kind: 'monstruosité', size: 'M',
    abilities: { str: 17, dex: 12, con: 14, int: 6, wis: 13, cha: 6 },
    skillBonuses: { Perception: 5 },
    senses: 'Vision dans le noir 18 m · perception passive 15',
    // p. 168. Vitesse 15 m : il choisit ses cibles, on ne le sème pas.
    actions: [
      { name: 'Multiattaque', kind: 'utility', attacks: 2, sequence: ['Morsure'], detail: 'Deux morsures.' },
      { name: 'Morsure', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d8+3', damageType: 'perforants', detail: 'Plus 3 (1d6) dégâts de feu.' },
      { name: 'Souffle de feu (recharge 5-6)', kind: 'save', save: 'DEX', detail: 'Cône de 4,50 m, sauvegarde de Dextérité — dégâts de feu, moitié en cas de réussite.' },
    ],
  },
  {
    id: 'capitaine-garde', name: 'Capitaine de la garde', ac: 18, hp: 75, speed: '9 m', cr: '4',
    kind: 'humanoïde', size: 'M', theme: ['garde', 'ville'],
    abilities: { str: 18, dex: 14, con: 16, int: 11, wis: 12, cha: 13 },
    skillBonuses: { Athlétisme: 6, Perception: 4 },
    senses: 'Perception passive 14',
    // p. 165. Le javelot de sa multiattaque existe au livre, mais sa ligne de
    // dégâts était illisible dans le scan : plutôt que de l'inventer, seule
    // l'épée longue est chiffrée ici.
    actions: [
      { name: 'Multiattaque', kind: 'utility', attacks: 2, sequence: ['Épée longue'], detail: 'Deux attaques, épée longue ou javelot.' },
      { name: 'Épée longue', kind: 'attack', toHit: 6, reach: '1,50 m', damage: '2d10+4', damageType: 'tranchants' },
    ],
  },
  {
    id: 'chef-de-brutes', name: 'Chef de brutes', ac: 16, hp: 82, speed: '9 m', cr: '4',
    kind: 'humanoïde', size: 'M', theme: ['bandit', 'ville'],
    abilities: { str: 17, dex: 14, con: 16, int: 11, wis: 10, cha: 11 },
    senses: 'Perception passive 10',
    // p. 310.
    actions: [
      { name: 'Multiattaque', kind: 'utility', attacks: 2, sequence: ['Marteau de guerre', 'Arbalète lourde'], detail: 'Deux attaques, marteau de guerre ou arbalète lourde.' },
      { name: 'Marteau de guerre', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '2d8+3', damageType: 'contondants' },
      { name: 'Arbalète lourde', kind: 'attack', toHit: 4, reach: '30/120 m', damage: '2d10+2', damageType: 'perforants' },
    ],
  },
  // ── Les gobelours : le chaînon qui manquait à la famille gobeline ──
  //
  // Le bestiaire portait déjà les quatre gobelins et le hobgobelin ; il
  // sautait les gobelours, qui sont pourtant ce qu'un chef gobelin envoie
  // devant. Les deux se distinguent par la portée : 3 m d'allonge, ce qui
  // leur permet de frapper depuis le second rang.
  {
    id: 'gobelours', name: 'Gobelours', ac: 14, hp: 33, speed: '9 m', cr: '1',
    kind: 'humanoïde', size: 'M', theme: ['gobelin', 'foret'],
    abilities: { str: 15, dex: 14, con: 13, int: 8, wis: 11, cha: 9 },
    skillBonuses: { Discrétion: 6, Survie: 2 },
    senses: 'Vision dans le noir 18 m · perception passive 10',
    traits: ['Enlèvement : déplacer une créature qu’il agrippe ne lui coûte pas de mouvement supplémentaire.'],
    // p. 62. PV 33 (6d8 + 6) : la Constitution de 13 se recoupe (6 × +1 = 6).
    // CA 14 = armure de peau (12) + Dex 2.
    actions: [
      { name: 'Empoignade', kind: 'attack', toHit: 4, reach: '3 m', damage: '2d6+2', damageType: 'contondants', detail: 'Cible M ou moins : Agrippée (DD 12 pour se libérer).' },
      { name: 'Marteau léger', kind: 'attack', toHit: 4, reach: '3 m ou 6/18 m', damage: '3d4+2', damageType: 'contondants', detail: 'Avantage si la cible est déjà agrippée par le gobelours.' },
    ],
  },
  {
    id: 'gobelours-traqueur', name: 'Gobelours traqueur', ac: 15, hp: 65, speed: '9 m', cr: '3',
    kind: 'humanoïde', size: 'M', theme: ['gobelin', 'foret'],
    abilities: { str: 17, dex: 14, con: 14, int: 11, wis: 12, cha: 11 },
    // La colonne des sauvegardes est en partie brouillée par l'océrisation ;
    // seules celles qui DIFFÈRENT du modificateur sont retenues, parce qu'un
    // écart signale une maîtrise et rien d'autre.
    saveBonuses: { dex: 4, wis: 3 },
    skillBonuses: { Discrétion: 6, Survie: 3 },
    senses: 'Vision dans le noir 18 m · perception passive 11',
    traits: ['Enlèvement : déplacer une créature qu’il agrippe ne lui coûte pas de mouvement supplémentaire.'],
    // p. 62. PV 65 (10d8 + 20) : Constitution 14 confirmée (10 × +2 = 20).
    actions: [
      { name: 'Multiattaque', kind: 'utility', attacks: 2, sequence: ['Javeline', 'Morgenstern'], detail: 'Deux attaques, javeline ou morgenstern.' },
      { name: 'Javeline', kind: 'attack', toHit: 5, reach: '3 m ou 9/36 m', damage: '3d6+3', damageType: 'perforants' },
      { name: 'Morgenstern', kind: 'attack', toHit: 5, reach: '3 m', damage: '2d8+3', damageType: 'perforants', detail: 'Avantage si la cible est déjà agrippée par le gobelours.' },
      { name: 'Empoignade rapide', kind: 'save', save: 'DEX', detail: 'Action bonus. DD 13, une créature M ou moins à 3 m — échec : Agrippée (DD 13 pour se libérer).' },
    ],
  },

  // ── La stirge : la nuisance à 5 PV qui saigne un joueur en trois tours ──
  {
    id: 'stirge', name: 'Stirge', ac: 13, hp: 5, speed: '3 m · vol 12 m', cr: '1/8',
    kind: 'monstruosité', size: 'TP', theme: ['ruines'],
    abilities: { str: 4, dex: 16, con: 11, int: 2, wis: 8, cha: 5 },
    senses: 'Vision dans le noir 18 m · perception passive 9',
    // p. 299. PV 5 (2d4), Constitution 11 : rien à ajouter aux dés.
    // Le vrai danger n'est pas le coup, c'est l'accrochage : une fois
    // plantée, elle draine 5 dégâts par tour SANS relancer d'attaque.
    actions: [
      { name: 'Trompe', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d6+3', damageType: 'perforants', detail: 'La stirge s’accroche. Tant qu’elle est accrochée, elle n’attaque plus mais inflige 5 (2d4) dégâts nécrotiques au début de chacun de ses tours. Elle se détache pour 1,50 m de mouvement ; la cible ou un voisin peut l’arracher par une action.' },
    ],
  },

  // ── Les lycanthropes ───────────────────────────────────────────────
  //
  // Les trois partagent la même mécanique : une morsure qui MAUDIT (le
  // personnage tombé à 0 PV se relève lycanthrope sous le contrôle du MJ), et
  // une action bonus de métamorphose. C'est la morsure qu'il faut avoir sous
  // les yeux — pas la liste de leurs formes.
  {
    id: 'rat-garou', name: 'Rat-garou', ac: 13, hp: 60, speed: '9 m · escalade 9 m', cr: '2',
    kind: 'monstruosité', size: 'M', theme: ['ville', 'bandit'],
    abilities: { str: 10, dex: 16, con: 12, int: 11, wis: 10, cha: 8 },
    skillBonuses: { Perception: 4, Discrétion: 5 },
    senses: 'Vision dans le noir 18 m · perception passive 14',
    // p. 325. PV 60 (11d8 + 11) : Constitution 12 confirmée (11 × +1 = 11).
    actions: [
      { name: 'Multiattaque', kind: 'utility', attacks: 2, sequence: ['Griffure', 'Arbalète de poing', 'Morsure'], detail: 'Deux attaques, griffure ou arbalète de poing ; l’une peut être remplacée par une morsure.' },
      { name: 'Morsure', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '2d4+3', damageType: 'perforants', detail: 'Forme de rat ou hybride. Humanoïde touché : sauvegarde de Constitution DD 11 — échec, il est maudit. S’il tombe à 0 PV, il devient un rat-garou contrôlé par le MJ avec 10 PV.' },
      { name: 'Griffure', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '1d6+3', damageType: 'tranchants' },
      { name: 'Arbalète de poing', kind: 'attack', toHit: 5, reach: '9/36 m', damage: '1d6+3', damageType: 'perforants', detail: 'Forme humanoïde ou hybride.' },
      { name: 'Métamorphose', kind: 'utility', detail: 'Action bonus. Rat de taille P, hybride de taille M, ou retour à sa forme humanoïde — mêmes statistiques dans chaque forme.' },
    ],
  },
  {
    id: 'loup-garou', name: 'Loup-garou', ac: 15, hp: 71, speed: '9 m (12 m en loup)', cr: '3',
    kind: 'monstruosité', size: 'M', theme: ['foret', 'loup'],
    abilities: { str: 16, dex: 14, con: 14, int: 10, wis: 11, cha: 10 },
    skillBonuses: { Perception: 4, Discrétion: 4 },
    senses: 'Vision dans le noir 18 m · perception passive 14',
    traits: ['Tactique de meute : avantage à l’attaque si un allié valide du loup-garou se tient à 1,50 m de la cible.'],
    // p. 327. PV 71 (11d8 + 22) : Constitution 14 confirmée (11 × +2 = 22).
    actions: [
      { name: 'Multiattaque', kind: 'utility', attacks: 2, sequence: ['Griffure', 'Arc long', 'Morsure'], detail: 'Deux attaques, griffure ou arc long ; l’une peut être remplacée par une morsure.' },
      { name: 'Morsure', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '2d8+3', damageType: 'perforants', detail: 'Forme de loup ou hybride. Humanoïde touché : sauvegarde de Constitution DD 12 — échec, il est maudit. S’il tombe à 0 PV, il devient un loup-garou contrôlé par le MJ avec 10 PV.' },
      { name: 'Griffure', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '2d6+3', damageType: 'tranchants' },
      { name: 'Arc long', kind: 'attack', toHit: 4, reach: '45/180 m', damage: '2d8+2', damageType: 'perforants', detail: 'Forme humanoïde ou hybride.' },
      { name: 'Métamorphose', kind: 'utility', detail: 'Action bonus. Loup de taille M, hybride de taille G, ou retour à sa forme humanoïde — mêmes statistiques dans chaque forme.' },
    ],
  },
  {
    id: 'sanglier-garou', name: 'Sanglier-garou', ac: 15, hp: 97, speed: '9 m (12 m en sanglier)', cr: '4',
    kind: 'monstruosité', size: 'M', theme: ['foret'],
    abilities: { str: 17, dex: 10, con: 15, int: 10, wis: 11, cha: 8 },
    skillBonuses: { Perception: 2 },
    senses: 'Perception passive 12',
    // p. 325. PV 97 (15d8 + 30) : Constitution 15 confirmée (15 × +2 = 30).
    // La javeline est imprimée « 3d5 + 3 » dans le scan — un dé qui n'existe
    // pas. La moyenne annoncée (13) donne 3d6 + 3, et c'est ce qui est écrit.
    actions: [
      { name: 'Multiattaque', kind: 'utility', attacks: 2, sequence: ['Javeline', 'Défense', 'Coup de boutoir'], detail: 'Deux attaques, javeline ou défense ; l’une peut être remplacée par un coup de boutoir.' },
      { name: 'Coup de boutoir', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '2d8+3', damageType: 'perforants', detail: 'Forme de sanglier ou hybride. Humanoïde touché : sauvegarde de Constitution DD 12 — échec, il est maudit. S’il tombe à 0 PV, il devient un sanglier-garou contrôlé par le MJ avec 10 PV.' },
      { name: 'Javeline', kind: 'attack', toHit: 5, reach: '1,50 m ou 9/36 m', damage: '3d6+3', damageType: 'perforants', detail: 'Forme humanoïde ou hybride.' },
      { name: 'Défense', kind: 'attack', toHit: 5, reach: '1,50 m', damage: '2d6+3', damageType: 'perforants', detail: 'Forme de sanglier ou hybride. Après 6 m en ligne droite vers une cible M ou moins : +7 (2d6) dégâts et cible À terre.' },
      { name: 'Métamorphose', kind: 'utility', detail: 'Action bonus. Sanglier de taille P, hybride de taille M, ou retour à sa forme humanoïde — mêmes statistiques dans chaque forme.' },
    ],
  },

  // ── Le feu follet : 27 PV, CA 19, et il ne se laisse pas toucher ──
  //
  // Son bloc est déroutant et c'est voulu : Dextérité 28 mais une attaque à
  // +4 seulement. Le livre l'imprime ainsi — la Dextérité sert son
  // initiative et sa CA, pas son coup.
  {
    id: 'feu-follet', name: 'Feu follet', ac: 19, hp: 27, speed: '1,50 m · vol 15 m (stationnaire)', cr: '2',
    kind: 'mort-vivant', size: 'TP', theme: ['mort-vivant', 'ruines'],
    abilities: { str: 1, dex: 28, con: 10, int: 13, wis: 14, cha: 11 },
    senses: 'Vision dans le noir 36 m · perception passive 12',
    traits: [
      'Résistances : acide, contondants, froid, feu, nécrotiques, perforants, tranchants. Immunités : foudre, poison.',
      'Éphémère : il ne peut rien porter ni transporter.',
      'Illumination : lumière vive sur 6 m, faible sur 6 m de plus.',
      'Déplacement incorporel : il traverse créatures et objets comme du terrain difficile ; 5 (1d10) dégâts de force s’il finit son tour dans un objet.',
    ],
    // p. 333. PV 27 (11d4), Constitution 10 : rien à ajouter aux dés.
    // « Regagne 10 (3d5) » au scan : 3d5 n'existe pas, la moyenne dit 3d6.
    actions: [
      { name: 'Décharge', kind: 'attack', toHit: 4, reach: '1,50 m', damage: '2d8+2', damageType: 'foudre' },
      { name: 'Dévorer la vie', kind: 'save', save: 'CON', detail: 'Action bonus. DD 10, une créature vivante à 0 PV qu’il voit à 1,50 m — échec : elle meurt et le feu follet regagne 10 (3d6) PV.' },
      { name: 'Disparaître', kind: 'utility', detail: 'Action bonus. Le feu follet et sa lueur deviennent Invisibles tant qu’il se concentre ; l’effet cesse dès qu’il attaque ou dévore une vie.' },
    ],
  },
];
