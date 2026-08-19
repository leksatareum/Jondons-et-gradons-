import { describe, expect, it } from 'vitest';
import { CLASS_FEATURE_DESCRIPTIONS, CLASS_FEATURES, classFeaturesAt, classFeaturesUpTo } from './class-features';
import { CLASSES } from './classes';

describe('capacités de classe', () => {
  it('couvre les douze classes', () => {
    expect(Object.keys(CLASS_FEATURES)).toHaveLength(12);
    for (const klass of CLASSES) {
      expect(CLASS_FEATURES[klass.id], klass.id).toBeDefined();
    }
  });

  it('les niveaux sont dans la plage 1–20', () => {
    for (const [classId, byLevel] of Object.entries(CLASS_FEATURES)) {
      for (const level of Object.keys(byLevel)) {
        expect(Number(level), `${classId} niveau ${level}`).toBeGreaterThanOrEqual(1);
        expect(Number(level), `${classId} niveau ${level}`).toBeLessThanOrEqual(20);
      }
    }
  });
});

describe('dérivation par niveau', () => {
  it('cumule les capacités jusqu’au niveau atteint, pas au-delà', () => {
    const druide5 = classFeaturesUpTo('druide', 5);
    expect(druide5).toContain('Forme sauvage'); // niveau 2
    expect(druide5).toContain('Résurgence sauvage'); // niveau 5
    expect(druide5).not.toContain('Furie élémentaire'); // niveau 7
  });

  it('classFeaturesAt ne rend que les capacités du niveau exact', () => {
    expect(classFeaturesAt('druide', 5)).toEqual(['Résurgence sauvage']);
    expect(classFeaturesAt('druide', 4)).toEqual([]);
  });

  it('une classe inconnue ne fait pas planter la dérivation', () => {
    expect(classFeaturesUpTo('inexistante', 20)).toEqual([]);
    expect(classFeaturesAt('inexistante', 5)).toEqual([]);
  });

  it('l’Archidruide arrive au niveau 20 du Druide', () => {
    expect(classFeaturesAt('druide', 20)).toContain('Archidruide');
  });
});

describe('descriptions', () => {
  it('une description au moins pour les capacités de nos trois classes jouées', () => {
    const sansDescription = ['druide', 'rodeur', 'occultiste']
      .flatMap((classId) => classFeaturesUpTo(classId, 20))
      .filter((name) => !CLASS_FEATURE_DESCRIPTIONS[name]);
    expect([...new Set(sansDescription)].sort()).toEqual([]);
  });
});
