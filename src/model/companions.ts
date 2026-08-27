import {
  addLinkedCreature, linkedCreatureOptionFor, linkedCreatureOptionsFor,
  linkedCreaturesAfterLongRest, refreshLinkedCreatures, type LinkedCreatureOption,
} from '../domain/linked-creatures';
import { spendResource } from './cast';
import { WILD_SHAPE_RESOURCE_KEY } from './wild-shape';
import type { CharacterSheet, LinkedCreature } from './character';
import type { DerivedCharacter } from './derive';

/**
 * Créatures liées, greffées sur `CharacterSheet`.
 *
 * `domain/linked-creatures.ts` connaît déjà tout ce qui donne accès à une
 * créature liée — Trouver un familier, Compagnon sauvage du Druide, Pacte de
 * la Chaîne, Maître des bêtes — et calcule leurs profils mécaniques. Il
 * travaille déjà sur des objets suffisamment proches de `CharacterSheet` pour
 * être appelés directement, moyennant un petit adaptateur ; ce module ne fait
 * que ça, et donne un type précis à ce que le domaine laisse en
 * `Record<string, unknown>`.
 */

const adapter = (sheet: CharacterSheet) => ({
  classLevels: sheet.classLevels,
  // Le domaine appelle « classSelections » ce que cette fiche appelle
  // `classChoices` : les décisions de classe, indexées par identifiant.
  classSelections: sheet.classChoices,
  abilities: sheet.abilities,
  spells: sheet.spells,
  // Le domaine ne connaît que la forme structurelle, pas les champs précis :
  // il ne fait qu'y lire `family` et `swapReady`, qu'un `LinkedCreature` porte.
  companions: (sheet.companions ?? []) as unknown as Array<Record<string, unknown>>,
});

/** Ce que ce personnage peut lier maintenant — familier, compagnon primordial. */
export const availableCompanions = (sheet: CharacterSheet): LinkedCreatureOption[] =>
  linkedCreatureOptionsFor(adapter(sheet));

const asLinkedCreature = (raw: Record<string, unknown>): LinkedCreature => raw as unknown as LinkedCreature;

/**
 * Ce qui paie l'invocation d'un Compagnon sauvage (Druide) — la seule des
 * quatre sources de créature liée qui ne soit pas gratuite. PHB 2024 :
 * une utilisation de Forme sauvage OU un emplacement de sort, au choix du
 * joueur. Trouver un familier (Occultiste, Pacte de la Chaîne) est à
 * volonté et sans coût d'emplacement ; le Compagnon primordial (Rôdeur,
 * Maître des bêtes) s'obtient sans dépense à chaque repos long.
 */
export type CompanionPayment = { type: 'forme-sauvage' } | { type: 'emplacement'; rang: number };

/**
 * Lie une créature. En remplace une de la même famille si le personnage en
 * avait déjà une — un compagnon primordial ne s'empile pas avec le précédent,
 * il le remplace, comme le prévoit la règle.
 *
 * Un Compagnon sauvage exige `payment` et refuse en silence si la ressource
 * annoncée n'est en fait plus disponible — jamais de familier gratuit, jamais
 * de ressource qui descend sous zéro.
 */
export function bondCompanion(
  sheet: CharacterSheet,
  derived: DerivedCharacter,
  optionId: string,
  customName = '',
  payment?: CompanionPayment,
): CharacterSheet {
  const option = linkedCreatureOptionFor(adapter(sheet), optionId);
  if (!option) return sheet;

  let payee = sheet;
  if (option.source === 'wild-companion') {
    if (!payment) return sheet;
    if (payment.type === 'forme-sauvage') {
      const ressource = derived.resources.find((entry) => entry.key === WILD_SHAPE_RESOURCE_KEY);
      if (!ressource || ressource.remaining <= 0) return sheet;
      payee = spendResource(sheet, WILD_SHAPE_RESOURCE_KEY);
    } else {
      const slot = derived.spellcasting.slots.find((entry) => entry.level === payment.rang && !entry.pact);
      if (!slot || slot.remaining <= 0) return sheet;
      payee = spendResource(sheet, `emplacement-${payment.rang}`);
    }
  }

  const existantes = (payee.companions ?? []) as unknown as Array<Record<string, unknown>>;
  const suivants = addLinkedCreature(existantes, option, customName).map(asLinkedCreature);
  return { ...payee, companions: suivants };
}

