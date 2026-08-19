import { describe, expect, it } from 'vitest';
import { SUBCLASSES, subclassByName, subclassFeaturesUpTo, subclassGroupFor } from './subclasses';
import { CLASSES } from './classes';

describe('les 48 sous-classes du PHB 2024', () => {
  it('quarante-huit sous-classes réparties sur les douze classes', () => {
    const total = Object.values(SUBCLASSES).reduce((n, group) => n + group.options.length, 0);
    expect(total).toBe(48);
    expect(Object.keys(SUBCLASSES)).toHaveLength(12);
  });

  it('chaque classe a son groupe de sous-classes', () => {
    for (const klass of CLASSES) {
      expect(subclassGroupFor(klass.id), klass.id).toBeDefined();
    }
  });

  it('toutes les sous-classes se choisissent au niveau 3 en 2024', () => {
    for (const [classId, group] of Object.entries(SUBCLASSES)) {
      expect(group.choiceLevel, classId).toBe(3);
    }
  });

  it('les noms de sous-classe sont uniques dans tout le jeu (ils servent de clé sur la fiche)', () => {
    const names = Object.values(SUBCLASSES).flatMap((group) => group.options.map((option) => option.name));
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('capacités de sous-classe', () => {
  it('cumule jusqu’au niveau atteint, pas au-delà', () => {
    const lune5 = subclassFeaturesUpTo('Cercle de la Lune', 5).map((feature) => feature.level);
    expect(lune5.every((level) => level <= 5)).toBe(true);
    expect(subclassFeaturesUpTo('Cercle de la Lune', 2)).toEqual([]);
  });

  it('une sous-classe absente ou nulle ne fait pas planter la dérivation', () => {
    expect(subclassFeaturesUpTo(null, 20)).toEqual([]);
    expect(subclassFeaturesUpTo('Cercle inexistant', 20)).toEqual([]);
    expect(subclassByName('Cercle inexistant')).toBeUndefined();
  });

  it('chaque capacité a un niveau entre 3 et 20 et une description', () => {
    for (const group of Object.values(SUBCLASSES)) {
      for (const option of group.options) {
        for (const feature of option.features) {
          expect(feature.level, `${option.name} · ${feature.name}`).toBeGreaterThanOrEqual(3);
          expect(feature.level, `${option.name} · ${feature.name}`).toBeLessThanOrEqual(20);
          expect(feature.desc, `${option.name} · ${feature.name}`).toBeTruthy();
        }
      }
    }
  });

  it('les sous-classes de nos trois classes jouées sont présentes', () => {
    for (const name of ['Cercle de la Lune', 'Cercle de la Terre', 'Chasseur', 'Patron Fiélon', 'Patron Grand Ancien']) {
      expect(subclassByName(name), name).toBeDefined();
    }
  });
});
