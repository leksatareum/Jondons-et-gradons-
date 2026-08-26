import { spellById, type Spell } from '../content/spell-catalogue';
import { spellbookOf } from '../model/spellbook';
import { grantedSpells, grantResourceKey } from '../model/spell-grants';
import { abilityModifier, effectiveAbilities, levelInClass, type CharacterSheet } from '../model/character';
import type { DerivedCharacter, DerivedSlot } from '../model/derive';
import type { Economy, PayableResource, PlayableCard } from './combat-layout';
import { MARQUE_CHASSEUR_SPELL_ID, MARQUE_LIBRE_KEY } from '../model/rodeur';
import { arcanumChoisis, arcanumResourceKey, invocationsChoisies } from '../model/invocations';
import { CARTE_ETOILES_KEY, SORT_DE_CERCLE_GRATUIT_KEY } from '../model/druide';
import { estCercleDesEtoiles } from '../model/wild-shape';
import { sortDuCercleDeLaTerre } from '../model/choix-de-classe';
import { BENEDICTION_TENEBREUX_CARD_ID, benedictionDuTenebreuxMontant, patronDe } from '../model/occultiste';
import { PAS_DES_FEES_KEY } from '../domain/warlock-patron-resources';

/**
 * Les cartes jouables d'un personnage, dérivées de sa fiche.
 *
 * Jusqu'ici l'écran de combat affichait `demoCards`, une liste écrite à la
 * main pour une occultiste — que tout le monde recevait, quelle que soit sa
 * classe. Un rôdeur se voyait donc proposer « Explosion occulte » en pleine
 * partie.
 *
 * Ce qui est dérivable l'est ; ce qui ne l'est pas reste vide plutôt que
 * d'être inventé. En particulier, les dégâts et le bonus d'attaque : le
 * catalogue (`content/spells.js`, 389 entrées vérifiées) ne porte AUCUN champ
 * structuré pour eux, seulement le texte de règle tel qu'imprimé. Une carte
 * de sort n'affiche donc jamais de `damage` ni de `toHit` — à la différence
 * d'une attaque à l'arme (`weapon-cards.ts`), qui se calcule entièrement.
 * Extraire un chiffre du texte par expression régulière donnerait des
 * nombres faux avec l'aplomb des nombres justes — le joueur lit le texte du
 * sort, et le DD est affiché une fois pour toutes en en-tête.
 *
 * Seule exception, volontairement étroite : un bonus qui vient d'un FAIT de
 * fiche déjà exact ailleurs (Décharge agonisante ajoute le modificateur de
 * Charisme, une valeur que l'appli connaît déjà) peut apparaître en note sur
 * la carte — jamais un chiffre extrait du texte du sort lui-même.
 */

/**
 * Les provenances internes, dites en français — mêmes clés que le grimoire.
 * Un joueur n'a pas à connaître le vocabulaire du modèle.
 */
const SOURCE_LISIBLE: Record<string, string> = {
  species: 'ton lignage',
  'origin:background': 'ton don d’origine',
  origin: 'ton don d’origine',
};

export const sourceLisible = (source: string): string => SOURCE_LISIBLE[source] ?? source;

/** « 1 action bonus » → l'économie d'action que l'écran connaît. */
export function economyOf(spell: Spell): Economy {
  const t = spell.castingTime.toLocaleLowerCase('fr');
  if (t.includes('bonus')) return 'bonus';
  if (t.includes('réaction') || t.includes('reaction')) return 'reaction';
  if (t === 'action') return 'action';
  // Une heure de rituel n'est pas une action de combat : hors économie.
  return 'libre';
}

/**
 * Exporté pour l'écran de combat : savoir si le sort qu'on vient de jouer
 * demande de la concentration, pour l'afficher et permettre de la rompre.
 */
export const concentre = (spell: Spell): boolean =>
  spell.duration.toLocaleLowerCase('fr').startsWith('concentration');

/** Ligne de détail : ce qu'on relit avant de lancer, pas la description entière. */
export function detailOf(spell: Spell): string {
  return [
    spell.level === 0 ? 'sort mineur' : `rang ${spell.level}`,
    spell.range,
    concentre(spell) ? 'concentration' : null,
  ].filter(Boolean).join(' · ');
}

/**
 * L'emplacement le plus bas qui suffit. Conservé pour ce qu'il dit : c'est
 * le paiement proposé par défaut, pas le seul possible.
 */
export function slotFor(rank: number, slots: DerivedSlot[]): DerivedSlot | null {
  if (rank === 0) return null;
  return slots.find((slot) => slot.level >= rank) ?? null;
}

const pastilleEmplacement = (slot: DerivedSlot): PayableResource => ({
  key: slot.pact ? 'pacte' : `emplacement-${slot.level}`,
  remaining: slot.remaining,
  max: slot.max,
  label: slot.pact ? `Emplacement de pacte (rang ${slot.level})` : `Emplacement de rang ${slot.level}`,
});

