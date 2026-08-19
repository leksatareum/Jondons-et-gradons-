import { describe, expect, it } from 'vitest';
import { importLegacyCharacter, type LegacyCharacter } from './import-legacy';
import { deriveCharacter } from './derive';

/**
 * Non-régression d'une perte de données trouvée en important les VRAIES
 * fiches de la campagne, pas les personnages de démonstration.
 *
 * La première version de l'import jetait tout sort marqué `always: true`, en
 * supposant que la dérivation le rendrait. Faux dans deux cas : un sort
 * accordé par un don (Initié à la magie) et la magie innée d'un lignage. Cinq
 * sorts disparaissaient silencieusement sur huit fiches — dont un sort de
 * l'occultiste effectivement jouée à cette table.
 *
 * Les fiches ci-dessous reproduisent la forme exacte du problème, sans être
 * les fiches réelles (données de campagne).
 */

const occultisteAvecDonInitie: LegacyCharacter = {
  name: 'Occultiste avec Initié à la magie',
  speciesId: 'elfe', lineageId: 'drow',
  classId: 'occultiste', level: 2, background: 'Sage', featIds: ['initie'],
  abilities: { str: 8, dex: 10, con: 14, int: 15, wis: 13, cha: 15 },
  spells: [
    { id: 'malefice', prepared: true, sourceClass: 'occultiste' },
    // Accordé par le don, mais c'est le joueur qui a choisi lequel.
    { id: 'orbe-chromatique', always: true, source: 'origin', prepared: true, sourceClass: 'origin:background' },
  ],
};

const drowNiveau3: LegacyCharacter = {
  name: 'Drow niveau 3',
  speciesId: 'elfe', lineageId: 'drow',
  classId: 'occultiste', level: 3, subclass: 'Patron Fiélon',
  abilities: { str: 8, dex: 14, con: 14, int: 10, wis: 12, cha: 16 },
  spells: [
    { id: 'bras-hadar', prepared: true, sourceClass: 'occultiste' },
    // Magie innée du lignage : dérivable, celle-là.
    { id: 'lueurs-feeriques', always: true, source: 'species', prepared: true },
  ],
};

describe('aucun sort accordé n’est perdu à l’import', () => {
  it('un sort de don est conservé sur la fiche, marqué comme accordé', () => {
    const { sheet, warnings } = importLegacyCharacter(occultisteAvecDonInitie);
    const orbe = sheet.spells.find((spell) => spell.id === 'orbe-chromatique');
    expect(orbe).toBeDefined();
    expect(orbe?.grantedBy).toBe('origin');
    expect(warnings.join(' ')).toMatch(/orbe-chromatique/);
  });

  it('la magie innée d’un lignage est dérivée, donc retirée de la liste choisie', () => {
    const { sheet } = importLegacyCharacter(drowNiveau3);
    expect(sheet.spells.map((spell) => spell.id)).not.toContain('lueurs-feeriques');
    expect(deriveCharacter(sheet).spellcasting.alwaysPrepared).toContain('lueurs-feeriques');
  });

  it('un Drow sous le niveau 3 n’a pas encore sa magie innée', () => {
    const { sheet } = importLegacyCharacter({ ...drowNiveau3, level: 2, subclass: null, spells: [] });
    expect(deriveCharacter(sheet).spellcasting.alwaysPrepared).not.toContain('lueurs-feeriques');
  });

  it.each([occultisteAvecDonInitie, drowNiveau3])(
    'sur $name, chaque sort d’origine est soit conservé, soit réellement dérivé', (legacy) => {
      const { sheet } = importLegacyCharacter(legacy);
      const derived = new Set(deriveCharacter(sheet).spellcasting.alwaysPrepared);
      const kept = new Set(sheet.spells.map((spell) => spell.id));
      const lost = (legacy.spells ?? [])
        .map((spell) => spell.id!)
        .filter((id) => !kept.has(id) && !derived.has(id));
      expect(lost).toEqual([]);
    },
  );
});

describe('le terrain du Cercle de la Terre est lu à l’import', () => {
  it('les sorts du terrain choisi sont dérivés, pas stockés', () => {
    const { sheet } = importLegacyCharacter({
      name: 'Druide de la Terre', speciesId: 'nain',
      classId: 'druide', level: 5, subclass: 'Cercle de la Terre',
      classSelections: { druide: { terrain: 'aride' } },
      abilities: { str: 10, dex: 12, con: 14, int: 10, wis: 16, cha: 8 },
      spells: [{ id: 'boule-feu', always: true, prepared: true, sourceClass: 'druide' }],
    });
    expect(sheet.spells.map((spell) => spell.id)).not.toContain('boule-feu');
    expect(deriveCharacter(sheet).spellcasting.alwaysPrepared).toContain('boule-feu');
  });
});
