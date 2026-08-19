import { describe, expect, it } from 'vitest';
import { RECHARGE_TYPES } from './recharge';

describe('vocabulaire de recharge', () => {
  it('huit valeurs, reprises telles quelles', () => {
    expect(RECHARGE_TYPES).toEqual(['court', 'long', 'court_ou_long', 'initiative', 'tour', 'condition', 'jamais', 'unknown']);
  });
});
