import { armesEquipables, attaquesDuPersonnage, attaquesParAction } from '../model/weapons';
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
 *
 * S'y ajoute une carte « Équiper » par arme possédée mais pas en main :
 * changer d'arme est un choix de combat comme un autre, qui coûte l'Action
 * du tour au même titre qu'attaquer ou lancer un sort — jamais un geste
 * gratuit au milieu d'un round. Hors combat, `layoutCombatCards` ignore de
 * toute façon l'économie d'action : l'équiper y reste libre.
 */
export function weaponCardsFromCharacter(sheet: CharacterSheet, derived: DerivedCharacter): PlayableCard[] {
  const parAction = attaquesParAction(sheet);
  const attaques: PlayableCard[] = attaquesDuPersonnage(sheet, derived).map((attaque) => ({
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

  const changements: PlayableCard[] = armesEquipables(sheet).map((weapon) => ({
    id: `equiper-${weapon.id}`,
    name: `Équiper ${weapon.name}`,
    economy: 'action',
    detail: `${weapon.melee ? 'corps à corps' : 'à distance'} · ${weapon.props !== '—' ? weapon.props.toLocaleLowerCase('fr') : ''}`.trim(),
    equipWeaponId: weapon.id,
  }));

  return [...attaques, ...changements];
}
