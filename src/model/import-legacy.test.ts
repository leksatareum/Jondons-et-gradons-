import { describe, expect, it } from 'vitest';
import legacyParty from './__fixtures__/legacy-party.json';
import { compareWithLegacy, importLegacyCharacter, type LegacyCharacter } from './import-legacy';
import { deriveCharacter } from './derive';
import { totalLevel } from './character';

const party = legacyParty as LegacyCharacter[];
const byName = (name: string) => party.find((character) => character.name === name)!;
const importOf = (name: string) => importLegacyCharacter(byName(name));

describe('import — les décisions sont conservées', () => {
  it.each(party.map((character) => [character.name, character] as const))(
    '%s garde identité, espèce, classe, niveau et sous-classe', (_name, legacy) => {
      const { sheet } = importLegacyCharacter(legacy);
      expect(sheet.name).toBe(legacy.name);
      expect(sheet.speciesId).toBe(legacy.speciesId);
      expect(totalLevel(sheet)).toBe(legacy.level);
      expect(sheet.classLevels[0].classId).toBe(legacy.classId);
      expect(sheet.classLevels[0].subclass).toBe(legacy.subclass);
      expect(sheet.abilities).toEqual(legacy.abilities);
    },
  );

  it('retrouve l’id d’origine depuis son nom affiché', () => {
    expect(importOf('Veya').sheet.backgroundId).toBe('guide');
    expect(importOf('Cassian').sheet.backgroundId).toBe('acolyte');
  });

  it('conserve les maîtrises et l’équipement choisis', () => {
    const { sheet } = importOf('Veya');
    expect(sheet.skillProficiencies).toEqual(expect.arrayContaining(['discretion', 'survie', 'perception']));
    expect(sheet.armorId).toBe('cuirclou');
    expect(sheet.gold).toBe(120);
    expect(sheet.inventory.map((item) => item.name)).toContain('Potion de soins');
  });
});

describe('import — les valeurs calculées sont jetées, pas recopiées', () => {
  it('aucun champ dérivable ne subsiste sur la fiche importée', () => {
    const { sheet } = importOf('Veya');
    for (const forbidden of ['hpMax', 'speed', 'hitDie', 'darkvision', 'resistances', 'features', 'attacks', 'className']) {
      expect(sheet, forbidden).not.toHaveProperty(forbidden);
    }
  });

  it('les sorts accordés d’office ne sont plus stockés — ils seront dérivés', () => {
    const { sheet, warnings } = importOf('Veya');
    // Veya avait « Marque du chasseur » marquée `always: true` sur sa fiche.
    expect(sheet.spells.map((spell) => spell.id)).not.toContain('marque-chasseur');
    expect(sheet.spells.map((spell) => spell.id)).toContain('fouet-epineux');
    expect(warnings.join(' ')).toMatch(/accordé/);
    // …et la dérivation la lui rend, sans consommer son budget de sorts.
    expect(deriveCharacter(sheet).spellcasting.alwaysPrepared).toContain('marque-chasseur');
  });
});

describe('import — l’état vivant devient des dépenses, pas des valeurs courantes', () => {
  it('les PV deviennent des dégâts subis, et la dérivation retrouve les PV du moment', () => {
    const legacy = byName('Veya');
    const { sheet } = importOf('Veya');
    expect(sheet.live.damageTaken).toBe(legacy.hpMax! - legacy.hp!);
    expect(sheet.live.temporaryHp).toBe(legacy.hpTemp);

    const derived = deriveCharacter(sheet);
    expect(derived.currentHp).toBe(derived.maxHp - sheet.live.damageTaken);
  });

  it('les emplacements deviennent des dépenses par rang', () => {
    // Wrenna : rang 1 à 2/4 et rang 3 à 2/2 → 2 dépensés au rang 1, 0 au rang 3.
    const { sheet } = importOf('Wrenna');
    expect(sheet.live.spellSlotsSpent[1]).toBe(2);
    expect(sheet.live.spellSlotsSpent[3]).toBeUndefined();
  });

  it('la Concentration est suivie à part, pas comme un état', () => {
    const { sheet } = importOf('Veya');
    expect(sheet.live.concentration?.note).toBe('Marque du chasseur');
    expect(sheet.live.conditions.map((condition) => condition.id)).not.toContain('concentration');
  });

  it('un vrai état est bien repris', () => {
    expect(importOf('Wrenna').sheet.live.conditions.map((condition) => condition.id)).toContain('empoisonne');
  });
});

