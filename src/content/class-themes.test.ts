import { describe, expect, it } from 'vitest';
import { CLASSES } from './classes';
import { CLASS_THEMES, DEFAULT_CLASS_THEME, classeThematique, themeDeClasse } from './class-themes';

describe('une matière par classe', () => {
  it('les douze classes du PHB ont chacune leur matière', () => {
    for (const classe of CLASSES) {
      expect(CLASS_THEMES[classe.id], `matière manquante pour ${classe.id}`).toBeDefined();
    }
  });

  it('aucune matière ne laisse un jeton vide', () => {
    for (const [id, theme] of Object.entries(CLASS_THEMES)) {
      for (const [clef, valeur] of Object.entries(theme)) {
        expect(valeur, `${id}.${clef}`).toBeTruthy();
      }
    }
  });

  it('accentWash reste opaque — jamais confondu avec accentGlow, translucide', () => {
    // Régression : un fond translucide sous le bandeau MJ ou une compétence
    // maîtrisée laisse transparaître ce qu'il y a derrière. `accentWash`
    // doit rester une couleur pleine (hex), `accentGlow` une rgba.
    for (const [id, theme] of Object.entries(CLASS_THEMES)) {
      expect(theme.accentWash, `${id}.accentWash`).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.accentGlow, `${id}.accentGlow`).toMatch(/^rgba\(/);
      expect(theme.accentWash).not.toBe(theme.accentGlow);
    }
  });
});

describe('la classe thématique d’une fiche', () => {
  it('une fiche sans classe n’a pas de classe thématique', () => {
    expect(classeThematique([])).toBeNull();
  });

  it('un personnage mono-classe se théorise sur cette classe', () => {
    expect(classeThematique([{ classId: 'druide', level: 5 }])).toBe('druide');
  });

  it('un multiclassé se théorise sur le plus haut niveau', () => {
    expect(classeThematique([
      { classId: 'roublard', level: 2 },
      { classId: 'occultiste', level: 6 },
    ])).toBe('occultiste');
  });

  it('à égalité, la première classe déclarée l’emporte — stable, pas arbitraire', () => {
    expect(classeThematique([
      { classId: 'guerrier', level: 4 },
      { classId: 'clerc', level: 4 },
    ])).toBe('guerrier');
  });

  it('une classe inconnue retombe sur la matière par défaut', () => {
    expect(themeDeClasse([{ classId: 'inconnue', level: 3 }])).toBe(DEFAULT_CLASS_THEME);
  });

  it('sans classe du tout, la matière par défaut aussi', () => {
    expect(themeDeClasse([])).toBe(DEFAULT_CLASS_THEME);
  });

  it('la matière suit vraiment la classe', () => {
    expect(themeDeClasse([{ classId: 'druide', level: 3 }])).toBe(CLASS_THEMES.druide);
    expect(themeDeClasse([{ classId: 'occultiste', level: 3 }])).toBe(CLASS_THEMES.occultiste);
  });
});
