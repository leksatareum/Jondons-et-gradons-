import { describe, expect, it } from 'vitest';
import './wild-shape-moon-levels-3-5';
import {
  applyWildShape,
  canCastSpellWhileWildShaped,
  eligibleWildShapeProfiles,
  endWildShape,
  lunarRadianceActive,
  lunarRadianceConcentrationBonus,
  normalizedKnownWildShapeForms,
  openWildShapeSwapAfterLongRest,
  swapWildShapeForm,
  wildShapeKnownLimit,
  wildShapeMaxCr,
  wildShapeTempHp,
} from './wild-shape';
import { effectiveWildShapeSaveModifier, effectiveWildShapeSkillModifier } from './wild-shape-proficiencies';

const druid = (level: number, subclass: string | null = null) => ({
  level,
  classId: 'druide',
  subclass,
  classLevels: [{ classId: 'druide', level, subclass }],
  abilities: { str: 8, dex: 14, con: 14, int: 12, wis: 18, cha: 10 },
  hp: 30,
  hpMax: 30,
  hpTemp: 0,
  attacks: [{ id: 'staff', name: 'Bâton', dice: '1d6+2' }],
  resources: [{ name: 'Forme sauvage', current: 2, max: 2 }],
  conditions: [],
  turn: { action: false, bonus: false, reaction: false },
});

describe('Forme sauvage PHB 2024 · niveaux 2 à 5', () => {
  it('limite le Druide 2 à 4 formes connues, FP 1/4 et sans vitesse de vol', () => {
    const ch = druid(2);
    expect(wildShapeKnownLimit(2)).toBe(4);
    expect(wildShapeMaxCr(ch)).toBe(0.25);
    const forms = eligibleWildShapeProfiles(ch);
    expect(forms.length).toBeGreaterThan(4);
    expect(forms.every((form) => !/vol/i.test(form.speed))).toBe(true);
    expect(forms.some((form) => form.id === 'wolf')).toBe(true);
    expect(forms.some((form) => form.id === 'black-bear')).toBe(false);
  });

  it('passe à 6 formes connues et FP 1/2 au Druide 4', () => {
    const ch = druid(4);
    expect(wildShapeKnownLimit(4)).toBe(6);
    expect(wildShapeMaxCr(ch)).toBe(0.5);
    expect(eligibleWildShapeProfiles(ch).some((form) => form.id === 'black-bear')).toBe(true);
    expect(eligibleWildShapeProfiles(ch).some((form) => form.id === 'brown-bear')).toBe(false);
  });

  it('ouvre les cinq profils FP 1 du PHB au Cercle de la Lune niveau 3', () => {
    const ch = druid(3, 'Cercle de la Lune');
    expect(wildShapeMaxCr(ch)).toBe(1);
    expect(wildShapeTempHp(ch)).toBe(9);
    const ids = eligibleWildShapeProfiles(ch).map((form) => form.id);
    expect(ids).toEqual(expect.arrayContaining(['brown-bear', 'dire-wolf', 'giant-spider', 'lion', 'tiger']));
    expect(ids.some((id) => ['hawk', 'owl', 'raven'].includes(id))).toBe(false);
  });

  it('applique la CA lunaire, les PV temporaires triples et la durée exacte au niveau 3', () => {
    const base = { ...druid(3, 'Cercle de la Lune'), wildShapeKnownForms: ['brown-bear', 'wolf', 'rat', 'spider'] };
    const shifted = applyWildShape(base, 'brown-bear');
    expect(shifted.activeWildShape?.formName).toBe('Ours brun');
    expect(shifted.activeWildShape?.ac).toBe(17);
    expect(shifted.activeWildShape?.durationHours).toBe(1.5);
    expect(shifted.hpTemp).toBe(9);
    expect(shifted.attacks?.map((attack) => attack.name)).toEqual(['Morsure', 'Griffe']);
  });

  it('remplace les caractéristiques physiques et attaques sans toucher INT/SAG/CHA ni aux PV', () => {
    const base = { ...druid(2), wildShapeKnownForms: ['wolf', 'rat', 'spider', 'riding-horse'] };
    const shifted = applyWildShape(base, 'wolf');
    expect(shifted).not.toBe(base);
    expect(shifted.abilities?.str).toBe(14);
    expect(shifted.abilities?.dex).toBe(15);
    expect(shifted.abilities?.con).toBe(12);
    expect(shifted.abilities?.int).toBe(12);
    expect(shifted.abilities?.wis).toBe(18);
    expect(shifted.abilities?.cha).toBe(10);
    expect(shifted.hp).toBe(30);
    expect(shifted.hpMax).toBe(30);
    expect(shifted.hpTemp).toBe(2);
    expect(shifted.attacks?.[0]?.name).toBe('Morsure');
    expect(shifted.resources?.find((entry) => entry.name === 'Forme sauvage')?.current).toBe(1);
  });

  it('garde les maîtrises du Druide mais choisit le meilleur modificateur du profil de bête', () => {
    const base = { ...druid(3, 'Cercle de la Lune'), wildShapeKnownForms: ['tiger', 'wolf', 'rat', 'spider'] };
    const tiger = applyWildShape(base, 'tiger');

    expect(effectiveWildShapeSkillModifier(tiger, 'discretion', 'dex', 2, true, false)).toEqual({ modifier: 7, source: 'beast' });
    expect(effectiveWildShapeSkillModifier(tiger, 'discretion', 'dex', 2, true, true)).toEqual({ modifier: 7, source: 'character' });

    const camelBase = { ...druid(3), wildShapeKnownForms: ['camel', 'wolf', 'rat', 'spider'] };
    const camel = applyWildShape(camelBase, 'camel');
    expect(effectiveWildShapeSaveModifier(camel, 'con', 2, false)).toEqual({ modifier: 5, source: 'beast' });
    expect(effectiveWildShapeSaveModifier(camel, 'con', 2, true)).toEqual({ modifier: 5, source: 'character' });
  });

  it('restaure les caractéristiques physiques et attaques en quittant la forme', () => {
    const base = { ...druid(2), wildShapeKnownForms: ['wolf', 'rat', 'spider', 'riding-horse'] };
    const shifted = applyWildShape(base, 'wolf');
    const restored = endWildShape(shifted);
    expect(restored.abilities?.str).toBe(8);
    expect(restored.abilities?.dex).toBe(14);
    expect(restored.abilities?.con).toBe(14);
    expect(restored.attacks?.[0]?.name).toBe('Bâton');
    expect(restored.activeWildShape).toBeNull();
  });

  it('ouvre exactement un échange de forme connue après repos long', () => {
    const base = { ...druid(4), wildShapeKnownForms: ['wolf', 'rat', 'spider', 'riding-horse', 'boar', 'panther'] };
    const rested = openWildShapeSwapAfterLongRest(base);
    expect(rested.wildShapeFormSwapOpen).toBe(true);
    const swapped = swapWildShapeForm(rested, 'rat', 'black-bear');
    expect(normalizedKnownWildShapeForms(swapped)).toContain('black-bear');
    expect(normalizedKnownWildShapeForms(swapped)).not.toContain('rat');
    expect(swapped.wildShapeFormSwapOpen).toBe(false);
    expect(swapWildShapeForm(swapped, 'wolf', 'giant-goat')).toBe(swapped);
  });

  it('interdit les sorts en forme normale et autorise tous les sorts lunaires aux paliers 3/5/7/9', () => {
    const normal = applyWildShape({ ...druid(3), wildShapeKnownForms: ['wolf', 'rat', 'spider', 'riding-horse'] }, 'wolf');
    expect(canCastSpellWhileWildShaped(normal, 'Soins')).toBe(false);

    const moon3 = applyWildShape({ ...druid(3, 'Cercle de la Lune'), wildShapeKnownForms: ['wolf', 'rat', 'spider', 'riding-horse'] }, 'wolf');
    expect(canCastSpellWhileWildShaped(moon3, 'Soins')).toBe(true);
    expect(canCastSpellWhileWildShaped(moon3, 'Rayon de lune')).toBe(true);
    expect(canCastSpellWhileWildShaped(moon3, 'Boule de feu')).toBe(false);

    const moon7 = applyWildShape({ ...druid(7, 'Cercle de la Lune'), wildShapeKnownForms: ['wolf', 'rat', 'spider', 'riding-horse'] }, 'wolf');
    expect(canCastSpellWhileWildShaped(moon7, 'Source de clair de lune')).toBe(true);

    const moon9 = applyWildShape({ ...druid(9, 'Cercle de la Lune'), wildShapeKnownForms: ['wolf', 'rat', 'spider', 'riding-horse'] }, 'wolf');
    expect(canCastSpellWhileWildShaped(moon9, 'Soins de groupe')).toBe(true);
  });
});

