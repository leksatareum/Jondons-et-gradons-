import { describe, expect, it } from 'vitest';
import {
  allowedSpells, cantripBudget, cantripChoices, grantedCantrips,
  maxCastableRank, preparedBudget, spellbookOf, spellChoices,
} from './spellbook';
import { deriveCharacter } from './derive';
import { EMPTY_LIVE_STATE, type CharacterSheet } from './character';

const fiche = (over: Partial<CharacterSheet> = {}): CharacterSheet => ({
  id: 'f', name: 'Fixture', speciesId: 'humain', lineageId: null, ancestryId: null, size: null,
  backgroundId: 'sage',
  abilities: { str: 10, dex: 10, con: 14, int: 10, wis: 16, cha: 16 },
  alignment: null,
  classLevels: [{ classId: 'druide', level: 2, subclass: null, subclassId: null }],
  classChoices: {}, skillProficiencies: [], expertise: [], toolProficiencies: [],
  languages: [], featIds: [], abilityImprovements: [], cantrips: [], spells: [],
  inventory: [], armorId: null, shield: false, gold: 0,
  live: { ...EMPTY_LIVE_STATE, hitDiceSpent: {}, spellSlotsSpent: {}, resourcesSpent: {}, conditions: [] },
  ...over,
});

const avec = (sheet: CharacterSheet) => ({ sheet, derived: deriveCharacter(sheet) });

describe('ce que le personnage a le droit de préparer', () => {
  it('plafonne au rang lançable, pas au niveau de personnage', () => {
    const { sheet, derived } = avec(fiche());
    expect(maxCastableRank(derived)).toBe(1);
    const [liste] = allowedSpells(sheet, derived);
    expect(liste.classId).toBe('druide');
    expect(liste.spells.every((spell) => spell.level === 1)).toBe(true);
    expect(liste.spells.length).toBeGreaterThan(0);
  });

  it('ne propose que la liste de la classe', () => {
    const { sheet, derived } = avec(fiche());
    const [liste] = allowedSpells(sheet, derived);
    expect(liste.spells.every((spell) => spell.classes.includes('dr'))).toBe(true);
    // « Armure d'Agathys » est un sort d'occultiste : il n'a rien à faire ici.
    expect(liste.spells.some((spell) => spell.id === 'armure-agathys')).toBe(false);
  });

  it('un multiclassé voit les deux listes, séparément', () => {
    const { sheet, derived } = avec(fiche({
      classLevels: [
        { classId: 'druide', level: 2, subclass: null, subclassId: null },
        { classId: 'occultiste', level: 1, subclass: null, subclassId: null },
      ],
    }));
    const listes = allowedSpells(sheet, derived);
    expect(listes.map((l) => l.classId)).toEqual(['druide', 'occultiste']);
  });

  it('une classe sans magie n’ouvre aucune liste', () => {
    const { sheet, derived } = avec(fiche({
      classLevels: [{ classId: 'roublard', level: 3, subclass: null, subclassId: null }],
    }));
    expect(allowedSpells(sheet, derived)).toEqual([]);
  });
});

