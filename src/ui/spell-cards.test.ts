import { describe, expect, it } from 'vitest';
import { cardsFromCharacter, detailOf, economyOf, slotFor } from './spell-cards';
import { spellById } from '../content/spell-catalogue';
import { deriveCharacter } from '../model/derive';
import { EMPTY_LIVE_STATE, type CharacterSheet } from '../model/character';

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

describe('économie d’action, lue sur le sort', () => {
  it('range chaque temps d’incantation où il faut', () => {
    expect(economyOf({ castingTime: 'Action' } as never)).toBe('action');
    expect(economyOf({ castingTime: '1 action bonus' } as never)).toBe('bonus');
    expect(economyOf({ castingTime: '1 réaction' } as never)).toBe('reaction');
    // Un rituel d'une heure n'est pas une action de combat.
    expect(economyOf({ castingTime: '1 heure' } as never)).toBe('libre');
    expect(economyOf({ castingTime: '10 minutes' } as never)).toBe('libre');
  });

  it('« Mot de guérison » est bien une action bonus', () => {
    expect(economyOf(spellById('mot-guerison')!)).toBe('bonus');
  });
});

describe('ligne de détail', () => {
  it('signale la concentration, qui décide de ce qu’on peut lancer ensuite', () => {
    const brouillard = spellById('brouillard')!;
    expect(detailOf(brouillard)).toContain('concentration');
    expect(detailOf(brouillard)).toContain('rang 1');
  });

  it('un sort mineur n’a pas de rang', () => {
    const mineur = spellById('coup-tonnerre')!;
    expect(detailOf(mineur)).toContain('sort mineur');
    expect(detailOf(mineur)).not.toContain('rang');
  });
});

describe('l’emplacement qui paie le sort', () => {
  const slots = [
    { level: 1, max: 4, spent: 1, remaining: 3 },
    { level: 2, max: 3, spent: 0, remaining: 3 },
  ];

  it('prend le plus bas qui suffit', () => {
    expect(slotFor(1, slots)?.level).toBe(1);
    expect(slotFor(2, slots)?.level).toBe(2);
  });

  it('un sort mineur ne consomme rien', () => {
    expect(slotFor(0, slots)).toBeNull();
  });

  it('un rang hors de portée ne trouve pas d’emplacement', () => {
    expect(slotFor(5, slots)).toBeNull();
  });
});

describe('les cartes viennent de la fiche, pas d’une liste écrite à la main', () => {
  it('un rôdeur ne se voit plus proposer les sorts d’un occultiste', () => {
    const sheet = fiche({
      classLevels: [{ classId: 'rodeur', level: 2, subclass: null, subclassId: null }],
      spells: [{ id: 'brouillard', sourceClass: 'rodeur', prepared: true }],
    });
    const cartes = cardsFromCharacter(sheet, deriveCharacter(sheet));
    const ids = cartes.map((carte) => carte.id);
    expect(ids).toContain('brouillard');
    expect(ids).toContain('marque-chasseur'); // toujours préparé, dérivé
    expect(ids).not.toContain('explosion-occulte');
    expect(ids).not.toContain('armure-agathys');
  });

  it('rattache chaque sort à l’emplacement qui le paie', () => {
    const sheet = fiche({
      spells: [{ id: 'soins', sourceClass: 'druide', prepared: true }],
    });
    const carte = cardsFromCharacter(sheet, deriveCharacter(sheet))
      .find((c) => c.id === 'soins');
    expect(carte?.resource).toMatchObject({ key: 'emplacement-1', label: 'Emplacement de rang 1' });
  });

  it('l’occultiste dépense un emplacement de pacte', () => {
    const sheet = fiche({
      classLevels: [{ classId: 'occultiste', level: 2, subclass: null, subclassId: null }],
      spells: [{ id: 'armure-agathys', sourceClass: 'occultiste', prepared: true }],
    });
    const carte = cardsFromCharacter(sheet, deriveCharacter(sheet))
      .find((c) => c.id === 'armure-agathys');
    expect(carte?.resource?.key).toBe('pacte');
    expect(carte?.resource?.label).toBe('Emplacement de pacte');
  });

  it('marque hors budget un sort accordé par un don', () => {
    const sheet = fiche({
      classLevels: [{ classId: 'occultiste', level: 2, subclass: null, subclassId: null }],
      spells: [{ id: 'orbe-chromatique', sourceClass: 'occultiste', prepared: true, grantedBy: 'origin' }],
    });
    const carte = cardsFromCharacter(sheet, deriveCharacter(sheet))
      .find((c) => c.id === 'orbe-chromatique');
    expect(carte?.granted).toBe(true);
  });

  it('n’invente ni dégâts ni bonus d’attaque', () => {
    // Quatre sorts seulement ont un effet structuré : deviner les autres
    // donnerait des nombres faux avec l'aplomb des nombres justes.
    const sheet = fiche({ spells: [{ id: 'soins', sourceClass: 'druide', prepared: true }] });
    const carte = cardsFromCharacter(sheet, deriveCharacter(sheet))
      .find((c) => c.id === 'soins');
    expect(carte?.damage).toBeUndefined();
    expect(carte?.toHit).toBeUndefined();
  });
});
