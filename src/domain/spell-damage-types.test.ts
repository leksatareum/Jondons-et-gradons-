import { describe, expect, it } from 'vitest';
import { damageTypesOf } from './spell-damage-types';
import { CATALOGUE, spellById } from '../content/spell-catalogue';

const texteDe = (id: string) => {
  const spell = spellById(id);
  if (!spell) throw new Error(`sort inconnu dans le test : ${id}`);
  return spell;
};

describe('damageTypesOf', () => {
  it('lit un type de dégâts unique, sur un sort simple', () => {
    expect(damageTypesOf(texteDe('mains-brulantes'))).toEqual(['feu']);
    expect(damageTypesOf(texteDe('rayon-givre'))).toEqual(['froid']);
    expect(damageTypesOf(texteDe('trait-feu'))).toEqual(['feu']);
  });

  it('lit deux types quand le sort en inflige vraiment deux', () => {
    // Colonne de flamme : dégâts de feu ET dégâts radiants, dans la même phrase.
    expect(damageTypesOf(texteDe('colonne-flamme'))).toEqual(['feu', 'radiants']);
  });

  it('ne renvoie rien pour un sort qui n’inflige aucun dégât', () => {
    expect(damageTypesOf(texteDe('lumiere'))).toEqual([]);
    expect(damageTypesOf(texteDe('soins'))).toEqual([]);
  });

  it('ignore une immunité ou une résistance — ce n’est pas le sort qui inflige ces dégâts', () => {
    // Silence : « immunisées aux dégâts de tonnerre » — aucun dégât infligé.
    expect(damageTypesOf(texteDe('silence'))).toEqual([]);
    // Esprit impénétrable : « immunisée aux dégâts psychiques » — idem.
    expect(damageTypesOf(texteDe('esprit-impenetrable'))).toEqual([]);
  });

  it('garde un dégât réel même quand un mot défensif traîne ailleurs dans le texte', () => {
    // Bouclier de flammes : « résistance au froid... » PUIS « subit 2d8 dégâts
    // de feu » — la résistance ne doit pas faire disparaître le dégât réel.
    expect(damageTypesOf(texteDe('bouclier-flammes'))).toEqual(['feu']);
  });

  it('accepte un objet nu, sans dépendre du catalogue', () => {
    expect(damageTypesOf({ text: 'Sauvegarde ratée : 3d6 dégâts de force.' })).toEqual(['force']);
    expect(damageTypesOf({ text: 'Rien à voir ici.', upcast: '+1d6 dégâts tranchants par rang.' }))
      .toEqual(['tranchants']);
  });

  it('sur le catalogue entier : jamais plus de deux types, et jamais un mot défensif juste avant', () => {
    for (const spell of CATALOGUE) {
      const types = damageTypesOf(spell);
      expect(types.length).toBeLessThanOrEqual(2);
      for (const type of types) {
        // La même prudence que le module applique, revérifiée mécaniquement :
        // le mot juste avant chaque « dégâts » retenu ne doit jamais dire le
        // contraire de « en inflige ».
        const texte = `${spell.text} ${spell.upcast ?? ''}`;
        const motif = new RegExp(`(résist[^\\s]* aux |imm[^\\s]* aux |vuln[ée]rabl[^\\s]* aux |sensibl[^\\s]* aux )dégâts\\s+(?:de\\s+|d['’])?${type}`, 'i');
        expect(motif.test(texte)).toBe(false);
      }
    }
  });
});
