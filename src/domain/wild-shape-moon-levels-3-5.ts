import { PHB_CREATURES } from '../content/creatures';
import { WILD_SHAPE_PROFILES, type WildShapeProfile } from './wild-shape';

const creature = (id: string) => {
  const found = PHB_CREATURES.find((entry) => entry.id === id);
  if (!found) throw new Error(`Profil de bête PHB manquant: ${id}`);
  return found;
};

const profile = (
  id: string,
  size: WildShapeProfile['size'],
  abilities: WildShapeProfile['abilities'],
  attacks: WildShapeProfile['attacks'],
  extra: Partial<WildShapeProfile> = {},
): WildShapeProfile => {
  const base = creature(id);
  return {
    id,
    name: base.name,
    size,
    cr: base.cr,
    ac: base.ac,
    hp: base.hp,
    speed: base.speed,
    abilities,
    attacks,
    ...extra,
  };
};

// Profils FP 1 de l'appendice B accessibles au Cercle de la Lune dès le niveau 3.
// On ne duplique que les données mécaniques compactes nécessaires au moteur.
export const MOON_LEVEL_3_BEASTS: WildShapeProfile[] = [
  profile('brown-bear', 'G', { str: 17, dex: 12, con: 15 }, [
    { id: 'bite', name: 'Morsure', toHit: 5, dice: '1d8+3', type: 'perforants' },
    { id: 'claw', name: 'Griffe', toHit: 5, dice: '1d4+3', type: 'tranchants', props: 'Cible TG ou moins : À terre' },
  ], {
    skillOverrides: { perception: 3 },
    senses: 'Vision dans le noir 18 m · Perception passive 13',
    attacksPerAction: 2,
  }),
  profile('dire-wolf', 'G', { str: 17, dex: 15, con: 15 }, [
    { id: 'bite', name: 'Morsure', toHit: 5, dice: '1d10+3', type: 'perforants', props: 'Cible TG ou moins : À terre' },
  ], {
    skillOverrides: { perception: 5, discretion: 4 },
    senses: 'Vision dans le noir 18 m · Perception passive 15',
    traits: ['Tactique de meute'],
  }),
  profile('giant-spider', 'G', { str: 14, dex: 16, con: 12 }, [
    { id: 'bite', name: 'Morsure', toHit: 5, dice: '1d8+3+2d6', type: 'perforants + poison' },
    { id: 'web', name: 'Toile (Recharge 5–6)', props: 'JS Dextérité DD 13 à 18 m · Entravé jusqu’à destruction de la toile' },
  ], {
    skillOverrides: { perception: 4, discretion: 7 },
    senses: 'Vision dans le noir 18 m · Perception passive 14',
    traits: ['Pattes d’araignée', 'Marche sur les toiles'],
  }),
  profile('lion', 'G', { str: 17, dex: 15, con: 11 }, [
    { id: 'rend', name: 'Lacération', toHit: 5, dice: '1d8+3', type: 'tranchants' },
    { id: 'roar', name: 'Rugissement', props: 'JS Sagesse DD 11 à 4,50 m · Effrayé jusqu’au début du prochain tour du lion' },
  ], {
    skillOverrides: { perception: 3, discretion: 4 },
    senses: 'Vision dans le noir 18 m · Perception passive 13',
    traits: ['Tactique de meute', 'Avec 3 m d’élan, saut en longueur jusqu’à 7,50 m.'],
    attacksPerAction: 2,
  }),
  profile('tiger', 'G', { str: 17, dex: 16, con: 14 }, [
    { id: 'pounce', name: 'Bond', toHit: 5, dice: '1d6+3', type: 'tranchants', props: 'Avec avantage : +1d6 et cible TG ou moins À terre' },
  ], {
    skillOverrides: { perception: 3, discretion: 7 },
    senses: 'Vision dans le noir 18 m · Perception passive 13',
    traits: ['Rôder : après Bond, déplacement jusqu’à la moitié de la vitesse sans attaque d’opportunité puis possibilité de Se cacher.'],
  }),
];

export function installMoonLevelThreeBeasts(): void {
  for (const form of MOON_LEVEL_3_BEASTS) {
    if (!WILD_SHAPE_PROFILES.some((entry) => entry.id === form.id)) WILD_SHAPE_PROFILES.push(form);
  }
}

installMoonLevelThreeBeasts();
