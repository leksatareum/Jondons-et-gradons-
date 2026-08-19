import { describe, expect, it } from 'vitest';
import {
  hasNatureMagician,
  hasWildResurgence,
  natureMagicianSlotLevelFrom,
  wildShapeShortRestRecovery,
  wildShapeUses,
} from './druid-resources';

describe('Forme sauvage — paliers confirmés PHB 2024', () => {
  it('aucune utilisation avant le niveau 2', () => {
    expect(wildShapeUses(1)).toBe(0);
  });
  it('2 utilisations aux niveaux 2 à 5', () => {
    expect(wildShapeUses(2)).toBe(2);
    expect(wildShapeUses(5)).toBe(2);
  });
  it('3 utilisations aux niveaux 6 à 16', () => {
    expect(wildShapeUses(6)).toBe(3);
    expect(wildShapeUses(16)).toBe(3);
  });
  it('4 utilisations aux niveaux 17 à 20', () => {
    expect(wildShapeUses(17)).toBe(4);
    expect(wildShapeUses(20)).toBe(4);
  });
  it('un repos court ne rend qu’une utilisation', () => {
    expect(wildShapeShortRestRecovery).toBe(1);
  });
});

describe('Résurgence sauvage', () => {
  it('disponible à partir du niveau 5', () => {
    expect(hasWildResurgence(4)).toBe(false);
    expect(hasWildResurgence(5)).toBe(true);
  });
});

describe('Magicien de la nature (Archidruide, niveau 20)', () => {
  it('n’apparaît qu’au niveau 20', () => {
    expect(hasNatureMagician(19)).toBe(false);
    expect(hasNatureMagician(20)).toBe(true);
  });

  it('convertit deux niveaux de sort par utilisation de Forme sauvage', () => {
    expect(natureMagicianSlotLevelFrom(1)).toBe(2);
    expect(natureMagicianSlotLevelFrom(3)).toBe(6);
    expect(natureMagicianSlotLevelFrom(0)).toBe(0);
  });
});
