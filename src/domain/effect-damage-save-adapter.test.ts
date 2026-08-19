import { describe, expect, it } from 'vitest';

import { addEncounterEffect, encounterEffectsFromConditions } from './effect-adapters';
import type { ActiveEffect } from './effects';

const laughter: ActiveEffect = {
  id: 'spell:rire-hideux:caster:target:1',
  sourceId: 'rire-hideux',
  sourceName: 'Fou rire',
  sourceType: 'spell',
  targetId: 'target',
  casterId: 'caster',
  duration: { kind: 'concentration', rounds: 10, expiresAt: 'end-turn' },
  modifiers: [
    { type: 'condition', condition: 'À terre' },
    { type: 'condition', condition: "Incapable d'agir" },
  ],
  repeatSave: { ability: 'SAG', dc: 15, timing: 'end-turn', endsOnSuccess: true },
  damageTriggeredSave: { ability: 'SAG', dc: 15, advantage: true, endsOnSuccess: true },
};

describe('encounter damage-triggered save persistence', () => {
  it('reconstruit une seule instance de Fou rire avec les deux conditions et le déclencheur dégâts', () => {
    const combatant = addEncounterEffect({ id: 'target', conditions: [] }, laughter);
    expect(combatant.conditions).toHaveLength(2);
    const rebuilt = encounterEffectsFromConditions(combatant.conditions, 'target');
    expect(rebuilt).toHaveLength(1);
    expect(rebuilt[0]).toMatchObject({
      sourceId: 'rire-hideux',
      damageTriggeredSave: { ability: 'SAG', dc: 15, advantage: true, endsOnSuccess: true },
    });
    expect(rebuilt[0].modifiers).toEqual(laughter.modifiers);
  });
});
