import { describe, expect, it } from 'vitest';
import { fiendishVigorTemporaryHp, invocationSpellGrants, warlockInvocationPassives } from './warlock-active-invocations';

const picks = (...invocations: string[]) => ({ occultiste: { invocations } });

describe('Invocations actives de l’Occultiste', () => {
  it('accorde les sorts gratuits sélectionnés', () => {
    const grants = invocationSpellGrants(picks('armor-of-shadows', 'mask-many-faces', 'misty-visions'));
    expect(grants.map((entry) => entry.id)).toEqual(['armure-mage', 'deguisement', 'image-illusoire']);
    expect(grants.every((entry) => entry.freeCast === 'unlimited')).toBe(true);
  });

  it('conserve la condition lumineuse de l’invisibilité', () => {
    const grant = invocationSpellGrants(picks('one-with-shadows'))[0];
    expect(grant.condition).toBe('dim-or-dark');
    expect(grant.selfOnly).toBe(true);
  });

  it('gère Don des profondeurs', () => {
    const grant = invocationSpellGrants(picks('gift-of-the-depths'))[0];
    expect(grant.freeRecharge).toBe('long');
    const passives = warlockInvocationPassives({ classSelections: picks('gift-of-the-depths') });
    expect(passives.waterBreathing).toBe(true);
    expect(passives.swimSpeedEqualsSpeed).toBe(true);
  });

  it('gère Vision du diable', () => {
    expect(warlockInvocationPassives({ classSelections: picks('devils-sight') }).devilsSightRangeMeters).toBe(36);
  });

  it('maximise Simulacre de vie via Vigueur fiélonne', () => {
    expect(fiendishVigorTemporaryHp(picks('fiendish-vigor'), 'simulacre-vie')).toBe(12);
  });

  it('accorde Communication avec les morts à volonté via Murmures de la tombe', () => {
    const grant = invocationSpellGrants(picks('whispers-grave'))[0];
    expect(grant).toMatchObject({ id: 'parler-morts', freeCast: 'unlimited', featureName: 'Murmures de la tombe' });
  });

  it('accorde Œil arcanique à volonté via Visions des royaumes lointains', () => {
    const grant = invocationSpellGrants(picks('visions-distant-realms'))[0];
    expect(grant).toMatchObject({ id: 'oeil-arcanique', freeCast: 'unlimited', featureName: 'Visions des royaumes lointains' });
  });
});
