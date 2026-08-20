import { spellById, type Spell } from '../content/spell-catalogue';
import type { CharacterSheet, SpellGrant } from './character';
import type { DerivedCharacter } from './derive';
import { maxCastableRank } from './spellbook';

/**
 * Les sorts accordés par le MJ.
 *
 * Un don ne touche à rien de ce qui existe : ni au budget de sorts préparés,
 * ni aux emplacements, ni aux règles de réouverture de la classe. Il apporte
 * ses propres lancements et les recharge au repos. C'est ce qui le rend sûr —
 * un don mal réglé ne peut pas corrompre le reste de la fiche, il ne peut que
 * se retirer.
 */

/** Clé de ressource d'un don. Stable, pour que la dépense survive à un rechargement. */
export const grantResourceKey = (grant: SpellGrant): string => `don:${grant.id}`;

export interface GrantedSpell {
  grant: SpellGrant;
  spell: Spell;
  /**
   * Vrai quand le personnage n'a aucun emplacement de ce rang. Le don reste
   * lançable — il a ses propres charges — mais le MJ doit l'avoir vu.
   */
  auDessusDeSonRang: boolean;
}

export function grantedSpells(sheet: CharacterSheet, derived: DerivedCharacter): GrantedSpell[] {
  const rangMax = maxCastableRank(derived);
  return (sheet.grants ?? []).flatMap((grant): GrantedSpell[] => {
    const spell = spellById(grant.spellId);
    if (!spell) return [];
    return [{ grant, spell, auDessusDeSonRang: spell.level > rangMax }];
  });
}

/** Ce qu'il faut savoir avant d'accorder, pour ne pas le faire à l'aveugle. */
export interface GrantWarning {
  kind: 'rang-trop-eleve' | 'deja-accorde' | 'deja-sur-la-fiche' | 'source-vide';
  detail: string;
}

/**
 * Les avertissements d'un don envisagé.
 *
 * Rien n'est interdit : le MJ récompense qui il veut avec ce qu'il veut. Mais
 * rien ne passe en silence — un don qu'on ne pouvait pas prévoir est une
 * erreur qu'on ne découvre qu'en pleine partie, quand le joueur essaie de
 * lancer un sort qui ne part pas.
 */
export function grantWarnings(
  sheet: CharacterSheet,
  derived: DerivedCharacter,
  candidat: { spellId: string; source: string },
): GrantWarning[] {
  const avertissements: GrantWarning[] = [];
  const spell = spellById(candidat.spellId);
  if (!spell) return [{ kind: 'deja-accorde', detail: 'Sort inconnu du catalogue.' }];

  if (!candidat.source.trim()) {
    avertissements.push({
      kind: 'source-vide',
      detail: 'Sans provenance, personne ne saura d’où vient ce sort à la prochaine séance.',
    });
  }

  const rangMax = maxCastableRank(derived);
  if (spell.level > rangMax) {
    avertissements.push({
      kind: 'rang-trop-eleve',
      detail: `Rang ${spell.level} : ${sheet.name} n’a pas d’emplacement de ce rang. `
        + 'Le sort restera lançable par ses lancements gratuits, et par eux seuls.',
    });
  }

  if ((sheet.grants ?? []).some((grant) => grant.spellId === candidat.spellId)) {
    avertissements.push({
      kind: 'deja-accorde',
      detail: `${spell.name} a déjà été accordé à ${sheet.name}. En accorder un second cumulera les lancements.`,
    });
  }

  if (sheet.spells.some((sort) => sort.id === candidat.spellId)) {
    avertissements.push({
      kind: 'deja-sur-la-fiche',
      detail: `${sheet.name} a déjà ${spell.name} sur sa fiche. Le don s’y ajoutera sans le remplacer.`,
    });
  }

  return avertissements;
}

/** Ajoute un don. Ne modifie rien d'autre — c'est la garantie du dispositif. */
export function withGrant(sheet: CharacterSheet, grant: SpellGrant): CharacterSheet {
  return { ...sheet, grants: [...(sheet.grants ?? []), grant] };
}

/**
 * Retire un don, et la dépense qui allait avec.
 *
 * Laisser la dépense derrière ferait réapparaître un « 0/1 utilisé » sur un
 * don qui n'existe plus, si le même identifiant était réutilisé.
 */
export function withoutGrant(sheet: CharacterSheet, grantId: string): CharacterSheet {
  const vise = (sheet.grants ?? []).find((grant) => grant.id === grantId);
  const restants = (sheet.grants ?? []).filter((grant) => grant.id !== grantId);
  const depenses = { ...(sheet.live.resourcesSpent ?? {}) };
  if (vise) delete depenses[grantResourceKey(vise)];
  return { ...sheet, grants: restants, live: { ...sheet.live, resourcesSpent: depenses } };
}
