import { describe, expect, it } from 'vitest';
import { SPELLS } from './spells.js';

const patronSpellIds = [
  // Archifée
  'apaisement', 'lueurs-feeriques', 'pas-brumeux', 'force-fantasmagorique', 'sommeil',
  'clignotement', 'croissance-vegetale', 'domination-bete', 'invisibilite-superieure',
  'domination-personne', 'apparence',
  // Céleste
  'aide', 'soins', 'trait-lumiere', 'restauration-partielle', 'lumiere', 'flamme-sacree',
  'lumiere-jour', 'reviviscence', 'gardien-foi', 'mur-feu', 'restauration-superieure',
  'invocation-celeste',
  // Fiélon
  'mains-brulantes', 'injonction', 'rayon-ardent', 'suggestion', 'boule-feu', 'nuage-poison',
  'bouclier-flammes', 'geas', 'insectes',
];

describe('sorts de Patron Occultiste — PHB 2024', () => {
  it('garantit que tous les sorts canoniques des Patrons existent dans le corpus', () => {
    const known = new Set(SPELLS.map((spell: { id: string }) => spell.id));
    const missing = patronSpellIds.filter((id) => !known.has(id)).sort();
    expect(missing).toEqual([]);
  });

  it('garde explicitement Quête/Geas dans la couverture du Fiélon', () => {
    expect(patronSpellIds).toContain('geas');
  });
});
