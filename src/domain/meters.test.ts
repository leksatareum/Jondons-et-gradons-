import { describe, expect, it } from 'vitest';
import { formatMeters, parseMeters } from './meters';

describe('parseMeters', () => {
  it('lit un entier', () => {
    expect(parseMeters('9 m')).toBe(9);
  });

  it('lit une virgule française', () => {
    expect(parseMeters('1,50 m')).toBe(1.5);
  });

  it('renvoie null pour ce qui n’est pas une distance', () => {
    expect(parseMeters('Personnelle')).toBeNull();
    expect(parseMeters(undefined)).toBeNull();
  });
});

describe('formatMeters', () => {
  it('n’écrit pas de virgule pour un entier', () => {
    expect(formatMeters(9)).toBe('9');
  });

  it('utilise la virgule française pour une fraction', () => {
    expect(formatMeters(1.5)).toBe('1,5');
  });
});
