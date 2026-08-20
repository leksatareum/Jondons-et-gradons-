import { describe, expect, it } from 'vitest';
import {
  cantripsKnown,
  fullCasterSlots,
  halfCasterSlots,
  tabledPreparedSpellCount,
  spellSwapRule,
  pactMagicSlots,
  preparedSpellCount,
  wizardSpellbookSize,
} from './spellcasting-progression';

describe('emplacements de sort — lanceurs complets (PHB 2024)', () => {
  it('niveau 1 : un emplacement de rang 1', () => {
    expect(fullCasterSlots(1)).toEqual([2]);
  });
  it('niveau 5 : 4/3/2', () => {
    expect(fullCasterSlots(5)).toEqual([4, 3, 2]);
  });
  it('niveau 20 : neuf rangs, plafond 4/3/3/3/3/2/2/1/1', () => {
    expect(fullCasterSlots(20)).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1]);
  });
});

describe('emplacements de sort — lanceurs partiels (PHB 2024 : dès le niveau 1)', () => {
  it('niveau 1 : deux emplacements de rang 1, pas zéro', () => {
    expect(halfCasterSlots(1)).toEqual([2]);
  });
  it('niveau 20 : 4/3/3/3/2', () => {
    expect(halfCasterSlots(20)).toEqual([4, 3, 3, 3, 2]);
  });
});

describe('magie occulte (Pacte) — Occultiste', () => {
  it('niveau 1 : un emplacement de rang 1', () => {
    expect(pactMagicSlots(1)).toEqual({ slots: 1, slotLevel: 1 });
  });
  it('niveau 11 : trois emplacements de rang 5', () => {
    expect(pactMagicSlots(11)).toEqual({ slots: 3, slotLevel: 5 });
  });
  it('niveau 20 : quatre emplacements de rang 5', () => {
    expect(pactMagicSlots(20)).toEqual({ slots: 4, slotLevel: 5 });
  });
});

describe('sorts mineurs connus', () => {
  it('base au niveau 1', () => {
    expect(cantripsKnown('druide', 1)).toBe(2);
    expect(cantripsKnown('occultiste', 1)).toBe(2);
    expect(cantripsKnown('magicien', 1)).toBe(3);
  });
  it('palier +1 au niveau 4 puis +1 au niveau 10', () => {
    expect(cantripsKnown('druide', 4)).toBe(3);
    expect(cantripsKnown('druide', 10)).toBe(4);
  });
  it('une classe sans sorts mineurs renvoie 0', () => {
    expect(cantripsKnown('rodeur', 20)).toBe(0);
  });
});

describe('grimoire du Magicien', () => {
  it('6 sorts au niveau 1, +2 par niveau, 44 au niveau 20', () => {
    expect(wizardSpellbookSize(1)).toBe(6);
    expect(wizardSpellbookSize(20)).toBe(44);
  });
});

describe('sorts préparés — dérivé du modificateur, pas d’une table figée', () => {
  it('un Druide niveau 1 avec Sagesse +3 prépare 4 sorts', () => {
    expect(preparedSpellCount(3, 1)).toBe(4);
  });
  it('à niveau égal, un modificateur plus élevé prépare plus de sorts', () => {
    const faible = preparedSpellCount(1, 5);
    const fort = preparedSpellCount(4, 5);
    expect(fort).toBeGreaterThan(faible);
    expect(fort - faible).toBe(3);
  });
  it('minimum 1, même avec un modificateur négatif', () => {
    expect(preparedSpellCount(-2, 1)).toBe(1);
  });
});

describe('sorts connus — Occultiste (vérifié PHB 2024)', () => {
  it('niveau 1 : deux sorts connus', () => {
    expect(tabledPreparedSpellCount('occultiste', 1)).toBe(2);
  });
  it('niveau 20 : quinze sorts connus', () => {
    expect(tabledPreparedSpellCount('occultiste', 20)).toBe(15);
  });
});

describe('sorts connus — table absente pour une classe non reconstruite', () => {
  it('barde et ensorceleur renvoient null tant que non vérifiés contre le PHB', () => {
    expect(tabledPreparedSpellCount('barde', 5)).toBe(9);
    expect(tabledPreparedSpellCount('ensorceleur', 5)).toBe(9);
    expect(tabledPreparedSpellCount('paladin' as never, 5)).toBeNull();
  });
});

describe('sorts préparés — les classes qui lisent une table', () => {
  /**
   * Ces valeurs ont été relevées dans le PHB 2024 (Barde p. 60, Rôdeur p. 120,
   * Ensorceleur p. 140, Occultiste p. 154). Les figer ici évite qu'une
   * réécriture les remplace un jour par une formule qui « paraît » juste.
   */
  it('lit les bornes de chaque table', () => {
    expect(tabledPreparedSpellCount('occultiste', 1)).toBe(2);
    expect(tabledPreparedSpellCount('occultiste', 20)).toBe(15);
    expect(tabledPreparedSpellCount('rodeur', 1)).toBe(2);
    expect(tabledPreparedSpellCount('rodeur', 20)).toBe(15);
    expect(tabledPreparedSpellCount('barde', 1)).toBe(4);
    expect(tabledPreparedSpellCount('barde', 20)).toBe(22);
    expect(tabledPreparedSpellCount('ensorceleur', 1)).toBe(2);
    expect(tabledPreparedSpellCount('ensorceleur', 20)).toBe(22);
  });

  it('ne dépend jamais de la caractéristique d’incantation', () => {
    // Deux occultistes de même niveau préparent autant de sorts, quel que
    // soit leur Charisme : la table ne prend pas le modificateur en argument.
    expect(tabledPreparedSpellCount('occultiste', 5)).toBe(6);
    expect(tabledPreparedSpellCount.length).toBe(2);
  });

  it('le rôdeur rouvre sa liste au repos long, l’occultiste en montant de niveau', () => {
    expect(spellSwapRule('rodeur')).toEqual({ when: 'repos-long', count: 1 });
    expect(spellSwapRule('occultiste')).toEqual({ when: 'montee-de-niveau', count: 1 });
    expect(spellSwapRule('druide')).toBeNull();
  });
});
