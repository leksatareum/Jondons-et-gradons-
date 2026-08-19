import { describe, expect, it } from 'vitest';
import {
  DAMAGE_TYPES,
  FEAT_ELEMENTAL_TYPES,
  FEAT_ENERGY_TYPES,
  KNOWLEDGE_SKILLS,
  OBSERVANT_SKILLS,
  SCHOOLS,
  SPELL_LIST_CODE,
} from './reference-lists';
import { SKILLS } from './character-basics';
import { SPELLS } from './spells.js';

describe('listes de référence', () => {
  it('treize types de dégâts', () => {
    expect(DAMAGE_TYPES).toHaveLength(13);
  });
  it('huit écoles de magie', () => {
    expect(SCHOOLS).toHaveLength(8);
  });
});

describe('sous-ensembles de choix', () => {
  it('les types d’énergie et élémentaires sont tous de vrais types de dégâts', () => {
    for (const type of [...FEAT_ENERGY_TYPES, ...FEAT_ELEMENTAL_TYPES]) {
      expect(DAMAGE_TYPES, type).toContain(type);
    }
  });

  it('les types élémentaires sont un sous-ensemble strict des types d’énergie', () => {
    expect(FEAT_ELEMENTAL_TYPES.every((type) => FEAT_ENERGY_TYPES.includes(type))).toBe(true);
    expect(FEAT_ELEMENTAL_TYPES.length).toBeLessThan(FEAT_ENERGY_TYPES.length);
  });

  it('les compétences citées existent toutes', () => {
    const ids = new Set(SKILLS.map((skill) => skill.id));
    for (const id of [...KNOWLEDGE_SKILLS, ...OBSERVANT_SKILLS]) {
      expect(ids.has(id), id).toBe(true);
    }
  });

  it('les compétences de connaissance sont bien toutes fondées sur l’Intelligence', () => {
    for (const id of KNOWLEDGE_SKILLS) {
      expect(SKILLS.find((skill) => skill.id === id)?.ability, id).toBe('int');
    }
  });
});

describe('codes de liste de sorts', () => {
  it('chaque code apparaît réellement dans le catalogue de sorts', () => {
    const used = new Set((SPELLS as { cl?: string[] }[]).flatMap((spell) => spell.cl ?? []));
    for (const [classId, code] of Object.entries(SPELL_LIST_CODE)) {
      expect(used.has(code), `${classId} (${code})`).toBe(true);
    }
  });
});