describe('le budget — un sort accordé ne le consomme pas', () => {
  it('compte les sorts choisis, et eux seuls', () => {
    const { sheet, derived } = avec(fiche({
      spells: [
        { id: 'soins', sourceClass: 'druide', prepared: true },
        { id: 'enchevetrement', sourceClass: 'druide', prepared: true },
      ],
    }));
    const [budget] = preparedBudget(sheet, derived);
    expect(budget).toMatchObject({ classId: 'druide', prepared: 2, max: 5, room: true });
  });

  it('un sort accordé par un don s’ajoute sans rapprocher du plafond', () => {
    const sansDon = avec(fiche({
      spells: [{ id: 'soins', sourceClass: 'druide', prepared: true }],
    }));
    const avecDon = avec(fiche({
      spells: [
        { id: 'soins', sourceClass: 'druide', prepared: true },
        { id: 'orbe-chromatique', sourceClass: 'druide', prepared: true, grantedBy: 'origin' },
      ],
    }));
    const budgetSans = preparedBudget(sansDon.sheet, sansDon.derived)[0];
    const budgetAvec = preparedBudget(avecDon.sheet, avecDon.derived)[0];

    expect(budgetAvec.prepared).toBe(budgetSans.prepared);
    expect(budgetAvec.free).toBe(budgetSans.free + 1);
  });

  it('le plafond atteint ferme la porte', () => {
    const { sheet, derived } = avec(fiche({
      spells: ['soins', 'enchevetrement', 'baies-nourricieres', 'charme-personne', 'graisse']
        .map((id) => ({ id, sourceClass: 'druide', prepared: true })),
    }));
    const [budget] = preparedBudget(sheet, derived);
    expect(budget.max).toBe(5);
    expect(budget.room).toBe(false);
  });

  it('dit ce qui rouvre la liste, parce que l’écran en dépend', () => {
    const druide = avec(fiche());
    expect(preparedBudget(druide.sheet, druide.derived)[0].mode).toBe('long-rest');

    const rodeur = avec(fiche({
      classLevels: [{ classId: 'rodeur', level: 2, subclass: null, subclassId: null }],
    }));
    expect(preparedBudget(rodeur.sheet, rodeur.derived)[0].mode).toBe('long-rest-one');

    const occultiste = avec(fiche({
      classLevels: [{ classId: 'occultiste', level: 2, subclass: null, subclassId: null }],
    }));
    expect(preparedBudget(occultiste.sheet, occultiste.derived)[0].mode).toBe('level-up');
  });
});

describe('le grimoire montre aussi ce qui n’est pas sur la fiche', () => {
  it('ajoute les sorts toujours préparés, que la fiche ne stocke pas', () => {
    const { sheet, derived } = avec(fiche({
      classLevels: [{ classId: 'rodeur', level: 2, subclass: null, subclassId: null }],
      spells: [{ id: 'brouillard', sourceClass: 'rodeur', prepared: true }],
    }));
    const livre = spellbookOf(sheet, derived);
    const noms = livre.map((entree) => entree.spell.id);
    // « Marque du chasseur » est toujours préparée pour un rôdeur : dérivée,
    // absente de la fiche, elle doit malgré tout apparaître au joueur.
    expect(noms).toContain('marque-chasseur');
    expect(noms).toContain('brouillard');
    const marque = livre.find((entree) => entree.spell.id === 'marque-chasseur');
    expect(marque?.standing.kind).toBe('toujours-prepare');
  });

  it('un sort inconnu du catalogue est ignoré plutôt que d’afficher une ligne vide', () => {
    const { sheet, derived } = avec(fiche({
      spells: [
        { id: 'soins', sourceClass: 'druide', prepared: true },
        { id: 'sort-fantome', sourceClass: 'druide', prepared: true },
      ],
    }));
    const ids = spellbookOf(sheet, derived).map((entree) => entree.spell.id);
    expect(ids).toContain('soins');
    expect(ids).not.toContain('sort-fantome');
  });
});

