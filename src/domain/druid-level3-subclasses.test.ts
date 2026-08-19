import { describe, expect, it } from 'vitest';
import {
  activateStarryForm,
  activateWrathOfSea,
  dismissStarryForm,
  dismissWrathOfSea,
  landsAid,
  rollStarryChaliceHealing,
  seaPassiveBenefits,
  seaStormbornBenefits,
  starMapFreeGuidingBoltUses,
  starryArcherAttack,
  starryChaliceHealing,
  starryChaliceSpellMayRestoreHitPoints,
  starryDragonD20Floor,
  starryDragonFlight,
  starryFormResistances,
  switchStarryConstellation,
} from './druid-level3-subclasses';

const druid = (subclass: string, wis = 18, level = 3) => ({
  level,
  classId: 'druide',
  subclass,
  classLevels: [{ classId: 'druide', level, subclass }],
  abilities: { str: 10, dex: 12, con: 14, int: 10, wis, cha: 8 },
  resources: [{ name: 'Forme sauvage', current: 2, max: 2 }],
  turn: { action: false, bonus: false, reaction: false },
  conditions: [],
});

describe('Cercles de Druide · PHB 2024', () => {
  it('Aide de la terre progresse de 2d6 à 3d6 puis 4d6', () => {
    const level3 = landsAid(druid('Cercle de la Terre'));
    expect(level3?.character.resources?.[0].current).toBe(1);
    expect(level3?.resolution).toEqual({ damageDice: '2d6', healingDice: '2d6', saveAbility: 'con', radiusMeters: 3, rangeMeters: 18 });

    expect(landsAid(druid('Cercle de la Terre', 18, 10))?.resolution.damageDice).toBe('3d6');
    expect(landsAid(druid('Cercle de la Terre', 18, 14))?.resolution.healingDice).toBe('4d6');
  });

  it('Courroux de la mer dépense une Forme sauvage et passe à une émanation de 3 m au niveau 6', () => {
    const active = activateWrathOfSea(druid('Cercle de la Mer'));
    expect(active.resources?.[0].current).toBe(1);
    expect(active.wrathOfSea).toMatchObject({ active: true, radiusMeters: 1.5, durationMinutes: 10, damageDice: '4d6', pushMeters: 4.5 });
    expect(dismissWrathOfSea(active).wrathOfSea).toBeNull();

    const level6 = activateWrathOfSea(druid('Cercle de la Mer', 18, 6));
    expect(level6.wrathOfSea?.radiusMeters).toBe(3);
    expect(seaPassiveBenefits(level6).swimSpeedEqualsSpeed).toBe(true);

    const lowWis = activateWrathOfSea(druid('Cercle de la Mer', 8));
    expect(lowWis.wrathOfSea?.damageDice).toBe('1d6');
  });

  it('Né de la tempête n’accorde vol et résistances que pendant Courroux de la mer', () => {
    const level10 = druid('Cercle de la Mer', 18, 10);
    expect(seaStormbornBenefits(level10)).toEqual({ flySpeedEqualsSpeed: false, resistances: [] });
    const active = activateWrathOfSea(level10);
    expect(seaStormbornBenefits(active)).toEqual({ flySpeedEqualsSpeed: true, resistances: ['froid', 'foudre', 'tonnerre'] });
  });

  it('Forme étoilée conserve les trois profils de niveau 3', () => {
    const archer = activateStarryForm(druid('Cercle des Étoiles'), 'archer');
    expect(archer.resources?.[0].current).toBe(1);
    expect(archer.starryForm?.form).toBe('archer');
    expect(starryArcherAttack(archer)).toEqual({ toHitAbility: 'wis', damage: '1d8+4', rangeMeters: 18 });

    const chalice = activateStarryForm(druid('Cercle des Étoiles'), 'chalice');
    expect(starryChaliceHealing(chalice)).toBe('1d8+4');

    const dragon = activateStarryForm(druid('Cercle des Étoiles'), 'dragon');
    expect(starryDragonD20Floor(dragon, 'wis-check')).toBe(10);
    expect(starryDragonD20Floor(dragon, 'con-concentration')).toBe(10);
    expect(dismissStarryForm(dragon).starryForm).toBeNull();
  });

  it('Calice ne s’arme que pour un sort à emplacement susceptible de rendre des PV et lance 1d8/2d8 + SAG', () => {
    expect(starryChaliceSpellMayRestoreHitPoints({ lv: 1, d: 'Une créature récupère 2d8 points de vie.' })).toBe(true);
    expect(starryChaliceSpellMayRestoreHitPoints({ lv: 0, d: 'Une créature récupère 1d8 points de vie.' })).toBe(false);
    expect(starryChaliceSpellMayRestoreHitPoints({ lv: 2, d: 'La cible gagne 5 points de vie temporaires.' })).toBe(false);

    const level3 = activateStarryForm(druid('Cercle des Étoiles'), 'chalice');
    expect(rollStarryChaliceHealing(level3, () => 0)).toBe(5);
    const level10 = activateStarryForm(druid('Cercle des Étoiles', 18, 10), 'chalice');
    expect(rollStarryChaliceHealing(level10, () => 0)).toBe(6);
    expect(rollStarryChaliceHealing(activateStarryForm(druid('Cercle des Étoiles'), 'dragon'), () => 0)).toBeNull();
  });

  it('Constellations scintillantes applique 2d8, vol stationnaire et changement de constellation au niveau 10', () => {
    const archer = activateStarryForm(druid('Cercle des Étoiles', 18, 10), 'archer');
    expect(starryArcherAttack(archer)?.damage).toBe('2d8+4');

    const chalice = activateStarryForm(druid('Cercle des Étoiles', 18, 10), 'chalice');
    expect(starryChaliceHealing(chalice)).toBe('2d8+4');

    const dragon = switchStarryConstellation(archer, 'dragon');
    expect(dragon.resources?.[0].current).toBe(1);
    expect(starryDragonFlight(dragon)).toEqual({ speedMeters: 6, hover: true });
    expect(dragon.starryForm?.hover).toBe(true);
  });

  it('Plein d’étoiles accorde les trois résistances physiques au niveau 14', () => {
    const stars = activateStarryForm(druid('Cercle des Étoiles', 18, 14), 'chalice');
    expect(starryFormResistances(stars)).toEqual(['contondants', 'perforants', 'tranchants']);
    expect(stars.starryForm?.resistances).toEqual(['contondants', 'perforants', 'tranchants']);
  });

  it('Carte stellaire donne un nombre de Traits guidants gratuits égal à SAG, minimum 1', () => {
    expect(starMapFreeGuidingBoltUses(druid('Cercle des Étoiles', 18))).toBe(4);
    expect(starMapFreeGuidingBoltUses(druid('Cercle des Étoiles', 8))).toBe(1);
  });

  it('refuse les capacités si la sous-classe ou la ressource ne convient pas', () => {
    expect(landsAid(druid('Cercle de la Lune'))).toBeNull();
    const empty = { ...druid('Cercle de la Mer'), resources: [{ name: 'Forme sauvage', current: 0, max: 2 }] };
    expect(activateWrathOfSea(empty)).toBe(empty);
  });
});
