import { describe, expect, it } from 'vitest';
import { EMPTY_LIVE_STATE, type CharacterSheet } from './character';
import { deriveCharacter } from './derive';
import {
  apresChangementDePv, echecParDegats, etatDeMort, lancerJetContreLaMort,
  noterJetContreLaMort, reinitialiserJets, stabiliser,
} from './death-state';

const fiche = (live: Partial<CharacterSheet['live']> = {}): CharacterSheet => ({
  id: 'f', name: 'Fixture', speciesId: 'humain', lineageId: null, ancestryId: null, size: null,
  backgroundId: 'sage',
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  alignment: null,
  classLevels: [{ classId: 'guerrier', level: 1, subclass: null, subclassId: null }],
  classChoices: {}, skillProficiencies: [], expertise: [], toolProficiencies: [],
  languages: [], featIds: [], abilityImprovements: [], cantrips: [], spells: [],
  inventory: [], armorId: null, shield: false, gold: 0,
  maxHpOverride: 10,
  live: { ...EMPTY_LIVE_STATE, ...live },
});

/** Une fiche à 0 PV : la blessure vaut le maximum. */
const aTerre = (live: Partial<CharacterSheet['live']> = {}) => fiche({ damageTaken: 10, ...live });

const avec = (sheet: CharacterSheet) => [sheet, deriveCharacter(sheet)] as const;

describe('jets de sauvegarde contre la mort — la fiche et le domaine', () => {
  it('debout, il n’y a rien à jeter', () => {
    const [sheet, derivee] = avec(fiche());
    expect(etatDeMort(sheet, derivee)).toEqual({ aTerre: false, statut: null, succes: 0, echecs: 0 });
  });

  it('à 0 PV sans statut enregistré, le personnage est en train de mourir', () => {
    const [sheet, derivee] = avec(aTerre());
    expect(etatDeMort(sheet, derivee)).toMatchObject({ aTerre: true, statut: 'dying' });
  });

  it('trois succès stabilisent', () => {
    let [sheet, derivee] = avec(aTerre());
    for (let i = 0; i < 3; i += 1) sheet = noterJetContreLaMort(sheet, derivee, 'succes');
    expect(etatDeMort(sheet, derivee).statut).toBe('stable');
  });

  it('trois échecs tuent', () => {
    let [sheet, derivee] = avec(aTerre());
    for (let i = 0; i < 3; i += 1) sheet = noterJetContreLaMort(sheet, derivee, 'echec');
    expect(etatDeMort(sheet, derivee)).toMatchObject({ statut: 'dead', echecs: 3 });
  });

  it('un 1 naturel compte deux échecs', () => {
    const [sheet, derivee] = avec(aTerre());
    expect(etatDeMort(noterJetContreLaMort(sheet, derivee, 'nat1'), derivee).echecs).toBe(2);
  });

  it('un 20 naturel relève à 1 PV — la BLESSURE doit suivre, pas seulement le statut', () => {
    const [sheet, derivee] = avec(aTerre({ deathSaves: { success: 1, fail: 2 } }));
    const apres = noterJetContreLaMort(sheet, derivee, 'nat20');
    // 10 de maximum, 1 PV rendu ⇒ 9 de blessure. C'est toute la traduction
    // que ce module existe pour faire.
    expect(apres.live.damageTaken).toBe(9);
    expect(deriveCharacter(apres).currentHp).toBe(1);
    expect(etatDeMort(apres, deriveCharacter(apres))).toMatchObject({ statut: null, succes: 0, echecs: 0 });
  });

  it('un mort ne jette plus rien', () => {
    const [sheet, derivee] = avec(aTerre({ deathSaves: { success: 0, fail: 3 }, deathStatus: 'dead' }));
    expect(noterJetContreLaMort(sheet, derivee, 'succes')).toBe(sheet);
  });

  it('un stabilisé ne jette plus rien non plus', () => {
    const [sheet, derivee] = avec(aTerre({ deathStatus: 'stable' }));
    expect(noterJetContreLaMort(sheet, derivee, 'echec')).toBe(sheet);
  });

  it('stabiliser depuis l’extérieur marche sans aucun succès (Médecine DD 10)', () => {
    const [sheet, derivee] = avec(aTerre({ deathSaves: { success: 0, fail: 2 } }));
    const apres = stabiliser(sheet, derivee);
    expect(etatDeMort(apres, derivee)).toMatchObject({ statut: 'stable', echecs: 0 });
  });

  it('des dégâts à terre ajoutent un échec, deux sur un critique', () => {
    const [sheet, derivee] = avec(aTerre());
    expect(etatDeMort(echecParDegats(sheet, derivee, 3), derivee).echecs).toBe(1);
    expect(etatDeMort(echecParDegats(sheet, derivee, 3, true), derivee).echecs).toBe(2);
  });

  it('des dégâts à terre qui atteignent le maximum de PV tuent d’un coup', () => {
    const [sheet, derivee] = avec(aTerre());
    expect(etatDeMort(echecParDegats(sheet, derivee, 10), derivee).statut).toBe('dead');
  });

  it('des dégâts sur un personnage DEBOUT ne touchent pas aux jets', () => {
    const [sheet, derivee] = avec(fiche({ damageTaken: 2 }));
    expect(echecParDegats(sheet, derivee, 3)).toBe(sheet);
  });

  it('remonter au-dessus de 0 PV efface les jets', () => {
    const [sheet, derivee] = avec(fiche({ damageTaken: 8, deathSaves: { success: 1, fail: 2 }, deathStatus: 'dying' }));
    const apres = apresChangementDePv(sheet, derivee);
    expect(apres.live.deathSaves).toEqual({ success: 0, fail: 0 });
    expect(apres.live.deathStatus).toBeNull();
  });

  it('rester à 0 PV n’efface rien', () => {
    const [sheet, derivee] = avec(aTerre({ deathSaves: { success: 1, fail: 1 }, deathStatus: 'dying' }));
    expect(apresChangementDePv(sheet, derivee)).toBe(sheet);
  });

  it('un mort ne se relève pas parce qu’on lui rend des PV', () => {
    const [sheet, derivee] = avec(fiche({ damageTaken: 0, deathSaves: { success: 0, fail: 3 }, deathStatus: 'dead' }));
    expect(apresChangementDePv(sheet, derivee)).toBe(sheet);
  });

  it('réinitialiser sort un MORT de son état — c’est une correction, pas une règle', () => {
    const [sheet, derivee] = avec(aTerre({ deathSaves: { success: 0, fail: 3 }, deathStatus: 'dead' }));
    const apres = reinitialiserJets(sheet, derivee);
    expect(etatDeMort(apres, derivee)).toMatchObject({ statut: 'dying', succes: 0, echecs: 0 });
    // Corriger une saisie ne ressuscite personne : les PV ne bougent pas.
    expect(apres.live.damageTaken).toBe(10);
  });

  it('réinitialiser sort aussi d’un état « stabilisé »', () => {
    const [sheet, derivee] = avec(aTerre({ deathStatus: 'stable' }));
    expect(etatDeMort(reinitialiserJets(sheet, derivee), derivee).statut).toBe('dying');
  });

  it('réinitialiser remet les compteurs sans relever', () => {
    const [sheet, derivee] = avec(aTerre({ deathSaves: { success: 2, fail: 2 }, deathStatus: 'dying' }));
    const apres = reinitialiserJets(sheet, derivee);
    expect(etatDeMort(apres, derivee)).toMatchObject({ statut: 'dying', succes: 0, echecs: 0 });
    expect(apres.live.damageTaken).toBe(10);
  });
});

