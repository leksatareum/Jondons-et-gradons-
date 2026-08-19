import { describe, expect, it } from 'vitest';
import {
  buildPersistentSpellEffect,
  spellEffectById,
  spellInitialSave,
  spellTargetCount,
} from './spell-effects';

describe('effets de sorts PHB 2024', () => {
  it('Immobilisation de personne respecte la cible et la sauvegarde 2024', () => {
    const spell = spellEffectById('immobilisation-personne');
    expect(spell).not.toBeNull();
    expect(spell?.baseLevel).toBe(2);
    expect(spell?.targeting).toMatchObject({
      kind: 'creature',
      rangeMeters: 18,
      maxTargets: 1,
      requiresSight: true,
      creatureTypes: ['Humanoïde'],
    });
    expect(spell?.concentration).toBe(true);
    expect(spell?.duration).toMatchObject({ kind: 'concentration', rounds: 10 });
    expect(spellInitialSave(spell!, 15)).toEqual({ ability: 'SAG', dc: 15 });
    expect(spell?.repeatSave).toEqual({ ability: 'SAG', timing: 'end-turn', endsOnSuccess: true });
    expect(spell?.modifiers).toEqual([{ type: 'condition', condition: 'Paralysé' }]);
  });

  it('Immobilisation de personne ajoute une cible par niveau d’emplacement supérieur', () => {
    const spell = spellEffectById('immobilisation-personne')!;
    expect(spellTargetCount(spell, 2)).toBe(1);
    expect(spellTargetCount(spell, 3)).toBe(2);
    expect(spellTargetCount(spell, 5)).toBe(4);
  });

  it('Immobilisation de monstre vise une créature sans restriction Humanoïde', () => {
    const spell = spellEffectById('immobilisation-monstre')!;
    expect(spell.baseLevel).toBe(5);
    expect(spell.targeting.rangeMeters).toBe(27);
    expect(spell.targeting.creatureTypes).toBeUndefined();
    expect(spellTargetCount(spell, 7)).toBe(3);
  });

  it('construit l’effet persistant avec le DD réel du lanceur', () => {
    const definition = spellEffectById('immobilisation-personne')!;
    const effect = buildPersistentSpellEffect(definition, {
      casterId: 'caster',
      targetId: 'target',
      sourceName: 'Immobilisation de personne',
      saveDc: 16,
      appliedOrder: 42,
      potency: 3,
    });
    expect(effect).toMatchObject({
      sourceId: 'immobilisation-personne',
      sourceType: 'spell',
      casterId: 'caster',
      targetId: 'target',
      duration: { kind: 'concentration', rounds: 10 },
      modifiers: [{ type: 'condition', condition: 'Paralysé' }],
      repeatSave: { ability: 'SAG', dc: 16, timing: 'end-turn', endsOnSuccess: true },
      potency: 3,
      appliedOrder: 42,
    });
  });
});
