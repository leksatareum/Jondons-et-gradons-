import { describe, expect, it } from 'vitest';

import { spellEffectById } from '../content/spell-effects';
import { resolveDamageTriggeredSave, resolveRepeatedSave } from './effects';
import { resolveSavingThrowSpell } from './spell-resolution';

const laughter = spellEffectById('rire-hideux');
if (!laughter) throw new Error('Fou rire absent du moteur');

const failedInitial = () => resolveSavingThrowSpell(laughter, {
  id: 'target', distanceMeters: 6, visible: true, clearPath: true,
}, {
  casterId: 'caster', sourceName: 'Fou rire', saveDc: 15, slotLevel: 2, appliedOrder: 1,
  outcome: { kind: 'rolled', total: 12 },
});

describe('Fou rire PHB 2024', () => {
  it('applique À terre + Incapable d’agir et permet une cible supplémentaire par niveau', () => {
    const result = failedInitial();
    expect(result.maxTargets).toBe(2);
    expect(result.effect?.modifiers).toEqual([
      { type: 'condition', condition: 'À terre' },
      { type: 'condition', condition: "Incapable d'agir" },
    ]);
  });

  it('porte deux déclencheurs de sauvegarde distincts', () => {
    const effect = failedInitial().effect;
    expect(effect?.repeatSave).toEqual({ ability: 'SAG', timing: 'end-turn', endsOnSuccess: true, dc: 15 });
    expect(effect?.damageTriggeredSave).toEqual({ ability: 'SAG', advantage: true, endsOnSuccess: true, dc: 15 });
  });

  it('une sauvegarde réussie après dégâts termine le sort', () => {
    const effect = failedInitial().effect;
    if (!effect) throw new Error('effet absent');
    const result = resolveDamageTriggeredSave({ activeEffects: [effect] }, effect.id, 15);
    expect(result).toMatchObject({ resolved: true, success: true });
    expect(result.state.activeEffects).toEqual([]);
  });

  it('une sauvegarde ratée après dégâts conserve le sort puis la fin de tour peut le terminer', () => {
    const effect = failedInitial().effect;
    if (!effect) throw new Error('effet absent');
    const damage = resolveDamageTriggeredSave({ activeEffects: [effect] }, effect.id, 10);
    expect(damage.success).toBe(false);
    expect(damage.state.activeEffects).toHaveLength(1);
    const endTurn = resolveRepeatedSave(damage.state, effect.id, 17, 'end-turn');
    expect(endTurn.success).toBe(true);
    expect(endTurn.state.activeEffects).toEqual([]);
  });
});
