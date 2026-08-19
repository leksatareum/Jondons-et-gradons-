import { describe, expect, it } from 'vitest';
import { RULE_CATEGORIES, RULES_COMPENDIUM } from './rules-compendium';

describe('référence rapide des règles', () => {
  it('couvre les douze actions générales 2024', () => {
    const actionIds = RULES_COMPENDIUM.filter((entry) => entry.category === 'Actions').map((entry) => entry.id);
    expect(actionIds).toEqual(expect.arrayContaining([
      'action-attack', 'action-dash', 'action-disengage', 'action-dodge',
      'action-help', 'action-hide', 'action-influence', 'action-magic',
      'action-ready', 'action-search', 'action-study', 'action-utilize',
    ]));
  });

  it('possède au moins une entrée stable par domaine affiché', () => {
    for (const category of RULE_CATEGORIES) {
      expect(RULES_COMPENDIUM.some((entry) => entry.category === category)).toBe(true);
    }
    expect(new Set(RULES_COMPENDIUM.map((entry) => entry.id)).size).toBe(RULES_COMPENDIUM.length);
  });
});
