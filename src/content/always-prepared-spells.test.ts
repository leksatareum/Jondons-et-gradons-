import { describe, expect, it } from 'vitest';
import { SPELLS } from './spells.js';
import {
  alwaysPreparedSpellsFor,
  CLASS_ALWAYS_SPELLS,
  DRUID_TERRAINS,
  SUBCLASS_ALWAYS_SPELLS,
  TERRAIN_ALWAYS_SPELLS,
} from './always-prepared-spells';

const allTiers = [
  ...Object.values(SUBCLASS_ALWAYS_SPELLS),
  ...Object.values(TERRAIN_ALWAYS_SPELLS),
  ...Object.values(CLASS_ALWAYS_SPELLS),
];

describe('intégrité du corpus', () => {
  it('tout sort toujours préparé existe dans le catalogue de sorts', () => {
    const known = new Set((SPELLS as { id: string }[]).map((spell) => spell.id));
    const missing = [...new Set(allTiers.flatMap((tiers) => tiers.flatMap(([, ids]) => ids)))]
      .filter((id) => !known.has(id))
      .sort();
    expect(missing).toEqual([]);
  });

  it('les paliers de chaque entrée sont en ordre croissant', () => {
    for (const tiers of allTiers) {
      const levels = tiers.map(([level]) => level);
      expect(levels).toEqual([...levels].sort((a, b) => a - b));
    }
  });
});

describe('les quatre Patrons de l’Occultiste — présents seulement dans la sortie construite', () => {
  it.each(['Patron Archifée', 'Patron Céleste', 'Patron Fiélon', 'Patron Grand Ancien'])(
    '%s a bien sa table de sorts accordés', (patron) => {
      expect(SUBCLASS_ALWAYS_SPELLS[patron]?.length).toBeGreaterThan(0);
    },
  );

  it('un Occultiste reçoit Contact avec un autre plan au niveau 9, pas avant', () => {
    expect(alwaysPreparedSpellsFor({ classId: 'occultiste', level: 8 })).not.toContain('contact-autre-plan');
    expect(alwaysPreparedSpellsFor({ classId: 'occultiste', level: 9 })).toContain('contact-autre-plan');
  });
});

describe('dérivation à la lecture', () => {
  it('un Occultiste Fiélon niveau 5 cumule les sorts de classe et de patron accordés jusqu’à son niveau', () => {
    const spells = alwaysPreparedSpellsFor({ classId: 'occultiste', subclass: 'Patron Fiélon', level: 5 });
    expect(spells).toContain('mains-brulantes'); // palier 3
    expect(spells).toContain('boule-feu'); // palier 5
    expect(spells).not.toContain('bouclier-flammes'); // palier 7, pas encore
  });

  it('un Druide du Cercle de la Terre reçoit les sorts du terrain choisi, et change avec lui', () => {
    const aride = alwaysPreparedSpellsFor({ classId: 'druide', terrain: 'aride', level: 5 });
    const polaire = alwaysPreparedSpellsFor({ classId: 'druide', terrain: 'polaire', level: 5 });
    expect(aride).toContain('boule-feu');
    expect(polaire).toContain('tempete-neige');
    expect(polaire).not.toContain('boule-feu');
    // Druidique accorde Communication avec les animaux dès le niveau 1.
    expect(aride).toContain('parler-animaux');
  });

  it('un Rôdeur a Marque du chasseur toujours préparée dès le niveau 1', () => {
    expect(alwaysPreparedSpellsFor({ classId: 'rodeur', level: 1 })).toEqual(['marque-chasseur']);
  });

  it('les quatre terrains druidiques ont tous une table', () => {
    for (const terrain of DRUID_TERRAINS) {
      expect(TERRAIN_ALWAYS_SPELLS[terrain]?.length).toBeGreaterThan(0);
    }
  });

  it('ne renvoie aucun doublon', () => {
    const spells = alwaysPreparedSpellsFor({ classId: 'druide', subclass: 'Cercle de la Lune', terrain: 'aride', level: 20 });
    expect(spells).toHaveLength(new Set(spells).size);
  });
});
