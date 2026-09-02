import { describe, expect, it } from 'vitest';
import { resolveActionableItem, resolveHealingItem } from './consumable-ownership';
import { resolveWeaponFromItem } from './weapon-ownership';
import { formeTolerante } from './nom-normalise';
import { SYNONYMES_ARMES, SYNONYMES_EQUIPEMENT } from '../content/synonymes-objets';
import { WEAPONS } from '../content/weapons';
import { EQUIPMENT_CATALOG } from '../content/equipment';

/**
 * Reconnaître ce qu'un joueur a VRAIMENT tapé dans son sac.
 *
 * Ces cas ne sont pas inventés : ils viennent des trois fiches de la campagne
 * en cours, relevées telles quelles. Chacun était un objet inerte — une
 * potion sans jet de dés, un bâton sans carte d'attaque — sans que rien à
 * l'écran ne le signale.
 */

const arme = (nom: string) => resolveWeaponFromItem({ name: nom })?.name;
const action = (nom: string) => resolveActionableItem({ name: nom })?.name;
const soin = (nom: string) => resolveHealingItem({ name: nom })?.healDice;

describe('les sacs de la campagne, tels qu’ils sont écrits', () => {
  it('« Potion de soin » au singulier est une potion de soins', () => {
    expect(soin('Potion de soin')).toBe('2d4+2');
    // Et la forme du catalogue continue évidemment de marcher.
    expect(soin('Potion de soins')).toBe('2d4+2');
  });

  it('« Bâton » est le bâton de combat, sur les deux fiches qui l’écrivent ainsi', () => {
    expect(arme('Bâton')).toBe('Bâton de combat');
    expect(arme('baton')).toBe('Bâton de combat');
  });

  it('« Flasque d’huile » est de l’huile — le contenant n’est pas l’objet', () => {
    expect(action('Flasque d’huile')).toBe('Huile');
    expect(action("Flasque d'huile")).toBe('Huile');
    expect(action('Fiole d’acide')).toBe('Acide');
  });

  it('la parenthèse d’usage ne masque pas l’arme', () => {
    expect(arme('Bâton de combat (focaliseur druidique)')).toBe('Bâton de combat');
  });
});

describe('ce qui ne doit surtout PAS être reconnu', () => {
  it('un objet de quête reste un objet de quête', () => {
    // « Flasque en argent avec symbole » commence par « Flasque » sans être un
    // contenant d'autre chose : le repli ne s'y applique pas.
    expect(action('Flasque en argent avec symbole')).toBeUndefined();
    expect(arme('Flasque en argent avec symbole')).toBeUndefined();
    expect(action('Sang de vigne d’Iselyne')).toBeUndefined();
  });

  it('le matériel ordinaire ne devient pas une action de combat', () => {
    for (const nom of ['Lampe', 'Sac de couchage', 'Tenue de voyage', 'Carquois',
      'Focaliseur druidique', 'Livre de philosophie', "Sacoche d'explorateur"]) {
      expect(action(nom), nom).toBeUndefined();
      expect(arme(nom), nom).toBeUndefined();
    }
  });

  it('« Arc » seul n’est pas tranché à la place du joueur', () => {
    // Court ou long : les deux existent, et deviner serait pire que se taire.
    expect(arme('Arc')).toBeUndefined();
  });

  it('un mot court ne perd pas sa dernière lettre', () => {
    // Le repli du pluriel ne s'applique qu'aux mots de plus de deux lettres :
    // sinon « os », « as » ou « du » changeraient de sens.
    expect(formeTolerante('Os')).toBe('os');
    expect(formeTolerante('Sac de riz')).toBe('sac de riz');
  });
});

describe('garde-fou : le repli ne doit jamais confondre deux objets du catalogue', () => {
  const collisions = (noms: { name: string }[], options = {}) => {
    const par = new Map<string, string[]>();
    for (const entree of noms) {
      const clef = formeTolerante(entree.name, options);
      par.set(clef, [...(par.get(clef) ?? []), entree.name]);
    }
    return [...par.values()].filter((v) => v.length > 1);
  };

  it('aucune arme n’en écrase une autre', () => {
    expect(collisions(WEAPONS, { sansParenthese: true })).toEqual([]);
  });

  it('aucun équipement n’en écrase un autre', () => {
    // Ce test protège les AJOUTS futurs au catalogue autant que l'existant :
    // le jour où une entrée entrerait en collision, c'est ici qu'on l'apprend,
    // pas à la table.
    expect(collisions(EQUIPMENT_CATALOG)).toEqual([]);
  });
});

describe('table de synonymes', () => {
  it('ses clés sont déjà sous forme tolérante, sinon elles ne seraient jamais lues', () => {
    for (const clef of [...Object.keys(SYNONYMES_ARMES), ...Object.keys(SYNONYMES_EQUIPEMENT)]) {
      expect(formeTolerante(clef), clef).toBe(clef);
    }
  });

  it('ne renvoie que vers des objets qui existent', () => {
    for (const id of Object.values(SYNONYMES_ARMES)) {
      expect(WEAPONS.some((w) => w.id === id), id).toBe(true);
    }
    for (const id of Object.values(SYNONYMES_EQUIPEMENT)) {
      expect(EQUIPMENT_CATALOG.some((e) => e.id === id), id).toBe(true);
    }
  });

  it('« potion de guérison » et « antidote » sont compris', () => {
    expect(soin('Potion de guérison')).toBe('2d4+2');
    expect(action('Antidote')).toBe('Antitoxine');
  });
});
