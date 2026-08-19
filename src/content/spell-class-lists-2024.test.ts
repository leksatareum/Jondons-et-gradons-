import { describe, expect, it } from 'vitest';
import { SPELLS } from './spells.js';

/**
 * Listes de classe et entrées de sorts — audit PHB 2024.
 *
 * Ces assertions portent sur le corpus tel que l'application le reçoit, après
 * la chaîne de plugins : c'est le seul état qui compte, et plusieurs de ces
 * corrections y étaient déjà appliquées sans l'être dans le fichier source.
 */

type Sort = { id: string; n: string; lv: number; sc: string; t: string; r: string; cp: string; du: string; cc?: boolean; cl: string[]; d: string; up?: string };
const parId = new Map<string, Sort>((SPELLS as Sort[]).map((sort) => [sort.id, sort]));
const sort = (id: string) => {
  const trouve = parId.get(id);
  expect(trouve, `sort introuvable : ${id}`).toBeDefined();
  return trouve!;
};

describe('liste de sorts du Druide', () => {
  it.each(['symbole', 'incendiaire'])('accorde %s au Druide', (id) => {
    expect(sort(id).cl).toContain('dr');
  });

  it.each(['perception-vraie', 'metamorphose-supreme'])('retire %s de la liste du Druide', (id) => {
    expect(sort(id).cl).not.toContain('dr');
  });
});

describe('liste de sorts du Rôdeur', () => {
  it.each(['amitie-animale', 'peau-pierre', 'restauration-superieure'])('accorde %s au Rôdeur', (id) => {
    expect(sort(id).cl).toContain('ra');
  });
});

describe('liste de sorts de l’Occultiste', () => {
  it.each(['coup-tonnerre', 'leurre', 'scrutation', 'cercle-teleportation', 'portail', 'metamorphose-supreme', 'insanite'])(
    'accorde %s à l’Occultiste', (id) => {
      expect(sort(id).cl).toContain('w');
    },
  );

  it.each(['etincelle-etoilee', 'suggestion-groupe', 'programme-illusion', 'projection-image', 'symbole', 'teleportation'])(
    'retire %s de la liste de l’Occultiste', (id) => {
      expect(sort(id).cl).not.toContain('w');
    },
  );

  // L'audit énumère exactement les tags à changer. Les sorts accordés par un
  // Patron passent par SUBCLASS_ALWAYS_SPELLS ; aucun d'eux ne devait recevoir
  // le tag w au passage — ce test fige les seuls ajouts autorisés.
  it('n’ajoute le tag w qu’aux sept sorts listés par l’audit', () => {
    const autorises = new Set(['coup-tonnerre', 'leurre', 'scrutation', 'cercle-teleportation', 'portail', 'metamorphose-supreme', 'insanite']);
    for (const id of ['invocation-celeste', 'gardien-foi', 'croissance-vegetale', 'lueurs-feeriques', 'reviviscence']) {
      expect(autorises.has(id)).toBe(false);
      expect(sort(id).cl, `${id} n'était pas dans la liste d'ajouts`).not.toContain('w');
    }
  });
});

describe('Coup de tonnerre', () => {
  const coup = () => sort('coup-tonnerre');

  it('est un sort mineur d’Évocation à composante somatique seule', () => {
    expect(coup()).toMatchObject({ lv: 0, sc: 'Évocation', t: 'Action', cp: 'S', du: 'Instantanée' });
  });

  it('est une émanation personnelle de 1,50 m, et non une cible à 9 m', () => {
    expect(coup().r).toMatch(/Personnelle/);
    expect(coup().r).toMatch(/1,50 m/);
    expect(coup().r).not.toMatch(/^9 m$/);
  });

  it('touche les cinq classes de la liste 2024', () => {
    expect([...coup().cl].sort()).toEqual(['b', 'dr', 'm', 's', 'w'].sort());
  });

  it('n’a plus ni condition de dégâts préalables ni poussée', () => {
    expect(coup().d).not.toMatch(/vient de subir/i);
    expect(coup().d).not.toMatch(/repouss/i);
  });

  it('porte la sauvegarde de Constitution, 1d6 et la progression 5/11/17', () => {
    expect(coup().d).toMatch(/sauvegarde de Constitution/i);
    expect(coup().d).toMatch(/1d6/);
    expect(coup().up).toMatch(/2d6.*5.*3d6.*11.*4d6.*17/);
  });
});

describe('Marque du chasseur', () => {
  const marque = () => sort('marque-chasseur');

  it('déclenche sur un jet d’attaque, et non sur une attaque d’arme', () => {
    expect(marque().d).toMatch(/jet d'attaque/);
    expect(marque().d).not.toMatch(/attaques d'arme/);
  });

  it('inflige 1d6 de force sans progression au niveau 17', () => {
    expect(marque().d).toMatch(/1d6 dégâts de force/);
    expect(marque().d).not.toMatch(/2d6/);
    expect(marque().up || '').not.toMatch(/2d6/);
  });

  it('conserve l’avantage pour retrouver la cible et le transfert à 0 PV', () => {
    expect(marque().d).toMatch(/Perception ou Survie/);
    expect(marque().d).toMatch(/0 PV/);
  });

  it('conserve la prolongation de concentration par emplacement supérieur', () => {
    expect(marque().cc).toBe(true);
    expect(marque().up).toMatch(/8 heures/);
  });
});

describe('Cage de force', () => {
  const cage = () => sort('cage-force');

  it('demande la concentration jusqu’à 1 heure', () => {
    expect(cage().du).toMatch(/^Concentration/);
    expect(cage().du).toMatch(/1 heure/);
    expect(cage().cc).toBe(true);
  });

  it('consomme la poussière de rubis de 1 500 po', () => {
    expect(cage().cp).toMatch(/rubis/i);
    expect(cage().cp).toMatch(/1 500 po/);
    expect(cage().cp).toMatch(/consum/i);
  });

  it('conserve les règles de cage et de téléportation', () => {
    expect(cage().d).toMatch(/cage|boîte/i);
    expect(cage().d).toMatch(/téléportation/i);
  });
});
