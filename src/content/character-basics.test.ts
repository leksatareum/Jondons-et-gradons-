import { describe, expect, it } from 'vitest';
import { ABILITY_NAMES, ABILITY_ORDER, ALIGNMENTS, SKILLS, STANDARD_ARRAY, STANDARD_LANGUAGES, skillName } from './character-basics';

describe('caractéristiques', () => {
  it('six caractéristiques, dans l’ordre habituel', () => {
    expect(ABILITY_ORDER).toEqual(['str', 'dex', 'con', 'int', 'wis', 'cha']);
    expect(Object.keys(ABILITY_NAMES)).toHaveLength(6);
  });
  it('tableau standard trié décroissant', () => {
    expect(STANDARD_ARRAY).toEqual([15, 14, 13, 12, 10, 8]);
  });
});

describe('langues et alignements', () => {
  it('neuf langues standard hors Commun, dont l’ajout 2024', () => {
    expect(STANDARD_LANGUAGES).toHaveLength(9);
    expect(STANDARD_LANGUAGES).toContain('Langue des signes commune');
  });
  it('neuf alignements', () => {
    expect(ALIGNMENTS).toHaveLength(9);
  });
});

describe('compétences', () => {
  it('dix-huit compétences, chacune liée à sa caractéristique', () => {
    expect(SKILLS).toHaveLength(18);
    expect(SKILLS.find((skill) => skill.id === 'discretion')?.ability).toBe('dex');
    expect(SKILLS.find((skill) => skill.id === 'arcanes')?.ability).toBe('int');
    expect(SKILLS.find((skill) => skill.id === 'persuasion')?.ability).toBe('cha');
  });
  it('skillName retrouve le nom depuis l’id, ou le renvoie tel quel', () => {
    expect(skillName('perception')).toBe('Perception');
    expect(skillName('inconnue')).toBe('inconnue');
  });
});
