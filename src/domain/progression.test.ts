import { describe, expect, it } from 'vitest';
import { subclassHpGainAtLevel, subclassMaxHpBonus } from './progression';

describe('Résilience draconique 2024', () => {
  it('ne donne rien avant le choix de sous-classe', () => {
    expect(subclassMaxHpBonus('ensorceleur', 2, 'Sorcellerie draconique')).toBe(0);
  });

  it('ajoute trois PV au niveau 3', () => {
    expect(subclassHpGainAtLevel('ensorceleur', 2, 3, null, 'Sorcellerie draconique')).toBe(3);
  });

  it('ajoute ensuite un PV par niveau d’ensorceleur', () => {
    expect(subclassHpGainAtLevel('ensorceleur', 3, 4, 'Sorcellerie draconique', 'Sorcellerie draconique')).toBe(1);
    expect(subclassMaxHpBonus('ensorceleur', 12, 'Sorcellerie draconique')).toBe(12);
  });

  it('ne confond pas la CA sans armure et les PV des autres sous-classes', () => {
    expect(subclassMaxHpBonus('barde', 8, 'Collège de la Danse')).toBe(0);
    expect(subclassMaxHpBonus('ensorceleur', 8, 'Sorcellerie aberrante')).toBe(0);
  });
});
