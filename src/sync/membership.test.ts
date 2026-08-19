import { describe, expect, it } from 'vitest';
import { chargerAppartenances, choisirCampagne, ErreurAppartenance } from './membership';

function fakeClient(resultat: { data: unknown; error: { message: string } | null }) {
  return {
    from: () => ({ select: () => ({ order: async () => resultat }) }),
  } as never;
}

describe('appartenances', () => {
  it('le rôle vient de la base : MJ si la campagne est la sienne', async () => {
    const client = fakeClient({
      data: [
        { id: 'c1', name: 'Les Loups Rouges', gm_id: 'u-mj' },
        { id: 'c2', name: 'Une autre table', gm_id: 'u-autre' },
      ],
      error: null,
    });
    expect(await chargerAppartenances(client, 'u-mj')).toEqual([
      { campaignId: 'c1', nom: 'Les Loups Rouges', estMj: true },
      { campaignId: 'c2', nom: 'Une autre table', estMj: false },
    ]);
  });

  it('aucune campagne visible n’est pas une erreur — c’est un compte pas encore enrôlé', async () => {
    expect(await chargerAppartenances(fakeClient({ data: [], error: null }), 'u1')).toEqual([]);
  });

  it('une erreur de lecture remonte', async () => {
    const client = fakeClient({ data: null, error: { message: 'JWT expired' } });
    await expect(chargerAppartenances(client, 'u1')).rejects.toThrow(ErreurAppartenance);
  });
});

describe('choix de la campagne à ouvrir', () => {
  const campagne = (id: string) => ({ campaignId: id, nom: id, estMj: false });

  it('une seule : on entre directement, sans écran à traverser chaque séance', () => {
    expect(choisirCampagne([campagne('c1')])).toEqual({ quoi: 'une', campagne: campagne('c1') });
  });

  it('plusieurs : il faut demander', () => {
    expect(choisirCampagne([campagne('c1'), campagne('c2')]).quoi).toBe('plusieurs');
  });

  it('aucune : le compte existe mais n’est à aucune table', () => {
    expect(choisirCampagne([])).toEqual({ quoi: 'aucune' });
  });
});
