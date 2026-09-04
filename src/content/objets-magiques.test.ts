import { describe, expect, it } from 'vitest';
import {
  categoriesPresentes, chercherObjet, filtrerObjets,
  LIBELLE_CATEGORIE, LIBELLE_RARETE, OBJETS_MAGIQUES, objetsParRarete,
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

  it('ne contient que les deux raretés annoncées', () => {
    // Le fichier annonce le commun et le peu commun. Si une autre rareté s'y
    // glisse, l'écran l'affichera sous un filtre qui ment.
    expect(OBJETS_MAGIQUES.every((o) => o.rarete === 'commun' || o.rarete === 'peu-commun')).toBe(true);
  });

  it('porte les 53 communs et les 98 peu communs du Guide', () => {
    expect(objetsParRarete('commun')).toHaveLength(53);
    expect(objetsParRarete('peu-commun')).toHaveLength(98);
  });

  it('n’oublie pas ceux dont la rareté vit dans un tableau', () => {
    // Ces dix-là n'ont pas de ligne « Potion, Common » sous leur nom : leur
    // rareté est dans un tableau à l'intérieur de l'entrée. Le premier
    // passage, qui s'ancrait sur la ligne de type, les avait tous ratés —
    // dont les deux que l'on donne le plus souvent.
    for (const id of [
      'potion-de-soins', 'parchemin-de-sort-mineur',
      'potion-de-soins-superieure', 'parchemin-de-sort-moyen',
      'potion-de-force-de-geant-collines',
      'armure-ensorcelee', 'arme-ensorcelee', 'baton-ensorcele',
      'jeton-plume-de-quaal', 'instrument-des-bardes',
    ]) {
      expect(OBJETS_MAGIQUES.some((o) => o.id === id), id).toBe(true);
    }
  });

  it('chiffre les soins de la potion la plus donnée', () => {
    // Un MJ qui ouvre cette fiche veut le nombre de dés, pas une description.
    expect(OBJETS_MAGIQUES.find((o) => o.id === 'potion-de-soins')!.effet).toContain('2d4 + 2');
    expect(OBJETS_MAGIQUES.find((o) => o.id === 'potion-de-soins-superieure')!.effet).toContain('4d4 + 4');
  });

  it('n’y range pas l’armure +1, qui est RARE en 2024', () => {
    // Le réflexe est de la classer avec l'arme +1 et le bouclier +1, qui sont
    // peu communs. Le scan est formel : « Armor (...), Rare (+1) ».
    expect(OBJETS_MAGIQUES.some((o) => /^Armure \+1/.test(o.nom))).toBe(false);
    expect(OBJETS_MAGIQUES.some((o) => /^Arme \+1/.test(o.nom))).toBe(true);
    expect(OBJETS_MAGIQUES.some((o) => /^Bouclier \+1/.test(o.nom))).toBe(true);
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

  it('trouve un objet peu commun aussi bien qu’un commun', () => {
    expect(chercherObjet('sac sans fond').map((o) => o.id)).toEqual(['sac-sans-fond']);
    expect(chercherObjet('perle').length).toBeGreaterThanOrEqual(3);
  });
});

describe('les filtres du butin', () => {
  it('croise la rareté et la catégorie', () => {
    const potions = filtrerObjets({ raretes: ['peu-commun'], categories: ['potion'] });
    expect(potions.length).toBeGreaterThan(5);
    expect(potions.every((o) => o.rarete === 'peu-commun' && o.categorie === 'potion')).toBe(true);
  });

  it('sépare ce qui coûte une harmonisation de ce qui n’en coûte pas', () => {
    // Un personnage n'en porte que trois : c'est la question qu'on se pose
    // vraiment en choisissant quoi donner.
    const avec = filtrerObjets({ harmonisation: true });
    const sans = filtrerObjets({ harmonisation: false });
    expect(avec.every((o) => o.harmonisation !== undefined)).toBe(true);
    expect(sans.every((o) => o.harmonisation === undefined)).toBe(true);
    expect(avec.length + sans.length).toBe(OBJETS_MAGIQUES.length);
  });

  it('combine la recherche avec les filtres, sans les ignorer', () => {
    // Le piège classique : taper un nom et voir revenir des objets d'une
    // rareté qu'on avait justement écartée.
    expect(filtrerObjets({ question: 'perle', raretes: ['peu-commun'] })
      .every((o) => o.rarete === 'peu-commun')).toBe(true);
  });

  it('rend tout quand on ne demande rien', () => {
    expect(filtrerObjets({})).toHaveLength(OBJETS_MAGIQUES.length);
    expect(filtrerObjets({ raretes: [], categories: [] })).toHaveLength(OBJETS_MAGIQUES.length);
  });

  it('compte les catégories, les plus fournies d’abord', () => {
    const presentes = categoriesPresentes();
    expect(presentes[0]!.categorie).toBe('merveilleux');
    expect(presentes.reduce((somme, e) => somme + e.nombre, 0)).toBe(OBJETS_MAGIQUES.length);
    // Aucune catégorie déclarée mais vide : un filtre qui ne rend rien est un
    // bouton mort.
    expect(presentes.every((e) => e.nombre > 0)).toBe(true);
  });

  it('compte les catégories du sous-ensemble qu’on lui donne', () => {
    const communs = objetsParRarete('commun');
    const presentes = categoriesPresentes(communs);
    expect(presentes.reduce((somme, e) => somme + e.nombre, 0)).toBe(communs.length);
  });
});
