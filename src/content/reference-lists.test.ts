import { describe, expect, it } from 'vitest';
import { DAMAGE_TYPES, SCHOOLS } from './reference-lists';

describe('listes de référence', () => {
  it('treize types de dégâts', () => {
    expect(DAMAGE_TYPES).toHaveLength(13);
  });
  it('huit écoles de magie', () => {
    expect(SCHOOLS).toHaveLength(8);
  });
});
