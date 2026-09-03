import { describe, expect, it } from 'vitest';
import {
  budgetDeRencontre, budgetsDuGroupe, creaturesHostiles, evaluerRencontre, xpDuFP,
} from './encounter-generator';
import type { Combatant } from './encounter';

/**
 * Les valeurs vérifiées viennent des deux livres, pas d'une reconstitution :
 * le budget du Guide du Maître p. 115, les PX par FP du Manuel des Monstres
 * p. 8. Les deux exemples chiffrés du Guide servent de recoupement — ils
 * traversent les deux tables à la fois, c'est ce qui les rend utiles ici.
 */
describe('budget de rencontre', () => {
  it('reprend la table du Guide du Maître, du niveau 1 au niveau 20', () => {
    expect(budgetDeRencontre(1, 1, 'faible')).toBe(50);
    expect(budgetDeRencontre(3, 1, 'elevee')).toBe(400);
    expect(budgetDeRencontre(5, 1, 'moderee')).toBe(750);
    expect(budgetDeRencontre(12, 1, 'moderee')).toBe(3700);
    expect(budgetDeRencontre(20, 1, 'elevee')).toBe(22000);
  });

  it('multiplie par l’effectif, sans multiplicateur pour le nombre d’ennemis', () => {
    // La règle de 2014 gonflait le coût quand les monstres étaient nombreux ;
    // celle de 2024 additionne, point.
    expect(budgetDeRencontre(2, 3, 'moderee')).toBe(450);
    expect(budgetDeRencontre(3, 3, 'elevee')).toBe(1200);
  });

  it('refuse un niveau hors table plutôt que d’extrapoler', () => {
    expect(budgetDeRencontre(21, 4, 'faible')).toBeNull();
    expect(budgetDeRencontre(0, 4, 'faible')).toBeNull();
    expect(budgetsDuGroupe(3, 0)).toBeNull();
  });

  it('redonne les trois exemples chiffrés du Guide', () => {
    // « A low-difficulty encounter for four level 1 characters has an XP
    //   budget of 50 × 4, for a total of 200 XP » — et un Gobelours guerrier
    //   (FP 1) y remplit le budget à lui seul.
    expect(budgetDeRencontre(1, 4, 'faible')).toBe(200);
    expect(xpDuFP('1')).toBe(200);

    // « A moderate-difficulty encounter for five level 3 characters […] 225 × 5,
    //   for a total of 1,125 XP », dépensé en 2 Nothiques (450) + 9 Stirges (25).
    expect(budgetDeRencontre(3, 5, 'moderee')).toBe(1125);
    expect(xpDuFP('2') * 2 + xpDuFP('1/8') * 9).toBe(1125);

    // « A high-difficulty encounter for six level 15 characters […] 7,800 × 6,
    //   for a total of 46,800 XP », dépensé en 2 Dragons rouges adultes
    //   (FP 17) et 2 Géants du feu (FP 9).
    expect(budgetDeRencontre(15, 6, 'elevee')).toBe(46800);
    expect(xpDuFP('17') * 2 + xpDuFP('9') * 2).toBe(46000);
  });
});

describe('évaluation d’une rencontre déjà composée', () => {
  const groupe = { niveau: 3, taille: 3 }; // seuils : 450 / 675 / 1200

  it('situe la rencontre dans la bonne bande', () => {
    expect(evaluerRencontre([], groupe.niveau, groupe.taille).difficulte).toBe('aucune');
    // 2 gobelins guerriers = 100 PX, sous le seuil « faible » de 450.
    expect(evaluerRencontre([{ cr: '1/4' }, { cr: '1/4' }], 3, 3).difficulte).toBe('faible');
    // 1 loup-garou = 700 PX : au-dessus de 450, sous 1200.
    expect(evaluerRencontre([{ cr: '3' }], 3, 3).difficulte).toBe('elevee');
    // 2 sangliers-garous = 2200 PX, très au-delà du seuil « élevée ».
    expect(evaluerRencontre([{ cr: '4' }, { cr: '4' }], 3, 3).difficulte).toBe('au-dela');
  });

  it('additionne les PX sans rien inventer pour un FP inconnu', () => {
    const evaluation = evaluerRencontre([{ cr: '2' }, { cr: 'bizarre' }], 3, 3);
    expect(evaluation.xp).toBe(450);
  });

  it('avertit au-delà de deux créatures par personnage, plus fort à bas niveau', () => {
    const sept = Array.from({ length: 7 }, () => ({ cr: '1/8' }));
    const bas = evaluerRencontre(sept, 2, 3);
    const haut = evaluerRencontre(sept, 5, 3);
    expect(bas.avertissements[0]?.gravite).toBe('danger');
    expect(haut.avertissements[0]?.gravite).toBe('note');
    // Six créatures pour trois personnages : exactement deux chacun, rien à signaler.
    expect(evaluerRencontre(Array.from({ length: 6 }, () => ({ cr: '1/8' })), 2, 3).avertissements).toHaveLength(0);
  });

  it('signale les créatures de FP 0, que le Guide veut rares', () => {
    const evaluation = evaluerRencontre([{ cr: '0' }, { cr: '1' }], 3, 3);
    expect(evaluation.avertissements.some((a) => a.texte.includes('FP 0'))).toBe(true);
  });

  it('rend le budget nul plutôt qu’un chiffre faux quand la campagne n’a pas de fiche', () => {
    const evaluation = evaluerRencontre([{ cr: '1' }], 0, 0);
    expect(evaluation.budgets).toBeNull();
    expect(evaluation.difficulte).toBeNull();
    expect(evaluation.xp).toBe(200);
  });
});

describe('créatures hostiles', () => {
  const combattant = (side: Combatant['side'], name: string): Combatant => ({
    id: name, name, side, initiative: 0, dexterity: 0,
    maxHp: 1, damageTaken: 0, temporaryHp: 0, armorClass: 10, conditions: [],
  });

  it('écarte le groupe : les joueurs ne comptent pas dans leur propre budget', () => {
    const liste = [combattant('joueur', 'Veya'), combattant('creature', 'Gobelin')];
    expect(creaturesHostiles(liste).map((c) => c.name)).toEqual(['Gobelin']);
  });
});
