import { describe, expect, it } from 'vitest';
import { CREATURES_MM_2024 } from './creatures-mm-2024';
import { PHB_CREATURES } from './creatures';

/**
 * Les chiffres sont épinglés un par un, comme pour les réserves de classe :
 * ils viennent d'une lecture du Monster Manual 2024 sur un scan par endroits
 * abîmé, donc toute correction future doit se voir.
 *
 * Les tests de COHÉRENCE, eux, valent pour les ajouts à venir autant que pour
 * ceux d'aujourd'hui — c'est là qu'on apprendra qu'un futur monstre a été mal
 * saisi, plutôt qu'à la table.
 */

const par = (id: string) => CREATURES_MM_2024.find((c) => c.id === id);

describe('cohérence du renfort', () => {
  it('aucun identifiant ne double un monstre déjà présent', () => {
    const vus = new Map<string, number>();
    for (const creature of PHB_CREATURES) vus.set(creature.id, (vus.get(creature.id) ?? 0) + 1);
    expect([...vus].filter(([, n]) => n > 1)).toEqual([]);
  });

  it('aucun nom ne double non plus — deux « Garde » seraient indiscernables au choix', () => {
    const noms = PHB_CREATURES.map((c) => c.name.toLocaleLowerCase('fr'));
    expect(noms.length).toBe(new Set(noms).size);
  });

  it('chaque créature porte de quoi jouer son tour : PV, CA et au moins une attaque', () => {
    for (const creature of CREATURES_MM_2024) {
      expect(creature.hp, creature.name).toBeGreaterThan(0);
      expect(creature.ac, creature.name).toBeGreaterThan(0);
      const attaques = (creature.actions ?? []).filter((a) => a.kind === 'attack');
      expect(attaques.length, creature.name).toBeGreaterThan(0);
    }
  });

  it('toute attaque chiffre ses dégâts et son bonus — sinon la carte ne sert à rien', () => {
    for (const creature of CREATURES_MM_2024) {
      for (const action of creature.actions ?? []) {
        if (action.kind !== 'attack') continue;
        expect(action.toHit, `${creature.name} · ${action.name}`).toBeTypeOf('number');
        expect(action.damage, `${creature.name} · ${action.name}`).toMatch(/^\d+d\d+(\+\d+)?$/);
        expect(action.damageType, `${creature.name} · ${action.name}`).toBeTruthy();
      }
    }
  });

  it('les six caractéristiques sont renseignées, pas trois', () => {
    // La DD d'un sort ou d'une sauvegarde en dépend : une caractéristique
    // manquante se traduit par un calcul silencieusement faux.
    for (const creature of CREATURES_MM_2024) {
      expect(Object.keys(creature.abilities ?? {}).sort(), creature.name)
        .toEqual(['cha', 'con', 'dex', 'int', 'str', 'wis']);
    }
  });

  it('une multiattaque ne renvoie qu’à des attaques que la créature possède', () => {
    for (const creature of CREATURES_MM_2024) {
      const noms = new Set((creature.actions ?? []).map((a) => a.name));
      for (const action of creature.actions ?? []) {
        for (const enchainee of action.sequence ?? []) {
          expect(noms, `${creature.name} · ${enchainee}`).toContain(enchainee);
        }
      }
    }
  });

  it('les vitesses sont en mètres, jamais en pieds', () => {
    for (const creature of CREATURES_MM_2024) {
      expect(creature.speed, creature.name).toMatch(/\bm\b/);
      expect(creature.speed, creature.name).not.toMatch(/ft|pied/i);
    }
  });
});

describe('les valeurs lues au livre', () => {
  it.each([
    ['garde', 15, 11, '1/8'],
    ['cultiste', 12, 9, '1/8'],
    ['espion', 12, 27, '1'],
    ['acolyte', 13, 11, '1/4'],
    ['eclaireur', 13, 16, '1/2'],
    ['dur-a-cuire', 12, 32, '1/2'],
    ['berserker', 13, 67, '2'],
    ['fanatique-culte', 13, 44, '2'],
    ['guerrier-veteran', 17, 65, '3'],
    ['capitaine-eclaireur', 15, 66, '3'],
    ['manticore', 14, 68, '3'],
    ['momie', 11, 58, '3'],
    ['chien-infernal', 15, 58, '3'],
    ['capitaine-garde', 18, 75, '4'],
    ['chef-de-brutes', 16, 82, '4'],
  ])('%s : CA %i, %i PV, FP %s', (id, ac, hp, cr) => {
    const creature = par(id as string);
    expect(creature, id as string).toBeDefined();
    expect(creature!.ac).toBe(ac);
    expect(creature!.hp).toBe(hp);
    expect(creature!.cr).toBe(cr);
  });

  it('l’acolyte ajoute bien ses dégâts radiants — c’est ce qui le distingue', () => {
    expect(par('acolyte')!.actions![0].detail).toMatch(/radiants/);
  });

  it('le capitaine éclaireur garde ses 3d6 supplémentaires sur ses deux armes', () => {
    const attaques = par('capitaine-eclaireur')!.actions!.filter((a) => a.kind === 'attack');
    expect(attaques).toHaveLength(2);
    for (const attaque of attaques) expect(attaque.detail).toMatch(/3d6/);
  });

  it('la momie est lente : 6 m, c’est ce qui la rend jouable', () => {
    expect(par('momie')!.speed).toBe('6 m');
  });

  it('les deux armes de l’espion sont empoisonnées — c’est là qu’est sa menace', () => {
    const attaques = par('espion')!.actions!.filter((a) => a.kind === 'attack');
    expect(attaques).toHaveLength(2);
    for (const attaque of attaques) expect(attaque.detail).toMatch(/poison/i);
  });
});

describe('ce que le renfort change pour une table', () => {
  it('le bestiaire dépasse enfin FP 2 — il n’y avait que trois monstres au-dessus', () => {
    const auDessusDeDeux = PHB_CREATURES.filter((c) => Number(c.cr) >= 3);
    expect(auDessusDeDeux.length).toBeGreaterThanOrEqual(10);
  });

  it('les personnages ordinaires existent : garde, acolyte, vétéran', () => {
    const noms = PHB_CREATURES.map((c) => c.name);
    expect(noms).toContain('Garde');
    expect(noms).toContain('Acolyte');
    expect(noms).toContain('Guerrier vétéran');
  });
});
