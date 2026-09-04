import { describe, expect, it } from 'vitest';
import {
  COMPLICATIONS, COMPLICATIONS_NATURE, COMPLICATIONS_VILLE,
  FACTEURS_DE_FUITE, LIBELLE_TERRAIN, pointesGratuites, tirerComplication,
} from './poursuites';

describe('les tables de complications', () => {
  it('donne six entrées de chaque côté, numérotées 1 à 6', () => {
    // Le d12 ne touche que 1-6 ; 7-12 ne déclenchent rien. Une table de cinq
    // entrées voudrait dire qu'un résultat renvoie un trou.
    for (const [terrain, table] of Object.entries(COMPLICATIONS)) {
      expect(table.map((c) => c.rang), terrain).toEqual([1, 2, 3, 4, 5, 6]);
    }
  });

  it('nomme les deux terrains', () => {
    for (const terrain of Object.keys(COMPLICATIONS)) {
      expect(LIBELLE_TERRAIN[terrain as keyof typeof LIBELLE_TERRAIN], terrain).toBeTruthy();
    }
  });

  it('chiffre chaque complication qui demande un jet', () => {
    // Une complication sans DD ne se joue pas : il faudrait rouvrir le livre,
    // ce que cet écran existe précisément pour éviter.
    for (const table of Object.values(COMPLICATIONS)) {
      for (const c of table.filter((entree) => /[Ss]auvegarde/.test(entree.texte))) {
        expect(/DD \d+/.test(c.texte), c.texte.slice(0, 40)).toBe(true);
      }
    }
  });

  it('garde la symétrie imprimée : le DD 15 est le cinquième des deux côtés', () => {
    // C'est ce recoupement qui a permis de démêler deux colonnes entrelacées.
    // S'il saute, c'est que la répartition entre ville et nature a bougé.
    expect(COMPLICATIONS_VILLE.find((c) => c.texte.includes('DD 15'))!.rang).toBe(5);
    expect(COMPLICATIONS_NATURE.find((c) => c.texte.includes('DD 15'))!.rang).toBe(5);
  });

  it('range chaque entrée du bon côté', () => {
    // Le scan entrelace les deux colonnes et INVERSE leur ordre à mi-table :
    // seule la cohérence du contenu tranche. Ces témoins la verrouillent.
    const ville = COMPLICATIONS_VILLE.map((c) => c.texte).join(' ');
    const nature = COMPLICATIONS_NATURE.map((c) => c.texte).join(' ');
    for (const mot of ['foule', 'charrette', 'rixe', 'huile']) {
      expect(ville, mot).toContain(mot);
      expect(nature, mot).not.toContain(mot);
    }
    for (const mot of ['insectes', 'ravin', 'ronce-rasoir', 'pollen']) {
      expect(nature, mot).toContain(mot);
      expect(ville, mot).not.toContain(mot);
    }
  });

  it('reprend les chiffres de la ronce-rasoir lus à une autre page', () => {
    const ronce = COMPLICATIONS_NATURE.find((c) => c.texte.includes('ronce-rasoir'))!;
    expect(ronce.texte).toContain('DD 15');
    expect(ronce.texte).toContain('1d10');
  });
});

describe('le d12 de fin de tour', () => {
  it('ne déclenche rien de 7 à 12', () => {
    for (let de = 7; de <= 12; de += 1) {
      const { complication } = tirerComplication('ville', () => (de - 1) / 12);
      expect(complication, `dé ${de}`).toBeNull();
    }
  });

  it('rend la bonne entrée de 1 à 6', () => {
    for (let de = 1; de <= 6; de += 1) {
      const tirage = tirerComplication('nature', () => (de - 1) / 12);
      expect(tirage.de).toBe(de);
      expect(tirage.complication!.rang).toBe(de);
    }
  });

  it('ne sort pas de la table sur le dernier résultat du dé', () => {
    expect(tirerComplication('ville', () => 0.999999).de).toBe(12);
  });
});

describe('les Pointes', () => {
  it('valent 3 plus le modificateur de Constitution', () => {
    // Dauby, Constitution 14 : modificateur +2, donc cinq Pointes.
    expect(pointesGratuites(2)).toBe(5);
    expect(pointesGratuites(0)).toBe(3);
  });

  it('ne descendent jamais sous une', () => {
    // Le Guide impose un minimum d'une : sans lui, un personnage à
    // Constitution 6 ne pourrait pas courir du tout.
    expect(pointesGratuites(-2)).toBe(1);
    expect(pointesGratuites(-5)).toBe(1);
  });
});

describe('les facteurs de fuite', () => {
  it('donne autant d’avantages que de désavantages', () => {
    const avantages = FACTEURS_DE_FUITE.filter((f) => f.sens === 'avantage');
    expect(avantages).toHaveLength(FACTEURS_DE_FUITE.length - avantages.length);
  });
});
