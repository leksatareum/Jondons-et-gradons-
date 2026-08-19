import { describe, expect, it } from 'vitest';
import { BACKGROUNDS, backgroundById } from './backgrounds';

describe('les seize origines du PHB 2024', () => {
  it('seize origines, ids uniques', () => {
    expect(BACKGROUNDS).toHaveLength(16);
    expect(new Set(BACKGROUNDS.map((background) => background.id)).size).toBe(16);
  });

  it('chaque origine a deux compétences et un don d’origine', () => {
    for (const background of BACKGROUNDS) {
      expect(background.skills).toHaveLength(2);
      expect(background.feat).toBeTruthy();
      expect(background.featId).toBeTruthy();
    }
  });

  it('chaque origine a soit un outil fixe, soit une catégorie au choix, jamais les deux ni aucun', () => {
    for (const background of BACKGROUNDS) {
      expect(Boolean(background.tool) !== Boolean(background.toolChoice)).toBe(true);
    }
  });

  it('backgroundById retrouve une origine par id', () => {
    expect(backgroundById('guide')?.feat).toBe('Initié à la magie (Druide)');
    expect(backgroundById('inexistante')).toBeUndefined();
  });
});
