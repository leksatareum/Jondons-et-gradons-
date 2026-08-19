import { describe, expect, it } from 'vitest';
import { applyWildShape } from './wild-shape';
import { effectiveWildShapeSaveModifier } from './wild-shape-proficiencies';

const moon = (level: number, wis = 18) => ({
  level,
  classId: 'druide',
  subclass: 'Cercle de la Lune',
  classLevels: [{ classId: 'druide', level, subclass: 'Cercle de la Lune' }],
  abilities: { str: 8, dex: 14, con: 14, int: 12, wis, cha: 10 },
  attacks: [{ id: 'staff', name: 'Bâton', dice: '1d6+2' }],
  hpTemp: 0,
  resources: [{ name: 'Forme sauvage', current: 2, max: 2 }],
  conditions: [],
  turn: { action: false, bonus: false, reaction: false },
  wildShapeKnownForms: ['camel', 'wolf', 'rat', 'spider'],
});

describe('Cercle de la Lune · Robustesse accrue', () => {
  it('n’ajoute pas SAG aux JS CON avant le niveau 6', () => {
    const shifted = applyWildShape(moon(5), 'camel');
    expect(effectiveWildShapeSaveModifier(shifted, 'con', 3, false)).toEqual({ modifier: 5, source: 'beast' });
  });

  it('ajoute SAG au meilleur bonus de JS CON en Forme sauvage au niveau 6+', () => {
    const shifted = applyWildShape(moon(6), 'camel');
    expect(effectiveWildShapeSaveModifier(shifted, 'con', 3, false)).toEqual({ modifier: 9, source: 'beast' });
  });

  it('ne modifie pas les autres sauvegardes', () => {
    const shifted = applyWildShape(moon(6), 'camel');
    expect(effectiveWildShapeSaveModifier(shifted, 'dex', 3, false)).toEqual({ modifier: -1, source: 'character' });
  });
});
