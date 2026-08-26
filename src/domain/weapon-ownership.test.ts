import { describe, expect, it } from 'vitest';
import { ownedWeapons, resolveWeaponFromItem } from './weapon-ownership';

describe('reconnaître une arme dans le sac', () => {
  it('un nom qui correspond exactement au catalogue', () => {
    expect(resolveWeaponFromItem({ name: 'Cimeterre' })?.id).toBe('cimeterre');
  });

  it('un nom avec un complément entre parenthèses — le focaliseur du Bâton de combat', () => {
    expect(resolveWeaponFromItem({ name: 'Bâton de combat (focaliseur druidique)' })?.id).toBe('baton');
  });

  it('un alias d’équipement de départ qui ne correspond pas au nom exact', () => {
    expect(resolveWeaponFromItem({ name: 'Espadon' })?.id).toBe('epee2m');
    expect(resolveWeaponFromItem({ name: 'Fléau' })?.id).toBe('fleau');
  });

  it('catalogId prime quand il est renseigné', () => {
    expect(resolveWeaponFromItem({ name: 'Bidule', catalogId: 'dague' })?.id).toBe('dague');
  });

  it('un objet qui n’est pas une arme ne résout à rien', () => {
    expect(resolveWeaponFromItem({ name: 'Livre de savoir occulte' })).toBeUndefined();
    expect(resolveWeaponFromItem({ name: 'Bâton' })).toBeUndefined(); // le focaliseur seul, pas l’arme
  });
});

describe('les armes possédées — une fois chacune, jamais un doublon', () => {
  it('résout les armes du sac, ignore le reste', () => {
    const inventaire = [
      { name: 'Armure de cuir clouté' },
      { name: 'Cimeterre' },
      { name: 'Épée courte' },
      { name: 'Arc long' },
      { name: 'Flèches' },
    ];
    expect(ownedWeapons(inventaire).map((weapon) => weapon.id).sort()).toEqual(['arclong', 'cimeterre', 'epeecourte']);
  });

  it('deux dagues dans le sac ne donnent qu’une seule attaque possible', () => {
    const inventaire = [{ name: 'Dague' }, { name: 'Dague' }];
    expect(ownedWeapons(inventaire)).toHaveLength(1);
  });
});
