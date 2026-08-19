import { describe, expect, it } from 'vitest';
import { hasRuseMagique, ruseMagiqueRecoverableSlots } from './warlock-resources';
import { pactMagicSlots } from './spellcasting-progression';

describe('Ruse magique — disponible dès le niveau 2, confirmé PHB 2024', () => {
  it('indisponible au niveau 1', () => {
    expect(hasRuseMagique(1)).toBe(false);
    expect(ruseMagiqueRecoverableSlots(1)).toBe(0);
  });

  it('récupère la moitié du maximum d’emplacements de pacte, arrondie au supérieur', () => {
    // Niveau 2 : 2 emplacements max → ceil(2/2) = 1.
    expect(pactMagicSlots(2).slots).toBe(2);
    expect(ruseMagiqueRecoverableSlots(2)).toBe(1);
    // Niveau 11 : 3 emplacements max → ceil(3/2) = 2.
    expect(pactMagicSlots(11).slots).toBe(3);
    expect(ruseMagiqueRecoverableSlots(11)).toBe(2);
  });

  it('Maître occulte (niveau 20) rend la récupération totale', () => {
    expect(pactMagicSlots(20).slots).toBe(4);
    expect(ruseMagiqueRecoverableSlots(20)).toBe(4);
  });
});
