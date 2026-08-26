import { EMPTY_LIVE_STATE, type CharacterSheet } from '../model/character';
import type { PlayableCard } from './combat-layout';

/**
 * Fiche d'exemple pour regarder l'écran, calquée sur une occultiste de
 * niveau 2 comme celles de la campagne — mais entièrement inventée : aucune
 * donnée réelle de partie ne vit dans le dépôt.
 *
 * Elle ne porte QUE des décisions : ni PV maximum, ni CA, ni emplacements.
 * Tout ce que l'écran affiche en sort par dérivation, ce qui rend cette fiche
 * un test grandeur nature du modèle autant qu'un jeu de démonstration.
 */
export const demoSheet: CharacterSheet = {
  id: 'demo',
  name: 'Sélène',
  speciesId: 'elfe',
  lineageId: 'drow',
  backgroundId: 'sage',
  abilities: { str: 8, dex: 14, con: 14, int: 12, wis: 12, cha: 16 },
  classLevels: [{ classId: 'occultiste', level: 2, subclass: null }],
  classChoices: { occultiste: { invocations: ['pact-tome', 'agonizing-blast@explosion-occulte'] } },
  skillProficiencies: ['arcanes', 'tromperie'],
  expertise: [],
  toolProficiencies: [],
  languages: [],
  featIds: [],
  abilityImprovements: [],
  cantrips: [{ id: 'explosion-occulte', sourceClass: 'occultiste' }],
  spells: [
    { id: 'armure-agathys', sourceClass: 'occultiste', prepared: true },
    { id: 'malefice', sourceClass: 'occultiste', prepared: true },
    { id: 'orbe-chromatique', sourceClass: 'occultiste', prepared: true, grantedBy: 'origin' },
  ],
  inventory: [],
  armorId: null,
  shield: false,
  gold: 15,
  live: { ...EMPTY_LIVE_STATE, damageTaken: 4, temporaryHp: 0 },
};

export const demoCards: PlayableCard[] = [
  {
    id: 'explosion-occulte',
    name: 'Explosion occulte',
    economy: 'action',
    category: 'magie',
    detail: 'force · 36 m',
    toHit: 5,
    damage: '1d10+3',
  },
  {
    id: 'armure-agathys',
    name: "Armure d'Agathys",
    economy: 'action',
    category: 'magie',
    detail: '5 PV temporaires · représailles de froid',
    resources: [{ key: 'pacte', remaining: 2, max: 2, label: 'Emplacement de pacte' }],
  },
  {
    id: 'orbe-chromatique',
    name: 'Orbe chromatique',
    economy: 'action',
    category: 'magie',
    granted: true,
    toHit: 5,
    damage: '3d8',
  },
  {
    id: 'reprimande-infernale',
    name: 'Réprimande infernale',
    economy: 'reaction',
    category: 'magie',
    detail: 'quand une créature visible te blesse · 2d10 feu',
    resources: [{ key: 'pacte', remaining: 2, max: 2, label: 'Emplacement de pacte' }],
  },
];

import { withDistinctNames, type EncounterState } from '../domain/encounter';

/**
 * Rencontre d'exemple : le groupe face à une embuscade. Noms inventés, comme
 * la fiche ci-dessus — aucune donnée de campagne ne vit dans le dépôt.
 *
 * Elle exerce volontairement les cas pénibles : des créatures homonymes à
 * numéroter, un joueur à terre, un état en cours, et des points de vie
 * temporaires.
 */
export const demoEncounter: EncounterState = {
  round: 0,
  turnIndex: -1,
  combatants: withDistinctNames([
    { id: 'p1', name: 'Sélène', side: 'joueur', initiative: 19, dexterity: 2, maxHp: 17, damageTaken: 4, temporaryHp: 5, armorClass: 12, conditions: [] },
    { id: 'm1', name: 'Gobelin', side: 'creature', initiative: 16, dexterity: 2, maxHp: 7, damageTaken: 0, temporaryHp: 0, armorClass: 15, conditions: [] },
    { id: 'm2', name: 'Gobelin', side: 'creature', initiative: 16, dexterity: 2, maxHp: 7, damageTaken: 5, temporaryHp: 0, armorClass: 15, conditions: ['Effrayé'] },
    { id: 'p2', name: 'Brannoc', side: 'joueur', initiative: 14, dexterity: 1, maxHp: 19, damageTaken: 11, temporaryHp: 0, armorClass: 14, conditions: [] },
    { id: 'm3', name: 'Chef gobelin', side: 'creature', initiative: 12, dexterity: 3, maxHp: 21, damageTaken: 3, temporaryHp: 0, armorClass: 17, conditions: [] },
    { id: 'p3', name: 'Ysoria', side: 'joueur', initiative: 9, dexterity: 0, maxHp: 24, damageTaken: 24, temporaryHp: 0, armorClass: 15, conditions: ['Inconscient'] },
    { id: 'm4', name: 'Gobelin', side: 'creature', initiative: 7, dexterity: 2, maxHp: 7, damageTaken: 0, temporaryHp: 0, armorClass: 15, conditions: [] },
  ]),
};
