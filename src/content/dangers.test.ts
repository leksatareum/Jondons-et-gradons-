import { describe, expect, it } from 'vitest';
import { DANGERS, dangersPourNiveau, graviteAuNiveau } from './dangers';

describe('cohérence des dangers et pièges', () => {
  it('donne un identifiant unique à chacun', () => {
    const ids = DANGERS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('couvre chaque entrée par au moins une tranche de niveaux valide', () => {
    for (const danger of DANGERS) {
      expect(danger.tranches.length, danger.nom).toBeGreaterThan(0);
      for (const t of danger.tranches) {
        expect(t.min, danger.nom).toBeGreaterThanOrEqual(1);
        expect(t.max, danger.nom).toBeLessThanOrEqual(20);
        expect(t.min, danger.nom).toBeLessThanOrEqual(t.max);
      }
    }
  });

  it('ne laisse jamais deux tranches se chevaucher sur un même danger', () => {
    // Sinon `graviteAuNiveau` renverrait l'une ou l'autre selon l'ordre
    // d'écriture, et le même danger serait tantôt anodin tantôt mortel.
    for (const danger of DANGERS) {
      for (let niveau = 1; niveau <= 20; niveau += 1) {
        const touchees = danger.tranches.filter((t) => niveau >= t.min && niveau <= t.max);
        expect(touchees.length, `${danger.nom} au niveau ${niveau}`).toBeLessThanOrEqual(1);
      }
    }
  });

  it('donne à tout piège son déclencheur et sa détection', () => {
    // C'est ce qui distingue un piège d'un danger : il se déclenche, et les
    // joueurs peuvent le trouver. Sans ces deux lignes, il ne se joue pas.
    for (const piege of DANGERS.filter((d) => d.genre === 'piege')) {
      expect(piege.declencheur, piege.nom).toBeTruthy();
      expect(piege.detection, piege.nom).toBeTruthy();
    }
  });

  it('annonce un effet chiffré partout — un danger sans nombre ne se joue pas', () => {
    for (const danger of DANGERS) {
      expect(danger.effet.length, danger.nom).toBeGreaterThan(60);
      // Un DD, ou des dés : au moins l'un des deux.
      expect(/DD \d+|\d+d\d+/.test(danger.effet), danger.nom).toBe(true);
    }
  });
});

describe('filtrage par niveau du groupe', () => {
  it('ne rend que ce qui concerne la tranche du groupe', () => {
    const niveau3 = dangersPourNiveau(3);
    expect(niveau3.map((d) => d.id)).toContain('vase-verte');
    // Le Fleuve Styx est une affaire de niveaux 11-16.
    expect(niveau3.map((d) => d.id)).not.toContain('fleuve-styx');
    expect(dangersPourNiveau(13).map((d) => d.id)).toContain('fleuve-styx');
  });

  it('sait ne rendre que les pièges, ou que le décor', () => {
    expect(dangersPourNiveau(3, 'piege').every((d) => d.genre === 'piege')).toBe(true);
    expect(dangersPourNiveau(3, 'decor').every((d) => d.genre === 'decor')).toBe(true);
  });

  it('met les mortels devant', () => {
    const liste = dangersPourNiveau(3);
    const premierAnodin = liste.findIndex((d) => graviteAuNiveau(d, 3) === 'anodin');
    const dernierMortel = liste.map((d) => graviteAuNiveau(d, 3)).lastIndexOf('mortel');
    expect(dernierMortel).toBeLessThan(premierAnodin);
  });

  it('change la gravité d’une tranche à l’autre, pour un même danger', () => {
    const jaune = DANGERS.find((d) => d.id === 'moisissure-jaune')!;
    expect(graviteAuNiveau(jaune, 3)).toBe('mortel');
    expect(graviteAuNiveau(jaune, 7)).toBe('anodin');
    expect(graviteAuNiveau(jaune, 15)).toBeNull();
  });

  it('sert vraiment le groupe de la campagne : des deux genres au niveau 2', () => {
    expect(dangersPourNiveau(2, 'decor').length).toBeGreaterThanOrEqual(6);
    expect(dangersPourNiveau(2, 'piege').length).toBeGreaterThanOrEqual(5);
  });
});
