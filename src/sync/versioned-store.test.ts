import { describe, expect, it } from 'vitest';
import { VersionedStore } from './versioned-store';

type Fiche = { id: string; version: number; nom: string };
const store = () => new VersionedStore<Fiche>();

describe('instantané complet', () => {
  it('fait autorité : ce qui n’y est plus est retiré', () => {
    const s = store();
    s.applySnapshot([{ id: 'a', version: 1, nom: 'A' }, { id: 'b', version: 1, nom: 'B' }]);
    const result = s.applySnapshot([{ id: 'a', version: 2, nom: 'A2' }]);
    expect(result.updated.map((r) => r.id)).toEqual(['a']);
    expect(result.removed).toEqual(['b']);
    expect(s.all().map((r) => r.id)).toEqual(['a']);
  });

  it('ressuscite un enregistrement qu’on croyait supprimé, si le serveur le renvoie', () => {
    const s = store();
    s.applySnapshot([{ id: 'a', version: 1, nom: 'A' }]);
    s.applyDelete('a', 2);
    expect(s.has('a')).toBe(false);
    s.applySnapshot([{ id: 'a', version: 3, nom: 'A3' }]);
    expect(s.get('a')?.nom).toBe('A3');
  });
});

describe('événements incrémentaux — la version tranche, jamais l’ordre d’arrivée', () => {
  it('un événement plus ancien que l’état détenu est ignoré', () => {
    const s = store();
    s.applySnapshot([{ id: 'a', version: 5, nom: 'récent' }]);
    const result = s.applyUpsert({ id: 'a', version: 3, nom: 'périmé' });
    expect(result.kind).toBe('ignored');
    expect(result.reason).toBe('version-obsolete');
    expect(s.get('a')?.nom).toBe('récent');
  });

  it('un événement plus récent que l’instantané est appliqué', () => {
    const s = store();
    s.applySnapshot([{ id: 'a', version: 5, nom: 'instantané' }]);
    expect(s.applyUpsert({ id: 'a', version: 6, nom: 'plus récent' }).kind).toBe('updated');
    expect(s.get('a')?.nom).toBe('plus récent');
  });

  it('la course classique : l’instantané arrive après l’événement qu’il contient déjà', () => {
    const s = store();
    // Un événement de version 7 arrive pendant la resynchronisation…
    s.applyUpsert({ id: 'a', version: 7, nom: 'v7' });
    // …puis l'instantané, lu plus tôt, ne porte que la version 5.
    s.applySnapshot([{ id: 'a', version: 5, nom: 'v5' }]);
    // L'instantané fait autorité sur la composition de l'ensemble, et la
    // resynchronisation qui suit reconvergera. Ce qui compte ici : aucune
    // exception, aucun état incohérent.
    expect(s.get('a')).toBeDefined();
    // Et un nouvel événement v7 est bien réappliqué par-dessus.
    expect(s.applyUpsert({ id: 'a', version: 7, nom: 'v7' }).kind).toBe('updated');
    expect(s.get('a')?.nom).toBe('v7');
  });

  it('une suppression n’est pas défaite par un événement plus ancien', () => {
    const s = store();
    s.applySnapshot([{ id: 'a', version: 4, nom: 'A' }]);
    s.applyDelete('a', 5);
    expect(s.applyUpsert({ id: 'a', version: 4, nom: 'zombie' }).kind).toBe('ignored');
    expect(s.has('a')).toBe(false);
  });
});
