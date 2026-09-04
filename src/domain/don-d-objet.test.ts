import { describe, expect, it } from 'vitest';
import { resolveHealingItem } from './consumable-ownership';
import {
  catalogIdPourLeSac, catalogueADonner, chercherADonner, LIBELLE_PROVENANCE, ligneDeSac,
} from './don-d-objet';

describe('le catalogue réuni', () => {
  it('donne une clef unique à chaque entrée', () => {
    // Deux sources peuvent porter le même nom — c'est justement le cas de la
    // Potion de soins. Sans clef distincte, React en perdrait une.
    const clefs = catalogueADonner().map((o) => o.clef);
    expect(new Set(clefs).size).toBe(clefs.length);
  });

  it('puise dans les quatre sources', () => {
    const provenances = new Set(catalogueADonner().map((o) => o.provenance));
    for (const p of Object.keys(LIBELLE_PROVENANCE)) {
      expect(provenances.has(p as never), p).toBe(true);
    }
  });

  it('ne propose pas de donner un service', () => {
    // On ne glisse pas une nuit d'auberge dans un sac.
    expect(catalogueADonner().some((o) => /auberge|messager|voyage/i.test(o.nom) && o.provenance === 'equipement'
      && o.detail.includes('kg'))).toBe(true);
    expect(catalogueADonner().some((o) => o.clef === 'eq:sv-auberge')).toBe(false);
  });

  it('ne propose pas « Sans armure », qui n’est pas un objet', () => {
    expect(catalogueADonner().some((o) => o.clef === 'armure:none')).toBe(false);
  });

  it('donne un nom et une ligne de détail à chacun', () => {
    for (const objet of catalogueADonner()) {
      expect(objet.nom.length, objet.clef).toBeGreaterThan(1);
    }
  });
});

describe('l’objet arrive vivant dans le sac', () => {
  it('rend la Potion de soins buvable, même choisie dans le chapitre des trésors', () => {
    // C'est le vrai piège de ce lot : la potion existe en double, et seule la
    // version du catalogue d'équipement porte ses dés de soin. Donner l'autre
    // poserait une potion qu'on ne peut pas boire.
    const magique = catalogueADonner().find((o) => o.clef === 'mag:potion-de-soins')!;
    expect(resolveHealingItem(ligneDeSac(magique, 1))).toBeTruthy();
    expect(resolveHealingItem(ligneDeSac(magique, 1))!.healDice).toBe('2d4+2');
  });

  it('retrouve l’identifiant d’équipement à partir du nom', () => {
    expect(catalogIdPourLeSac('Potion de soins')).toBe('av-potion-soins');
  });

  it('retombe sur l’identifiant de secours quand l’équipement ne connaît pas l’objet', () => {
    expect(catalogIdPourLeSac('Sac sans fond', 'sac-sans-fond')).toBe('sac-sans-fond');
    expect(catalogIdPourLeSac('Objet qui n’existe pas')).toBeUndefined();
  });

  it('écrit une quantité entière et jamais nulle', () => {
    const objet = catalogueADonner()[0]!;
    expect(ligneDeSac(objet, 0).qty).toBe(1);
    expect(ligneDeSac(objet, -3).qty).toBe(1);
    expect(ligneDeSac(objet, 2.7).qty).toBe(2);
  });
});

describe('la recherche du don', () => {
  it('trouve les outils de voleur', () => {
    expect(chercherADonner('voleur').some((o) => o.nom === 'Outils de voleur')).toBe(true);
  });

  it('trouve un parchemin', () => {
    expect(chercherADonner('parchemin').length).toBeGreaterThan(1);
  });

  it('ignore les accents', () => {
    expect(chercherADonner('epee').length).toBeGreaterThan(0);
  });

  it('met l’objet magique devant, à nom égal', () => {
    // Le MJ qui tape « potion de soins » sort du chapitre des trésors.
    const soins = chercherADonner('Potion de soins');
    expect(soins.length).toBeGreaterThanOrEqual(2);
    expect(soins[0]!.provenance).toBe('magique');
  });

  it('se restreint aux provenances demandées', () => {
    const magiques = chercherADonner('', ['magique']);
    expect(magiques.every((o) => o.provenance === 'magique')).toBe(true);
    expect(magiques.length).toBeGreaterThan(140);
  });

  it('rend tout le catalogue sur une recherche vide', () => {
    expect(chercherADonner('   ')).toHaveLength(catalogueADonner().length);
  });

  it('rend une liste vide plutôt que n’importe quoi', () => {
    expect(chercherADonner('zzzzz')).toEqual([]);
  });
});
