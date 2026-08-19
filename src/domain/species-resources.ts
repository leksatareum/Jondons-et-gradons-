import { proficiencyBonus } from './proficiency';
import { ancestryOf, lineageOf, speciesMagicFor } from '../content/species';

/**
 * Ressources accordées par l'espèce — dérivées de l'espèce/du lignage/de
 * l'ascendance choisis et du niveau, jamais stockées. Repêché de
 * `table-connectee/src/App.jsx` (`speciesResourcesFor`).
 */
export interface SpeciesResource {
  name: string;
  max: number;
  recharge: 'long' | 'court_ou_long';
  desc: string;
  resourceKey: string;
}

export interface SpeciesResourceCharacter {
  speciesId?: string | null;
  lineageId?: string | null;
  speciesAncestry?: string | null;
  level?: number;
}

const define = (name: string, max: number, recharge: SpeciesResource['recharge'], desc: string, key: string = name): SpeciesResource =>
  ({ name, max, recharge, desc, resourceKey: `species:${key}` });

export function speciesResourcesFor(character: SpeciesResourceCharacter): SpeciesResource[] {
  const level = character.level || 1;
  const prof = proficiencyBonus(level);
  const lineage = lineageOf(character.speciesId, character.lineageId);
  const ancestry = ancestryOf(character.speciesId, character.speciesAncestry);
  const resources: SpeciesResource[] = [];

  if (character.speciesId === 'aasimar') {
    resources.push(define('Mains guérisseuses', 1, 'long', 'Action Magie : rend un nombre de d4 de PV égal à la maîtrise.'));
    if (level >= 3) resources.push(define('Révélation céleste', 1, 'long', 'Action bonus, 1 minute : Ailes célestes, Radiance intérieure ou Voile nécrotique.'));
  }
  if (character.speciesId === 'drakeide') {
    resources.push(define('Souffle draconique', prof, 'long', `${ancestry?.damage || 'Type choisi'} · cône de 4,50 m ou ligne de 9 m, sauvegarde de Dextérité.`));
    if (level >= 5) resources.push(define('Vol draconique', 1, 'long', 'Action bonus : vitesse de vol égale à la vitesse pendant 10 minutes.'));
  }
  if (character.speciesId === 'nain') {
    resources.push(define('Connaissance de la pierre', prof, 'long', 'Action bonus : perception des vibrations à 18 m pendant 10 minutes au contact de la pierre.'));
  }
  if (character.speciesId === 'goliath') {
    resources.push(define(ancestry?.name || 'Ascendance de géant', prof, 'long', ancestry?.desc || 'Faveur de géant choisie à la création.'));
    if (level >= 5) resources.push(define('Forme imposante', 1, 'long', 'Action bonus, 10 minutes : taille G, avantage en Force et vitesse +3 m.'));
  }
  if (character.speciesId === 'orc') {
    resources.push(define("Ruée d'adrénaline", prof, 'court_ou_long', 'Ruée en action bonus et PV temporaires égaux à la maîtrise.'));
    resources.push(define('Ténacité implacable', 1, 'long', 'Tombe à 1 PV au lieu de 0 si les dégâts ne tuent pas sur le coup.'));
  }
  if (character.speciesId === 'gnome' && lineage?.id === 'forets') {
    resources.push(define('Communication avec les animaux', prof, 'long', 'Lancements gratuits du sort inné ; les emplacements restent utilisables.'));
  }
  if (character.speciesId === 'elfe' || character.speciesId === 'tieffelin') {
    // Simplification par rapport à App.jsx : le nom affiché utilise l'id du
    // sort brut plutôt que sa recherche dans le catalogue (`SPELLS`), pour
    // ne pas coupler ce module au contenu des sorts. À la charge de la
    // couche d'affichage de résoudre l'id en nom lisible.
    for (const spellId of speciesMagicFor(character.speciesId, character.lineageId, level).spells) {
      resources.push(define(`Magie innée · ${spellId}`, 1, 'long', 'Un lancement sans emplacement ; les emplacements restent utilisables.', `spell:${spellId}`));
    }
  }
  return resources;
}
