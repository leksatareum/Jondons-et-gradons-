import { describe, expect, it } from 'vitest';
import { applyLevelUp, levelUpBlockers, levelUpPlan } from './level-up';
import { deriveCharacter } from './derive';
import { EMPTY_LIVE_STATE, totalLevel, type CharacterSheet } from './character';

const fiche = (over: Partial<CharacterSheet> = {}): CharacterSheet => ({
  id: 'f', name: 'Fixture', speciesId: 'humain', lineageId: null, ancestryId: null, size: null,
  backgroundId: 'sage',
  abilities: { str: 10, dex: 12, con: 14, int: 10, wis: 16, cha: 10 },
  alignment: null,
  classLevels: [{ classId: 'druide', level: 2, subclass: null, subclassId: null }],
  classChoices: {}, skillProficiencies: [], expertise: [], toolProficiencies: [],
  languages: [], featIds: [], abilityImprovements: [], cantrips: [], spells: [],
  inventory: [], armorId: null, shield: false, gold: 0,
  live: { ...EMPTY_LIVE_STATE, hitDiceSpent: {}, spellSlotsSpent: {}, resourcesSpent: {}, conditions: [] },
  ...over,
});

describe('ce que le niveau demande, et lui seul', () => {
  it('ouvre la sous-classe au niveau 3', () => {
    const plan = levelUpPlan(fiche(), 'druide')!;
    expect(plan.to).toBe(3);
    expect(plan.subclass?.options.length).toBeGreaterThan(0);
    expect(plan.subclass?.label).toBeTruthy();
  });

  it('ne redemande pas une sous-classe déjà choisie', () => {
    const sheet = fiche({
      classLevels: [{ classId: 'druide', level: 3, subclass: 'Cercle de la Lune', subclassId: null }],
    });
    expect(levelUpPlan(sheet, 'druide')!.subclass).toBeNull();
  });

  it('signale les niveaux d’augmentation de caractéristique', () => {
    const sheet = fiche({
      classLevels: [{ classId: 'druide', level: 3, subclass: 'Cercle de la Lune', subclassId: null }],
    });
    expect(levelUpPlan(sheet, 'druide')!.asi).toBe(true);
    expect(levelUpPlan(fiche(), 'druide')!.asi).toBe(false);
  });

  it('montre ce que la classe apporte à ce niveau', () => {
    const sheet = fiche({
      classLevels: [{ classId: 'druide', level: 4, subclass: 'Cercle de la Lune', subclassId: null }],
    });
    // Niveau 5 : Résurgence sauvage.
    expect(levelUpPlan(sheet, 'druide')!.features).toContain('Résurgence sauvage');
  });

  it('au niveau de la sous-classe, la classe ne donne rien — c’est le cercle qui donne', () => {
    const plan = levelUpPlan(fiche(), 'druide')!;
    expect(plan.features).toEqual([]);
    // Les options portent chacune ce qu'elles apporteront : c'est sur ça que
    // le choix se fait, pas sur le nom.
    const lune = plan.subclass!.options.find((option) => /lune/i.test(option.name));
    expect(lune?.features.some((feature) => feature.level === 3)).toBe(true);
  });

  it('une fois la sous-classe posée, ses capacités du niveau apparaissent', () => {
    const sheet = fiche({
      classLevels: [{ classId: 'druide', level: 5, subclass: 'Cercle de la Lune', subclassId: null }],
    });
    const plan = levelUpPlan(sheet, 'druide')!;
    expect(plan.subclassFeatures.every((feature) => feature.level === 6)).toBe(true);
  });

  it('s’arrête au niveau 20', () => {
    const sheet = fiche({
      classLevels: [{ classId: 'druide', level: 20, subclass: 'Cercle de la Lune', subclassId: null }],
    });
    expect(levelUpPlan(sheet, 'druide')).toBeNull();
  });

  it('ne planifie rien pour une classe absente de la fiche', () => {
    expect(levelUpPlan(fiche(), 'magicien')).toBeNull();
  });
});

describe('ce qui empêche de valider', () => {
  const plan = levelUpPlan(fiche(), 'druide')!;

  it('exige un jet dans les bornes du dé', () => {
    expect(levelUpBlockers(plan, { classId: 'druide', hitPointRoll: 0 }).join(' ')).toContain('entre 1 et 8');
    expect(levelUpBlockers(plan, { classId: 'druide', hitPointRoll: 9 }).join(' ')).toContain('entre 1 et 8');
  });

  it('exige la sous-classe quand le niveau l’ouvre', () => {
    const blocages = levelUpBlockers(plan, { classId: 'druide', hitPointRoll: 5 });
    expect(blocages.some((b) => b.includes('choisir'))).toBe(true);
  });

  it('refuse une augmentation qui ne vaut pas +2 en tout', () => {
    const sheet = fiche({
      classLevels: [{ classId: 'druide', level: 3, subclass: 'Cercle de la Lune', subclassId: null }],
    });
    const p = levelUpPlan(sheet, 'druide')!;
    expect(levelUpBlockers(p, { classId: 'druide', hitPointRoll: 5, improvement: { wis: 3 } }).join(' '))
      .toContain('+2 en tout');
    expect(levelUpBlockers(p, { classId: 'druide', hitPointRoll: 5, improvement: { wis: 1, con: 1 } }))
      .toEqual([]);
  });

  it('laisse passer quand tout est renseigné', () => {
    expect(levelUpBlockers(plan, {
      classId: 'druide', hitPointRoll: 5, subclass: 'Cercle de la Lune',
    })).toEqual([]);
  });
});

