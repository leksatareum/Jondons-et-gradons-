import { describe, expect, it } from 'vitest';
import { CLASSES, classById } from './classes';

describe('les douze classes du PHB 2024', () => {
  it('douze classes, ids uniques', () => {
    expect(CLASSES).toHaveLength(12);
    expect(new Set(CLASSES.map((klass) => klass.id)).size).toBe(12);
  });

  it('classById retrouve une classe par id', () => {
    expect(classById('druide')?.hitDie).toBe(8);
    expect(classById('inexistante')).toBeUndefined();
  });

  it('nos trois classes jouées : dé de vie, sauvegardes et type de lanceur', () => {
    expect(classById('occultiste')).toMatchObject({ hitDie: 8, saves: ['wis', 'cha'], caster: 'pact' });
    expect(classById('druide')).toMatchObject({ hitDie: 8, saves: ['int', 'wis'], caster: 'full' });
    expect(classById('rodeur')).toMatchObject({ hitDie: 10, saves: ['str', 'dex'], caster: 'half' });
  });

  it('le Guerrier et le Roublard ont des niveaux d’ASI supplémentaires par rapport à la table standard', () => {
    expect(classById('guerrier')?.asi).toHaveLength(7);
    expect(classById('roublard')?.asi).toHaveLength(6);
    expect(classById('druide')?.asi).toEqual([4, 8, 12, 16, 19]);
  });
});