describe('points de vie — un jet de dé est un fait, pas un calcul', () => {
  it('les PV importés sont repris exactement, avec un avertissement expliquant pourquoi', () => {
    const { sheet, warnings } = importOf('Veya');
    expect(sheet.maxHpOverride).toBe(byName('Veya').hpMax);
    expect(deriveCharacter(sheet).maxHp).toBe(byName('Veya').hpMax);
    expect(warnings.join(' ')).toMatch(/jets de dé de vie/);
  });

  it('sans total imposé, la moyenne fixe s’applique', () => {
    const { sheet } = importOf('Veya');
    const { maxHpOverride: _ignored, ...sansImposition } = sheet;
    // Rôdeuse niveau 5, d10, Constitution 14 : 10 + 4×6 + 5×2 = 44.
    expect(deriveCharacter(sansImposition).maxHp).toBe(44);
  });

  it('les jets enregistrés priment sur la moyenne, et la dérivation reprend la main', () => {
    const { sheet } = importOf('Veya');
    const avecJets = { ...sheet, maxHpOverride: null, hitPointRolls: [3, 8, 2, 9] };
    // 10 + (3+8+2+9) + 5×2 = 42 : les PV redeviennent entièrement dérivés.
    expect(deriveCharacter(avecJets).maxHp).toBe(42);
  });

  it('des jets incomplets se complètent par la moyenne, sans planter', () => {
    const { sheet } = importOf('Veya');
    const partiel = { ...sheet, maxHpOverride: null, hitPointRolls: [3] };
    // 10 + 3 + 6 + 6 + 6 + 10 = 41.
    expect(deriveCharacter(partiel).maxHp).toBe(41);
  });
});

describe('test d’acceptation — la dérivation retombe sur les valeurs de l’ancienne app', () => {
  it.each(party.map((character) => [character.name, character] as const))(
    '%s : PV maximum identiques', (_name, legacy) => {
      const { sheet } = importLegacyCharacter(legacy);
      expect(deriveCharacter(sheet).maxHp).toBe(legacy.hpMax);
    },
  );

  it.each(party.map((character) => [character.name, character] as const))(
    '%s : aucun écart, tous champs confondus', (_name, legacy) => {
      const { sheet } = importLegacyCharacter(legacy);
      expect(compareWithLegacy(legacy, deriveCharacter(sheet))).toEqual([]);
    },
  );

  it.each(party.map((character) => [character.name, character] as const))(
    '%s : emplacements de sort identiques', (_name, legacy) => {
      const { sheet } = importLegacyCharacter(legacy);
      const derived = deriveCharacter(sheet);
      const slotDiffs = compareWithLegacy(legacy, derived).filter((diff) => diff.field.startsWith('slots'));
      expect(slotDiffs).toEqual([]);
    },
  );

  it.each(party.map((character) => [character.name, character] as const))(
    '%s : bonus de maîtrise et CA cohérents', (_name, legacy) => {
      const { sheet } = importLegacyCharacter(legacy);
      const derived = deriveCharacter(sheet);
      expect(derived.proficiencyBonus).toBe(3); // tous niveau 5
      expect(derived.armorClass).toBeGreaterThan(0);
    },
  );

  it('une fiche importée deux fois donne le même résultat (hors horodatage)', () => {
    const first = importOf('Cassian').sheet;
    const second = importOf('Cassian').sheet;
    expect({ ...first, importedFrom: null }).toEqual({ ...second, importedFrom: null });
  });
});

describe('import — robustesse', () => {
  it('une fiche vide n’explose pas et signale ce qui manque', () => {
    const { sheet, warnings } = importLegacyCharacter({});
    expect(sheet.name).toBe('Sans nom');
    expect(sheet.classLevels).toEqual([]);
    expect(warnings.length).toBeGreaterThan(0);
    expect(() => deriveCharacter(sheet)).not.toThrow();
  });

  it('une origine inconnue est signalée plutôt qu’inventée', () => {
    const { sheet, warnings } = importLegacyCharacter({ background: 'Chasseur de primes' });
    expect(sheet.backgroundId).toBe('');
    expect(warnings.join(' ')).toMatch(/Chasseur de primes/);
  });
});
