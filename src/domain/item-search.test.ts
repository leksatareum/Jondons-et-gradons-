import { describe, expect, it } from 'vitest';
import { chercherObjets, SUGGESTIONS_DEPART } from './item-search';
import { resolveActionableItem, resolveHealingItem } from './consumable-ownership';
import { resolveWeaponFromItem } from './weapon-ownership';

const noms = (requete: string) => chercherObjets(requete).map((objet) => objet.nom);

describe('chercher un objet du catalogue', () => {
  it('trouve « Potion de soins » depuis ce qu’un joueur tape vraiment', () => {
    // Le cas signalé : au singulier et sans majuscule, l'ajout ne donnait
    // qu'une ligne de texte libre, sans effet.
    for (const tape of ['potion de soin', 'Potion de Soins', 'POTION DE SOINS', 'potion']) {
      expect(noms(tape)).toContain('Potion de soins');
    }
  });

  it('ignore les accents', () => {
    expect(noms('epee courte')).toContain('Épée courte');
    expect(noms('feu gregeois')).toContain('Feu grégeois');
  });

  it('trouve les mots dans le désordre', () => {
    expect(noms('soins potion')).toContain('Potion de soins');
  });

  it('remonte la correspondance exacte en premier', () => {
    // « corde » ne doit pas d'abord sortir « Corde à boyau » ou un outil qui
    // contient le mot : le joueur croirait que l'objet n'existe pas.
    expect(noms('corde')[0]).toBe('Corde (15 m)');
  });

  it('trouve aussi les armes et les armures, pas seulement l’équipement', () => {
    expect(noms('arc long')).toContain('Arc long');
    expect(noms('cotte de mailles').length).toBeGreaterThan(0);
  });

  it('une requête vide ne propose rien', () => {
    expect(chercherObjets('')).toEqual([]);
    expect(chercherObjets('   ')).toEqual([]);
  });

  it('une requête sans correspondance ne propose rien — le texte libre prendra le relais', () => {
    expect(chercherObjets('amulette du roi-sorcier')).toEqual([]);
  });

  it('respecte la limite demandée', () => {
    expect(chercherObjets('a', 3).length).toBeLessThanOrEqual(3);
  });

  it('ne propose ni service ni « Sans armure » : on ne les range pas dans un sac', () => {
    expect(noms('sans armure')).not.toContain('Sans armure');
    expect(chercherObjets('auberge').every((objet) => objet.categorie !== 'Service')).toBe(true);
  });
});

describe('ce que la recherche promet, l’appli doit le tenir', () => {
  it('un objet marqué « soin » est réellement reconnu comme soignant une fois au sac', () => {
    for (const objet of chercherObjets('potion de soins')) {
      if (objet.effet !== 'soin') continue;
      expect(resolveHealingItem({ name: objet.nom })).toBeDefined();
    }
  });

  it('un objet marqué « combat » a réellement son raccourci', () => {
    for (const nom of ['Acide', 'Antitoxine', 'Poison simple']) {
      const trouve = chercherObjets(nom).find((objet) => objet.nom === nom);
      expect(trouve?.effet).toBe('combat');
      expect(resolveActionableItem({ name: nom })).toBeDefined();
    }
  });

  it('une arme trouvée est réellement reconnue comme arme une fois au sac', () => {
    for (const nom of ['Épée courte', 'Arc long', 'Dague']) {
      const trouve = chercherObjets(nom).find((objet) => objet.nom === nom);
      expect(trouve?.effet).toBe('arme');
      expect(resolveWeaponFromItem({ name: nom })).toBeDefined();
    }
  });

  it('les suggestions de départ sont toutes de vrais objets du catalogue', () => {
    expect(SUGGESTIONS_DEPART.length).toBeGreaterThan(0);
    for (const objet of SUGGESTIONS_DEPART) {
      expect(chercherObjets(objet.nom).map((trouve) => trouve.nom)).toContain(objet.nom);
    }
  });
});
