import { describe, expect, it } from 'vitest';
import {
  canChangePreparedSpells,
  spellcastingAbility,
  spellcastingNumbers,
  canReplaceCantripOnLevelUp,
  canReplaceCantripOnLongRest,
  canReplaceSpellOnLevelUp,
  canReplaceSpellOnLongRest,
  newSpellStartsPrepared,
  scribingCost,
  spellManagementMode,
} from './spellcasting';

describe('gestion des sorts par classe 2024', () => {
  it('sépare grimoire, préparation libre, remplacement unique au repos et remplacement au niveau', () => {
    expect(spellManagementMode('magicien')).toBe('spellbook');
    expect(spellManagementMode('clerc')).toBe('long-rest');
    expect(spellManagementMode('druide')).toBe('long-rest');
    expect(spellManagementMode('paladin')).toBe('long-rest');
    expect(spellManagementMode('rodeur')).toBe('long-rest-one');
    expect(spellManagementMode('barde')).toBe('level-up');
    expect(spellManagementMode('ensorceleur')).toBe('level-up');
    expect(spellManagementMode('occultiste')).toBe('level-up');
    expect(spellManagementMode('guerrier', 'Chevalier occulte')).toBe('level-up');
    expect(spellManagementMode('roublard', 'Filou arcanique')).toBe('level-up');
    expect(spellManagementMode('guerrier', 'Champion')).toBe('none');
  });

  it('n’autorise la préparation libre que pour les classes qui refont leur liste', () => {
    expect(canChangePreparedSpells('clerc', false)).toBe(false);
    expect(canChangePreparedSpells('clerc', true)).toBe(true);
    expect(canChangePreparedSpells('druide', true)).toBe(true);
    expect(canChangePreparedSpells('magicien', true)).toBe(true);
    expect(canChangePreparedSpells('rodeur', true)).toBe(false);
    expect(canChangePreparedSpells('barde', true)).toBe(false);
  });

  it('autorise exactement la fenêtre de remplacement au repos long du Rôdeur', () => {
    expect(canReplaceSpellOnLongRest('rodeur', false)).toBe(false);
    expect(canReplaceSpellOnLongRest('rodeur', true)).toBe(true);
    expect(canReplaceSpellOnLongRest('druide', true)).toBe(false);
    expect(canReplaceSpellOnLongRest('occultiste', true)).toBe(false);
  });

  it('ne propose plus le remplacement de sort du Rôdeur à la montée de niveau', () => {
    expect(canReplaceSpellOnLevelUp('rodeur')).toBe(false);
    expect(canReplaceSpellOnLevelUp('occultiste')).toBe(true);
    expect(canReplaceSpellOnLevelUp('magicien')).toBe(false);
  });

  it('applique le bon rythme de remplacement des sorts mineurs', () => {
    expect(canReplaceCantripOnLevelUp('clerc')).toBe(true);
    expect(canReplaceCantripOnLevelUp('guerrier', 'Chevalier occulte')).toBe(true);
    expect(canReplaceCantripOnLevelUp('roublard', 'Filou arcanique')).toBe(true);
    expect(canReplaceCantripOnLevelUp('magicien')).toBe(false);
    expect(canReplaceCantripOnLongRest('magicien')).toBe(true);
    expect(canReplaceCantripOnLongRest('barde')).toBe(false);
  });

  it('calcule le coût standard de copie au grimoire', () => {
    expect(scribingCost(1)).toEqual({ gold: 50, hours: 2 });
    expect(scribingCost(5)).toEqual({ gold: 250, hours: 10 });
  });

  it('ajoute les sorts de magicien au grimoire sans les préparer automatiquement', () => {
    expect(newSpellStartsPrepared('magicien')).toBe(false);
    expect(newSpellStartsPrepared('barde')).toBe(true);
  });
});

describe('quand la liste préparée se rouvre — PHB 2024', () => {
  /**
   * Relevé page par page : Rôdeur p. 119, Occultiste p. 154. Ces deux-là ne
   * rouvrent pas leur liste de la même façon, et c'est ce qui décide si
   * l'écran des sorts propose un choix ou une consultation.
   */
  it('le rôdeur échange un sort à chaque repos long', () => {
    expect(spellManagementMode('rodeur')).toBe('long-rest-one');
    expect(canReplaceSpellOnLongRest('rodeur', true)).toBe(true);
    expect(canReplaceSpellOnLevelUp('rodeur')).toBe(false);
  });

  it('l’occultiste n’échange qu’en montant de niveau', () => {
    expect(spellManagementMode('occultiste')).toBe('level-up');
    expect(canReplaceSpellOnLongRest('occultiste', true)).toBe(false);
    expect(canReplaceSpellOnLevelUp('occultiste')).toBe(true);
  });

  it('le druide rouvre toute sa liste au repos long', () => {
    expect(spellManagementMode('druide')).toBe('long-rest');
    expect(canChangePreparedSpells('druide', true)).toBe(true);
  });
});

describe('DD de sauvegarde et bonus d’attaque de sort', () => {
  it('8 + maîtrise + modificateur, et maîtrise + modificateur', () => {
    // Occultiste 2, Charisme 15 (+2), maîtrise +2.
    expect(spellcastingNumbers('occultiste', 2, 2)).toEqual({
      ability: 'cha', saveDc: 12, attackBonus: 4,
    });
  });

  it('chaque classe utilise sa propre caractéristique', () => {
    expect(spellcastingAbility('druide')).toBe('wis');
    expect(spellcastingAbility('rodeur')).toBe('wis');
    expect(spellcastingAbility('magicien')).toBe('int');
    expect(spellcastingAbility('occultiste')).toBe('cha');
  });

  it('une classe sans magie n’a ni DD ni bonus d’attaque', () => {
    expect(spellcastingAbility('roublard')).toBeNull();
    expect(spellcastingNumbers('roublard', 3, 2)).toBeNull();
  });
});
