import { describe, expect, it } from 'vitest';

import {
  enqueueConcentrationCheck,
  normalizeConcentrationQueue,
  resolveConcentrationCheckQueue,
} from './concentration';

describe('concentration save queue', () => {
  it('migre une sauvegarde historique dans la file', () => {
    expect(normalizeConcentrationQueue(undefined, { dc: 12, detail: 'Bénédiction' }))
      .toEqual([{ dc: 12, detail: 'Bénédiction' }]);
  });

  it('conserve une sauvegarde distincte pour chaque instance de dégâts', () => {
    const first = enqueueConcentrationCheck([], null, 9, 'Bénédiction');
    const second = enqueueConcentrationCheck(first, first[0], 44, 'Bénédiction');
    expect(second).toEqual([
      { dc: 10, detail: 'Bénédiction', damageTaken: 9 },
      { dc: 22, detail: 'Bénédiction', damageTaken: 44 },
    ]);
  });

  it('une réussite ne résout que la première sauvegarde', () => {
    const queue = [
      { dc: 10, detail: 'Vol', damageTaken: 4 },
      { dc: 18, detail: 'Vol', damageTaken: 36 },
    ];
    expect(resolveConcentrationCheckQueue(queue, queue[0], true)).toEqual({
      queue: [{ dc: 18, detail: 'Vol', damageTaken: 36 }],
      keepConcentration: true,
      resolved: true,
    });
  });

  it('un échec rompt la concentration et annule les sauvegardes restantes', () => {
    const queue = [{ dc: 10 }, { dc: 15 }];
    expect(resolveConcentrationCheckQueue(queue, queue[0], false)).toEqual({
      queue: [], keepConcentration: false, resolved: true,
    });
  });
});
