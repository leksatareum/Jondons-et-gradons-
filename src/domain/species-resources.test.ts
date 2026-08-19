import { describe, expect, it } from 'vitest';
import { speciesResourcesFor } from './species-resources';

describe('ressources d’espèce', () => {
  it('un Aasimar niveau 1 n’a que Mains guérisseuses', () => {
    const resources = speciesResourcesFor({ speciesId: 'aasimar', level: 1 });
    expect(resources.map((resource) => resource.name)).toEqual(['Mains guérisseuses']);
  });

  it('un Aasimar niveau 3 gagne Révélation céleste', () => {
    const resources = speciesResourcesFor({ speciesId: 'aasimar', level: 3 });
    expect(resources.map((resource) => resource.name)).toContain('Révélation céleste');
  });

  it('un Drakéide a un souffle dont le nombre d’usages suit le bonus de maîtrise', () => {
    const niveau1 = speciesResourcesFor({ speciesId: 'drakeide', level: 1 });
    const niveau5 = speciesResourcesFor({ speciesId: 'drakeide', level: 5 });
    expect(niveau1.find((resource) => resource.name === 'Souffle draconique')?.max).toBe(2);
    expect(niveau5.find((resource) => resource.name === 'Souffle draconique')?.max).toBe(3);
    expect(niveau5.map((resource) => resource.name)).toContain('Vol draconique');
  });

  it('un Elfe drow niveau 5 a deux magies innées suivies séparément', () => {
    const resources = speciesResourcesFor({ speciesId: 'elfe', lineageId: 'drow', level: 5 });
    expect(resources.map((resource) => resource.resourceKey)).toEqual([
      'species:spell:lueurs-feeriques',
      'species:spell:tenebres',
    ]);
  });

  it('une espèce sans ressource particulière (Halfelin) n’en renvoie aucune', () => {
    expect(speciesResourcesFor({ speciesId: 'halfelin', level: 10 })).toEqual([]);
  });
});
