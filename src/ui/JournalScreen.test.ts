import { describe, expect, it } from 'vitest';
import { conversationsAvec, parChapitre, secretsEnvoyesA, secretsRecus } from './JournalScreen';
import type { JournalEntry, Message } from '../sync/campaign-sync';

const message = (over: Partial<Message> & { id: string }): Message => ({
  authorId: 'moi', recipientId: 'veya', kind: 'message', body: '…',
  version: 1, createdAt: '2026-08-20T10:00:00Z', ...over,
});

const entree = (over: Partial<JournalEntry> & { id: string }): JournalEntry => ({
  authorId: 'mj', title: null, chapter: null, body: '…',
  version: 1, createdAt: '2026-08-20T10:00:00Z', ...over,
});

const veya = { id: 'veya', nom: 'Veya' };
const mj = { id: 'mj', nom: 'le MJ' };

describe('conversations privées', () => {
  it('rassemble les deux sens d’un échange avec la même personne', () => {
    const messages = [
      message({ id: 'a', authorId: 'moi', recipientId: 'veya', body: 'Tu viens ?' }),
      message({ id: 'b', authorId: 'veya', recipientId: 'moi', body: 'J’arrive.' }),
    ];
    const [{ echanges }] = conversationsAvec(messages, 'moi', [veya]);
    expect(echanges.map((m) => m.id)).toEqual(['a', 'b']);
  });

  it('sépare les correspondants — un message au MJ n’apparaît pas chez Veya', () => {
    const messages = [
      message({ id: 'a', recipientId: 'veya' }),
      message({ id: 'b', recipientId: 'mj' }),
    ];
    const conversations = conversationsAvec(messages, 'moi', [veya, mj]);
    expect(conversations[0].echanges.map((m) => m.id)).toEqual(['a']);
    expect(conversations[1].echanges.map((m) => m.id)).toEqual(['b']);
  });

  it('ignore un échange entre deux autres personnes — le MJ voit tout, il ne le lit pas ici', () => {
    // Le MJ lit toute sa table (RLS) : sur SA conversation avec Veya, un
    // message que Veya a envoyé à Thorin n'a rien à faire.
    const messages = [message({ id: 'x', authorId: 'veya', recipientId: 'thorin' })];
    const [{ echanges }] = conversationsAvec(messages, 'moi', [veya]);
    expect(echanges).toEqual([]);
  });

  it('se lit dans l’ordre où la conversation s’est tenue, plus ancien d’abord', () => {
    const messages = [
      message({ id: 'tard', createdAt: '2026-08-20T18:00:00Z' }),
      message({ id: 'tot', createdAt: '2026-08-20T08:00:00Z' }),
    ];
    const [{ echanges }] = conversationsAvec(messages, 'moi', [veya]);
    expect(echanges.map((m) => m.id)).toEqual(['tot', 'tard']);
  });

  it('un secret n’est jamais mêlé aux messages — on n’y répond pas', () => {
    const messages = [
      message({ id: 'm', kind: 'message' }),
      message({ id: 's', kind: 'secret', authorId: 'veya', recipientId: 'moi' }),
    ];
    const [{ echanges }] = conversationsAvec(messages, 'moi', [veya]);
    expect(echanges.map((m) => m.id)).toEqual(['m']);
  });

  it('un correspondant sans échange garde sa place, avec une liste vide', () => {
    expect(conversationsAvec([], 'moi', [veya, mj])).toEqual([
      { correspondant: veya, echanges: [] },
      { correspondant: mj, echanges: [] },
    ]);
  });
});

describe('secrets reçus', () => {
  it('ne retient que les secrets qui me sont adressés', () => {
    const messages = [
      message({ id: 'pour-moi', kind: 'secret', authorId: 'mj', recipientId: 'moi' }),
      message({ id: 'pour-veya', kind: 'secret', authorId: 'mj', recipientId: 'veya' }),
      message({ id: 'simple', kind: 'message', authorId: 'mj', recipientId: 'moi' }),
    ];
    expect(secretsRecus(messages, 'moi').map((m) => m.id)).toEqual(['pour-moi']);
  });

  it('plus récent d’abord — le dernier révélé est celui qu’on relit', () => {
    const messages = [
      message({ id: 'vieux', kind: 'secret', recipientId: 'moi', createdAt: '2026-08-01T10:00:00Z' }),
      message({ id: 'neuf', kind: 'secret', recipientId: 'moi', createdAt: '2026-08-20T10:00:00Z' }),
    ];
    expect(secretsRecus(messages, 'moi').map((m) => m.id)).toEqual(['neuf', 'vieux']);
  });
});

