import { describe, expect, it } from 'vitest';
import { PHB_CREATURES } from './creatures';
import { THEMES_RENCONTRE } from '../domain/encounter-generator';

describe('le bestiaire', () => {
  it('un identifiant par créature, jamais deux fois le même', () => {
    const ids = PHB_CREATURES.map((creature) => creature.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('chaque créature a des points de vie et une classe d’armure jouables', () => {
    for (const creature of PHB_CREATURES) {
      expect(creature.hp, creature.id).toBeGreaterThan(0);
      expect(creature.ac, creature.id).toBeGreaterThan(0);
    }
  });

  it('les nouvelles entrées du Manuel des monstres 2024 ont au moins une attaque', () => {
    // Contrairement au squelette ou au zombie déjà présents, ce lot arrive
    // d'un coup : une créature sans aucune action jouable serait un adversaire
    // que le MJ ne pourrait pas faire agir en combat.
    const ajoutees = [
      'gobelin-larbin', 'gobelin-guerrier', 'gobelin-chef', 'gobelin-envouteur',
      'bandit', 'bandit-capitaine', 'kobold-guerrier', 'kobold-aile',
      'ogre', 'ogrillon', 'ogre-zombie', 'worg', 'harpie',
    ];
    for (const id of ajoutees) {
      const creature = PHB_CREATURES.find((c) => c.id === id);
      expect(creature, id).toBeDefined();
      expect(creature!.actions?.some((action) => action.kind === 'attack'), id).toBe(true);
    }
  });

  it('le complément du bestiaire (orcs, gobelinoïdes, gnoll, morts-vivants, monstrosités) a au moins une attaque', () => {
    const ajoutees = [
      'orc-guerrier', 'orc-chef-de-guerre', 'hobgobelin-guerrier', 'malandrin',
      'gnoll-guerrier', 'ombre', 'spectre', 'goule', 'necrophage', 'ours-hibou', 'mimique',
    ];
    for (const id of ajoutees) {
      const creature = PHB_CREATURES.find((c) => c.id === id);
      expect(creature, id).toBeDefined();
      expect(creature!.actions?.some((action) => action.kind === 'attack'), id).toBe(true);
    }
  });

  it('chaque thème du générateur automatique a au moins une créature dans le bestiaire', () => {
    // Un thème sans aucune créature correspondante afficherait « Aucune
    // créature de ce genre » à chaque fois, silencieusement inutile.
    for (const [theme, libelle] of THEMES_RENCONTRE) {
      expect(PHB_CREATURES.some((creature) => creature.theme?.includes(theme)), libelle).toBe(true);
    }
  });

  it('le zombie de base a enfin ses actions — le trou d’origine est comblé', () => {
    const zombie = PHB_CREATURES.find((c) => c.id === 'zombie');
    expect(zombie?.actions?.length).toBeGreaterThan(0);
    expect(zombie?.traits?.some((trait) => /Robustesse des morts-vivants/.test(trait))).toBe(true);
  });

  it('un gobelin chef porte bien la CA de son équipement (cotte de mailles + bouclier)', () => {
    const chef = PHB_CREATURES.find((c) => c.id === 'gobelin-chef');
    expect(chef?.ac).toBe(17);
  });

  it('le pistolet du capitaine bandit porte à 9/27 m, comme celui du catalogue d’armes', () => {
    const capitaine = PHB_CREATURES.find((c) => c.id === 'bandit-capitaine');
    const pistolet = capitaine?.actions?.find((action) => action.name === 'Pistolet');
    expect(pistolet?.reach).toBe('9/27 m');
  });
});
