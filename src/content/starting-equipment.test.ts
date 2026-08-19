import { describe, expect, it } from 'vitest';
import {
  CRAFT_IDS_BY_TOOL,
  CRAFT_TOOL_ITEM_ID,
  FAST_CRAFT_IDS_BY_TOOL,
  FAST_CRAFT_TOOLS,
  STARTING_KITS,
} from './starting-equipment';
import { CLASSES } from './classes';
import { ALL_TOOL_PROFICIENCIES } from './class-choices';

describe('équipement de départ', () => {
  it('les douze classes ont un kit proposé', () => {
    expect(Object.keys(STARTING_KITS)).toHaveLength(12);
    for (const klass of CLASSES) {
      expect(STARTING_KITS[klass.id], klass.id).toBeDefined();
    }
  });
});

describe('artisanat', () => {
  it('tout outil de fabrication rapide sait aussi fabriquer normalement', () => {
    for (const tool of FAST_CRAFT_TOOLS) {
      expect(CRAFT_IDS_BY_TOOL[tool], tool).toBeDefined();
    }
    expect(Object.keys(FAST_CRAFT_IDS_BY_TOOL).length).toBeLessThanOrEqual(Object.keys(CRAFT_IDS_BY_TOOL).length);
  });

  it('tout outil qui fabrique quelque chose est une maîtrise d’outil réelle', () => {
    const inconnus = Object.keys(CRAFT_IDS_BY_TOOL).filter((tool) => !ALL_TOOL_PROFICIENCIES.includes(tool));
    expect(inconnus).toEqual([]);
  });

  it('chaque outil fabricant a un objet « outils » associé', () => {
    const sansObjet = Object.keys(CRAFT_IDS_BY_TOOL).filter((tool) => !CRAFT_TOOL_ITEM_ID[tool]);
    expect(sansObjet).toEqual([]);
  });
});