describe('secrets envoyés, sur la fiche d’un personnage précis', () => {
  it('n’affiche que les secrets confiés à ce personnage — pas ceux confiés à un autre', () => {
    // Le MJ ouvre la fiche de Dauby (correspondants = [dauby]) : le secret
    // confié à Veya n'a rien à faire dans cette liste, même si le MJ en est
    // bien l'auteur.
    const dauby = { id: 'dauby', nom: 'Dauby' };
    const messages = [
      message({ id: 'pour-dauby', kind: 'secret', authorId: 'mj', recipientId: 'dauby' }),
      message({ id: 'pour-veya', kind: 'secret', authorId: 'mj', recipientId: 'veya' }),
    ];
    expect(secretsEnvoyesA(messages, 'mj', [dauby]).map((m) => m.id)).toEqual(['pour-dauby']);
  });

  it('sur l’onglet Journal (tous les correspondants), rien n’est filtré', () => {
    const dauby = { id: 'dauby', nom: 'Dauby' };
    const messages = [
      message({ id: 'pour-dauby', kind: 'secret', authorId: 'mj', recipientId: 'dauby' }),
      message({ id: 'pour-veya', kind: 'secret', authorId: 'mj', recipientId: 'veya' }),
    ];
    const ids = secretsEnvoyesA(messages, 'mj', [dauby, veya]).map((m) => m.id);
    expect(ids.sort()).toEqual(['pour-dauby', 'pour-veya']);
  });

  it('ignore un secret dont je ne suis pas l’auteur', () => {
    const dauby = { id: 'dauby', nom: 'Dauby' };
    const messages = [message({ id: 'x', kind: 'secret', authorId: 'dauby', recipientId: 'dauby' })];
    expect(secretsEnvoyesA(messages, 'mj', [dauby])).toEqual([]);
  });
});

describe('regroupement par chapitre', () => {
  it('rassemble les entrées du même chapitre, plus récente d’abord à l’intérieur', () => {
    const lignes = [
      entree({ id: 'vieille', chapter: 'Valbrume', createdAt: '2026-08-01T10:00:00Z' }),
      entree({ id: 'neuve', chapter: 'Valbrume', createdAt: '2026-08-20T10:00:00Z' }),
    ];
    const groupes = parChapitre(lignes);
    expect(groupes).toHaveLength(1);
    expect(groupes[0].chapitre).toBe('Valbrume');
    expect(groupes[0].lignes.map((l) => l.id)).toEqual(['neuve', 'vieille']);
  });

  it('classe les chapitres selon leur entrée la plus récente, ce chapitre-là en tête', () => {
    const lignes = [
      entree({ id: 'a', chapter: 'Valbrume', createdAt: '2026-08-01T10:00:00Z' }),
      entree({ id: 'b', chapter: 'La dent cassée', createdAt: '2026-08-20T10:00:00Z' }),
    ];
    const groupes = parChapitre(lignes);
    expect(groupes.map((g) => g.chapitre)).toEqual(['La dent cassée', 'Valbrume']);
  });

  it('le registre général (sans chapitre) reste toujours en dernier', () => {
    const lignes = [
      entree({ id: 'sans', chapter: null, createdAt: '2026-08-25T10:00:00Z' }), // la plus récente de toutes
      entree({ id: 'avec', chapter: 'Valbrume', createdAt: '2026-08-01T10:00:00Z' }),
    ];
    const groupes = parChapitre(lignes);
    expect(groupes.map((g) => g.chapitre)).toEqual(['Valbrume', null]);
  });

  it('un chapitre fait d’espaces seulement compte comme aucun chapitre', () => {
    const lignes = [entree({ id: 'x', chapter: '   ' })];
    const groupes = parChapitre(lignes);
    expect(groupes).toEqual([{ chapitre: null, lignes: [lignes[0]] }]);
  });
});