/**
 * TOUS les paiements légaux d'un sort de ce rang, du moins cher au plus cher.
 *
 * Un emplacement paie un sort de son rang ou d'un rang inférieur — d'où la
 * liste entière plutôt que le seul plus bas : monter en rang est un choix que
 * l'application n'avait aucun moyen d'offrir.
 *
 * Les emplacements de pacte y figurent au même titre. En multiclassage
 * Incantation + Magie de pacte, chaque réserve peut payer les sorts de
 * l'autre ; elles ne restent distinctes que pour leur récupération. Le pacte
 * est trié à son rang réel, ce qui le met souvent en tête pour un sort de bas
 * rang : c'est bien pour cela que le choix est demandé.
 */
export function paiementsPourRang(rank: number, derived: DerivedCharacter): PayableResource[] {
  if (rank === 0) return [];
  return derived.spellcasting.slots
    .filter((slot) => slot.level >= rank)
    .slice()
    .sort((a, b) => a.level - b.level)
    .map(pastilleEmplacement);
}

/**
 * Les paiements d'un sort donné, lancements gratuits compris.
 *
 * Ennemi juré (Rôdeur 1) donne des lancements de Marque du chasseur sans
 * emplacement. Ils ne changent pas le sort, seulement son coût : ils
 * s'ajoutent donc à la liste, en tête puisqu'ils ne coûtent rien d'autre.
 * Sans cela, la carte cherchait un emplacement et laissait la réserve
 * intacte — la capacité de niveau 1 du Rôdeur n'existait pas en jeu.
 */
export function paiementsPourSort(
  spell: Spell,
  derived: DerivedCharacter,
  sheet?: CharacterSheet,
): PayableResource[] {
  const paiements = paiementsPourRang(spell.level, derived);

  // Ennemi juré : des lancements de Marque du chasseur sans emplacement.
  if (spell.id === MARQUE_CHASSEUR_SPELL_ID) {
    const gratuits = derived.resources.find((resource) => resource.key === MARQUE_LIBRE_KEY);
    if (gratuits) {
      return [{
        key: gratuits.key,
        remaining: gratuits.remaining,
        max: gratuits.max,
        label: 'Ennemi juré · sans emplacement',
      }, ...paiements];
    }
  }

  // Récupération naturelle : un sort de cercle de rang 1+ se lance sans
  // emplacement, une fois par repos long. Ce sont les sorts du TERRAIN
  // choisi — pas n'importe quel sort accordé d'office.
  if (sheet && spell.level >= 1 && sortDuCercleDeLaTerre(sheet, spell.id)) {
    const gratuit = derived.resources.find((resource) => resource.key === SORT_DE_CERCLE_GRATUIT_KEY);
    if (gratuit) {
      return [{
        key: gratuit.key,
        remaining: gratuit.remaining,
        max: gratuit.max,
        label: 'Récupération naturelle · sans emplacement',
      }, ...paiements];
    }
  }

  // Pas des fées (Occultiste · Patron Archifée, niveau 3+) : Pas brumeux
  // sans emplacement, modificateur de Charisme fois par repos long. La
  // réserve était déjà comptée juste (`domain/warlock-patron-resources.ts`),
  // affichée dans le pisteur — mais jamais proposée comme paiement du sort
  // lui-même : le lancer coûtait un emplacement normal, et personne ne
  // pouvait relier les deux gestes.
  if (sheet && spell.id === 'pas-brumeux' && patronDe(sheet) === 'archifee') {
    const gratuit = derived.resources.find((resource) => resource.key === PAS_DES_FEES_KEY);
    if (gratuit) {
      return [{
        key: gratuit.key,
        remaining: gratuit.remaining,
        max: gratuit.max,
        label: 'Pas des fées · sans emplacement',
      }, ...paiements];
    }
  }

  // Carte stellaire (Druide · Cercle des Étoiles, niveau 3+) : Trait de
  // lumière sans emplacement, même mécanique que Pas des fées ci-dessus —
  // la réserve était comptée, jamais offerte comme paiement du sort lui-même.
  if (sheet && spell.id === 'trait-lumiere' && estCercleDesEtoiles(sheet)) {
    const gratuit = derived.resources.find((resource) => resource.key === CARTE_ETOILES_KEY);
    if (gratuit) {
      return [{
        key: gratuit.key,
        remaining: gratuit.remaining,
        max: gratuit.max,
        label: 'Carte stellaire · sans emplacement',
      }, ...paiements];
    }
  }

  return paiements;
}

/**
 * Décharge agonisante (Occultiste, niveau 2+) ajoute le modificateur de
 * Charisme aux dégâts de CHAQUE rayon du sort mineur choisi — un fait de
 * règle simple et exact, pas une extraction de texte : rien à voir avec les
 * dégâts d'un sort qu'on se refuse à deviner (cf. l'en-tête du fichier). Un
 * joueur qui l'a prise n'avait sinon aucun rappel sur sa propre carte.
 */
