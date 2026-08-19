import { describe, expect, it } from 'vitest';
import { convertWildShapeToSpellSlot, natureMagicianOptions } from './druid-archdruid';

const druid20 = (overrides: Record<string, unknown> = {}) => ({
  classId: 'druide',
  level: 20,
  classLevels: [{ classId: 'druide', level: 20 }],
  resources: [
    { name: 'Forme sauvage', current: 4, max: 4 },
    { name: 'Magicien de la nature', current: 1, max: 1 },
  ],
  slots: [
    { level: 2, current: 3, max: 3, temporary: 0 },
    { level: 4, current: 3, max: 3, temporary: 0 },
    { level: 6, current: 1, max: 1, temporary: 0 },
    { level: 8, current: 1, max: 1, temporary: 0 },
  ],
  turn: { action: true, bonus: true },
  ...overrides,
});

describe('Druide 20 · Archidruide · Magicien de la nature', () => {
  it('n’existe pas avant le niveau 20', () => {
    expect(natureMagicianOptions({ ...druid20(), level: 19, classLevels: [{ classId: 'druide', level: 19 }] })).toEqual([]);
  });

  it('propose 1/2/3/4 usages pour créer un emplacement 2/4/6/8', () => {
    expect(natureMagicianOptions(druid20())).toEqual([
      { wildShapeUses: 1, slotLevel: 2 },
      { wildShapeUses: 2, slotLevel: 4 },
      { wildShapeUses: 3, slotLevel: 6 },
      { wildShapeUses: 4, slotLevel: 8 },
    ]);
  });

  it('convertit plusieurs Formes sauvages en un seul emplacement temporaire', () => {
    const converted = convertWildShapeToSpellSlot(druid20(), 2);
    expect(converted.resources?.find((resource) => resource.name === 'Forme sauvage')?.current).toBe(2);
    expect(converted.resources?.find((resource) => resource.name === 'Magicien de la nature')?.current).toBe(0);
    expect(converted.slots?.find((slot) => slot.level === 4)).toMatchObject({ current: 4, max: 3, temporary: 1 });
  });

  it('ne consomme aucune action ou action bonus', () => {
    const source = druid20();
    const converted = convertWildShapeToSpellSlot(source, 1);
    expect(converted.turn).toEqual(source.turn);
  });

  it('refuse une seconde conversion avant le prochain repos long', () => {
    const first = convertWildShapeToSpellSlot(druid20(), 1);
    expect(convertWildShapeToSpellSlot(first, 1)).toBe(first);
  });
});
