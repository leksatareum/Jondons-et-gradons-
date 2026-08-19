import { describe, expect, it } from 'vitest';

import { periodicDamageAtSlot, spellEffectById } from '../content/spell-effects';
import { resolveSavingThrowSpell, validateSpellTarget } from './spell-resolution';

const strike = spellEffectById('frappe-entravante');
if (!strike) throw new Error('Frappe entravante absente du moteur');

describe('Frappe entravante — moteur PHB 2024', () => {
  it('ne redemande pas distance/ligne claire après l’attaque déclencheuse', () => {
    expect(validateSpellTarget(strike, { id: 'target' })).toEqual({
      status: 'valid',
      reasons: [],
      missingFacts: [],
    });
  });

  it('applique Entravé sur sauvegarde de Force ratée avec test d’évasion par action', () => {
    const result = resolveSavingThrowSpell(strike, { id: 'target' }, {
      casterId: 'caster',
      sourceName: 'Frappe entravante',
      saveDc: 15,
      slotLevel: 1,
      appliedOrder: 1,
      outcome: { kind: 'rolled', total: 14 },
    });
    expect(result.saveSucceeded).toBe(false);
    expect(result.effect?.modifiers).toEqual([{ type: 'condition', condition: 'Entravé' }]);
    expect(result.effect?.escapeCheck).toEqual({
      ability: 'FOR', skill: 'Athlétisme', dc: 15, actionRequired: true, helperAllowed: true, endsOnSuccess: true,
    });
    expect(result.effect?.periodicDamage).toEqual({ timing: 'start-turn', dice: '1d6', damageType: 'perforants' });
  });

  it('n’applique aucun effet persistant si la sauvegarde réussit', () => {
    const result = resolveSavingThrowSpell(strike, { id: 'target' }, {
      casterId: 'caster', sourceName: 'Frappe entravante', saveDc: 15, slotLevel: 1, appliedOrder: 2,
      outcome: { kind: 'rolled', total: 15 },
    });
    expect(result.saveSucceeded).toBe(true);
    expect(result.effect).toBeNull();
  });

  it('augmente uniquement les dégâts périodiques avec le niveau d’emplacement', () => {
    expect(periodicDamageAtSlot(strike, 1)?.dice).toBe('1d6');
    expect(periodicDamageAtSlot(strike, 2)?.dice).toBe('2d6');
    expect(periodicDamageAtSlot(strike, 5)?.dice).toBe('5d6');
  });

  it('signale l’avantage de sauvegarde des créatures de taille G+', () => {
    expect(strike.saveNote).toMatch(/taille G ou supérieure.*avantage/i);
  });
});