function noteDechargeAgonisante(sheet: CharacterSheet, cantripId: string): string | null {
  const cible = invocationsChoisies(sheet).find((id) => id === `agonizing-blast@${cantripId}`);
  if (!cible) return null;
  const cha = abilityModifier(effectiveAbilities(sheet).cha);
  return `+${cha} aux dégâts par rayon (Décharge agonisante)`;
}

export function cardsFromCharacter(sheet: CharacterSheet, derived: DerivedCharacter): PlayableCard[] {
  const cartes: PlayableCard[] = [];

  // Les sorts mineurs ne coûtent rien : ils passent en premier parce que ce
  // sont eux qu'on relance tour après tour.
  for (const chosen of sheet.cantrips) {
    const spell = spellById(chosen.id);
    if (!spell) continue;
    const noteInvocation = noteDechargeAgonisante(sheet, spell.id);
    cartes.push({
      id: spell.id,
      name: spell.name,
      economy: economyOf(spell),
      category: 'magie',
      detail: noteInvocation ? `${detailOf(spell)} · ${noteInvocation}` : detailOf(spell),
    });
  }

  for (const entree of spellbookOf(sheet, derived)) {
    const { spell, standing } = entree;
    if (spell.level === 0) continue;
    const paiements = paiementsPourSort(spell, derived, sheet);
    cartes.push({
      id: spell.id,
      name: spell.name,
      economy: economyOf(spell),
      category: 'magie',
      detail: detailOf(spell),
      ...(standing.kind === 'accorde' ? { granted: true, grantedBy: sourceLisible(standing.par) } : {}),
      ...(paiements.length ? { resources: paiements } : {}),
    });
  }

  // Arcanum mystique : un sort de rang 6 à 9 qu'aucun emplacement d'Occultiste
  // ne pourrait payer — la Magie de pacte plafonne au rang 5. Il se lance une
  // fois sur sa propre réserve, rendue au repos long.
  for (const arcanum of arcanumChoisis(sheet)) {
    const spell = spellById(arcanum.spellId);
    if (!spell) continue;
    const ressource = derived.resources.find((entry) => entry.key === arcanumResourceKey(arcanum.rank));
    cartes.push({
      id: `arcanum-${arcanum.rank}`,
      name: spell.name,
      economy: economyOf(spell),
      category: 'magie',
      detail: detailOf(spell),
      granted: true,
      grantedBy: `ton Arcanum de rang ${arcanum.rank}`,
      ...(ressource ? {
        resources: [{
          key: ressource.key,
          remaining: ressource.remaining,
          max: ressource.max,
          label: `Arcanum de rang ${arcanum.rank} · repos long`,
        }],
      } : {}),
    });
  }

  // Bénédiction du Ténébreux (Occultiste · Patron Fiélon, niveau 3+) : un
  // déclencheur, pas un sort — quand un ennemi tombe à 0, réduit par
  // l'Occultiste ou à 3 m ou moins de lui. `model/occultiste.ts` le calculait
  // déjà, exact et testé ; rien ne le proposait à la table, donc rien ne
  // l'appliquait jamais. Il ne coûte ni Action ni ressource : « Libre »,
  // comme un rituel, pour ne pas laisser croire qu'il consomme la réaction.
  if (levelInClass(sheet, 'occultiste') >= 3 && patronDe(sheet) === 'fielon') {
    cartes.push({
      id: BENEDICTION_TENEBREUX_CARD_ID,
      name: 'Bénédiction du Ténébreux',
      economy: 'libre',
      category: 'magie',
      detail: `+${benedictionDuTenebreuxMontant(sheet)} PV temporaires · un ennemi vient de tomber à 0`,
      granted: true,
      grantedBy: 'ton Patron Fiélon',
    });
  }

  // Les dons du MJ : ils ne dépensent pas d'emplacement, ils ont leurs propres
  // lancements. Un sort au-dessus du rang du personnage se joue donc quand
  // même — c'est tout l'intérêt d'une récompense de scénario.
  for (const { grant, spell } of grantedSpells(sheet, derived)) {
    const ressource = derived.resources.find((entry) => entry.key === grantResourceKey(grant));
    cartes.push({
      id: `don-${grant.id}`,
      name: spell.name,
      economy: economyOf(spell),
      category: 'magie',
      detail: detailOf(spell),
      granted: true,
      grantedBy: grant.source,
      ...(ressource ? {
        resources: [{
          key: ressource.key,
          remaining: ressource.remaining,
          max: ressource.max,
          label: `Accordé · ${grant.recharge === 'long' ? 'repos long' : 'repos court'}`,
        }],
      } : {}),
    });
  }

  return cartes;
}
