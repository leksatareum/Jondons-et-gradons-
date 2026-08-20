import { describe, expect, it } from 'vitest';
import { CATALOGUE, searchSpells, spellById, spellsForClass } from './spell-catalogue';

describe('catalogue de sorts', () => {
  it('lit les clés courtes du fichier de données', () => {
    const brouillard = spellById('brouillard');
    expect(brouillard?.name).toBe('Nappe de brouillard');
    expect(brouillard?.level).toBe(1);
    expect(brouillard?.classes).toContain('dr');
  });

  it('chaque sort a un identifiant et un nom', () => {
    const muets = CATALOGUE.filter((spell) => !spell.id || !spell.name);
    expect(muets).toEqual([]);
  });

  it('un identifiant inconnu ne renvoie pas un sort au hasard', () => {
    expect(spellById('sort-qui-nexiste-pas')).toBeNull();
    expect(spellById(null)).toBeNull();
  });

  it('filtre par liste de classe, et par rang si demandé', () => {
    const druide = spellsForClass('druide');
    expect(druide.length).toBeGreaterThan(50);
    expect(druide.every((spell) => spell.classes.includes('dr'))).toBe(true);

    const mineursDruide = spellsForClass('druide', 0);
    expect(mineursDruide.every((spell) => spell.level === 0)).toBe(true);
    expect(mineursDruide.length).toBeGreaterThan(0);
  });

  it('une classe sans magie renvoie une liste vide, pas le catalogue entier', () => {
    expect(spellsForClass('roublard')).toEqual([]);
    expect(spellsForClass('guerrier')).toEqual([]);
  });
});

describe('recherche de sort — l’ordre évite l’erreur', () => {
  it('le nom exact passe devant celui qui le contient', () => {
    const resultats = searchSpells('boule de feu');
    expect(resultats[0].name).toBe('Boule de feu');
    expect(resultats.map((s) => s.name)).toContain('Boule de feu à retardement');
  });

  it('ignore les accents et la casse', () => {
    expect(searchSpells('ECLAIR').length).toBeGreaterThan(0);
    expect(searchSpells('enchevetrement')[0].name).toBe('Enchevêtrement');
  });

  it('ne cherche pas sur un seul caractère', () => {
    expect(searchSpells('b')).toEqual([]);
    expect(searchSpells(' ')).toEqual([]);
  });

  it('classe les débuts de nom avant les correspondances au milieu', () => {
    const resultats = searchSpells('feu');
    const debut = resultats.findIndex((s) => s.name.toLocaleLowerCase('fr').startsWith('feu'));
    const milieu = resultats.findIndex((s) => !s.name.toLocaleLowerCase('fr').startsWith('feu'));
    if (debut >= 0 && milieu >= 0) expect(debut).toBeLessThan(milieu);
  });
});
