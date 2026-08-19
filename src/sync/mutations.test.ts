import { describe, expect, it, vi } from 'vitest';
import { createEncounter, saveEncounter, saveSheet, WriteError } from './mutations';
import type { CharacterSheet } from '../model/character';
import type { EncounterState } from '../domain/encounter';

/**
 * Doublure de client qui enregistre ce qui est ENVOYÉ. C'est le point du test :
 * ce qu'on n'envoie pas compte autant que ce qu'on envoie.
 */
function fakeClient(result: { data: unknown; error: { message: string } | null }) {
  const sent: { table: string; verb: string; payload: unknown }[] = [];
  const terminal = {
    select: () => ({ single: async () => result }),
    eq() { return terminal; },
  };
  const client: any = {
    from: (table: string) => ({
      update: (payload: unknown) => { sent.push({ table, verb: 'update', payload }); return terminal; },
      insert: (payload: unknown) => { sent.push({ table, verb: 'insert', payload }); return terminal; },
    }),
  };
  return { client, sent };
}

const sheet = { name: 'Brannoc' } as unknown as CharacterSheet;
const state = { turnIndex: 0, combatants: [] } as unknown as EncounterState;

describe('la version n’est jamais écrite par le client', () => {
  it('la sauvegarde d’une fiche n’envoie que les données', async () => {
    const { client, sent } = fakeClient({ data: { id: 's1', version: 4, data: sheet }, error: null });
    await saveSheet(client, null, 's1', sheet);
    expect(sent[0]?.payload).toEqual({ data: sheet });
    expect(Object.keys(sent[0]?.payload as object)).not.toContain('version');
  });

  it('la sauvegarde d’une rencontre non plus', async () => {
    const { client, sent } = fakeClient({ data: { id: 'e1', version: 2, state }, error: null });
    await saveEncounter(client, null, 'e1', state);
    expect(sent[0]?.payload).toEqual({ state });
  });

  it('la création d’une rencontre laisse la base numéroter', async () => {
    const { client, sent } = fakeClient({ data: { id: 'e1', version: 1, state }, error: null });
    await createEncounter(client, null, 'c1', state);
    expect(sent[0]?.payload).toEqual({ campaign_id: 'c1', state });
  });
});

describe('un refus ne passe pas pour un succès', () => {
  it('une erreur Supabase remonte, nommée', async () => {
    const { client } = fakeClient({ data: null, error: { message: 'permission denied' } });
    await expect(saveSheet(client, null, 's1', sheet)).rejects.toThrow(WriteError);
  });

  it('zéro ligne renvoyée sans erreur — le cas de la RLS — remonte aussi', async () => {
    // Une écriture filtrée par la RLS ne lève pas d’erreur : elle ne touche
    // simplement aucune ligne. Sans ce contrôle, le joueur croit avoir écrit.
    const { client } = fakeClient({ data: null, error: null });
    await expect(saveSheet(client, null, 's1', sheet)).rejects.toThrow(/refusée|introuvable/);
  });
});

describe('la ligne renvoyée nourrit l’affichage', () => {
  it('elle est réinjectée dans la synchronisation, sans attendre l’écho du canal', async () => {
    const { client } = fakeClient({ data: { id: 's1', version: 7, data: sheet }, error: null });
    const sync = { ingest: vi.fn() };
    await saveSheet(client, sync as never, 's1', sheet);
    expect(sync.ingest).toHaveBeenCalledWith('jg_sheets', expect.objectContaining({ id: 's1', version: 7 }));
  });
});
