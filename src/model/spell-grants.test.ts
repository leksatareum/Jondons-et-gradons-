import { describe, expect, it } from 'vitest';
import { grantedSpells, grantResourceKey, grantWarnings, withGrant, withoutGrant } from './spell-grants';
import { deriveCharacter } from './derive';
import { preparedBudget } from './spellbook';
import { EMPTY_LIVE_STATE, type CharacterSheet, type SpellGrant } from './character';

const fiche = (over: Partial<CharacterSheet> = {}): CharacterSheet => ({
  id: 'f', name: 'Dauby', speciesId: 'humain', lineageId: null, ancestryId: null, size: null,
  backgroundId: 'sage',
  abilities: { str: 10, dex: 16, con: 14, int: 10, wis: 14, cha: 10 },
  alignment: null,
  classLevels: [{ classId: 'rodeur', level: 2, subclass: null, subclassId: null }],
  classChoices: {}, skillProficiencies: [], expertise: [], toolProficiencies: [],
  languages: [], featIds: [], abilityImprovements: [], cantrips: [], spells: [],
  inventory: [], armorId: null, shield: false, gold: 0,
  live: { ...EMPTY_LIVE_STATE, hitDiceSpent: {}, spellSlotsSpent: {}, resourcesSpent: {}, conditions: [] },
  ...over,
});

const don = (over: Partial<SpellGrant> = {}): SpellGrant => ({
  id: 'g1', spellId: 'boule-feu', source: 'Génie du désert',
  uses: 1, recharge: 'long', grantedAt: '2026-08-20T10:00:00.000Z',
  ...over,
});

describe('un don n’altère rien de ce qui existe', () => {
  it('ne consomme pas le budget de sorts préparés', () => {
    const sans = fiche({ spells: [{ id: 'brouillard', sourceClass: 'rodeur', prepared: true }] });
    const avec = withGrant(sans, don());
    const budgetSans = preparedBudget(sans, deriveCharacter(sans))[0];
    const budgetAvec = preparedBudget(avec, deriveCharacter(avec))[0];
    expect(budgetAvec.prepared).toBe(budgetSans.prepared);
    expect(budgetAvec.max).toBe(budgetSans.max);
  });

  it('ne touche pas aux emplacements de sort', () => {
    const sans = fiche();
    const avec = withGrant(sans, don());
    expect(deriveCharacter(avec).spellcasting.slots)
      .toEqual(deriveCharacter(sans).spellcasting.slots);
  });

  it('apporte ses propres lancements, rechargés au repos', () => {
    const sheet = withGrant(fiche(), don({ uses: 2 }));
    const ressource = deriveCharacter(sheet).resources
      .find((entry) => entry.key === grantResourceKey(don()));
    expect(ressource).toMatchObject({ max: 2, remaining: 2, recharge: 'long', sourceClass: 'don' });
    expect(ressource?.name).toContain('Génie du désert');
  });

  it('compte les lancements déjà dépensés', () => {
    const base = withGrant(fiche(), don({ uses: 2 }));
    const sheet = {
      ...base,
      live: { ...base.live, resourcesSpent: { [grantResourceKey(don())]: 1 } },
    };
    const ressource = deriveCharacter(sheet).resources
      .find((entry) => entry.key === grantResourceKey(don()));
    expect(ressource).toMatchObject({ spent: 1, remaining: 1 });
  });
});

describe('révoquer un don', () => {
  it('le retire, et la dépense avec lui', () => {
    const base = withGrant(fiche(), don());
    const utilise = {
      ...base,
      live: { ...base.live, resourcesSpent: { [grantResourceKey(don())]: 1 } },
    };
    const apres = withoutGrant(utilise, 'g1');
    expect(apres.grants).toEqual([]);
    expect(apres.live.resourcesSpent).toEqual({});
  });

  it('ne touche pas aux autres dons', () => {
    const sheet = withGrant(withGrant(fiche(), don()), don({ id: 'g2', spellId: 'soins' }));
    expect(withoutGrant(sheet, 'g1').grants?.map((g) => g.id)).toEqual(['g2']);
  });
});

describe('les avertissements — rien d’interdit, rien en silence', () => {
  it('signale un rang que le personnage ne peut pas lancer', () => {
    const sheet = fiche();
    const avertissements = grantWarnings(sheet, deriveCharacter(sheet),
      { spellId: 'boule-feu', source: 'Génie' });
    const rang = avertissements.find((a) => a.kind === 'rang-trop-eleve');
    expect(rang).toBeTruthy();
    expect(rang?.detail).toContain('Dauby');
    expect(rang?.detail).toContain('lancements gratuits');
  });

  it('ne dit rien du rang quand le personnage peut le lancer', () => {
    const sheet = fiche();
    const avertissements = grantWarnings(sheet, deriveCharacter(sheet),
      { spellId: 'brouillard', source: 'Génie' });
    expect(avertissements.some((a) => a.kind === 'rang-trop-eleve')).toBe(false);
  });

  it('exige une provenance', () => {
    const sheet = fiche();
    const avertissements = grantWarnings(sheet, deriveCharacter(sheet),
      { spellId: 'brouillard', source: '   ' });
    expect(avertissements.some((a) => a.kind === 'source-vide')).toBe(true);
  });

  it('prévient d’un don en double plutôt que de l’empêcher', () => {
    const sheet = withGrant(fiche(), don());
    const avertissements = grantWarnings(sheet, deriveCharacter(sheet),
      { spellId: 'boule-feu', source: 'Autre génie' });
    const doublon = avertissements.find((a) => a.kind === 'deja-accorde');
    expect(doublon?.detail).toContain('cumulera');
  });

  it('prévient si le sort est déjà préparé sur la fiche', () => {
    const sheet = fiche({ spells: [{ id: 'brouillard', sourceClass: 'rodeur', prepared: true }] });
    const avertissements = grantWarnings(sheet, deriveCharacter(sheet),
      { spellId: 'brouillard', source: 'Génie' });
    expect(avertissements.some((a) => a.kind === 'deja-sur-la-fiche')).toBe(true);
  });
});

describe('le don au niveau du sort', () => {
  it('marque le hors-portée sans le rendre injouable', () => {
    const sheet = withGrant(fiche(), don());
    const [accorde] = grantedSpells(sheet, deriveCharacter(sheet));
    expect(accorde.spell.name).toBe('Boule de feu');
    expect(accorde.auDessusDeSonRang).toBe(true);
  });

  it('un sort inconnu du catalogue est ignoré plutôt qu’affiché vide', () => {
    const sheet = withGrant(fiche(), don({ spellId: 'sort-fantome' }));
    expect(grantedSpells(sheet, deriveCharacter(sheet))).toEqual([]);
  });
});
