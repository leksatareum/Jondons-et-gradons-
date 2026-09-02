import { describe, expect, it } from 'vitest';
import {
  ecrireAppartenances, ecrireCampagne, lireAppartenances, lireCampagne, oublierTout,
  type StockageLocal,
} from './cache-local';
import type { SyncRow } from './supabase-transport';

/**
 * Un stockage de test. `plafond` imite le quota du navigateur : au-delà, les
 * écritures lèvent, exactement comme `localStorage` quand il est plein.
 */
function stockage(plafond = Infinity): StockageLocal & { contenu: Map<string, string> } {
  const contenu = new Map<string, string>();
  const poids = () => [...contenu.values()].reduce((total, valeur) => total + valeur.length, 0);
  return {
    contenu,
    lire: (clef) => contenu.get(clef) ?? null,
    ecrire: (clef, valeur) => {
      const precedent = contenu.get(clef)?.length ?? 0;
      if (poids() - precedent + valeur.length > plafond) throw new Error('QuotaExceededError');
      contenu.set(clef, valeur);
    },
    effacer: (clef) => { contenu.delete(clef); },
    clefs: () => [...contenu.keys()],
  };
}

const fiche = (id: string, version = 1): SyncRow => ({ id, version, data: { nom: id } });

describe('cache de campagne', () => {
  it('rend ce qu’on y a mis, avec la date d’enregistrement', () => {
    const s = stockage();
    expect(ecrireCampagne(s, 'camp', { jg_sheets: [fiche('a')] }, 1_700_000_000)).toBe('complet');
    const lu = lireCampagne(s, 'camp');
    expect(lu?.tables.jg_sheets).toEqual([fiche('a')]);
    expect(lu?.enregistreLe).toBe(1_700_000_000);
    expect(lu?.partiel).toBe(false);
  });

  it('ne rend rien pour une campagne jamais enregistrée', () => {
    expect(lireCampagne(stockage(), 'inconnue')).toBeNull();
  });

  it('ne mélange pas deux campagnes', () => {
    const s = stockage();
    ecrireCampagne(s, 'un', { jg_sheets: [fiche('a')] }, 1);
    ecrireCampagne(s, 'deux', { jg_sheets: [fiche('b')] }, 2);
    expect(lireCampagne(s, 'un')?.tables.jg_sheets).toEqual([fiche('a')]);
    expect(lireCampagne(s, 'deux')?.tables.jg_sheets).toEqual([fiche('b')]);
  });

  it('jette un contenu tronqué plutôt que de le déplier à moitié', () => {
    const s = stockage();
    ecrireCampagne(s, 'camp', { jg_sheets: [fiche('a')] }, 1);
    s.contenu.set('jg.cache.campagne.camp', '{"format":1,"tables":{"jg_she');
    expect(lireCampagne(s, 'camp')).toBeNull();
  });

  it('jette un contenu écrit par une version antérieure du format', () => {
    const s = stockage();
    s.contenu.set('jg.cache.campagne.camp', JSON.stringify({ format: 0, enregistreLe: 1, tables: {} }));
    expect(lireCampagne(s, 'camp')).toBeNull();
  });
});

describe('quota dépassé — on sacrifie le décor, jamais les fiches', () => {
  it('retombe sur les tables essentielles et le signale', () => {
    // Assez de place pour les fiches seules, pas pour le journal en plus.
    const complet = JSON.stringify({
      format: 1, enregistreLe: 1, partiel: false,
      tables: { jg_sheets: [fiche('a')], jg_journal_entries: [fiche('j')] },
    });
    const s = stockage(complet.length - 1);

    const issue = ecrireCampagne(s, 'camp', {
      jg_sheets: [fiche('a')],
      jg_journal_entries: [fiche('j')],
    }, 1);

    expect(issue).toBe('partiel');
    const lu = lireCampagne(s, 'camp');
    expect(lu?.tables.jg_sheets).toEqual([fiche('a')]);
    expect(lu?.tables.jg_journal_entries).toBeUndefined();
    expect(lu?.partiel).toBe(true);
  });

  it('ne laisse pas une moitié de vérité quand même le repli ne tient pas', () => {
    const s = stockage(10);
    expect(ecrireCampagne(s, 'camp', { jg_sheets: [fiche('a')] }, 1)).toBe('echec');
    expect(lireCampagne(s, 'camp')).toBeNull();
  });

  it('ne perd pas le cache précédent quand le nouveau tient', () => {
    const s = stockage();
    ecrireCampagne(s, 'camp', { jg_sheets: [fiche('a', 1)] }, 1);
    ecrireCampagne(s, 'camp', { jg_sheets: [fiche('a', 2)] }, 2);
    expect(lireCampagne(s, 'camp')?.tables.jg_sheets).toEqual([fiche('a', 2)]);
  });
});

describe('appartenances', () => {
  it('rend la liste des tables enregistrée pour ce compte', () => {
    const s = stockage();
    const tables = [{ campaignId: 'c1', nom: 'Essai', estMj: false, gmId: 'mj' }];
    ecrireAppartenances(s, 'moi', tables);
    expect(lireAppartenances(s, 'moi')).toEqual(tables);
  });

  it('ne rend pas les tables d’un autre compte', () => {
    const s = stockage();
    ecrireAppartenances(s, 'moi', [{ campaignId: 'c1', nom: 'Essai', estMj: false, gmId: 'mj' }]);
    expect(lireAppartenances(s, 'quelquun-dautre')).toBeNull();
  });

  it('ne fait pas échouer l’appli quand le stockage est plein', () => {
    const s = stockage(5);
    expect(() => ecrireAppartenances(s, 'moi', [{ campaignId: 'c1', nom: 'Essai', estMj: false, gmId: 'mj' }]))
      .not.toThrow();
    expect(lireAppartenances(s, 'moi')).toBeNull();
  });
});

describe('déconnexion', () => {
  it('efface les fiches et les tables, et rien d’autre', () => {
    const s = stockage();
    ecrireCampagne(s, 'camp', { jg_sheets: [fiche('a')] }, 1);
    ecrireAppartenances(s, 'moi', [{ campaignId: 'c1', nom: 'Essai', estMj: false, gmId: 'mj' }]);
    s.contenu.set('sb-auth-token', 'à quelqu’un d’autre');

    oublierTout(s);

    expect(lireCampagne(s, 'camp')).toBeNull();
    expect(lireAppartenances(s, 'moi')).toBeNull();
    expect(s.contenu.get('sb-auth-token')).toBe('à quelqu’un d’autre');
  });
});