describe('appliquer la montée', () => {
  it('monte le niveau, pose la sous-classe et consigne le jet', () => {
    const sheet = fiche();
    const plan = levelUpPlan(sheet, 'druide')!;
    const apres = applyLevelUp(sheet, plan, {
      classId: 'druide', hitPointRoll: 6, subclass: 'Cercle de la Lune',
    });
    expect(totalLevel(apres)).toBe(3);
    expect(apres.classLevels[0].subclass).toBe('Cercle de la Lune');
    expect(apres.hitPointRolls).toEqual([6]);
  });

  it('les emplacements et les sorts préparables suivent tout seuls', () => {
    const sheet = fiche();
    const avant = deriveCharacter(sheet);
    const apres = deriveCharacter(applyLevelUp(sheet, levelUpPlan(sheet, 'druide')!, {
      classId: 'druide', hitPointRoll: 6, subclass: 'Cercle de la Lune',
    }));
    expect(apres.spellcasting.preparedMax.druide).toBeGreaterThan(avant.spellcasting.preparedMax.druide);
    expect(apres.spellcasting.slots.length).toBeGreaterThanOrEqual(avant.spellcasting.slots.length);
    expect(apres.proficiencyBonus).toBe(avant.proficiencyBonus);
  });

  it('l’augmentation de caractéristique s’applique', () => {
    const sheet = fiche({
      classLevels: [{ classId: 'druide', level: 3, subclass: 'Cercle de la Lune', subclassId: null }],
    });
    const apres = applyLevelUp(sheet, levelUpPlan(sheet, 'druide')!, {
      classId: 'druide', hitPointRoll: 5, improvement: { wis: 2 },
    });
    expect(deriveCharacter(apres).abilities.wis).toBe(18);
  });

  it('un don choisi à la place se pose sur la fiche', () => {
    const sheet = fiche({
      classLevels: [{ classId: 'druide', level: 3, subclass: 'Cercle de la Lune', subclassId: null }],
    });
    const apres = applyLevelUp(sheet, levelUpPlan(sheet, 'druide')!, {
      classId: 'druide', hitPointRoll: 5, featId: 'general-resilient',
    });
    expect(apres.featIds).toContain('general-resilient');
  });
});

describe('les PV d’un personnage importé ne changent pas sous ses yeux', () => {
  const importe = fiche({ maxHpOverride: 19 });

  it('ajoute le gain au total imposé au lieu de le recalculer', () => {
    const plan = levelUpPlan(importe, 'druide')!;
    expect(plan.usesOverride).toBe(true);
    const apres = applyLevelUp(importe, plan, {
      classId: 'druide', hitPointRoll: 6, subclass: 'Cercle de la Lune',
    });
    // 19 + jet 6 + Constitution +2
    expect(apres.maxHpOverride).toBe(27);
    expect(deriveCharacter(apres).maxHp).toBe(27);
  });

  it('rattrape les niveaux passés quand l’augmentation monte la Constitution', () => {
    const sheet = fiche({
      maxHpOverride: 24,
      abilities: { str: 10, dex: 12, con: 13, int: 10, wis: 16, cha: 10 },
      classLevels: [{ classId: 'druide', level: 3, subclass: 'Cercle de la Lune', subclassId: null }],
    });
    const apres = applyLevelUp(sheet, levelUpPlan(sheet, 'druide')!, {
      classId: 'druide', hitPointRoll: 5, improvement: { con: 2 },
    });
    // Constitution 13 (+1) → 15 (+2). Gain : 5 + 2, plus 1 point rattrapé
    // pour chacun des trois niveaux déjà acquis.
    expect(apres.maxHpOverride).toBe(24 + 5 + 2 + 3);
  });

  it('sans total imposé, la dérivation reprend seule le calcul', () => {
    const sheet = fiche();
    const apres = applyLevelUp(sheet, levelUpPlan(sheet, 'druide')!, {
      classId: 'druide', hitPointRoll: 6, subclass: 'Cercle de la Lune',
    });
    expect(apres.maxHpOverride).toBeUndefined();
    // Dé 8 au niveau 1, moyenne 5 au niveau 2 (jamais jetée), 6 au niveau 3,
    // plus Constitution +2 par niveau.
    expect(deriveCharacter(apres).maxHp).toBe(8 + 5 + 6 + 6);
  });
});
