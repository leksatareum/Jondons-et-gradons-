import { describe, expect, it } from 'vitest';
import {
  chercherObjet, LIBELLE_CATEGORIE, LIBELLE_RARETE, OBJETS_MAGIQUES, objetsParRarete,
} from './objets-magiques';

describe('cohérence du catalogue', () => {
  it('donne un identifiant unique à chaque objet', () => {
    const ids = OBJETS_MAGIQUES.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ne nomme jamais deux fois la même chose', () => {
    const noms = OBJETS_MAGIQUES.map((o) => o.nom);
    expect(new Set(noms).size).toBe(noms.length);
  });

  it('range chaque objet dans une catégorie et une rareté connues', () => {
    for (const objet of OBJETS_MAGIQUES) {
      expect(LIBELLE_CATEGORIE[objet.categorie], objet.nom).toBeTruthy();
      expect(LIBELLE_RARETE[objet.rarete], objet.nom).toBeTruthy();
    }
  });

  it('ne contient que du commun dans ce lot', () => {
    // Le fichier annonce un lot de communs. Si une autre rareté s'y glisse,
    // l'écran l'affichera sous un titre qui ment.
    expect(OBJETS_MAGIQUES.every((o) => o.rarete === 'commun')).toBe(true);
  });

  it('porte les 51 objets communs du Guide', () => {
    expect(objetsParRarete('commun')).toHaveLength(51);
  });

  it('donne un effet à chacun, pas seulement un nom', () => {
    for (const objet of OBJETS_MAGIQUES) {
      expect(objet.effet.length, objet.nom).toBeGreaterThan(30);
    }
  });

  it('situe chaque objet dans le chapitre du trésor', () => {
    // Le chapitre 7 court de la page 217 à la page 335. Une page hors de cette
    // plage est une faute de recopie, pas une référence.
    for (const objet of OBJETS_MAGIQUES) {
      expect(objet.page, objet.nom).toBeGreaterThanOrEqual(217);
      expect(objet.page, objet.nom).toBeLessThanOrEqual(335);
    }
  });

  it('donne un support à ce qui en demande un, et à rien d’autre', () => {
    // Une arme sans support ne dit pas SUR QUOI elle s'applique ; un objet
    // merveilleux n'en a pas.
    for (const objet of OBJETS_MAGIQUES) {
      const enDemande = ['arme', 'munition', 'armure'].includes(objet.categorie);
      expect(Boolean(objet.support), objet.nom).toBe(enDemande);
    }
  });

  it('dit la restriction d’harmonisation quand le Guide en pose une', () => {
    const restreints = [
      ['amulette-eclat-sombre', 'occultiste'],
      ['chapeau-de-magicien', 'magicien'],
      ['rubis-du-mage-de-guerre', 'lanceur de sorts'],
    ] as const;
    for (const [id, mot] of restreints) {
      const objet = OBJETS_MAGIQUES.find((o) => o.id === id)!;
      expect(objet.harmonisation, id).toContain(mot);
    }
  });

  it('convertit les distances en mètres, jamais en pieds', () => {
    // Toute l'appli parle en mètres ; un « 30 pieds » oublié dans un effet
    // oblige à convertir de tête en pleine partie.
    //
    // Le motif vise un NOMBRE suivi de l'unité, pas le mot seul : le Membre
    // prothétique remplace « une main, un bras, un pied, une jambe », où
    // « pied » est un membre du corps. C'est ce que la première version de
    // cette attente avait signalé à tort.
    for (const objet of OBJETS_MAGIQUES) {
      expect(/\d+([,.]\d+)?\s*pieds?\b/.test(objet.effet), objet.nom).toBe(false);
    }
  });

  it('dit ce qui est illisible plutôt que de l’inventer', () => {
    // La liste des épées concernées par l'Épée touchée par la lune est coupée
    // par l'entrelacement des colonnes. L'entrée doit LE DIRE.
    const epee = OBJETS_MAGIQUES.find((o) => o.id === 'epee-touchee-par-la-lune')!;
    expect(epee.support).toContain('illisible');
  });
});

describe('le tri et la recherche', () => {
  it('range par ordre alphabétique français', () => {
    const noms = objetsParRarete('commun').map((o) => o.nom);
    expect(noms).toEqual([...noms].sort((a, b) => a.localeCompare(b, 'fr')));
  });

  it('trouve sans accent ni majuscule', () => {
    // On tape « epee » à une main pendant que la table attend.
    expect(chercherObjet('epee').map((o) => o.id)).toContain('epee-touchee-par-la-lune');
    expect(chercherObjet('BAGUETTE').length).toBeGreaterThan(1);
  });

  it('trouve un mot au milieu du nom', () => {
    expect(chercherObjet('charlatan').map((o) => o.id)).toEqual(['de-du-charlatan']);
  });

  it('rend tout le catalogue sur une recherche vide', () => {
    expect(chercherObjet('   ')).toHaveLength(OBJETS_MAGIQUES.length);
  });

  it('rend une liste vide plutôt que n’importe quoi', () => {
    expect(chercherObjet('zzzz')).toEqual([]);
  });
});
