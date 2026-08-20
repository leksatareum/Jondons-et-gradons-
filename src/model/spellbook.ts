import { spellById, spellsForClass, type Spell } from '../content/spell-catalogue';
import { spellManagementMode } from '../domain/spellcasting';
import type { CharacterSheet, ChosenSpell } from './character';
import type { DerivedCharacter } from './derive';

/**
 * Le grimoire : ce qu'un personnage a le droit de préparer, et ce qu'il en a
 * fait.
 *
 * Deux questions distinctes, que l'ancienne app mélangeait :
 *
 *  · **autorisé** — dérivé de la classe et du niveau, jamais stocké ;
 *  · **préparé** — une décision du joueur, et la seule chose qui aille en base.
 *
 * Un sort accordé d'office ne relève d'aucune des deux : il est là quoi qu'il
 * arrive, et il ne consomme pas le budget. Confondre les trois est le bug que
 * le backlog garde en mémoire — un Druide du Cercle de la Terre affichait
 * « Liste 9/6 » sans enfreindre la moindre règle.
 */

/** Rang de sort le plus élevé que ce personnage peut lancer, pacte compris. */
export function maxCastableRank(derived: DerivedCharacter): number {
  return derived.spellcasting.slots.reduce((max, slot) => Math.max(max, slot.level), 0);
}

export interface AllowedSpells {
  classId: string;
  /** Sorts mineurs de la liste, tous rangs confondus (ils n'ont pas de rang). */
  cantrips: Spell[];
  /** Sorts de rang 1 et plus, plafonnés à ce que le personnage peut lancer. */
  spells: Spell[];
}

/**
 * Ce que le personnage peut préparer, classe par classe.
 *
 * Le plafond est le rang lançable, pas le niveau de personnage : un Occultiste
 * de niveau 2 n'accède qu'au rang 1 même s'il connaît des sorts plus hauts par
 * ailleurs, et lui proposer du rang 3 serait lui promettre ce que ses
 * emplacements ne paient pas.
 */
export function allowedSpells(sheet: CharacterSheet, derived: DerivedCharacter): AllowedSpells[] {
  const rangMax = maxCastableRank(derived);
  return sheet.classLevels
    .map((entry) => ({
      classId: entry.classId,
      cantrips: spellsForClass(entry.classId, 0),
      spells: spellsForClass(entry.classId)
        .filter((spell) => spell.level >= 1 && spell.level <= rangMax),
    }))
    .filter((liste) => liste.cantrips.length > 0 || liste.spells.length > 0);
}

/** D'où vient un sort présent sur la fiche, et ce que ça implique. */
export type SpellStanding =
  /** Choisi par le joueur : consomme le budget, retirable. */
  | { kind: 'prepare' }
  /** Accordé d'office par la classe, la sous-classe, le terrain, l'espèce. */
  | { kind: 'toujours-prepare' }
  /** Accordé par un don ou une invocation : hors budget, non retirable. */
  | { kind: 'accorde'; par: string };

export interface BookEntry {
  spell: Spell;
  classId: string;
  standing: SpellStanding;
}

export interface ClassBudget {
  classId: string;
  /** Sorts qui consomment le budget. */
  prepared: number;
  /** Ce que la table de classe autorise. */
  max: number;
  /** Sorts présents sans rien consommer. */
  free: number;
  /** Vrai quand il reste de la place. */
  room: boolean;
  /** Ce qui rouvre la liste — décide si l'écran propose un choix. */
  mode: ReturnType<typeof spellManagementMode>;
}

const standingOf = (chosen: ChosenSpell, alwaysPrepared: Set<string>): SpellStanding => {
  if (alwaysPrepared.has(chosen.id)) return { kind: 'toujours-prepare' };
  if (chosen.grantedBy) return { kind: 'accorde', par: chosen.grantedBy };
  return { kind: 'prepare' };
};

/**
 * Les sorts effectivement sur la fiche, chacun avec sa provenance.
 *
 * Les sorts toujours préparés ne sont pas stockés sur la fiche : ils sont
 * dérivés, donc ajoutés ici. Un joueur ne doit pas avoir à se souvenir que
 * son sort de sous-classe existe parce qu'il ne le voit nulle part.
 */
export function spellbookOf(sheet: CharacterSheet, derived: DerivedCharacter): BookEntry[] {
  const alwaysPrepared = new Set(derived.spellcasting.alwaysPrepared);
  const mainClass = sheet.classLevels[0]?.classId ?? '';

  const chosen = sheet.spells.flatMap((entry): BookEntry[] => {
    const spell = spellById(entry.id);
    if (!spell) return [];
    return [{
      spell,
      classId: entry.sourceClass || mainClass,
      standing: standingOf(entry, alwaysPrepared),
    }];
  });

  const dejaLa = new Set(chosen.map((entry) => entry.spell.id));
  const accordes = derived.spellcasting.alwaysPrepared.flatMap((id): BookEntry[] => {
    if (dejaLa.has(id)) return [];
    const spell = spellById(id);
    if (!spell) return [];
    return [{ spell, classId: mainClass, standing: { kind: 'toujours-prepare' } }];
  });

  return [...chosen, ...accordes];
}

/**
 * Où en est le budget, classe par classe.
 *
 * Seuls les sorts choisis comptent. C'est toute la correction : un sort
 * accordé s'ajoute à la fiche sans jamais rapprocher le joueur du plafond.
 */
export function preparedBudget(sheet: CharacterSheet, derived: DerivedCharacter): ClassBudget[] {
  const book = spellbookOf(sheet, derived);
  return sheet.classLevels
    .filter((entry) => derived.spellcasting.preparedMax[entry.classId] !== undefined)
    .map((entry) => {
      const sien = book.filter((item) => item.classId === entry.classId);
      const prepared = sien.filter((item) => item.standing.kind === 'prepare').length;
      const max = derived.spellcasting.preparedMax[entry.classId];
      return {
        classId: entry.classId,
        prepared,
        max,
        free: sien.length - prepared,
        room: prepared < max,
        mode: spellManagementMode(entry.classId, entry.subclass),
      };
    });
}
