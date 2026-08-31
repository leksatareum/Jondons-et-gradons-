import { describe, expect, it } from 'vitest';
import { spellRollType } from './spell-roll-type';
import { CATALOGUE, spellById } from '../content/spell-catalogue';

const texteDe = (id: string) => {
  const spell = spellById(id);
  if (!spell) throw new Error(`sort inconnu dans le test : ${id}`);
  return spell;
};

describe('spellRollType', () => {
  it('reconnaît une attaque de sort à distance ou au corps à corps', () => {
    expect(spellRollType(texteDe('trait-feu'))).toEqual({ kind: 'attaque' });
    expect(spellRollType(texteDe('contact-glacial'))).toEqual({ kind: 'attaque' });
  });

  it('reconnaît une arme invoquée qui attaque avec le bonus DU LANCEUR', () => {
    expect(spellRollType(texteDe('arme-spirituelle'))).toEqual({ kind: 'attaque' });
    expect(spellRollType(texteDe('epee-arcanique'))).toEqual({ kind: 'attaque' });
  });

  it('reconnaît une sauvegarde et la bonne caractéristique', () => {
    expect(spellRollType(texteDe('vague-tonnante'))).toEqual({ kind: 'sauvegarde', ability: 'con' });
    expect(spellRollType(texteDe('enchevetrement'))).toMatchObject({ kind: 'sauvegarde' });
  });

  it('un sort qui impose à la fois une attaque ET une sauvegarde secondaire reste une attaque', () => {
    // Couteau de glace : attaque de sort qui touche, PUIS une sauvegarde
    // secondaire pour les créatures proches — c'est l'attaque qui décide si
    // le sort touche sa cible, donc le rôle principal de la carte.
    expect(spellRollType(texteDe('couteau-glace'))).toEqual({ kind: 'attaque' });
  });

  it('ne renvoie rien pour un sort qui n’impose ni attaque ni sauvegarde', () => {
    expect(spellRollType(texteDe('soins'))).toBeUndefined();
  });

  it('trouve la bonne caractéristique même quand une autre est citée comme simple bonus', () => {
    // Appel des animaux : « avantage aux sauvegardes de Force » (un bonus,
    // pas une sauvegarde imposée par CE sort) PUIS « sauvegarde de
    // Dextérité ou subit 3d10 dégâts » — la vraie sauvegarde du sort.
    expect(spellRollType(texteDe('appel-animaux'))).toEqual({ kind: 'sauvegarde', ability: 'dex' });
  });

  it('ignore un pur bonus aux sauvegardes d’autrui, même sans autre jet dans le texte', () => {
    // Hâte : « l'avantage aux sauvegardes de Dextérité » — un bonus donné à
    // la cible bénéficiaire, jamais une sauvegarde que Hâte impose.
    expect(spellRollType(texteDe('hate'))).toBeUndefined();
  });

  it('ignore un désavantage posé sur les jets futurs de la cible, même à distance du mot « aux »', () => {
    // Danse irrésistible d'Otto : « désavantage aux attaques et sauvegardes
    // de Dextérité » (un malus posé sur la cible) PUIS « sauvegarde de
    // Sagesse pour terminer le sort » — la vraie sauvegarde répétée.
    expect(spellRollType(texteDe('danse-irresistible-otto'))).toEqual({ kind: 'sauvegarde', ability: 'wis' });
  });

  it('retient la PREMIÈRE sauvegarde citée quand un sort en mentionne deux légitimement', () => {
    // Statique synaptique : sauvegarde d'Intelligence pour l'effet principal,
    // puis une pénalité aux sauvegardes de Constitution en cas d'échec —
    // c'est l'Intelligence qui déclenche réellement l'effet de la carte.
    expect(spellRollType(texteDe('statique-synaptique'))).toEqual({ kind: 'sauvegarde', ability: 'int' });
  });

  it('ignore un buff qui mentionne « sauvegarde » sans en imposer une à une cible', () => {
    // Bénédiction : « +1d4 à leurs jets d'attaque et de sauvegarde » — un
    // bonus aux SAUVEGARDES D'AUTRUI, pas une sauvegarde contre ce sort.
    expect(spellRollType(texteDe('benediction'))).toBeUndefined();
  });

  it('ignore un sort qui impose son propre DD fixe — celui du lanceur serait faux', () => {
    // Contact extraplanaire : « Sauvegarde d'Intelligence DD 15 », toujours
    // 15 quel que soit le lanceur.
    expect(spellRollType(texteDe('contact-autre-plan'))).toBeUndefined();
  });

  it('ne plante sur aucun des 389 sorts et ne renvoie qu’une forme valide', () => {
    for (const spell of CATALOGUE) {
      const type = spellRollType(spell);
      if (!type) continue;
      if (type.kind === 'sauvegarde') {
        expect(['str', 'dex', 'con', 'int', 'wis', 'cha']).toContain(type.ability);
      }
    }
  });

  it('sur les 389 sorts, ne classe que ce que les deux motifs couvrent réellement', () => {
    const attaques = CATALOGUE.filter((s) => spellRollType(s)?.kind === 'attaque');
    const sauvegardes = CATALOGUE.filter((s) => spellRollType(s)?.kind === 'sauvegarde');
    expect(attaques.length).toBeGreaterThan(20);
    expect(sauvegardes.length).toBeGreaterThan(100);
    // Chevauchement attendu et documenté : deux sorts citent les deux motifs,
    // classés « attaque » — l'attaque est le jet qui décide si le sort agit.
    const chevauchement = attaques.filter((s) => /sauvegardes? (?:de |d['’])/i.test(s.text));
    expect(chevauchement.length).toBe(2);
  });
});
