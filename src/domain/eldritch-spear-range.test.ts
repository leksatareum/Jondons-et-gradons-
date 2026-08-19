import { describe, expect, it } from 'vitest';
import { SPELLS } from '../content/spells.js';
import { estCandidatLanceOcculte, porteeEnMetres, rangedDamageCantripsFrom } from './eldritch-spear-range';

describe('lecture des portées', () => {
  it.each([
    ['18 m', 18],
    ['9 m', 9],
    ['1,50 m', 1.5],
    ['3 m', 3],
    ['800 km', 800000],
  ])('lit %s', (texte, attendu) => {
    expect(porteeEnMetres(texte)).toBe(attendu);
  });

  it.each(['Personnelle', 'Contact', 'Portée de vue', '', undefined, null])(
    'ne donne pas de portée pour %s', (texte) => {
      expect(porteeEnMetres(texte)).toBeNull();
    },
  );

  it('ne prend pas le rayon d’une émanation pour une portée', () => {
    expect(porteeEnMetres('Personnelle (émanation de 1,50 m)')).toBeNull();
  });
});

describe('candidats à Lance occulte', () => {
  it('accepte un sort mineur à 3 m ou plus', () => {
    expect(estCandidatLanceOcculte({ r: '3 m' })).toBe(true);
    expect(estCandidatLanceOcculte({ r: '18 m' })).toBe(true);
  });

  it('refuse Personnelle, Contact et les portées inférieures à 3 m', () => {
    expect(estCandidatLanceOcculte({ r: 'Personnelle' })).toBe(false);
    expect(estCandidatLanceOcculte({ r: 'Contact' })).toBe(false);
    expect(estCandidatLanceOcculte({ r: '1,50 m' })).toBe(false);
  });

  it('refuse Coup de tonnerre, émanation personnelle depuis l’audit', () => {
    const coup = (SPELLS as { id: string; r: string }[]).find((sort) => sort.id === 'coup-tonnerre')!;
    expect(estCandidatLanceOcculte(coup)).toBe(false);
  });

  it('accepte Trait de feu et Rayon de givre, sorts mineurs à distance', () => {
    for (const id of ['trait-feu', 'rayon-givre']) {
      const sort = (SPELLS as { id: string; r: string }[]).find((candidat) => candidat.id === id)!;
      expect(estCandidatLanceOcculte(sort), `${id} · portée ${sort.r}`).toBe(true);
    }
  });

  it('filtre une liste de sorts mineurs de dégâts sur leur portée', () => {
    const filtres = rangedDamageCantripsFrom([
      { id: 'trait-feu', name: 'Trait de feu', range: '36 m' },
      { id: 'toucher-choc', name: 'Poigne électrique', range: 'Contact' },
      { id: 'coup-tonnerre', name: 'Coup de tonnerre', range: 'Personnelle (émanation de 1,50 m)' },
    ]);
    expect(filtres.map((cantrip) => cantrip.id)).toEqual(['trait-feu']);
  });
});
