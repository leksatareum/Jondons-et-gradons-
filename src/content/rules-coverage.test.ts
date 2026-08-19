import { describe, expect, it } from 'vitest';
import { RULE_COVERAGE, coverageCounts } from './rules-coverage';

describe('registre de couverture des règles', () => {
  it('possède des identifiants uniques et une description exploitable', () => {
    expect(new Set(RULE_COVERAGE.map((area) => area.id)).size).toBe(RULE_COVERAGE.length);
    expect(RULE_COVERAGE.every((area) => area.detail.length >= 20)).toBe(true);
  });

  it('distingue automatisation, assistance et référence', () => {
    const counts = coverageCounts();
    expect(counts.automated).toBeGreaterThan(0);
    expect(counts.assisted).toBeGreaterThan(0);
    expect(counts.reference).toBeGreaterThan(0);
  });
});
