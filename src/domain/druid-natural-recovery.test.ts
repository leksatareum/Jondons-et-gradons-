import { describe, expect, it } from 'vitest';
import {
  markNaturalRecoveryAfterShortRest,
  markNaturalRecoveryFreeSpellUsed,
  naturalRecoveryFreeSpellAvailable,
  naturalRecoveryMissingSlots,
  recoverNaturalRecoverySlots,
  resetNaturalRecoveryLongRest,
  validateNaturalRecoverySelection,
} from './druid-natural-recovery';

const land = (level = 6) => ({
  classId: 'druide',
  level,
  subclass: 'Cercle de la Terre',
  classLevels: [{ classId: 'druide', level, subclass: 'Cercle de la Terre' }],
  circleLandType: 'arid' as const,
  spells: [{ id: 'boule-feu', source: 'circle-land', prepared: true }],
  slots: [
    { level: 1, current: 2, max: 4 },
    { level: 2, current: 1, max: 3 },
    { level: 3, current: 0, max: 3 },
    { level: 6, current: 0, max: 1 },
  ],
});

describe('Cercle de la Terre · Récupération naturelle', () => {
  it('autorise un sort du Cercle niveau 1+ sans emplacement une fois par repos long', () => {
    const character = land();
    expect(naturalRecoveryFreeSpellAvailable(character, 'boule-feu')).toBe(true);
    const used = markNaturalRecoveryFreeSpellUsed(character);
    expect(used.naturalRecoveryFreeSpellUsed).toBe(true);
    expect(naturalRecoveryFreeSpellAvailable(used, 'boule-feu')).toBe(false);
    expect(naturalRecoveryFreeSpellAvailable(character, 'autre-sort')).toBe(false);
  });

  it('n’ouvre la récupération de slots qu’après un repos court', () => {
    expect(naturalRecoveryMissingSlots(land())).toEqual([]);
    const ready = markNaturalRecoveryAfterShortRest(land());
    expect(ready.naturalRecoveryShortRestReady).toBe(true);
    expect(naturalRecoveryMissingSlots(ready)).toEqual([1, 1, 2, 2, 3, 3, 3]);
  });

  it('respecte le budget moitié du niveau arrondi au supérieur et interdit les slots 6+', () => {
    const ready = markNaturalRecoveryAfterShortRest(land(6));
    expect(validateNaturalRecoverySelection(ready, [2, 1])).toBe(true);
    expect(validateNaturalRecoverySelection(ready, [3, 1])).toBe(false);
    expect(validateNaturalRecoverySelection(ready, [6])).toBe(false);
  });

  it('récupère la sélection en une fois puis ferme la capacité jusqu’au repos long', () => {
    const ready = markNaturalRecoveryAfterShortRest(land(10));
    const recovered = recoverNaturalRecoverySlots(ready, [3, 2]);
    expect(recovered.slots?.find((slot) => slot.level === 3)?.current).toBe(1);
    expect(recovered.slots?.find((slot) => slot.level === 2)?.current).toBe(2);
    expect(recovered.naturalRecoverySlotRecoveryUsed).toBe(true);
    expect(recovered.naturalRecoveryShortRestReady).toBe(false);
    expect(recoverNaturalRecoverySlots(recovered, [1])).toBe(recovered);
  });

  it('le repos long restaure indépendamment les deux usages', () => {
    const reset = resetNaturalRecoveryLongRest({ ...land(), naturalRecoveryFreeSpellUsed: true, naturalRecoverySlotRecoveryUsed: true, naturalRecoveryShortRestReady: true });
    expect(reset.naturalRecoveryFreeSpellUsed).toBe(false);
    expect(reset.naturalRecoverySlotRecoveryUsed).toBe(false);
    expect(reset.naturalRecoveryShortRestReady).toBe(false);
  });
});