describe('le dé de l’appli — mêmes probabilités qu’à la table', () => {
  const jetAvec = (valeur: number) => {
    const [sheet, derivee] = avec(aTerre());
    // `rollDie` fait 1 + floor(random × 20) : la borne basse d'une face.
    return lancerJetContreLaMort(sheet, derivee, () => (valeur - 1) / 20);
  };

  it('10 ou plus est un succès, 9 ou moins un échec', () => {
    expect(jetAvec(10).resultat).toBe('succes');
    expect(jetAvec(9).resultat).toBe('echec');
  });

  it('le 1 et le 20 gardent leur statut particulier', () => {
    expect(jetAvec(1).resultat).toBe('nat1');
    expect(jetAvec(20).resultat).toBe('nat20');
  });

  it('le dé tiré est rendu à l’écran, pas seulement son effet', () => {
    const jet = jetAvec(14);
    expect(jet.de).toBe(14);
    expect(etatDeMort(jet.sheet, deriveCharacter(jet.sheet)).succes).toBe(1);
  });

  it('les vingt faces sortent, et seulement elles', () => {
    const [sheet, derivee] = avec(aTerre());
    const vus = new Set<number>();
    for (let i = 0; i < 4000; i += 1) vus.add(lancerJetContreLaMort(sheet, derivee).de);
    expect([...vus].sort((a, b) => a - b)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });
});
