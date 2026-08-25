import { describe, expect, it } from 'vitest';
import { budgetDeRencontre, suggererComposition, xpDuFP } from './encounter-generator';
import type { CreatureTemplate } from '../content/creatures';

const creature = (id: string, cr: string): CreatureTemplate =>
  ({ id, name: id, ac: 10, hp: 10, speed: '9 m', cr, kind: 'humanoïde' });

describe('budget de rencontre (DMG 2024, niveaux 1 à 5)', () => {
  it('multiplie le budget par personnage par la taille du groupe', () => {
    expect(budgetDeRencontre(1, 4, 'faible')).toBe(200);
    expect(budgetDeRencontre(2, 3, 'moderee')).toBe(450);
    expect(budgetDeRencontre(5, 1, 'elevee')).toBe(1100);
  });

  it('refuse plutôt que d’inventer au-delà du niveau 5', () => {
    expect(budgetDeRencontre(6, 4, 'faible')).toBeNull();
    expect(budgetDeRencontre(20, 4, 'elevee')).toBeNull();
  });

  it('refuse un groupe vide', () => {
    expect(budgetDeRencontre(3, 0, 'faible')).toBeNull();
  });
});

describe('points d’expérience par facteur de puissance', () => {
  it('lit la table pour les FP connus', () => {
    expect(xpDuFP('1/8')).toBe(25);
    expect(xpDuFP('2')).toBe(450);
  });

  it('renvoie 0 pour un FP hors table, plutôt qu’une estimation', () => {
    expect(xpDuFP('10')).toBe(0);
    expect(xpDuFP('n’importe quoi')).toBe(0);
  });
});

describe('suggérer une composition homogène', () => {
  it('reste sous le budget', () => {
    const bestiaire = [creature('gobelin', '1/4'), creature('ogre', '2')];
    const composition = suggererComposition(200, bestiaire, () => 0);
    const depense = composition.reduce((total, c) => total + xpDuFP(c.cr), 0);
    expect(depense).toBeLessThanOrEqual(200);
    expect(composition.length).toBeGreaterThan(0);
  });

  it('ne propose qu’une seule créature à la fois (homogène)', () => {
    const bestiaire = [creature('gobelin', '1/4'), creature('ogre', '2')];
    const composition = suggererComposition(200, bestiaire, () => 0);
    expect(new Set(composition.map((c) => c.id)).size).toBe(1);
  });

  it('ignore les créatures qui dépassent le budget à elles seules', () => {
    const bestiaire = [creature('trop-cher', '5')];
    expect(suggererComposition(100, bestiaire)).toEqual([]);
  });

  it('un bestiaire vide ne renvoie rien', () => {
    expect(suggererComposition(500, [])).toEqual([]);
  });

  it('s’arrête à 12 exemplaires même avec un budget énorme', () => {
    const bestiaire = [creature('rat', '0')]; // 10 PX
    const composition = suggererComposition(100000, bestiaire, () => 0);
    expect(composition.length).toBe(12);
  });

  it('écarte le FP 0 par défaut — pas d’essaim de faucons pour une vraie menace', () => {
    const bestiaire = [creature('faucon', '0'), creature('gobelin', '1/4')];
    const composition = suggererComposition(600, bestiaire, () => 0);
    expect(composition[0]?.id).toBe('gobelin');
  });

  it('retombe sur le FP 0 si c’est la seule option qui rentre dans le budget', () => {
    const bestiaire = [creature('faucon', '0')];
    const composition = suggererComposition(50, bestiaire, () => 0);
    expect(composition[0]?.id).toBe('faucon');
  });
});
