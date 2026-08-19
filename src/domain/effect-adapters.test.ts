import { describe, expect, it } from 'vitest';
import type { ActiveEffect } from './effects';
import {
  addCharacterEffect,
  addEncounterEffect,
  encounterEffectsFromConditions,
  removeEncounterConcentrationFromCaster,
  removeEncounterEffect,
  syncEffectConditions,
} from './effect-adapters';

const hold: ActiveEffect = {
  id: 'spell:immobilisation-personne:caster:target:1',
  sourceId: 'immobilisation-personne',
  sourceName: 'Immobilisation de personne',
  sourceType: 'spell',
  targetId: 'target',
  casterId: 'caster',
  duration: { kind: 'concentration', rounds: 10 },
  modifiers: [{ type: 'condition', condition: 'Paralysé' }],
  repeatSave: { ability: 'SAG', dc: 15, timing: 'end-turn', endsOnSuccess: true },
  potency: 2,
  appliedOrder: 42,
  createdRound: 3,
};

describe('effect adapters', () => {
  it('projette un ActiveEffect de personnage vers les conditions visibles sans perdre l’effet source', () => {
    const result = addCharacterEffect({ conditions: [{ label: 'Empoisonné' }] }, hold);
    expect(result.activeEffects).toEqual([hold]);
    expect(result.conditions).toEqual([
      { label: 'Empoisonné' },
      {
        label: 'Paralysé',
        detail: 'Immobilisation de personne',
        effectId: hold.id,
        sourceId: hold.sourceId,
        casterId: 'caster',
      },
    ]);
  });

  it('ne duplique pas une condition manuelle déjà affichée', () => {
    const result = syncEffectConditions({ activeEffects: [hold], conditions: [{ label: 'Paralysé', detail: 'MJ' }] });
    expect(result.conditions).toEqual([{ label: 'Paralysé', detail: 'MJ' }]);
  });

  it('sérialise puis reconstruit un effet d’ennemi sans perdre ses métadonnées mécaniques', () => {
    const combatant = addEncounterEffect({ id: 'target', conditions: [{ label: 'À terre' }] }, hold);
    expect(combatant.conditions?.some((condition) => condition.effectId === hold.id)).toBe(true);
    const rebuilt = encounterEffectsFromConditions(combatant.conditions, 'target');
    expect(rebuilt).toEqual([hold]);
  });

  it('retire tout le bloc sérialisé d’un effet terminé', () => {
    const combatant = addEncounterEffect({ id: 'target', conditions: [{ label: 'À terre' }] }, hold);
    const result = removeEncounterEffect(combatant, hold.id);
    expect(result.conditions).toEqual([{ label: 'À terre' }]);
  });

  it('rompt uniquement les effets de concentration du lanceur concerné', () => {
    const other = { ...hold, id: 'spell:autre:other:target:2', sourceId: 'autre', casterId: 'other' };
    let combatant = addEncounterEffect({ id: 'target', conditions: [] }, hold);
    combatant = addEncounterEffect(combatant, other);
    const result = removeEncounterConcentrationFromCaster(combatant, 'caster');
    expect(encounterEffectsFromConditions(result.conditions, 'target')).toEqual([other]);
  });
});
