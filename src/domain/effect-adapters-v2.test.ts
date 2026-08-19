import { describe, expect, it } from 'vitest';

import { addEncounterEffect, encounterEffectsFromConditions, syncEffectConditions } from './effect-adapters';
import type { ActiveEffect } from './effects';

const strike: ActiveEffect = {
  id: 'spell:frappe-entravante:caster:target:1',
  sourceId: 'frappe-entravante',
  sourceName: 'Frappe entravante',
  sourceType: 'spell',
  targetId: 'target',
  casterId: 'caster',
  duration: { kind: 'concentration', rounds: 10 },
  modifiers: [{ type: 'condition', condition: 'Entravé' }],
  escapeCheck: { ability: 'FOR', skill: 'Athlétisme', dc: 15, actionRequired: true, helperAllowed: true, endsOnSuccess: true },
  periodicDamage: { timing: 'start-turn', dice: '2d6', damageType: 'perforants' },
  potency: 2,
  appliedOrder: 12,
  createdRound: 4,
};

describe('effect adapter V2 metadata', () => {
  it('sérialise et reconstruit les tests d’évasion et dégâts périodiques', () => {
    const combatant = addEncounterEffect({ id: 'target', conditions: [] }, strike);
    const rebuilt = encounterEffectsFromConditions(combatant.conditions, 'target');
    expect(rebuilt).toEqual([strike]);
  });

  it('affiche les dégâts périodiques dans le rappel de condition', () => {
    const result = syncEffectConditions({ activeEffects: [strike], conditions: [] });
    expect(result.conditions?.[0]).toMatchObject({
      label: 'Entravé',
      detail: 'Frappe entravante · début du tour : 2d6 perforants',
    });
  });
});
