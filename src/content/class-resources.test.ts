import { describe, expect, it } from 'vitest';
import { CLASS_RESOURCES, classResourcesFor, RESSOURCES_A_VERIFIER } from './class-resources';
import { CLASSES } from './classes';
import type { AbilityScores } from '../model/character';

/**
 * Chaque chiffre est épinglé ici, palier par palier.
 *
 * C'est le but : ces valeurs sont écrites de mémoire du PHB 2024 (voir
 * l'en-tête de `class-resources.ts`), donc une correction doit se voir. Un
 * test qui casse quand on change un palier n'est pas une gêne, c'est la
 * fonction de ce fichier.
 */

const CARACS: AbilityScores = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
const avecCha = (cha: number): AbilityScores => ({ ...CARACS, cha });

/** La réserve `key` d'un personnage mono-classe de niveau `niveau`. */
const reserve = (classId: string, niveau: number, key: string, abilities = CARACS) =>
  classResourcesFor([{ classId, level: niveau }], abilities).find((r) => r.key === key);

const max = (classId: string, niveau: number, key: string, abilities = CARACS) =>
  reserve(classId, niveau, key, abilities)?.max;

describe('cohérence de la table', () => {
  it('ne déclare que des classes qui existent', () => {
    const connues = new Set(CLASSES.map((c) => c.id));
    for (const definition of CLASS_RESOURCES) expect(connues).toContain(definition.classId);
  });

  it('ne double jamais une clé — deux réserves confondues, ce serait une réserve perdue', () => {
    const clefs = CLASS_RESOURCES.map((r) => r.key);
    expect(new Set(clefs).size).toBe(clefs.length);
  });

  it('préfixe chaque clé par sa classe, pour ne pas collisionner avec une autre', () => {
    for (const definition of CLASS_RESOURCES) {
      expect(definition.key.startsWith(`${definition.classId}:`)).toBe(true);
    }
  });

  it('laisse les trois classes déjà écrites à la main en dehors de cette table', () => {
    // Sinon un Druide aurait deux Formes sauvages, chacune comptée à part.
    const ecritesAlaMain = ['druide', 'rodeur', 'occultiste'];
    for (const definition of CLASS_RESOURCES) {
      expect(ecritesAlaMain).not.toContain(definition.classId);
    }
  });

  it('n’annonce comme sûr que ce qui l’est, et documente le reste', () => {
    for (const definition of RESSOURCES_A_VERIFIER) expect(definition.note).toBeTruthy();
  });
});

describe('Barbare — Rage', () => {
  it.each([[1, 2], [2, 2], [3, 3], [5, 3], [6, 4], [11, 4], [12, 5], [16, 5], [17, 6], [20, 6]])(
    'niveau %i : %i rages',
    (niveau, attendu) => expect(max('barbare', niveau, 'barbare:rage')).toBe(attendu),
  );

  it('revient entièrement au repos long, une seule au repos court', () => {
    const rage = reserve('barbare', 5, 'barbare:rage');
    expect(rage?.recharge).toBe('long');
    expect(rage?.shortRecovery).toBe(1);
  });
});

describe('Barde — Inspiration bardique', () => {
  it('vaut le modificateur de Charisme', () => {
    expect(max('barde', 1, 'barde:inspiration', avecCha(16))).toBe(3);
    expect(max('barde', 12, 'barde:inspiration', avecCha(20))).toBe(5);
  });

  it('ne descend jamais sous 1, même avec un Charisme catastrophique', () => {
    // Un barde à 8 en Charisme est un choix, pas une raison de n'avoir aucune
    // inspiration — le livre pose un minimum de 1.
    expect(max('barde', 1, 'barde:inspiration', avecCha(8))).toBe(1);
  });

  it('existe dès le niveau 1', () => {
    expect(reserve('barde', 1, 'barde:inspiration')).toBeDefined();
  });
});

describe('Clerc — Conduit divin', () => {
  it('n’existe pas au niveau 1', () => {
    expect(reserve('clerc', 1, 'clerc:conduit-divin')).toBeUndefined();
  });

  it.each([[2, 2], [5, 2], [6, 3], [17, 3], [18, 4], [20, 4]])(
    'niveau %i : %i utilisations',
    (niveau, attendu) => expect(max('clerc', niveau, 'clerc:conduit-divin')).toBe(attendu),
  );
});

