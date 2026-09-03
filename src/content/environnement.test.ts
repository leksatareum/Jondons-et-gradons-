import { describe, expect, it } from 'vitest';
import { EFFETS_ENVIRONNEMENT, effetsParUsure, LIBELLE_RYTHME } from './environnement';

describe('cohérence des effets d’environnement', () => {
  it('donne un identifiant unique à chacun', () => {
    const ids = EFFETS_ENVIRONNEMENT.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('donne un rythme connu à chacun', () => {
    for (const effet of EFFETS_ENVIRONNEMENT) {
      expect(LIBELLE_RYTHME[effet.rythme], effet.nom).toBeTruthy();
    }
  });

  it('chiffre tout ce qui demande un jet', () => {
    // Un effet qui demande une sauvegarde DOIT porter son DD dans le texte :
    // c'est la seule raison d'ouvrir cet écran en pleine partie.
    //
    // Le tri ne se fait PAS sur le rythme : la haute altitude agit à chaque
    // heure sans demander le moindre jet. C'est ce que cette attente avait
    // rattrapé, et pourquoi `sauvegarde` existe séparément.
    for (const effet of EFFETS_ENVIRONNEMENT.filter((e) => e.sauvegarde)) {
      expect(/DD \d+|DD est de \d+/.test(effet.effet), effet.nom).toBe(true);
    }
  });

  it('ne déclare une sauvegarde que là où le texte en annonce une', () => {
    for (const effet of EFFETS_ENVIRONNEMENT) {
      const texteParleDeSauvegarde = /[Ss]auvegarde/.test(effet.effet);
      expect(Boolean(effet.sauvegarde), effet.nom).toBe(texteParleDeSauvegarde);
    }
  });

  it('dit qui échappe à ce qui coûte de l’Épuisement, quand le Guide le précise', () => {
    // Le froid, la chaleur et l'eau glacée ont tous les trois une exemption
    // explicite ; l'oublier fait subir un Épuisement à un personnage immunisé.
    for (const id of ['froid-extreme', 'chaleur-extreme', 'eau-glacee']) {
      const effet = EFFETS_ENVIRONNEMENT.find((e) => e.id === id)!;
      expect(effet.exemption, id).toBeTruthy();
    }
  });

  it('marque comme usants ceux qui infligent de l’Épuisement, et eux seuls', () => {
    for (const effet of EFFETS_ENVIRONNEMENT) {
      const parle = effet.effet.includes('Épuisement');
      expect(effet.epuisement, effet.nom).toBe(parle);
    }
  });

  it('n’annonce pas un chiffre que le scan ne donne pas', () => {
    // La tolérance de la glace fine est illisible dans notre exemplaire.
    // L'entrée doit le DIRE, pas inventer un nombre de dés.
    const glace = EFFETS_ENVIRONNEMENT.find((e) => e.id === 'glace-fine')!;
    expect(glace.effet).toContain('illisible');
    expect(/\d+d10/.test(glace.effet), 'aucun dé inventé').toBe(false);
  });
});

describe('tri par usure', () => {
  it('met devant ce qui coûte de l’Épuisement', () => {
    const liste = effetsParUsure();
    const dernierUsant = liste.map((e) => e.epuisement).lastIndexOf(true);
    const premierSain = liste.findIndex((e) => !e.epuisement);
    expect(dernierUsant).toBeLessThan(premierSain);
  });
});
