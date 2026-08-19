import { describe, expect, it } from 'vitest';
import { ELDRITCH_INVOCATIONS, eligibleInvocationOptions, invocationBaseId, warlockInvocationCount } from './eldritch-invocations';

describe('invocations occultes 2024', () => {
  it('contient les 28 options du Manuel et la table de progression', () => {
    expect(ELDRITCH_INVOCATIONS).toHaveLength(28);
    expect(warlockInvocationCount(1)).toBe(1);
    expect(warlockInvocationCount(2)).toBe(3);
    expect(warlockInvocationCount(5)).toBe(5);
    expect(warlockInvocationCount(20)).toBe(10);
  });

  it('les trois Pactes du PHB 2024 sont disponibles dès le niveau 1, et le Talisman (Tasha/2014) est absent', () => {
    // Vérifié le 19/08/2026 contre le PHB 2024 papier de l'utilisateur : le
    // Pacte du Talisman n'a pas été reconduit en 2024, et le niveau 3 est
    // celui de la sous-classe (patron), pas celui des Pactes.
    for (const id of ['pact-blade', 'pact-chain', 'pact-tome']) {
      expect(ELDRITCH_INVOCATIONS.find((invocation) => invocation.id === id)?.minLevel).toBe(1);
    }
    expect(ELDRITCH_INVOCATIONS.find((invocation) => invocation.id === 'pact-talisman')).toBeUndefined();
  });

  it('bloque les prérequis de niveau et de pacte', () => {
    const base = { level: 5, selectedIds: [], damageCantrips: [], rangedDamageCantrips: [], attackCantrips: [], originFeats: [] };
    const withoutPact = eligibleInvocationOptions(base).map((option) => option.id);
    expect(withoutPact).not.toContain('thirsting-blade');
    const withBlade = eligibleInvocationOptions({ ...base, selectedIds: ['pact-blade'] }).map((option) => option.id);
    expect(withBlade).toContain('thirsting-blade');
    expect(withBlade).not.toContain('lifedrinker');
  });

  it('déplie les options répétables par cible', () => {
    const options = eligibleInvocationOptions({
      level: 2,
      selectedIds: [],
      damageCantrips: [{ id: 'blast', name: 'Décharge occulte' }],
      rangedDamageCantrips: [{ id: 'blast', name: 'Décharge occulte' }],
      attackCantrips: [{ id: 'blast', name: 'Décharge occulte' }],
      originFeats: [{ id: 'chanceux', name: 'Chanceux' }],
    });
    expect(options.map((option) => option.id)).toContain('agonizing-blast@blast');
    expect(options.map((option) => option.id)).toContain('lessons-first-ones@chanceux');
    expect(invocationBaseId('repelling-blast@blast')).toBe('repelling-blast');
  });
});
