import { describe, expect, it } from 'vitest';
import { DRUIDIC_WARRIOR, FIGHTING_STYLES, RANGER_FIGHTING_STYLES } from './fighting-styles';

describe('styles de combat — PHB 2024', () => {
  it('contient les dix options du don', () => {
    expect(FIGHTING_STYLES).toHaveLength(10);
    expect(new Set(FIGHTING_STYLES.map((style) => style.id)).size).toBe(10);
  });

  it('le Guerrier druidique est réservé au Rôdeur, en plus de la liste commune', () => {
    expect(FIGHTING_STYLES).not.toContainEqual(DRUIDIC_WARRIOR);
    expect(RANGER_FIGHTING_STYLES).toHaveLength(11);
    expect(RANGER_FIGHTING_STYLES).toContainEqual(DRUIDIC_WARRIOR);
  });
});
