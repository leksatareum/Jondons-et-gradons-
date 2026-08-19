import { describe, expect, it } from 'vitest';
import {
  consumeTurnSlotForMode, isTurnBasedMode, magicTurnSlotUnavailableForMode,
  setCharacterTurnBasedMode, turnSlotUnavailableForMode,
} from './turn-based-mode';

describe('mode tour par tour', () => {
  it('ne consomme aucune économie d’action hors mode tour par tour', () => {
    const turn = { turnBased: false, action: false, bonus: false, reaction: false };
    expect(consumeTurnSlotForMode(turn, 'action')).toEqual(turn);
    expect(consumeTurnSlotForMode(turn, 'bonus')).toEqual(turn);
    expect(turnSlotUnavailableForMode({ turn: { ...turn, action: true, bonus: true } }, 'action')).toBe(false);
    expect(magicTurnSlotUnavailableForMode({ turn: { ...turn, action: true } }, 'action')).toBe(false);
  });

  it('mécanise Action, Bonus et Réaction quand le MJ a activé le tour par tour', () => {
    let turn = { turnBased: true, action: false, bonus: false, reaction: false, extraActions: 0 };
    turn = consumeTurnSlotForMode(turn, 'action');
    expect(turn.action).toBe(true);
    expect(turnSlotUnavailableForMode({ turn }, 'action')).toBe(true);
    turn = consumeTurnSlotForMode(turn, 'bonus');
    expect(turn.bonus).toBe(true);
    expect(turnSlotUnavailableForMode({ turn }, 'bonus')).toBe(true);
  });

  it('continue d’interdire une action à une créature incapable même hors combat', () => {
    expect(turnSlotUnavailableForMode({ turn: { turnBased: false } }, 'action', true)).toBe(true);
  });

  it('l’activation et la désactivation remettent l’économie d’action à zéro', () => {
    const character = { id: 'hero', turn: { turnBased: true, action: true, bonus: true, reaction: true, attacksRemaining: 2, extraActions: 1 } };
    const free = setCharacterTurnBasedMode(character, false);
    expect(isTurnBasedMode(free)).toBe(false);
    expect(free.turn).toMatchObject({ action: false, bonus: false, reaction: false, attacksRemaining: 0, extraActions: 0 });
    const combat = setCharacterTurnBasedMode(free, true);
    expect(isTurnBasedMode(combat)).toBe(true);
    expect(combat.turn).toMatchObject({ action: false, bonus: false, reaction: false, attacksRemaining: 0 });
  });
});
