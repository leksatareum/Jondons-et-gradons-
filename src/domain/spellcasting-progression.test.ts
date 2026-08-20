import { describe, expect, it } from 'vitest';
import {
  cantripsKnown,
  fullCasterSlots,
  halfCasterSlots,
  tabledPreparedSpellCount,
  pactMagicSlots,
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
    expect(cantripsKnown('paladin', 20)).toBe(0);
  });

  it('confirmé contre le PHB 2024 : même palier (4 et 10) pour les six classes', () => {
    // barde 2/3/4, clerc 3/4/5, druide 2/3/4, ensorceleur 4/5/6,
    // magicien 3/4/5, occultiste 2/3/4 — un seul point de départ par classe,
    // la même progression pour toutes.
    const attendu: Record<string, [number, number, number]> = {
      barde: [2, 3, 4], clerc: [3, 4, 5], druide: [2, 3, 4],
      ensorceleur: [4, 5, 6], magicien: [3, 4, 5], occultiste: [2, 3, 4],
    };
    for (const [classe, [avant4, avant10, apres10]] of Object.entries(attendu)) {
      expect(cantripsKnown(classe as never, 3)).toBe(avant4);
      expect(cantripsKnown(classe as never, 4)).toBe(avant10);
      expect(cantripsKnown(classe as never, 9)).toBe(avant10);
      expect(cantripsKnown(classe as never, 10)).toBe(apres10);
      expect(cantripsKnown(classe as never, 20)).toBe(apres10);
    }
  });
});

describe('grimoire du Magicien', () => {
  it('6 sorts au niveau 1, +2 par niveau, 44 au niveau 20', () => {
    expect(wizardSpellbookSize(1)).toBe(6);
    expect(wizardSpellbookSize(20)).toBe(44);
  });
});

describe('sorts préparés — lus dans la table, jamais calculés (PHB 2024)', () => {
  it('un Druide niveau 1 prépare 4 sorts, quelle que soit sa Sagesse', () => {
    expect(tabledPreparedSpellCount('druide', 1)).toBe(4);
  });
  it('Clerc et Druide partagent la progression des lanceurs complets', () => {
    for (let niveau = 1; niveau <= 20; niveau += 1) {
      expect(tabledPreparedSpellCount('clerc', niveau))
        .toBe(tabledPreparedSpellCount('druide', niveau));
      expect(tabledPreparedSpellCount('barde', niveau))
        .toBe(tabledPreparedSpellCount('druide', niveau));
    }
  });
  it('Paladin et Rôdeur ont la même progression de demi-lanceurs', () => {
    for (let niveau = 1; niveau <= 20; niveau += 1) {
      expect(tabledPreparedSpellCount('paladin', niveau))
        .toBe(tabledPreparedSpellCount('rodeur', niveau));
    }
  });
  it('le Magicien s’écarte des autres lanceurs complets à partir du niveau 14', () => {
    expect(tabledPreparedSpellCount('magicien', 13)).toBe(tabledPreparedSpellCount('clerc', 13));
    expect(tabledPreparedSpellCount('magicien', 14)).toBe(18);
    expect(tabledPreparedSpellCount('clerc', 14)).toBe(17);
    expect(tabledPreparedSpellCount('magicien', 20)).toBe(25);
  });
  it('le grimoire du Magicien n’est pas sa liste préparée', () => {
    // Le répertoire où il puise, et ce qu'il en a tiré aujourd'hui : au
    // niveau 20, 44 sorts inscrits au minimum pour 25 préparés.
    expect(wizardSpellbookSize(20)).toBe(44);
    expect(tabledPreparedSpellCount('magicien', 20)).toBe(25);
    expect(wizardSpellbookSize(1)).toBe(6);
    expect(tabledPreparedSpellCount('magicien', 1)).toBe(4);
  });
});

describe('sorts préparés — Occultiste (vérifié PHB 2024)', () => {
  it('niveau 1 : deux sorts préparés', () => {
    expect(tabledPreparedSpellCount('occultiste', 1)).toBe(2);
  });
  it('niveau 20 : quinze sorts préparés', () => {
    expect(tabledPreparedSpellCount('occultiste', 20)).toBe(15);
  });
});

describe('sorts préparés — les huit classes lanceuses ont leur table', () => {
  it('aucune classe lanceuse ne reste sans nombre', () => {
    const lanceuses = ['barde', 'clerc', 'druide', 'ensorceleur',
      'magicien', 'occultiste', 'paladin', 'rodeur'] as const;
    for (const classe of lanceuses) {
      for (const niveau of [1, 5, 11, 20]) {
        expect(tabledPreparedSpellCount(classe, niveau)).toBeGreaterThan(0);
      }
    }
  });

  it('une classe sans magie n’a pas de nombre à lire', () => {
    expect(tabledPreparedSpellCount('roublard' as never, 5)).toBeNull();
    expect(tabledPreparedSpellCount('guerrier' as never, 5)).toBeNull();
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

});
