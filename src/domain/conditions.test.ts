import { describe, expect, it } from 'vitest';
import { CONDITIONS } from './conditions';

describe('les 14 états officiels du PHB 2024', () => {
  it('couvre exactement les 14 états (Épuisement excepté, compteur à part)', () => {
    expect(Object.keys(CONDITIONS)).toHaveLength(14);
  });

  it('Aveuglé désavantage tes attaques et avantage celles contre toi', () => {
    expect(CONDITIONS.aveugle.attack).toBe('dis');
    expect(CONDITIONS.aveugle.incoming).toBe('adv');
  });

  it('Inconscient et Paralysé ratent d’office les sauvegardes de Force et Dextérité', () => {
    expect(CONDITIONS.inconscient.autoFail).toEqual(['str', 'dex']);
    expect(CONDITIONS.paralyse.autoFail).toEqual(['str', 'dex']);
  });

  it('Pétrifié résiste à tous les dégâts', () => {
    expect(CONDITIONS.petrifie.resistAll).toBe(true);
  });
});

/**
 * Ces trois cas encodent des corrections réelles : la version extraite du
 * texte source d'App.jsx les avait faux. Ils échouent si quelqu'un
 * « re-simplifie » le fichier vers l'ancienne version.
 */
describe('règles 2024 que la version source d’App.jsx avait fausses', () => {
  it('Étourdi ne réduit PAS la vitesse à 0', () => {
    expect(CONDITIONS.etourdi.speed0).toBeUndefined();
    expect(CONDITIONS.etourdi.incapacitated).toBe(true);
  });

  it('Agrippé n’impose aucun désavantage général aux attaques (seulement hors agrippeur, décrit en note)', () => {
    expect(CONDITIONS.agrippe.attack).toBeUndefined();
    expect(CONDITIONS.agrippe.speed0).toBe(true);
  });

  it('Invisible n’accorde avantage/désavantage que conditionnellement — jamais dans les champs structurés', () => {
    expect(CONDITIONS.invisible.attack).toBeUndefined();
    expect(CONDITIONS.invisible.incoming).toBeUndefined();
    expect(CONDITIONS.invisible.note).toMatch(/ne peut pas te voir/);
  });
});
