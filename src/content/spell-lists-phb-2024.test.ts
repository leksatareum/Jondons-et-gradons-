import { describe, expect, it } from 'vitest';
import { CATALOGUE, spellsForClass } from './spell-catalogue';

/**
 * Les listes de sorts des trois classes jouées, comptées contre le PHB 2024.
 *
 * Le catalogue vient de l'ancienne application et n'avait jamais été confronté
 * au livre. Cette vérification a trouvé trois erreurs :
 *
 * 1. **Charme-personne manquait à la liste du Druide** (p. 82). Le Druide y a
 *    droit au rang 1 ; l'application ne le lui proposait pas.
 * 2. **Rappel à la vie était sur la liste du Druide** (p. 84). Il n'y figure
 *    pas — c'est un sort de Barde, Clerc et Paladin. Un joueur pouvait le
 *    préparer sans y avoir droit.
 * 3. **Deux sorts existaient en double** sous deux identifiants : Peur
 *    (« Terreur ») et Métamorphose mineure (« Altération de soi »). Ils
 *    apparaissaient deux fois dans chaque liste qui les contient.
 *
 * Le décompte par rang est le garde-fou : il attrape aussi bien un sort ajouté
 * à tort qu'un sort oublié, sans dépendre de la traduction des noms.
 */

/** Nombre de sorts par rang, relevé dans les tables du livre. */
const LISTES: Record<string, { page: string; parRang: number[] }> = {
  // p. 82-84 : rangs 0 à 9.
  druide: { page: 'p. 82-84', parRang: [13, 18, 23, 17, 21, 15, 10, 6, 8, 4] },
  // p. 120-122 : le Rôdeur n'a pas de sorts mineurs et plafonne au rang 5.
  rodeur: { page: 'p. 120-122', parRang: [0, 14, 18, 16, 7, 6] },
  // p. 156-158 : la Magie de pacte plafonne au rang 5, l'Arcanum va au-delà.
  occultiste: { page: 'p. 156-158', parRang: [12, 15, 12, 14, 6, 9] },
};

describe('listes de sorts — décompte par rang contre le PHB 2024', () => {
  for (const [classId, { page, parRang }] of Object.entries(LISTES)) {
    describe(`${classId} (${page})`, () => {
      parRang.forEach((attendu, rang) => {
        it(`rang ${rang} : ${attendu} sort(s)`, () => {
          const trouves = spellsForClass(classId, rang);
          expect(trouves.map((spell) => spell.name).sort()).toHaveLength(attendu);
        });
      });
    });
  }
});

describe('les corrections trouvées par ce décompte', () => {
  const nomsDu = (classId: string, rang: number) =>
    spellsForClass(classId, rang).map((spell) => spell.id);

  it('Charme-personne est bien sur la liste du Druide (p. 82)', () => {
    expect(nomsDu('druide', 1)).toContain('charme-personne');
    // …et reste sur celles qui l'avaient déjà.
    for (const classe of ['barde', 'ensorceleur', 'occultiste', 'magicien']) {
      expect(nomsDu(classe, 1)).toContain('charme-personne');
    }
  });

  it('Rappel à la vie n’est PAS sur la liste du Druide (p. 84)', () => {
    expect(nomsDu('druide', 5)).not.toContain('rappel-vie');
    for (const classe of ['barde', 'clerc', 'paladin']) {
      expect(nomsDu(classe, 5)).toContain('rappel-vie');
    }
  });

  it('Peur et Métamorphose mineure n’existent plus qu’en un seul exemplaire', () => {
    expect(CATALOGUE.filter((spell) => spell.id === 'terreur')).toHaveLength(0);
    expect(CATALOGUE.filter((spell) => spell.id === 'alteration-soi')).toHaveLength(0);
    expect(CATALOGUE.filter((spell) => spell.id === 'peur')).toHaveLength(1);
    expect(CATALOGUE.filter((spell) => spell.id === 'metamorphose-mineure')).toHaveLength(1);
  });
});

describe('aucun identifiant en double dans le catalogue', () => {
  it('391 entrées devenues 389, toutes distinctes', () => {
    const ids = CATALOGUE.map((spell) => spell.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /**
   * Il n'y a pas de test automatique fiable du « même sort en double ».
   *
   * Une signature mécanique — rang, école, incantation, portée, durée, liste
   * de classes — donne des faux positifs : Aspersion acide et Rayon de givre
   * la partagent, Art druidique et Fouet épineux aussi, et ce sont bien des
   * sorts distincts. Comparer les descriptions ne marche pas davantage : les
   * deux entrées de Peur étaient reformulées différemment.
   *
   * Ce qui attrape réellement un doublon, c'est le décompte par rang
   * ci-dessus : un sort en trop dans une liste s'y voit immédiatement. C'est
   * ainsi que les deux ont été trouvés, et c'est ce qui protège la suite.
   */
  it('le décompte par rang reste le seul garde-fou honnête', () => {
    expect(Object.keys(LISTES)).toEqual(['druide', 'rodeur', 'occultiste']);
  });
});
