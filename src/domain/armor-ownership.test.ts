import { describe, expect, it } from 'vitest';
import { bonusBouclier, estUnBouclier, meilleurBouclier, possedeBouclier } from './armor-ownership';

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

  it('un bouclier magique, nommé par convention avec son bonus', () => {
    expect(estUnBouclier({ name: 'Bouclier +1' })).toBe(true);
    expect(estUnBouclier({ name: 'Bouclier +2' })).toBe(true);
  });

  it('un bouclier trouvé en jeu, nommé autrement que le catalogue', () => {
    expect(estUnBouclier({ name: 'Petit bouclier' })).toBe(true);
    expect(estUnBouclier({ name: 'Bouclier de fer' })).toBe(true);
    expect(estUnBouclier({ name: 'Boucliers de rechange' })).toBe(true);
  });

  it('autre chose n’est pas un bouclier', () => {
    expect(estUnBouclier({ name: 'Cimeterre' })).toBe(false);
    expect(estUnBouclier({ name: 'Armure de cuir' })).toBe(false);
    expect(estUnBouclier({ name: 'Boucle d’oreille' })).toBe(false);
  });
});

describe('le bonus de CA de chaque bouclier reconnu', () => {
  it('le bouclier de base : +2, comme le catalogue', () => {
    expect(meilleurBouclier([{ name: 'Bouclier' }])?.bonus).toBe(2);
  });

  it('un bouclier magique +1/+2/+3 : le bonus de base plus le chiffre du nom', () => {
    expect(meilleurBouclier([{ name: 'Bouclier +1' }])?.bonus).toBe(3);
    expect(meilleurBouclier([{ name: 'Bouclier +3' }])?.bonus).toBe(5);
  });

  it('un bouclier reconnu sans chiffre dans le nom : le bonus de base', () => {
    expect(meilleurBouclier([{ name: 'Petit bouclier' }])?.bonus).toBe(2);
  });

  it('deux boucliers différents dans le sac : celui qui protège le mieux compte', () => {
    const sac = [{ name: 'Bouclier' }, { name: 'Bouclier +1' }];
    expect(meilleurBouclier(sac)?.bonus).toBe(3);
    expect(meilleurBouclier(sac)?.name).toBe('Bouclier +1');
    expect(bonusBouclier(sac)).toBe(3);
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

describe('bonusBouclier', () => {
  it('0 si le sac n’en a aucun', () => {
    expect(bonusBouclier([{ name: 'Cimeterre' }])).toBe(0);
    expect(bonusBouclier([])).toBe(0);
  });
});
