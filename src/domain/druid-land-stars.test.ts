import { describe, expect, it } from 'vitest';
import {
  chooseLand,
  landSpellNames,
  landWardResistance,
  naturalRecoverySlotBudget,
  openLandChoiceAfterLongRest,
  resetLandStarsLongRest,
  spendStarMapGuidingBolt,
  starMapGuidingBoltMax,
  starMapGuidingBoltRemaining,
} from './druid-land-stars';

const druid = (level: number, subclass: string, wis = 18) => ({
  level,
  classId: 'druide',
  subclass,
  classLevels: [{ classId: 'druide', level, subclass }],
  abilities: { wis },
});

describe('Cercle de la Terre · choix après repos long', () => {
  it('ouvre le choix au niveau 3 et applique exactement les sorts du terrain', () => {
    const base = druid(3, 'Cercle de la Terre');
    const opened = openLandChoiceAfterLongRest(base);
    expect(opened.circleLandChoiceOpen).toBe(true);
    const polar = chooseLand(opened, 'polar');
    expect(polar.circleLandChoiceOpen).toBe(false);
    expect(landSpellNames(polar)).toEqual(['Nappe de brouillard', 'Immobilisation de personne', 'Rayon de givre']);
  });

  it('cumule les sorts canoniques jusqu’aux paliers 7 et 9', () => {
    const arid = chooseLand({ ...druid(9, 'Cercle de la Terre'), circleLandChoiceOpen: true }, 'arid');
    expect(landSpellNames(arid)).toEqual(['Flou', 'Mains brûlantes', 'Trait de feu', 'Boule de feu', 'Flétrissement', 'Mur de pierre']);

    const polar = chooseLand({ ...druid(9, 'Cercle de la Terre'), circleLandChoiceOpen: true }, 'polar');
    expect(landSpellNames(polar)).toEqual(['Nappe de brouillard', 'Immobilisation de personne', 'Rayon de givre', 'Tempête de neige', 'Tempête de grêle', 'Cône de froid']);

    const temperate = chooseLand({ ...druid(9, 'Cercle de la Terre'), circleLandChoiceOpen: true }, 'temperate');
    expect(landSpellNames(temperate)).toEqual(['Pas brumeux', 'Poigne électrique', 'Sommeil', 'Éclair', 'Liberté de mouvement', 'Foulée des arbres']);

    const tropical = chooseLand({ ...druid(9, 'Cercle de la Terre'), circleLandChoiceOpen: true }, 'tropical');
    expect(landSpellNames(tropical)).toEqual(['Aspersion acide', 'Rayon de maladie', 'Toile d’araignée', 'Nuage nauséabond', 'Métamorphose', "Fléau d'insectes"]);
  });

  it('refuse un changement hors fenêtre de repos long', () => {
    const base = { ...druid(3, 'Cercle de la Terre'), circleLandType: 'arid' as const, circleLandChoiceOpen: false };
    expect(chooseLand(base, 'polar')).toBe(base);
  });

  it('expose Récupération naturelle et Garde de la nature aux bons niveaux', () => {
    expect(naturalRecoverySlotBudget(druid(5, 'Cercle de la Terre'))).toBe(0);
    expect(naturalRecoverySlotBudget(druid(6, 'Cercle de la Terre'))).toBe(3);
    expect(naturalRecoverySlotBudget(druid(9, 'Cercle de la Terre'))).toBe(5);

    expect(landWardResistance({ ...druid(9, 'Cercle de la Terre'), circleLandType: 'arid' as const })).toBeNull();
    expect(landWardResistance({ ...druid(10, 'Cercle de la Terre'), circleLandType: 'arid' as const })).toBe('feu');
    expect(landWardResistance({ ...druid(10, 'Cercle de la Terre'), circleLandType: 'polar' as const })).toBe('froid');
    expect(landWardResistance({ ...druid(10, 'Cercle de la Terre'), circleLandType: 'temperate' as const })).toBe('foudre');
    expect(landWardResistance({ ...druid(10, 'Cercle de la Terre'), circleLandType: 'tropical' as const })).toBe('poison');
  });
});

describe('Cercle des Étoiles · Carte stellaire', () => {
  it('donne SAG utilisations gratuites de Trait de lumière, minimum 1', () => {
    const stars = druid(3, 'Cercle des Étoiles', 18);
    expect(starMapGuidingBoltMax(stars)).toBe(4);
    expect(starMapGuidingBoltRemaining(stars)).toBe(4);
    const used = spendStarMapGuidingBolt(stars);
    expect(starMapGuidingBoltRemaining(used)).toBe(3);
    expect(starMapGuidingBoltMax(druid(3, 'Cercle des Étoiles', 8))).toBe(1);
  });

  it('ne dépense plus lorsque la réserve gratuite est vide et revient au repos long', () => {
    const empty = { ...druid(3, 'Cercle des Étoiles', 12), starMapGuidingBoltUsed: 1 };
    expect(starMapGuidingBoltRemaining(empty)).toBe(0);
    expect(spendStarMapGuidingBolt(empty)).toBe(empty);
    const reset = resetLandStarsLongRest(empty);
    expect(reset.starMapGuidingBoltUsed).toBe(0);
    expect(starMapGuidingBoltRemaining(reset)).toBe(1);
  });
});
