import { describe, expect, it } from 'vitest';
import { attaquesDuTemplate } from './AddAdversaryDialog';
import { PHB_CREATURES } from '../content/creatures';

const loup = PHB_CREATURES.find((creature) => creature.id === 'wolf')!;
const sprite = PHB_CREATURES.find((creature) => creature.id === 'sprite')!;

describe('attaques reprises du bestiaire', () => {
  it('extrait l’attaque d’une bête simple, avec ses dégâts', () => {
    const attaques = attaquesDuTemplate(loup);
    expect(attaques).toHaveLength(1);
    expect(attaques[0]).toMatchObject({ name: 'Morsure', toHit: 4, damage: '1d6+2', damageType: 'perforants' });
    expect(attaques[0].detail).toContain('À terre');
  });

  it('ne retient que les actions de type attaque — jamais les sauvegardes ni les utilitaires', () => {
    // L'esprit follet a une attaque d'épée, un arc, un test de sauvegarde et
    // un sort : seules les deux premières sont des attaques à lire au combat.
    const attaques = attaquesDuTemplate(sprite);
    expect(attaques.map((attaque) => attaque.name)).toEqual(['Épée-aiguille', 'Arc enchanteur']);
    expect(attaques.some((attaque) => attaque.name.includes('cœur'))).toBe(false);
    expect(attaques.some((attaque) => attaque.name.includes('Invisibilité'))).toBe(false);
  });

  it('chaque attaque reçoit un identifiant propre, même homonymes', () => {
    const attaques = attaquesDuTemplate(loup);
    const ids = new Set(attaques.map((attaque) => attaque.id));
    expect(ids.size).toBe(attaques.length);
  });

  it('une créature sans actions renvoie une liste vide, pas une erreur', () => {
    // Le corbeau n'a pas de bloc de combat détaillé dans le catalogue.
    const corbeau = PHB_CREATURES.find((creature) => creature.id === 'raven')!;
    expect(attaquesDuTemplate(corbeau)).toEqual([]);
  });
});
