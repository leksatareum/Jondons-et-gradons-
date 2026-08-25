import { describe, expect, it } from 'vitest';
import {
  attaquesDuTemplate, caracteristiquesDuTemplate, competencesDuTemplate,
  maitriseDuTemplate, sauvegardesDuTemplate,
} from './AddAdversaryDialog';
import { PHB_CREATURES } from '../content/creatures';

const loup = PHB_CREATURES.find((creature) => creature.id === 'wolf')!;
const sprite = PHB_CREATURES.find((creature) => creature.id === 'sprite')!;
const chat = PHB_CREATURES.find((creature) => creature.id === 'cat')!;
const elephant = PHB_CREATURES.find((creature) => creature.id === 'elephant')!;
// Une bête sans profil de Forme sauvage (BEAST_PHYSICAL) : contrairement à
// l'esprit follet ou au gobelin, aucune caractéristique d'adversaire
// (MONSTER_ABILITIES) ne vient non plus la compléter — elle reste à {}.
const faucon = PHB_CREATURES.find((creature) => creature.id === 'hawk')!;

describe('attaques reprises du bestiaire', () => {
  it('extrait l’attaque d’une bête simple, avec ses dégâts', () => {
    const attaques = attaquesDuTemplate(loup);
    expect(attaques).toHaveLength(1);
    expect(attaques[0]).toMatchObject({ name: 'Morsure', toHit: 4, damage: '1d6+2', damageType: 'perforants' });
    expect(attaques[0].detail).toContain('À terre');
  });

  it('ne retient que les actions de type attaque — jamais les sauvegardes ni les utilitaires', () => {
    // L'esprit follet a une attaque d'épée, un arc, un test de sauvegarde et
    // un sort : seules les deux premières sont des attaques à lire au combat.
    const attaques = attaquesDuTemplate(sprite);
    expect(attaques.map((attaque) => attaque.name)).toEqual(['Épée-aiguille', 'Arc enchanteur']);
    expect(attaques.some((attaque) => attaque.name.includes('cœur'))).toBe(false);
    expect(attaques.some((attaque) => attaque.name.includes('Invisibilité'))).toBe(false);
  });

  it('chaque attaque reçoit un identifiant propre, même homonymes', () => {
    const attaques = attaquesDuTemplate(loup);
    const ids = new Set(attaques.map((attaque) => attaque.id));
    expect(ids.size).toBe(attaques.length);
  });

  it('une créature sans actions renvoie une liste vide, pas une erreur', () => {
    // Le corbeau n'a pas de bloc de combat détaillé dans le catalogue.
    const corbeau = PHB_CREATURES.find((creature) => creature.id === 'raven')!;
    expect(attaquesDuTemplate(corbeau)).toEqual([]);
  });
});

describe('caractéristiques, maîtrise, sauvegardes et compétences reprises du bestiaire', () => {
  it('reprend Force/Dex/Constitution telles qu’imprimées, sans inventer les mentales', () => {
    expect(caracteristiquesDuTemplate(chat)).toEqual({ str: 3, dex: 15, con: 10 });
  });

  it('une créature sans profil de bête renvoie un objet vide, pas une erreur', () => {
    expect(caracteristiquesDuTemplate(faucon)).toEqual({});
    expect(caracteristiquesDuTemplate(elephant)).toEqual({});
  });

  it('un adversaire (pas une bête) porte ses six caractéristiques, mentales comprises', () => {
    // Contrairement à une bête de Forme sauvage : l'esprit follet a besoin de
    // son Intelligence et de son Charisme, qu'aucun Druide ne lui prête.
    expect(caracteristiquesDuTemplate(sprite)).toEqual({ str: 3, dex: 18, con: 10, int: 14, wis: 13, cha: 11 });
  });

  it('calcule le bonus de maîtrise depuis le FP du modèle (table du Manuel des Monstres)', () => {
    expect(maitriseDuTemplate(loup)).toBe(2); // FP 1/4
    expect(maitriseDuTemplate(elephant)).toBe(2); // FP 4 — encore dans la même tranche
  });

  it('ne retient que les sauvegardes où la créature est effectivement maîtrisée', () => {
    expect(sauvegardesDuTemplate(chat)).toEqual({ dex: 4 });
    expect(sauvegardesDuTemplate(loup)).toEqual({}); // le loup n'a aucune sauvegarde maîtrisée au PHB
  });

  it('reprend les compétences maîtrisées avec leur bonus total, pas le seul modificateur', () => {
    // La clé est le nom affiché (« Discrétion »), pas un identifiant interne :
    // `AddAdversaryDialog` l'utilise tel quel comme étiquette de compétence.
    expect(competencesDuTemplate(chat)).toEqual({ Perception: 3, Discrétion: 4 });
    expect(competencesDuTemplate(faucon)).toEqual({});
  });

  it('un adversaire porte lui aussi ses compétences avec leur nom affiché', () => {
    expect(competencesDuTemplate(sprite)).toEqual({ Perception: 3, Discrétion: 8 });
  });
});
