import { attaquesDuPersonnage, attaquesParAction } from '../model/weapons';
import type { CharacterSheet } from '../model/character';
import type { DerivedCharacter } from '../model/derive';
import type { PlayableCard } from './combat-layout';

/**
 * Les attaques du personnage, converties en cartes de combat — au même
 * format que les sorts, avec `toHit` et `damage` renseignés cette fois.
 *
 * Une attaque ne coûte jamais d'emplacement : elle n'a pas de `resources`,
 * exactement comme un sort mineur. Jouer la carte ne fait donc que cocher
 * l'Action du tour — la table lance les dés elle-même, comme partout
 * ailleurs dans l'écran de combat.
 */
export function weaponCardsFromCharacter(sheet: CharacterSheet, derived: DerivedCharacter): PlayableCard[] {
  const parAction = attaquesParAction(sheet);
  return attaquesDuPersonnage(sheet, derived).map((attaque) => ({
    id: attaque.id,
    name: attaque.name,
    economy: 'action',
    detail: [
      attaque.melee ? 'corps à corps' : 'à distance',
      attaque.properties !== '—' ? attaque.properties.toLocaleLowerCase('fr') : null,
      attaque.mastery ? `maîtrise : ${attaque.mastery}` : null,
      !attaque.proficient ? 'non maîtrisée' : null,
      parAction > 1 ? `${parAction} attaques` : null,
    ].filter(Boolean).join(' · '),
    toHit: attaque.toHit,
    damage: attaque.damage,
  }));
}
