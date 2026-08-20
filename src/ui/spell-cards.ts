import { spellById, type Spell } from '../content/spell-catalogue';
import { spellbookOf } from '../model/spellbook';
import { grantedSpells, grantResourceKey } from '../model/spell-grants';
import type { CharacterSheet } from '../model/character';
import type { DerivedCharacter, DerivedSlot } from '../model/derive';
import type { Economy, PlayableCard } from './combat-layout';

/**
 * Les cartes jouables d'un personnage, dérivées de sa fiche.
 *
 * Jusqu'ici l'écran de combat affichait `demoCards`, une liste écrite à la
 * main pour une occultiste — que tout le monde recevait, quelle que soit sa
 * classe. Un rôdeur se voyait donc proposer « Explosion occulte » en pleine
 * partie.
 *
 * Ce qui est dérivable l'est ; ce qui ne l'est pas reste vide plutôt que
 * d'être inventé. En particulier, les dégâts et le bonus d'attaque : seuls
 * quatre sorts du catalogue ont un effet structuré, les autres décrivent
 * leurs dégâts en toutes lettres. Les extraire par expression régulière
 * donnerait des nombres faux avec l'aplomb des nombres justes — le joueur lit
 * le texte du sort, et le DD est affiché une fois pour toutes en en-tête.
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

const concentre = (spell: Spell): boolean =>
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
 * L'emplacement qui paie ce sort.
 *
 * Le plus bas qui suffit : lancer un sort de rang 1 avec un emplacement de
 * rang 3 est un choix du joueur, jamais un défaut. L'occultiste n'a pas ce
 * choix — ses emplacements sont tous au même rang.
 */
export function slotFor(rank: number, slots: DerivedSlot[]): DerivedSlot | null {
  if (rank === 0) return null;
  return slots.find((slot) => slot.level >= rank) ?? null;
}

export function cardsFromCharacter(sheet: CharacterSheet, derived: DerivedCharacter): PlayableCard[] {
  const cartes: PlayableCard[] = [];

  // Les sorts mineurs ne coûtent rien : ils passent en premier parce que ce
  // sont eux qu'on relance tour après tour.
  for (const chosen of sheet.cantrips) {
    const spell = spellById(chosen.id);
    if (!spell) continue;
    cartes.push({
      id: spell.id,
      name: spell.name,
      economy: economyOf(spell),
      detail: detailOf(spell),
    });
  }

  for (const entree of spellbookOf(sheet, derived)) {
    const { spell, standing } = entree;
    if (spell.level === 0) continue;
    const slot = slotFor(spell.level, derived.spellcasting.slots);
    cartes.push({
      id: spell.id,
      name: spell.name,
      economy: economyOf(spell),
      detail: detailOf(spell),
      ...(standing.kind === 'accorde' ? { granted: true, grantedBy: sourceLisible(standing.par) } : {}),
      ...(slot ? {
        resource: {
          key: slot.pact ? 'pacte' : `emplacement-${slot.level}`,
          remaining: slot.remaining,
          max: slot.max,
          label: slot.pact ? 'Emplacement de pacte' : `Emplacement de rang ${slot.level}`,
        },
      } : {}),
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
      detail: detailOf(spell),
      granted: true,
      grantedBy: grant.source,
      ...(ressource ? {
        resource: {
          key: ressource.key,
          remaining: ressource.remaining,
          max: ressource.max,
          label: `Accordé · ${grant.recharge === 'long' ? 'repos long' : 'repos court'}`,
        },
      } : {}),
    });
  }

  return cartes;
}
