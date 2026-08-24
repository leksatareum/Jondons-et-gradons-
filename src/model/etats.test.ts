import { describe, expect, it } from 'vitest';
import { basculerEtat, etatsActifs, etatsDe, ETATS_ORDONNES, resumeDesEtats } from './etats';
import { CONDITIONS } from '../domain/conditions';

/**
 * Les états posés par le MJ sur un combattant. Les règles viennent du
 * glossaire du PHB 2024 (appendice C), vérifiées dans `conformite-phb.test.ts` ;
 * ce fichier vérifie leur raccordement à ce que l'application manipule.
 */

describe('le catalogue affiché couvre les 14 états, sans doublon ni oubli', () => {
  it('les 14 y sont, exactement une fois', () => {
    expect(ETATS_ORDONNES).toHaveLength(14);
    expect(new Set(ETATS_ORDONNES).size).toBe(14);
    expect([...ETATS_ORDONNES].sort()).toEqual(Object.keys(CONDITIONS).sort());
  });

  it('l’ordre est celui de la fréquence en jeu, pas l’alphabet', () => {
    // « À terre » et « Agrippé » se posent vingt fois plus souvent que
    // « Pétrifié » : les chercher en fin de liste ferait perdre le geste.
    expect(ETATS_ORDONNES[0]).toBe('a-terre');
    expect(ETATS_ORDONNES[1]).toBe('agrippe');
    expect(ETATS_ORDONNES.at(-1)).toBe('petrifie');
  });

  it('chaque état porte son nom et son effet', () => {
    for (const etat of etatsDe([])) {
      expect(etat.name).toBe(CONDITIONS[etat.id].name);
      expect(etat.effet.note.length).toBeGreaterThan(10);
    }
  });
});

describe('poser et retirer un état', () => {
  it('un appui pose, un second retire', () => {
    const pose = basculerEtat([], 'a-terre');
    expect(pose).toEqual(['a-terre']);
    expect(basculerEtat(pose, 'a-terre')).toEqual([]);
  });

  it('plusieurs états cohabitent', () => {
    let etats = basculerEtat([], 'entrave');
    etats = basculerEtat(etats, 'empoisonne');
    expect(etatsActifs(etats).map((e) => e.id)).toEqual(['entrave', 'empoisonne']);
  });

  it('un identifiant inconnu est ignoré plutôt que stocké', () => {
    // Sans ce garde-fou, une faute de frappe créerait un état fantôme :
    // affiché sur la liste du MJ, sans aucun effet connu.
    expect(basculerEtat([], 'ensorcele')).toEqual([]);
    expect(basculerEtat(['a-terre'], 'ensorcele')).toEqual(['a-terre']);
  });

  it('l’ordre d’affichage ne dépend pas de l’ordre où on les a posés', () => {
    const etats = basculerEtat(basculerEtat([], 'petrifie'), 'a-terre');
    expect(etatsActifs(etats).map((e) => e.id)).toEqual(['a-terre', 'petrifie']);
  });
});

describe('ce que les états imposent, cumulé', () => {
  it('aucun état : rien n’est imposé', () => {
    expect(resumeDesEtats([])).toEqual({
      attaquesDesavantagees: false, testsDesavantages: false,
      attaquesSubiesAvantagees: false, vitesseNulle: false,
      incapable: false, sauvegardesRatees: false, resistanceTotale: false,
    });
  });

  it('Entravé : désavantage aux attaques, avantage à celles subies, vitesse 0', () => {
    expect(resumeDesEtats(['entrave'])).toMatchObject({
      attaquesDesavantagees: true,
      attaquesSubiesAvantagees: true,
      vitesseNulle: true,
    });
  });

  it('Empoisonné touche aussi les tests de caractéristique', () => {
    expect(resumeDesEtats(['empoisonne'])).toMatchObject({
      attaquesDesavantagees: true, testsDesavantages: true,
    });
  });

  it('Paralysé rend incapable d’agir et rate les sauvegardes de FOR et DEX', () => {
    expect(resumeDesEtats(['paralyse'])).toMatchObject({
      incapable: true, vitesseNulle: true, sauvegardesRatees: true,
      attaquesSubiesAvantagees: true,
    });
  });

  it('deux états se cumulent sans s’annuler', () => {
    const cumul = resumeDesEtats(['empoisonne', 'entrave']);
    expect(cumul.testsDesavantages).toBe(true);   // de l'Empoisonné
    expect(cumul.vitesseNulle).toBe(true);        // de l'Entravé
  });

  it('Pétrifié accorde la résistance à tous les dégâts', () => {
    expect(resumeDesEtats(['petrifie']).resistanceTotale).toBe(true);
  });

  /**
   * Le point le plus important du résumé : ce qu'il ne dit PAS.
   */
  it('les effets CONDITIONNELS ne sont jamais affirmés', () => {
    // Effrayé : désavantage seulement si la source est en vue.
    expect(resumeDesEtats(['effraye']).attaquesDesavantagees).toBe(false);
    expect(resumeDesEtats(['effraye']).testsDesavantages).toBe(false);
    // Agrippé : désavantage seulement contre une autre cible que l'agrippeur.
    expect(resumeDesEtats(['agrippe']).attaquesDesavantagees).toBe(false);
    // …mais sa vitesse 0, elle, est inconditionnelle.
    expect(resumeDesEtats(['agrippe']).vitesseNulle).toBe(true);
  });

  it('Étourdi n’annule pas la vitesse — c’était la règle de 2014', () => {
    expect(resumeDesEtats(['etourdi'])).toMatchObject({
      incapable: true, sauvegardesRatees: true, vitesseNulle: false,
    });
  });
});
