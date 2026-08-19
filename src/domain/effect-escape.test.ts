import { describe, expect, it } from 'vitest';

import { addEffect, resolveEscapeCheck, type ActiveEffect } from './effects';

const entangled: ActiveEffect = {
  id: 'entangle:target',
  sourceId: 'enchevetrement',
  sourceName: 'Enchevêtrement',
  sourceType: 'spell',
  targetId: 'target',
  casterId: 'caster',
  duration: { kind: 'concentration', rounds: 10, expiresAt: 'end-turn' },
  modifiers: [{ type: 'condition', condition: 'Entravé' }],
  escapeCheck: {
    ability: 'FOR',
    skill: 'Athlétisme',
    dc: 15,
    actionRequired: true,
    endsOnSuccess: true,
  },
};

describe('escape checks', () => {
  it('retire l’effet après un test d’évasion réussi', () => {
    const state = addEffect({}, entangled);
    const result = resolveEscapeCheck(state, entangled.id, 15);
    expect(result.resolved).toBe(true);
    expect(result.success).toBe(true);
    expect(result.state.activeEffects).toEqual([]);
  });

  it('conserve l’effet après un test raté', () => {
    const state = addEffect({}, entangled);
    const result = resolveEscapeCheck(state, entangled.id, 14);
    expect(result.resolved).toBe(true);
    expect(result.success).toBe(false);
    expect(result.state.activeEffects).toHaveLength(1);
  });

  it('ne confond pas un test d’évasion avec une sauvegarde répétée', () => {
    const state = addEffect({}, entangled);
    const result = resolveEscapeCheck(state, 'other', 20);
    expect(result.resolved).toBe(false);
    expect(result.success).toBeNull();
    expect(result.state).toBe(state);
  });
});
