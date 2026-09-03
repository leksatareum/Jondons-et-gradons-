import { describe, expect, it } from 'vitest';
import {
  butinDuGroupe, DEGRES_DE_DIFFICULTE, fpEnNombre, TRESOR_DE_RESERVE,
  tresorDeReserve, tresorIndividuel, TRESOR_INDIVIDUEL,
} from './tresor';

/** Un dé toujours au maximum, puis toujours au minimum : les deux bornes d'un jet. */
const max = () => 0.999999;
const min = () => 0;

describe('tranches de facteur de puissance', () => {
  it('range les FP fractionnaires avec les FP 0 à 4', () => {
    expect(fpEnNombre('1/8')).toBe(0);
    expect(fpEnNombre('1/2')).toBe(0);
    expect(fpEnNombre('3')).toBe(3);
    expect(fpEnNombre('n’importe quoi')).toBe(0);
  });
});

describe('trésor individuel (Guide du Maître p. 120)', () => {
  it('respecte les bornes de la formule imprimée', () => {
    // FP 0-4 : 3d6 po, donc entre 3 et 18.
    expect(tresorIndividuel('1/4', min)!.montant).toBe(3);
    expect(tresorIndividuel('1/4', max)!.montant).toBe(18);
    // FP 5-10 : 2d8 × 10 po, donc entre 20 et 160.
    expect(tresorIndividuel('7', min)!.montant).toBe(20);
    expect(tresorIndividuel('7', max)!.montant).toBe(160);
    // FP 11-16 : 2d10 × 10 PLATINE — la monnaie change, pas seulement le montant.
    expect(tresorIndividuel('12', max)!.monnaie).toBe('pp');
  });

  it('encadre la moyenne imprimée de chaque ligne', () => {
    for (const ligne of TRESOR_INDIVIDUEL) {
      if (!ligne) continue;
      const bas = tresorIndividuel('1/4', min);
      expect(bas).not.toBeNull();
      // La moyenne annoncée par le livre doit tomber entre les deux bornes de
      // sa propre formule : c'est ce qui a permis de rattraper les
      // multiplicateurs abîmés par l'océrisation.
      const [nombre, faces] = ligne.des.split('d').map(Number);
      expect(ligne.moyenne).toBeGreaterThanOrEqual(nombre * ligne.multiplicateur);
      expect(ligne.moyenne).toBeLessThanOrEqual(nombre * faces * ligne.multiplicateur);
    }
  });

  it('ne rend rien au-delà du FP 16, plutôt qu’un trésor inventé', () => {
    expect(tresorIndividuel('20')).toBeNull();
    expect(butinDuGroupe('20', 3)).toBeNull();
  });

  it('multiplie par l’effectif du groupe, en un seul jet', () => {
    // Le Guide autorise un jet unique pour un groupe semblable.
    expect(butinDuGroupe('1/4', 4, max)!.montant).toBe(18 * 4);
  });
});

describe('trésor de réserve (Guide du Maître p. 121)', () => {
  it('encadre la moyenne imprimée de chaque ligne', () => {
    for (const { tresor } of TRESOR_DE_RESERVE) {
      const [nombre, faces] = tresor.des.split('d').map(Number);
      expect(tresor.moyenne).toBeGreaterThanOrEqual(nombre * tresor.multiplicateur);
      expect(tresor.moyenne).toBeLessThanOrEqual(nombre * faces * tresor.multiplicateur);
    }
  });

  it('redonne exactement la moyenne du livre au jet moyen', () => {
    // C'est ce recoupement qui a tranché les deux multiplicateurs abîmés :
    // 8d10 × 100 fait 4 400 en moyenne, 8d8 × 1 000 fait 36 000.
    const moyennes = TRESOR_DE_RESERVE.map(({ tresor }) => {
      const [nombre, faces] = tresor.des.split('d').map(Number);
      return (nombre * (faces + 1) / 2) * tresor.multiplicateur;
    });
    expect(moyennes).toEqual([500, 4400, 36000, 330000]);
  });

  it('tire aussi le nombre d’objets magiques, jamais négatif', () => {
    // FP 0-4 : 1d4-1, donc 0 au minimum et jamais moins.
    expect(tresorDeReserve('2', min).objets).toBe(0);
    expect(tresorDeReserve('2', max).objets).toBe(3);
    expect(tresorDeReserve('20', max).objets).toBe(6);
  });

  it('sert aussi de récompense de quête, sur le NIVEAU des personnages', () => {
    // Le Guide dit d'utiliser le niveau du groupe à la place du FP (p. 121) :
    // un groupe de niveau 3 tire donc sur la première ligne.
    expect(tresorDeReserve('3', max).formule).toBe('2d4 × 100 po');
  });
});

describe('degrés de difficulté', () => {
  it('reprend les six paliers du Guide, de 5 à 30', () => {
    expect(DEGRES_DE_DIFFICULTE.map((d) => d.dd)).toEqual([5, 10, 15, 20, 25, 30]);
  });

  it('rappelle que le DD 5 ne se lance pas', () => {
    expect(DEGRES_DE_DIFFICULTE[0].note).toContain('accorde la réussite');
  });
});
