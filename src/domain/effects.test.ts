import { describe, expect, it } from 'vitest';
import {
  addEffect,
  advanceCasterConcentrationEffects,
  advanceEffects,
  breakConcentration,
  effectAcBonus,
  effectConditions,
  mechanicallyActiveEffects,
  resolveRepeatedSave,
  type ActiveEffect,
} from './effects';

const restrained: ActiveEffect = {
  id: 'web:target', sourceId: 'web', sourceName: 'Toile', sourceType: 'spell', targetId: 'target', casterId: 'caster',
  duration: { kind: 'concentration', rounds: 10 },
  modifiers: [{ type: 'condition', condition: 'Entravé' }, { type: 'ac', value: 2 }],
  repeatSave: { ability: 'DEX', dc: 15, timing: 'end-turn' },
};

describe('effect engine', () => {
  it('ajoute et remplace un effet de même id', () => {
    const once = addEffect({}, restrained);
    const twice = addEffect(once, { ...restrained, sourceName: 'Toile renforcée' });
    expect(twice.activeEffects).toHaveLength(1);
    expect(twice.activeEffects?.[0].sourceName).toBe('Toile renforcée');
  });

  it('expose les conditions et bonus mécaniques', () => {
    const state = addEffect({}, restrained);
    expect(effectConditions(state)).toEqual(['Entravé']);
    expect(effectAcBonus(state)).toBe(2);
  });

  it('ne cumule pas deux lancements du même sort sur la même cible', () => {
    const weak = { ...restrained, id: 'web:a', potency: 1, appliedOrder: 1 };
    const strong = { ...restrained, id: 'web:b', potency: 2, appliedOrder: 2, modifiers: [{ type: 'ac', value: 4 }] } as ActiveEffect;
    const state = addEffect(addEffect({}, weak), strong);
    expect(mechanicallyActiveEffects(state)).toHaveLength(1);
    expect(effectAcBonus(state)).toBe(4);
  });

  it('préfère le lancement le plus récent à puissance égale', () => {
    const oldCast = { ...restrained, id: 'web:old', potency: 2, appliedOrder: 1 };
    const recentCast = { ...restrained, id: 'web:new', potency: 2, appliedOrder: 2, sourceName: 'Toile récente' };
    const state = addEffect(addEffect({}, oldCast), recentCast);
    expect(mechanicallyActiveEffects(state)[0].sourceName).toBe('Toile récente');
  });

  it('autorise des sorts différents à se cumuler', () => {
    const other = { ...restrained, id: 'bless:target', sourceId: 'bless', sourceName: 'Bénédiction', modifiers: [{ type: 'ac', value: 1 }] } as ActiveEffect;
    const state = addEffect(addEffect({}, restrained), other);
    expect(mechanicallyActiveEffects(state)).toHaveLength(2);
    expect(effectAcBonus(state)).toBe(3);
  });

  it('décompte une durée liée à la cible au bon timing', () => {
    const state = addEffect({}, { ...restrained, duration: { kind: 'rounds', rounds: 2, expiresAt: 'end-turn' } });
    expect(advanceEffects(state, 'start-turn').activeEffects?.[0].duration).toMatchObject({ rounds: 2 });
    expect(advanceEffects(state, 'end-turn').activeEffects?.[0].duration).toMatchObject({ rounds: 1 });
    expect(advanceEffects(advanceEffects(state, 'end-turn'), 'end-turn').activeEffects).toEqual([]);
  });

  it('ne décompte pas une Concentration sur le tour de la cible', () => {
    const state = addEffect({}, restrained);
    expect(advanceEffects(state, 'end-turn').activeEffects?.[0].duration).toMatchObject({
      kind: 'concentration', rounds: 10,
    });
  });

  it('décompte une Concentration uniquement sur la chronologie de son lanceur', () => {
    const state = addEffect({}, restrained);
    const wrongCaster = advanceCasterConcentrationEffects(state, 'other-caster', 'end-turn');
    expect(wrongCaster.activeEffects?.[0].duration).toMatchObject({ rounds: 10 });
    const advanced = advanceCasterConcentrationEffects(state, 'caster', 'end-turn');
    expect(advanced.activeEffects?.[0].duration).toMatchObject({ rounds: 9 });
  });

  it('retire un effet après une sauvegarde répétée réussie', () => {
    const result = resolveRepeatedSave(addEffect({}, restrained), restrained.id, 16, 'end-turn');
    expect(result.success).toBe(true);
    expect(result.state.activeEffects).toEqual([]);
  });

  it('conserve un effet après une sauvegarde ratée', () => {
    const result = resolveRepeatedSave(addEffect({}, restrained), restrained.id, 14, 'end-turn');
    expect(result.success).toBe(false);
    expect(result.state.activeEffects).toHaveLength(1);
  });

  it('rompt tous les effets de concentration du lanceur', () => {
    const state = addEffect(addEffect({}, restrained), { ...restrained, id: 'bless:target2', sourceId: 'bless', targetId: 'target2' });
    expect(breakConcentration(state, 'caster').activeEffects).toEqual([]);
  });
});