describe('le catalogue autorisé, sort par sort', () => {
  it('marque ce qui est préparé, et ce qui reste disponible', () => {
    const { sheet, derived } = avec(fiche({
      spells: [{ id: 'soins', sourceClass: 'druide', prepared: true }],
    }));
    const choix = spellChoices(sheet, derived, 'druide');
    expect(choix.find((c) => c.spell.id === 'soins')?.state.kind).toBe('prepare');
    expect(choix.find((c) => c.spell.id === 'enchevetrement')?.state.kind).toBe('disponible');
  });

  it('au plafond, tout le reste passe à « budget plein » plutôt que de disparaître', () => {
    const { sheet, derived } = avec(fiche({
      spells: ['soins', 'enchevetrement', 'baies-nourricieres', 'charme-personne', 'graisse']
        .map((id) => ({ id, sourceClass: 'druide', prepared: true })),
    }));
    const choix = spellChoices(sheet, derived, 'druide');
    // Plus rien n'est « disponible » : ce qui reste est soit hors d'atteinte
    // faute de place, soit accordé d'office — un sort toujours préparé n'a
    // jamais dépendu du budget.
    expect(choix.some((c) => c.state.kind === 'disponible')).toBe(false);
    expect(choix.some((c) => c.state.kind === 'budget-plein')).toBe(true);
    expect(choix.find((c) => c.spell.id === 'parler-animaux')?.state.kind)
      .toBe('toujours-prepare');
  });

  it('un sort toujours préparé n’est jamais proposé au choix', () => {
    const { sheet, derived } = avec(fiche({
      classLevels: [{ classId: 'rodeur', level: 2, subclass: null, subclassId: null }],
    }));
    const choix = spellChoices(sheet, derived, 'rodeur');
    const marque = choix.find((c) => c.spell.id === 'marque-chasseur');
    expect(marque?.state.kind).toBe('toujours-prepare');
  });

  it('ne propose rien pour une classe qui n’est pas celle du personnage', () => {
    const { sheet, derived } = avec(fiche());
    expect(spellChoices(sheet, derived, 'occultiste')).toEqual([]);
  });
});

describe('sorts mineurs — un quota à part, et des accordés hors quota', () => {
  const occultiste = (cantrips: { id: string; sourceClass: string }[]) => avec(fiche({
    classLevels: [{ classId: 'occultiste', level: 2, subclass: null, subclassId: null }],
    cantrips,
  }));

  it('ne compte que les sorts mineurs de la classe', () => {
    const { sheet, derived } = occultiste([
      { id: 'explosion-occulte', sourceClass: 'occultiste' },
      { id: 'glas', sourceClass: 'occultiste' },
      { id: 'lumieres-dansantes', sourceClass: 'species' },
      { id: 'illusion-mineure', sourceClass: 'origin:background' },
      { id: 'eclat-mental', sourceClass: 'origin:background' },
    ]);
    const [budget] = cantripBudget(sheet, derived);
    // Deux au quota de l'occultiste de niveau 2 ; les trois autres s'ajoutent.
    expect(budget).toMatchObject({ classId: 'occultiste', known: 2, max: 2, free: 3, room: false });
  });

  it('sans la provenance, le quota déborderait', () => {
    const { sheet, derived } = occultiste(
      ['explosion-occulte', 'glas', 'lumieres-dansantes', 'illusion-mineure', 'eclat-mental']
        .map((id) => ({ id, sourceClass: 'occultiste' })),
    );
    // C'est exactement ce que produisait l'import avant correction.
    expect(cantripBudget(sheet, derived)[0].known).toBe(5);
  });

  it('liste les sorts mineurs accordés avec leur source', () => {
    const { sheet } = occultiste([
      { id: 'explosion-occulte', sourceClass: 'occultiste' },
      { id: 'lumieres-dansantes', sourceClass: 'species' },
    ]);
    const accordes = grantedCantrips(sheet);
    expect(accordes).toHaveLength(1);
    expect(accordes[0].source).toBe('species');
    expect(accordes[0].spell.name).toBe('Lumières dansantes');
  });

  it('marque l’état de chaque sort mineur de la liste', () => {
    const { sheet, derived } = occultiste([{ id: 'glas', sourceClass: 'occultiste' }]);
    const choix = cantripChoices(sheet, derived, 'occultiste');
    expect(choix.every((entry) => entry.spell.level === 0)).toBe(true);
    expect(choix.find((c) => c.spell.id === 'glas')?.state.kind).toBe('prepare');
    expect(choix.some((c) => c.state.kind === 'disponible')).toBe(true);
  });

  it('un rôdeur n’a pas de sorts mineurs, donc pas de quota', () => {
    const { sheet, derived } = avec(fiche({
      classLevels: [{ classId: 'rodeur', level: 2, subclass: null, subclassId: null }],
    }));
    expect(cantripBudget(sheet, derived)).toEqual([]);
  });
});
