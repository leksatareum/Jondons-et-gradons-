export type TurnState = Record<string, any> & {
  turnBased?: boolean;
  action?: boolean;
  bonus?: boolean;
  reaction?: boolean;
  extraActions?: number;
};

export type TurnBasedCharacter = {
  turn?: TurnState;
  [key: string]: unknown;
};

const resetTrackedTurn = (turn: TurnState = {}, active: boolean): TurnState => ({
  ...turn,
  turnBased: active,
  action: false,
  bonus: false,
  reaction: false,
  spellSlotCast: false,
  extraActions: 0,
  actionSurgeUsed: false,
  freeMetamagicUsed: false,
  lifedrinkerUsed: false,
  attacksRemaining: 0,
  loadingWeaponIds: [],
  relentlessUsed: false,
  cleaveUsed: false,
  cleaveAvailable: null,
  lightWeaponUsedId: null,
  lightAttackUsed: false,
  nickUsed: false,
  dualWielderUsed: false,
});

export function isTurnBasedMode(character: TurnBasedCharacter | null | undefined): boolean {
  return character?.turn?.turnBased === true;
}

export function turnSlotUnavailableForMode(
  character: TurnBasedCharacter,
  slot: 'action' | 'bonus' | 'reaction',
  incapacitated = false,
): boolean {
  if (incapacitated) return true;
  if (!isTurnBasedMode(character)) return false;
  if (slot === 'action') return Boolean(character.turn?.action) && Number(character.turn?.extraActions || 0) <= 0;
  return Boolean(character.turn?.[slot]);
}

export function magicTurnSlotUnavailableForMode(
  character: TurnBasedCharacter,
  slot: 'action' | 'bonus' | 'reaction',
  incapacitated = false,
): boolean {
  if (turnSlotUnavailableForMode(character, slot, incapacitated)) return true;
  return isTurnBasedMode(character) && slot === 'action' && Boolean(character.turn?.action);
}

export function consumeTurnSlotForMode(turn: TurnState = {}, slot: 'action' | 'bonus' | 'reaction'): TurnState {
  const next = { ...turn };
  if (next.turnBased !== true) return next;
  const extraActions = Number(next.extraActions || 0);
  if (slot === 'action' && next.action && extraActions > 0) next.extraActions = extraActions - 1;
  else next[slot] = true;
  return next;
}

export function setCharacterTurnBasedMode<T extends TurnBasedCharacter>(character: T, active: boolean): T {
  if (character.turn?.turnBased === active
      && !character.turn?.action && !character.turn?.bonus && !character.turn?.reaction
      && Number(character.turn?.attacksRemaining || 0) === 0) return character;
  return { ...character, turn: resetTrackedTurn(character.turn || {}, active) } as T;
}
