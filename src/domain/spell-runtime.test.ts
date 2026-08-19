import { describe, expect, it } from 'vitest';
import {
  concentrationCastSignal,
  concentrationName,
  encounterTurnTransition,
  inferCastingSource,
  inferSpentSlot,
  runtimeSpellSaveDc,
} from './spell-runtime';

const caster = {
  id: 'caster',
  classId: 'magicien',
  level: 5,
  abilities: { int: 18, wis: 10, cha: 10 },
  spells: [{ id: 'immobilisation-personne', sourceClass: 'magicien', prepared: true }],
  slots: [{ level: 2, current: 3, max: 3 }],
  pactSlots: [],
  conditions: [],
  turn: { spellSlotCast: false },
};

describe('spell runtime helpers', () => {
  it('retrouve le nom du sort de Concentration', () => {
    expect(concentrationName({ ...caster, conditions: [{ label: 'Concentration', detail: 'Immobilisation de personne' }] })).toBe('Immobilisation de personne');
  });

  it('détecte l’emplacement réellement dépensé', () => {
    const current = { ...caster, slots: [{ level: 2, current: 2, max: 3 }] };
    expect(inferSpentSlot(caster, current)).toEqual({ level: 2, pact: false, amount: 1 });
  });

  it('détecte un lancement de Concentration sans confondre un tour où elle est seulement maintenue', () => {
    const cast = {
      ...caster,
      slots: [{ level: 2, current: 2, max: 3 }],
      conditions: [{ label: 'Concentration', detail: 'Immobilisation de personne' }],
      turn: { spellSlotCast: true },
    };
    expect(concentrationCastSignal(caster, cast)?.name).toBe('Immobilisation de personne');
    expect(concentrationCastSignal(cast, { ...cast, turn: { spellSlotCast: true } })).toBeNull();
  });

  it('détecte une relance du même sort au tour suivant', () => {
    const previous = {
      ...caster,
      conditions: [{ label: 'Concentration', detail: 'Immobilisation de personne' }],
      turn: { spellSlotCast: false },
    };
    const current = {
      ...previous,
      slots: [{ level: 2, current: 2, max: 3 }],
      turn: { spellSlotCast: true },
    };
    expect(concentrationCastSignal(previous, current)).not.toBeNull();
  });

  it('calcule le même DD de sauvegarde que le grimoire pour la source retenue', () => {
    const source = inferCastingSource(caster, 'immobilisation-personne');
    expect(source).toEqual({ sourceClass: 'magicien', ability: 'int', ambiguous: false });
    expect(runtimeSpellSaveDc(caster, source)).toBe(15);
  });

  it('repère uniquement un vrai changement de tour', () => {
    const previous = { status: 'active', round: 2, turnIndex: 0, combatants: [{ id: 'a' }, { id: 'b' }] };
    const sameTurn = { ...previous, combatants: [{ id: 'a', hp: 4 }, { id: 'b' }] };
    const next = { ...previous, turnIndex: 1 };
    expect(encounterTurnTransition(previous, sameTurn)).toBeNull();
    expect(encounterTurnTransition(previous, next)).toEqual({ ended: { id: 'a' }, started: { id: 'b' } });
  });
});
