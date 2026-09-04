import { describe, expect, it } from 'vitest';
import { APPARENCES, SECRETS, STYLES_DE_NOM } from '../content/pnj';
import type { StockageLocal } from '../sync/cache-local';
import { deplacerLoyaute, ecrireCarnet, lireCarnet, tirerPnj, type PnjDuCarnet } from './carnet-pnj';

/** Un stockage de papier, qui peut aussi refuser d'écrire — comme un vrai plein. */
function stockageFactice(options: { refuse?: boolean } = {}): StockageLocal & { contenu: Map<string, string> } {
  const contenu = new Map<string, string>();
  return {
    contenu,
    lire: (clef) => contenu.get(clef) ?? null,
    ecrire: (clef, valeur) => {
      if (options.refuse) throw new Error('quota');
      contenu.set(clef, valeur);
    },
    effacer: (clef) => { contenu.delete(clef); },
    clefs: () => [...contenu.keys()],
  };
}

describe('le tirage', () => {
  it('tire dans les vraies tables du Guide', () => {
    const pnj = tirerPnj(Math.random, 7);
    expect(APPARENCES).toContain(pnj.apparence);
    expect(SECRETS).toContain(pnj.secret);
    expect(STYLES_DE_NOM.map((s) => s.nom)).toContain(pnj.style);
  });

  it('ne sort jamais des tables, même sur le dernier résultat du dé', () => {
    // Un `Math.floor(hasard() * n)` avec un hasard proche de 1 est l'endroit
    // classique où l'on tombe à côté de la table.
    const pnj = tirerPnj(() => 0.999999, 7);
    expect(pnj.apparence).toBe(APPARENCES[APPARENCES.length - 1]);
    expect(pnj.secret).toBe(SECRETS[SECRETS.length - 1]);
  });

  it('démarre la loyauté au départ calculé sur le groupe', () => {
    expect(tirerPnj(() => 0, 7).loyaute).toBe(7);
  });

  it('laisse le nom au MJ', () => {
    expect(tirerPnj(() => 0, 7).nom).toBe('');
  });
});

describe('les bornes de la loyauté', () => {
  it('ne dépasse jamais le maximum du groupe', () => {
    expect(deplacerLoyaute(14, 4, 15)).toBe(15);
  });

  it('ne descend jamais sous zéro', () => {
    expect(deplacerLoyaute(2, -8, 15)).toBe(0);
  });

  it('bouge normalement entre les deux', () => {
    expect(deplacerLoyaute(7, 3, 15)).toBe(10);
    expect(deplacerLoyaute(7, -3, 15)).toBe(4);
  });
});

describe('le carnet gardé sur le téléphone', () => {
  const veya: PnjDuCarnet = {
    id: 'a1', nom: 'Sœur Amaline', style: 'Lyrique',
    apparence: APPARENCES[0]!, secret: SECRETS[0]!, loyaute: 7,
  };

  it('relit ce qu’il a écrit', () => {
    const stockage = stockageFactice();
    ecrireCarnet(stockage, 'camp-1', [veya]);
    expect(lireCarnet(stockage, 'camp-1')).toEqual([veya]);
  });

  it('sépare les campagnes', () => {
    const stockage = stockageFactice();
    ecrireCarnet(stockage, 'camp-1', [veya]);
    expect(lireCarnet(stockage, 'camp-2')).toEqual([]);
  });

  it('rend un carnet vide plutôt que de casser sur du JSON abîmé', () => {
    const stockage = stockageFactice();
    stockage.contenu.set('jg.pnj.camp-1', '{"format":1,"pnj":[{"nom":"tronq');
    expect(lireCarnet(stockage, 'camp-1')).toEqual([]);
  });

  it('jette un format qu’il ne reconnaît pas', () => {
    const stockage = stockageFactice();
    stockage.contenu.set('jg.pnj.camp-1', JSON.stringify({ format: 99, pnj: [veya] }));
    expect(lireCarnet(stockage, 'camp-1')).toEqual([]);
  });

  it('écarte une entrée sans identifiant, qu’on ne pourrait plus effacer', () => {
    const stockage = stockageFactice();
    stockage.contenu.set('jg.pnj.camp-1', JSON.stringify({ format: 1, pnj: [veya, { nom: 'orphelin' }] }));
    expect(lireCarnet(stockage, 'camp-1')).toEqual([veya]);
  });

  it('ne lève pas quand le stockage refuse d’écrire', () => {
    // Mode privé, quota plein : la séance continue sans carnet.
    expect(() => ecrireCarnet(stockageFactice({ refuse: true }), 'camp-1', [veya])).not.toThrow();
  });
});
