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
    detail: 'force · 36 m',
    toHit: 5,
    damage: '1d10+3',
  },
  {
    id: 'armure-agathys',
    name: "Armure d'Agathys",
    economy: 'action',
    detail: '5 PV temporaires · représailles de froid',
    resource: { key: 'pacte', remaining: 2, max: 2, label: 'Emplacement de pacte' },
  },
  {
    id: 'orbe-chromatique',
    name: 'Orbe chromatique',
    economy: 'action',
    granted: true,
    toHit: 5,
    damage: '3d8',
  },
  {
    id: 'reprimande-infernale',
    name: 'Réprimande infernale',
    economy: 'reaction',
    detail: 'quand une créature visible te blesse · 2d10 feu',
    resource: { key: 'pacte', remaining: 2, max: 2, label: 'Emplacement de pacte' },
  },
];
