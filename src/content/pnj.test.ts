import { describe, expect, it } from 'vitest';
import {
  APPARENCES, SECRETS, STYLES_DE_NOM,
  fpMaximalPourAllie, loyauteDuGroupe, MOUVEMENTS_DE_LOYAUTE, sensDeLaLoyaute,
} from './pnj';

describe('les tables du Guide', () => {
  it('donne les douze apparences du 1d12', () => {
    // Le Guide tire l'apparence sur un d12 : onze entrées voudraient dire
    // qu'un résultat sur douze ne renvoie rien.
    expect(APPARENCES).toHaveLength(12);
    expect(new Set(APPARENCES).size).toBe(12);
  });

  it('donne les dix secrets du 1d10', () => {
    expect(SECRETS).toHaveLength(10);
    expect(new Set(SECRETS).size).toBe(10);
  });

  it('rappelle les six styles de nom', () => {
    expect(STYLES_DE_NOM).toHaveLength(6);
    for (const style of STYLES_DE_NOM) {
      expect(style.exemple, style.nom).toBeTruthy();
    }
  });

  it('ne fait passer aucune entrée pour un nom tiré du livre', () => {
    // Les six tables de noms sont illisibles sur notre exemplaire (deux tables
    // par colonne, numéros de ligne indépendants). Les styles sont un
    // aide-mémoire : ils décrivent une sonorité, ils ne donnent pas de noms.
    for (const style of STYLES_DE_NOM) {
      expect(/^[A-ZÀ-Ý]/.test(style.exemple), style.nom).toBe(false);
    }
  });
});

describe('la loyauté', () => {
  it('se cale sur le plus haut Charisme du groupe', () => {
    // Veya 15, Dauby 12, Thorin 10 : maximum 15, départ 7.
    expect(loyauteDuGroupe([10, 15, 12])).toEqual({ maximum: 15, depart: 7 });
  });

  it('arrondit le départ vers le bas', () => {
    expect(loyauteDuGroupe([15])!.depart).toBe(7);
    expect(loyauteDuGroupe([16])!.depart).toBe(8);
  });

  it('ne renvoie rien tant qu’aucune fiche n’a de Charisme', () => {
    // Un écran vide vaut mieux qu'un maximum de 0, qui afficherait un PNJ
    // déjà prêt à trahir.
    expect(loyauteDuGroupe([])).toBeNull();
    expect(loyauteDuGroupe([0, Number.NaN])).toBeNull();
  });

  it('marque le zéro comme une rupture, pas comme une tiédeur', () => {
    expect(sensDeLaLoyaute(0)).toContain('plus dans l’intérêt du groupe');
    expect(sensDeLaLoyaute(9)).not.toBe(sensDeLaLoyaute(10));
  });

  it('chiffre chaque mouvement et dit quand il s’applique', () => {
    expect(MOUVEMENTS_DE_LOYAUTE.length).toBeGreaterThanOrEqual(3);
    for (const m of MOUVEMENTS_DE_LOYAUTE) {
      expect(/^\dd4$/.test(m.des), m.quand).toBe(true);
      expect(m.quand.length, m.des).toBeGreaterThan(20);
    }
  });
});

describe('le plafond d’un allié', () => {
  it('vaut la moitié du niveau du groupe', () => {
    // Le groupe est niveau 2 : un allié ne dépasse pas FP 1.
    expect(fpMaximalPourAllie(2)).toBe(1);
    expect(fpMaximalPourAllie(3)).toBe(1.5);
    expect(fpMaximalPourAllie(10)).toBe(5);
  });

  it('ne descend jamais sous zéro', () => {
    expect(fpMaximalPourAllie(0)).toBe(0);
    expect(fpMaximalPourAllie(-3)).toBe(0);
  });
});