/** Détache une créature liée — le joueur s'en sépare, ou elle est tombée hors du champ de la règle. */
export function dismissCompanion(sheet: CharacterSheet, companionId: string): CharacterSheet {
  const restants = (sheet.companions ?? []).filter((companion) => companion.id !== companionId);
  return { ...sheet, companions: restants };
}

/**
 * Dégâts ou soins sur une créature liée, plafonnés entre 0 et son maximum —
 * comme pour le personnage, mais son maximum à elle ne se dérive de rien : il
 * vient du profil qui l'a créée, recalculé à chaque montée de niveau par
 * `afterLongRest`.
 */
export function applyCompanionDamage(sheet: CharacterSheet, companionId: string, delta: number): CharacterSheet {
  const companions = (sheet.companions ?? []).map((companion) => (
    companion.id === companionId
      ? { ...companion, hp: Math.max(0, Math.min(companion.hpMax, companion.hp - delta)) }
      : companion
  ));
  return { ...sheet, companions };
}

/**
 * Ramène un compagnon primordial mort à la vie, en dépensant réellement
 * l'emplacement de sort que la règle demande — pas un simple retour à
 * pleins PV. PHB 2024 : « une action Magie, un contact et un emplacement de
 * sort la ramènent après 1 minute avec tous ses PV », tant qu'elle est
 * morte depuis moins d'une heure. Cette dernière condition se compte en
 * temps réel, pas en tours ni en repos : c'est au joueur de savoir si la
 * fenêtre est encore ouverte, comme pour tout ce que l'appli ne chronomètre
 * pas elle-même.
 *
 * Ignore silencieusement si la cible n'existe pas ou n'est pas morte — pas
 * de raison de dépenser un emplacement pour rien.
 */
export function ramenerCompagnon(sheet: CharacterSheet, companionId: string, rang: number): CharacterSheet {
  const cible = (sheet.companions ?? []).find((companion) => companion.id === companionId);
  if (!cible || cible.hp > 0) return sheet;
  const apresDepense = spendResource(sheet, `emplacement-${rang}`);
  const companions = (apresDepense.companions ?? []).map((companion) => (
    companion.id === companionId ? { ...companion, hp: companion.hpMax } : companion
  ));
  return { ...apresDepense, companions };
}

/**
 * Ce qu'un repos long fait aux créatures liées : un Compagnon sauvage
 * disparaît, un compagnon primordial peut être reformé (`swapReady`), et
 * toutes voient leurs nombres recalculés sur le niveau et les caractéristiques
 * actuels — un Maître des bêtes qui monte de niveau voit son compagnon
 * grandir avec lui, sans qu'on ait à le relier à la main.
 */
/**
 * Les nombres d'une créature liée, recalculés sur le niveau et les
 * caractéristiques actuels — sans rien y expirer ni y ouvrir. À la différence
 * du repos long, monter de niveau ne fait pas disparaître un Compagnon
 * sauvage : rien dans la règle ne le prévoit, et l'appeler ici le ferait
 * pourtant, à tort, à chaque « Niveau + ».
 */
export function refreshCompanions(sheet: CharacterSheet): CharacterSheet {
  const existantes = (sheet.companions ?? []) as unknown as Array<Record<string, unknown>>;
  const rafraichis = refreshLinkedCreatures(adapter(sheet), existantes).map(asLinkedCreature);
  return { ...sheet, companions: rafraichis };
}

export function companionsAfterLongRest(sheet: CharacterSheet): CharacterSheet {
  const existantes = (sheet.companions ?? []) as unknown as Array<Record<string, unknown>>;
  const restants = linkedCreaturesAfterLongRest(existantes);
  const rafraichis = refreshLinkedCreatures(adapter(sheet), restants).map(asLinkedCreature);
  return { ...sheet, companions: rafraichis };
}
