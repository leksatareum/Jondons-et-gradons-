import { describe, expect, it } from 'vitest';
import {
  ALL_TOOL_PROFICIENCIES,
  ARMOR_PROFICIENCIES,
  ARTISAN_TOOLS,
  BATTLE_MASTER_MANEUVERS,
  BLESSED_STRIKES,
  DIVINE_ORDER,
  ELEMENTAL_FURY,
  GAMING_SETS,
  METAMAGIC,
  MUSICAL_INSTRUMENTS,
  PRIMAL_ORDER,
  WILD_HEART_ASPECTS,
  toolChoiceOptions,
} from './class-choices';
import { BACKGROUNDS } from './backgrounds';
import { CLASSES } from './classes';

describe('options de choix de classe', () => {
  it('vingt manœuvres de Maître de guerre, dix métamagies', () => {
    expect(BATTLE_MASTER_MANEUVERS).toHaveLength(20);
    expect(METAMAGIC).toHaveLength(10);
  });

  it('chaque métamagie a un coût en points de sorcellerie', () => {
    for (const option of METAMAGIC) {
      expect(option.cost, option.name).toBeGreaterThanOrEqual(1);
    }
  });

  it('les choix binaires en proposent bien deux', () => {
    for (const table of [DIVINE_ORDER, PRIMAL_ORDER, BLESSED_STRIKES, ELEMENTAL_FURY]) {
      expect(table).toHaveLength(2);
    }
    expect(WILD_HEART_ASPECTS).toHaveLength(3);
  });

  it('l’Ordre primordial « Mage » ajoute la Sagesse aux tests, version construite', () => {
    // Le texte source d'App.jsx disait « maîtrise en Arcanes ou en Nature » ;
    // la chaîne de plugins le corrige. C'est aussi le bug relevé par l'ancien
    // test d'audit druid-core-2024 (cf. docs/legacy-rules-backlog.md, §2).
    expect(PRIMAL_ORDER.find((option) => option.id === 'mage')?.desc).toMatch(/Sagesse/);
  });
});

describe('maîtrises d’outils', () => {
  it('toutes les catégories sont réunies sans doublon', () => {
    expect(ALL_TOOL_PROFICIENCIES.length).toBe(new Set(ALL_TOOL_PROFICIENCIES).size);
    expect(ALL_TOOL_PROFICIENCIES).toEqual(expect.arrayContaining([...ARTISAN_TOOLS, ...GAMING_SETS]));
  });

  it('toolChoiceOptions rend la bonne catégorie', () => {
    expect(toolChoiceOptions('artisan')).toEqual(ARTISAN_TOOLS);
    expect(toolChoiceOptions('instrument')).toEqual(MUSICAL_INSTRUMENTS);
    expect(toolChoiceOptions('gaming')).toEqual(GAMING_SETS);
  });

  it('toute origine laissant le choix d’un outil pointe vers une catégorie non vide', () => {
    for (const background of BACKGROUNDS) {
      if (background.toolChoice) {
        expect(toolChoiceOptions(background.toolChoice).length, background.id).toBeGreaterThan(0);
      }
    }
  });
});

describe('maîtrises d’armure', () => {
  it('les douze classes ont une entrée', () => {
    for (const klass of CLASSES) {
      expect(ARMOR_PROFICIENCIES[klass.id], klass.id).toBeDefined();
    }
  });
});
