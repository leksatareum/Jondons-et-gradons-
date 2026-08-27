import { describe, expect, it } from 'vitest';
import { estUnBouclier, possedeBouclier } from './armor-ownership';

describe('reconnaître un bouclier dans le sac', () => {
  it('un nom qui correspond exactement au catalogue', () => {
    expect(estUnBouclier({ name: 'Bouclier' })).toBe(true);
  });

  it('un nom avec un complément entre parenthèses', () => {
    expect(estUnBouclier({ name: 'Bouclier (orné)' })).toBe(true);
  });

  it('catalogId prime quand il est renseigné', () => {
    expect(estUnBouclier({ name: 'Bidule', catalogId: 'bouclier' })).toBe(true);
  });

  it('autre chose n’est pas un bouclier', () => {
    expect(estUnBouclier({ name: 'Cimeterre' })).toBe(false);
    expect(estUnBouclier({ name: 'Armure de cuir' })).toBe(false);
  });
});

describe('possedeBouclier', () => {
  it('vrai si le sac en contient un, quel que soit le reste', () => {
    expect(possedeBouclier([{ name: 'Cimeterre' }, { name: 'Bouclier' }])).toBe(true);
  });

  it('faux si le sac n’en contient plus — vendu, donné, ou jamais eu', () => {
    expect(possedeBouclier([{ name: 'Cimeterre' }])).toBe(false);
    expect(possedeBouclier([])).toBe(false);
  });
});
