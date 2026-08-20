import { describe, expect, it } from 'vitest';
import { allowedSpells, maxCastableRank, preparedBudget, spellbookOf } from './spellbook';
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