describe('Guerrier', () => {
  it.each([[1, 2], [3, 2], [4, 3], [9, 3], [10, 4], [20, 4]])(
    'Second souffle, niveau %i : %i',
    (niveau, attendu) => expect(max('guerrier', niveau, 'guerrier:second-souffle')).toBe(attendu),
  );

  it('Fougue guerrière : une, puis deux à partir du niveau 17', () => {
    expect(reserve('guerrier', 1, 'guerrier:fougue-guerriere')).toBeUndefined();
    expect(max('guerrier', 2, 'guerrier:fougue-guerriere')).toBe(1);
    expect(max('guerrier', 16, 'guerrier:fougue-guerriere')).toBe(1);
    expect(max('guerrier', 17, 'guerrier:fougue-guerriere')).toBe(2);
  });

  it('Indomptable : rien avant 9, puis 1 / 2 / 3', () => {
    expect(reserve('guerrier', 8, 'guerrier:indomptable')).toBeUndefined();
    expect(max('guerrier', 9, 'guerrier:indomptable')).toBe(1);
    expect(max('guerrier', 13, 'guerrier:indomptable')).toBe(2);
    expect(max('guerrier', 17, 'guerrier:indomptable')).toBe(3);
  });
});

describe('Moine — Points de concentration', () => {
  it('n’existe pas au niveau 1, puis vaut le niveau de Moine', () => {
    expect(reserve('moine', 1, 'moine:concentration')).toBeUndefined();
    expect(max('moine', 2, 'moine:concentration')).toBe(2);
    expect(max('moine', 11, 'moine:concentration')).toBe(11);
    expect(max('moine', 20, 'moine:concentration')).toBe(20);
  });

  it('revient entièrement au repos court', () => {
    expect(reserve('moine', 5, 'moine:concentration')?.recharge).toBe('court_ou_long');
  });
});

describe('Paladin', () => {
  it('Imposition des mains : cinq points de vie par niveau', () => {
    expect(max('paladin', 1, 'paladin:imposition-des-mains')).toBe(5);
    expect(max('paladin', 6, 'paladin:imposition-des-mains')).toBe(30);
    expect(max('paladin', 20, 'paladin:imposition-des-mains')).toBe(100);
  });

  it('Conduit divin : rien avant 3, deux puis trois au niveau 11', () => {
    expect(reserve('paladin', 2, 'paladin:conduit-divin')).toBeUndefined();
    expect(max('paladin', 3, 'paladin:conduit-divin')).toBe(2);
    expect(max('paladin', 11, 'paladin:conduit-divin')).toBe(3);
  });
});

describe('Ensorceleur — Points de sorcellerie', () => {
  it('n’existe pas au niveau 1, puis vaut le niveau', () => {
    expect(reserve('ensorceleur', 1, 'ensorceleur:points-sorcellerie')).toBeUndefined();
    expect(max('ensorceleur', 2, 'ensorceleur:points-sorcellerie')).toBe(2);
    expect(max('ensorceleur', 20, 'ensorceleur:points-sorcellerie')).toBe(20);
  });
});

describe('Magicien — Récupération arcanique', () => {
  it('une fois par repos long, dès le niveau 1', () => {
    const r = reserve('magicien', 1, 'magicien:recuperation-arcanique');
    expect(r?.max).toBe(1);
    expect(r?.recharge).toBe('long');
  });
});

describe('Roublard', () => {
  it('n’a aucune réserve avant le niveau 20 — et ce n’est pas un oubli', () => {
    expect(classResourcesFor([{ classId: 'roublard', level: 19 }], CARACS)).toEqual([]);
    expect(max('roublard', 20, 'roublard:coup-de-chance')).toBe(1);
  });
});

describe('multiclassage — chaque réserve lit le niveau de SA classe', () => {
  it('un Paladin 6 / Guerrier 2 a 30 points d’Imposition des mains, pas 40', () => {
    const reserves = classResourcesFor(
      [{ classId: 'paladin', level: 6 }, { classId: 'guerrier', level: 2 }], CARACS,
    );
    expect(reserves.find((r) => r.key === 'paladin:imposition-des-mains')?.max).toBe(30);
  });

  it('et il porte bien les réserves des DEUX classes', () => {
    const reserves = classResourcesFor(
      [{ classId: 'paladin', level: 6 }, { classId: 'guerrier', level: 2 }], CARACS,
    ).map((r) => r.key);
    expect(reserves).toContain('paladin:conduit-divin');
    expect(reserves).toContain('guerrier:fougue-guerriere');
    expect(reserves).toContain('guerrier:second-souffle');
  });

  it('un Guerrier 1 n’a pas encore Fougue guerrière, même multiclassé', () => {
    const reserves = classResourcesFor(
      [{ classId: 'paladin', level: 10 }, { classId: 'guerrier', level: 1 }], CARACS,
    ).map((r) => r.key);
    expect(reserves).not.toContain('guerrier:fougue-guerriere');
  });

  it('une classe absente n’apporte rien', () => {
    expect(classResourcesFor([{ classId: 'magicien', level: 5 }], CARACS).map((r) => r.key))
      .toEqual(['magicien:recuperation-arcanique']);
  });
});
