import { describe, expect, it } from 'vitest';
import { ORIGIN_FEATS, originFeatById } from './origin-feats';
import { BACKGROUNDS } from './backgrounds';

describe('dons d’origine', () => {
  it('dix dons, chacun avec un nom et une description', () => {
    expect(Object.keys(ORIGIN_FEATS)).toHaveLength(10);
    for (const [id, feat] of Object.entries(ORIGIN_FEATS)) {
      expect(feat.name, id).toBeTruthy();
      expect(feat.desc, id).toBeTruthy();
    }
  });

  it('chaque origine référence un don d’origine qui existe', () => {
    const orphelins = BACKGROUNDS
      .filter((background) => !originFeatById(background.featId))
      .map((background) => `${background.id} → ${background.featId}`);
    expect(orphelins).toEqual([]);
  });

  it('originFeatById tolère une valeur absente', () => {
    expect(originFeatById(null)).toBeUndefined();
    expect(originFeatById('inexistant')).toBeUndefined();
  });
});