describe('Éclat lunaire (Cercle de la Lune, niveau 6) — actif seulement transformé', () => {
  it('inactif avant le niveau 6', () => {
    const forme = applyWildShape(druid(5, 'Cercle de la Lune'), 'wolf');
    expect(forme.activeWildShape).toBeDefined(); // la forme s’applique bien : ce n’est pas ça qui manque
    expect(lunarRadianceActive(forme)).toBe(false);
    expect(lunarRadianceConcentrationBonus(forme, 4)).toBe(0);
  });

  it('inactif si pas transformé, même au niveau 6', () => {
    expect(lunarRadianceActive(druid(6, 'Cercle de la Lune'))).toBe(false);
  });

  it('actif niveau 6+, transformé : ajoute le modificateur de Sagesse à la sauvegarde de concentration', () => {
    const forme = applyWildShape(druid(6, 'Cercle de la Lune'), 'wolf');
    expect(forme.activeWildShape).toBeDefined();
    expect(lunarRadianceActive(forme)).toBe(true);
    expect(lunarRadianceConcentrationBonus(forme, 4)).toBe(4);
  });

  it('un autre cercle n’y a jamais droit', () => {
    const forme = applyWildShape(druid(10, 'Cercle de la Terre'), 'wolf');
    expect(forme.activeWildShape).toBeDefined();
    expect(lunarRadianceActive(forme)).toBe(false);
  });
});
