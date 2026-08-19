import { describe, expect, it } from 'vitest';
import { spellEffectById } from '../content/spell-effects';
import { resolveSavingThrowSpell, savingThrowSucceeded, validateSpellTarget } from './spell-resolution';

const holdPerson = spellEffectById('immobilisation-personne')!;
const holdMonster = spellEffectById('immobilisation-monstre')!;

const validHumanoid = {
  id: 'target',
  creatureType: 'Humanoïde',
  distanceMeters: 12,
  visible: true,
  clearPath: true,
};

describe('résolution des sorts à sauvegarde', () => {
  it('valide une cible Humanoïde visible et à portée pour Immobilisation de personne', () => {
    expect(validateSpellTarget(holdPerson, validHumanoid)).toEqual({
      status: 'valid', reasons: [], missingFacts: [],
    });
  });

  it('refuse une créature non Humanoïde pour Immobilisation de personne', () => {
    const validation = validateSpellTarget(holdPerson, { ...validHumanoid, creatureType: 'Mort-vivant' });
    expect(validation.status).toBe('invalid');
    expect(validation.reasons.join(' ')).toMatch(/type de créature invalide/i);
  });

  it('refuse une cible hors portée ou derrière un couvert total', () => {
    const validation = validateSpellTarget(holdPerson, {
      ...validHumanoid,
      distanceMeters: 20,
      clearPath: false,
    });
    expect(validation.status).toBe('invalid');
    expect(validation.reasons).toHaveLength(2);
  });

  it('demande un arbitrage quand les faits du plateau ne sont pas renseignés', () => {
    const validation = validateSpellTarget(holdPerson, { id: 'target' });
    expect(validation.status).toBe('needs-adjudication');
    expect(validation.missingFacts).toEqual(expect.arrayContaining([
      'distance', 'ligne de vue', 'chemin clair', 'type de créature',
    ]));
  });

  it('applique Paralysé après un échec et injecte le DD dans la sauvegarde répétée', () => {
    const result = resolveSavingThrowSpell(holdPerson, validHumanoid, {
      casterId: 'caster',
      sourceName: 'Immobilisation de personne',
      saveDc: 15,
      slotLevel: 2,
      appliedOrder: 1,
      outcome: { kind: 'rolled', total: 14 },
    });
    expect(result.saveSucceeded).toBe(false);
    expect(result.effect).toMatchObject({
      targetId: 'target',
      modifiers: [{ type: 'condition', condition: 'Paralysé' }],
      repeatSave: { ability: 'SAG', dc: 15, timing: 'end-turn', endsOnSuccess: true },
    });
  });

  it('n’applique aucun effet après une sauvegarde initiale réussie', () => {
    const result = resolveSavingThrowSpell(holdPerson, validHumanoid, {
      casterId: 'caster',
      sourceName: 'Immobilisation de personne',
      saveDc: 15,
      slotLevel: 2,
      appliedOrder: 1,
      outcome: { kind: 'rolled', total: 15 },
    });
    expect(result.saveSucceeded).toBe(true);
    expect(result.effect).toBeNull();
  });

  it('ne fabrique pas un faux résultat quand la cible doit être arbitrée', () => {
    const unresolved = resolveSavingThrowSpell(holdPerson, { id: 'target' }, {
      casterId: 'caster', sourceName: 'Immobilisation de personne', saveDc: 15,
      slotLevel: 2, appliedOrder: 1, outcome: { kind: 'auto-fail' },
    });
    expect(unresolved.validation.status).toBe('needs-adjudication');
    expect(unresolved.saveSucceeded).toBeNull();
    expect(unresolved.effect).toBeNull();

    const confirmed = resolveSavingThrowSpell(holdPerson, { id: 'target' }, {
      casterId: 'caster', sourceName: 'Immobilisation de personne', saveDc: 15,
      slotLevel: 2, appliedOrder: 2, outcome: { kind: 'auto-fail' }, adjudicatedValid: true,
    });
    expect(confirmed.saveSucceeded).toBe(false);
    expect(confirmed.effect).not.toBeNull();
  });

  it('Immobilisation de monstre accepte un type non Humanoïde', () => {
    const validation = validateSpellTarget(holdMonster, {
      id: 'undead', creatureType: 'Mort-vivant', distanceMeters: 20, visible: true, clearPath: true,
    });
    expect(validation.status).toBe('valid');
  });

  it('gère les réussites et échecs automatiques explicitement', () => {
    expect(savingThrowSucceeded({ kind: 'auto-success' }, 30)).toBe(true);
    expect(savingThrowSucceeded({ kind: 'auto-fail' }, 1)).toBe(false);
  });
});
